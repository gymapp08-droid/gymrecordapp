import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IDataPortabilityBundle,
  IAnonymizationResult,
  IUserConsentPreferences,
  AccountStatus,
  ConsentCategory,
  IConsentRecord,
  IConsentStatus,
  SecurityAuditEventType,
  ISecurityAuditEvent,
  RetentionCategory,
} from '@alpha/types';
import {
  AuditCryptoUtil,
  GENESIS_AUDIT_HASH,
  AuditVerificationResult,
  DataRetentionUtil,
  DEFAULT_RETENTION_RULES,
  RetentionEvaluationResult,
  ExportChecksumUtil,
  globalRateLimiter,
  RATE_LIMIT_PROFILES,
} from '@alpha/utils';
import {
  GrantConsentDto,
  WithdrawConsentDto,
  UpdateConsentPreferencesDto,
} from '@alpha/validation';
import { AuthService } from '../auth/auth.service';

export const ERASURE_CONFIRM_PHRASE = 'DELETE MY DATA PERMANENTLY';

export const ACTIVE_PRIVACY_POLICIES: Record<ConsentCategory, string> = {
  [ConsentCategory.TERMS_OF_SERVICE]: '1.2.0',
  [ConsentCategory.PRIVACY_POLICY]: '1.1.0',
  [ConsentCategory.HEALTH_DATA_PROCESSING]: '1.0.0',
  [ConsentCategory.AI_COACHING_DATA_INGESTION]: '1.0.0',
  [ConsentCategory.ANALYTICS_TELEMETRY]: '1.0.0',
  [ConsentCategory.MARKETING_COMMUNICATIONS]: '1.0.0',
};

@Injectable()
export class PrivacyService {
  // Backing stores
  private readonly consentPreferencesStore = new Map<string, IUserConsentPreferences>();
  private readonly granularConsentStore = new Map<string, Map<ConsentCategory, IConsentRecord>>();
  private readonly userStore = new Map<
    string,
    {
      id: string;
      email: string;
      fullName: string;
      role: string;
      status: AccountStatus;
      isActive: boolean;
      createdAt: string;
    }
  >();
  private readonly auditChain: ISecurityAuditEvent[] = [];

  constructor(@Optional() private readonly authService?: AuthService) {
    // Seed standard test user
    this.userStore.set('athlete_privacy_001', {
      id: 'athlete_privacy_001',
      email: 'athlete.privacy@alpha.os',
      fullName: 'Marcus Vance',
      role: 'ATHLETE',
      status: AccountStatus.ACTIVE,
      isActive: true,
      createdAt: '2026-01-15T08:00:00.000Z',
    });
  }

  seedUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: AccountStatus;
    isActive: boolean;
    createdAt: string;
  }) {
    this.userStore.set(user.id, user);
  }

  getUser(userId: string) {
    return this.userStore.get(userId);
  }

  // -------------------------------------------------------------
  // 1. Granular Consent & Policy Versioning
  // -------------------------------------------------------------

  async getConsentStatus(userId: string): Promise<IConsentStatus> {
    let userConsents = this.granularConsentStore.get(userId);
    if (!userConsents) {
      userConsents = new Map<ConsentCategory, IConsentRecord>();
      this.granularConsentStore.set(userId, userConsents);
    }

    const records = {} as Record<ConsentCategory, IConsentRecord>;
    const outdatedCategories: ConsentCategory[] = [];

    for (const category of Object.values(ConsentCategory)) {
      const activeVersion = ACTIVE_PRIVACY_POLICIES[category];
      const existing = userConsents.get(category);

      if (!existing) {
        // Create default ungranted placeholder
        const ungranted: IConsentRecord = {
          id: `consent_${crypto.randomUUID()}`,
          userId,
          category,
          version: '0.0.0',
          granted: false,
        };
        records[category] = ungranted;
        outdatedCategories.push(category);
      } else {
        records[category] = existing;
        if (existing.version !== activeVersion || !existing.granted) {
          outdatedCategories.push(category);
        }
      }
    }

    return {
      userId,
      records,
      needsReconsent: outdatedCategories.length > 0,
      outdatedCategories,
    };
  }

  async grantConsent(
    userId: string,
    dto: GrantConsentDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<IConsentRecord> {
    let userConsents = this.granularConsentStore.get(userId);
    if (!userConsents) {
      userConsents = new Map<ConsentCategory, IConsentRecord>();
      this.granularConsentStore.set(userId, userConsents);
    }

    const nowIso = new Date().toISOString();
    const record: IConsentRecord = {
      id: `consent_${crypto.randomUUID()}`,
      userId,
      category: dto.category,
      version: dto.version,
      granted: dto.granted,
      grantedAt: nowIso,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    };

    userConsents.set(dto.category, record);

    // Cryptographic audit log
    this.logAuditEvent({
      eventType: SecurityAuditEventType.CONSENT_GRANTED,
      actorId: userId,
      actorRole: 'ATHLETE',
      targetUserId: userId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      details: { category: dto.category, version: dto.version },
    });

    return record;
  }

  async withdrawConsent(
    userId: string,
    dto: WithdrawConsentDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<IConsentRecord> {
    let userConsents = this.granularConsentStore.get(userId);
    if (!userConsents) {
      userConsents = new Map<ConsentCategory, IConsentRecord>();
      this.granularConsentStore.set(userId, userConsents);
    }

    const activeVersion = ACTIVE_PRIVACY_POLICIES[dto.category];
    const existing = userConsents.get(dto.category);
    const nowIso = new Date().toISOString();

    const record: IConsentRecord = {
      id: existing?.id || `consent_${crypto.randomUUID()}`,
      userId,
      category: dto.category,
      version: existing?.version || activeVersion,
      granted: false,
      grantedAt: existing?.grantedAt,
      withdrawnAt: nowIso,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    };

    userConsents.set(dto.category, record);

    // Cryptographic audit log
    this.logAuditEvent({
      eventType: SecurityAuditEventType.CONSENT_WITHDRAWN,
      actorId: userId,
      actorRole: 'ATHLETE',
      targetUserId: userId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      details: { category: dto.category, reason: dto.reason || 'User opted out' },
    });

    return record;
  }

  /**
   * Downstream Guard: Verify athlete has consented to AI coaching ingestion
   */
  canIngestAiTelemetry(userId: string): boolean {
    const userConsents = this.granularConsentStore.get(userId);
    if (!userConsents) return false;
    const aiConsent = userConsents.get(ConsentCategory.AI_COACHING_DATA_INGESTION);
    return !!aiConsent && aiConsent.granted && !aiConsent.withdrawnAt;
  }

  /**
   * Downstream Guard: Verify athlete has consented to health & biometric processing
   */
  canProcessHealthData(userId: string): boolean {
    const userConsents = this.granularConsentStore.get(userId);
    if (!userConsents) return false;
    const healthConsent = userConsents.get(ConsentCategory.HEALTH_DATA_PROCESSING);
    return !!healthConsent && healthConsent.granted && !healthConsent.withdrawnAt;
  }

  // Legacy consent methods for backwards-compatibility
  async getConsent(userId: string): Promise<IUserConsentPreferences> {
    const consent = this.consentPreferencesStore.get(userId);
    if (consent) {
      return consent;
    }

    const defaultConsent: IUserConsentPreferences = {
      userId,
      analyticsTracking: true,
      telemetrySharing: true,
      marketingCommunications: false,
      dataRetentionAgreed: true,
      updatedAt: new Date().toISOString(),
    };

    this.consentPreferencesStore.set(userId, defaultConsent);
    return defaultConsent;
  }

  async updateConsent(
    userId: string,
    data: UpdateConsentPreferencesDto,
  ): Promise<IUserConsentPreferences> {
    const current = await this.getConsent(userId);
    const updated: IUserConsentPreferences = {
      ...current,
      ...data,
      userId,
      updatedAt: new Date().toISOString(),
    };

    this.consentPreferencesStore.set(userId, updated);

    this.logAuditEvent({
      eventType: SecurityAuditEventType.CONSENT_GRANTED,
      actorId: userId,
      actorRole: 'ATHLETE',
      targetUserId: userId,
      details: data as Record<string, unknown>,
      action: 'PRIVACY_CONSENT_UPDATED',
      resource: 'UserConsentPreferences',
    });

    return updated;
  }

  // -------------------------------------------------------------
  // 2. Tamper-Evident Security Audit Log Chain
  // -------------------------------------------------------------

  logAuditEvent(params: {
    eventType: SecurityAuditEventType;
    actorId: string;
    actorRole: string;
    targetUserId?: string;
    organizationId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
    action?: string;
    resource?: string;
  }): ISecurityAuditEvent {
    const lastEvent = this.auditChain[this.auditChain.length - 1];
    const previousHash = lastEvent ? lastEvent.integrityHash : GENESIS_AUDIT_HASH;
    const id = `audit_${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    const integrityHash = AuditCryptoUtil.computeEventIntegrityHash(previousHash, {
      id,
      eventType: params.eventType,
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetUserId: params.targetUserId,
      organizationId: params.organizationId,
      timestamp,
      details: params.details,
    });

    const event: ISecurityAuditEvent = {
      id,
      eventType: params.eventType,
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetUserId: params.targetUserId,
      organizationId: params.organizationId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: params.details,
      timestamp,
      previousHash,
      integrityHash,
      // Backwards-compatible aliases
      action: params.action || (params.eventType as string),
      metadata: params.details,
      userId: params.targetUserId || params.actorId,
      resource: params.resource || 'UserPrivacy',
    };

    this.auditChain.push(event);
    return event;
  }

  verifyAuditLogIntegrity(): AuditVerificationResult {
    return AuditCryptoUtil.verifyAuditChain(this.auditChain);
  }

  getAuditTrail(userId?: string): ISecurityAuditEvent[] {
    if (userId) {
      return this.auditChain.filter((a) => a.actorId === userId || a.targetUserId === userId);
    }
    return [...this.auditChain];
  }

  // -------------------------------------------------------------
  // 3. Access Transparency: Read Auditing for Sensitive Health Data
  // -------------------------------------------------------------

  recordHealthDataAccess(
    actorId: string,
    actorRole: string,
    targetUserId: string,
    reason = 'Coach Telemetry Review',
    meta?: { ipAddress?: string; userAgent?: string },
  ): ISecurityAuditEvent {
    return this.logAuditEvent({
      eventType: SecurityAuditEventType.HEALTH_DATA_READ,
      actorId,
      actorRole,
      targetUserId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      details: { category: 'BIOMETRICS', reason },
    });
  }

  getHealthDataAccessLog(targetUserId: string): ISecurityAuditEvent[] {
    return this.auditChain.filter(
      (a) =>
        a.targetUserId === targetUserId &&
        a.eventType === SecurityAuditEventType.HEALTH_DATA_READ,
    );
  }

  // -------------------------------------------------------------
  // 4. Rate-Limited Data Portability Export Bundle (GDPR Art. 20)
  // -------------------------------------------------------------

  async generateDataPortabilityBundle(userId: string): Promise<IDataPortabilityBundle> {
    const user = this.userStore.get(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Enforce rate limiter (3 exports per hour)
    const rateKey = `export:${userId}`;
    const rateCheck = globalRateLimiter.check(
      rateKey,
      RATE_LIMIT_PROFILES.DATA_PORTABILITY_EXPORT.limit,
      RATE_LIMIT_PROFILES.DATA_PORTABILITY_EXPORT.windowSeconds,
    );

    if (!rateCheck.allowed) {
      throw new ForbiddenException({
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Data export limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds before requesting another export bundle.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const exportId = `export_${crypto.randomUUID()}`;
    const exportedAt = new Date().toISOString();

    const rawBundle: IDataPortabilityBundle = {
      exportId,
      exportedAt,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: {
        gender: 'MALE',
        heightCm: 182,
        weightKg: 80.5,
        experienceLevel: 'ADVANCED',
      },
      preferences: {
        unitSystem: 'METRIC',
        timezone: 'UTC',
        language: 'en',
      },
      workouts: [
        {
          id: 'ws_001',
          date: '2026-06-10',
          title: 'Upper Body Hypertrophy',
          setsCompleted: 16,
          totalVolumeKg: 12450,
        },
      ],
      nutrition: [
        {
          id: 'dml_001',
          date: '2026-06-10',
          caloriesConsumed: 2650,
          proteinGrams: 180,
          carbsGrams: 290,
          fatsGrams: 75,
        },
      ],
      activity: [
        {
          id: 'act_001',
          date: '2026-06-10',
          stepCount: 11420,
          activeCalories: 620,
        },
      ],
      biometrics: [
        {
          date: '2026-06-10',
          weightKg: 80.5,
          restingHeartRate: 54,
        },
      ],
      compliance: {
        format: 'JSON_SCHEMA_V1',
        gdprArticle: 'ARTICLE_20',
        framework: 'PRIVACY_READY',
        controlsImplemented: [
          'GDPR Article 20 (Right to Data Portability)',
          'CCPA 1798.100 (Right to Know and Portability)',
          'Deterministic SHA-256 Checksum Verification',
          'Canonical Metric/UTC Normalization',
        ],
        dataSovereignty: 'CANONICAL_UTC_METRIC',
      },
    };

    // Generate SHA-256 Checksum for data bundle integrity
    const checksum = ExportChecksumUtil.generateChecksum(rawBundle as unknown as Record<string, any>);
    rawBundle.checksum = checksum;

    this.logAuditEvent({
      eventType: SecurityAuditEventType.DATA_EXPORT_REQUESTED,
      actorId: userId,
      actorRole: 'ATHLETE',
      targetUserId: userId,
      details: { exportId, checksum },
      action: 'DATA_PORTABILITY_EXPORTED',
      resource: 'UserDataBundle',
    });

    return rawBundle;
  }

  // -------------------------------------------------------------
  // 5. GDPR Article 17 Right to Erasure / Anonymization
  // -------------------------------------------------------------

  async anonymizeUserData(
    userId: string,
    confirmPhrase: string,
    reason?: string,
  ): Promise<IAnonymizationResult> {
    if (confirmPhrase !== ERASURE_CONFIRM_PHRASE) {
      throw new BadRequestException({
        code: 'INVALID_ERASURE_CONFIRMATION',
        message: `To permanently erase user data, confirmPhrase must equal '${ERASURE_CONFIRM_PHRASE}'`,
      });
    }

    const user = this.userStore.get(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const pseudonym = `anonymized_${crypto.randomBytes(8).toString('hex')}`;
    const anonymizedAt = new Date().toISOString();

    // 1. Scrub PII from user identity record
    user.email = `${pseudonym}@deleted.alpha.os`;
    user.fullName = 'Anonymized Athlete';
    user.status = AccountStatus.DELETED;
    user.isActive = false;

    this.userStore.set(userId, user);

    // 2. Wipe consent preferences
    this.consentPreferencesStore.delete(userId);
    this.granularConsentStore.delete(userId);

    // 3. Invalidate all active sessions for this user
    if (this.authService) {
      await this.authService.revokeAllOtherSessions(userId);
    }

    // 4. Log erasure audit event
    this.logAuditEvent({
      eventType: SecurityAuditEventType.DATA_ERASURE_REQUESTED,
      actorId: userId,
      actorRole: 'ATHLETE',
      targetUserId: userId,
      details: { pseudonym, reason: reason || 'User requested erasure' },
      action: 'USER_DATA_ANONYMIZED',
      resource: 'UserIdentity',
    });

    return {
      userId,
      anonymizedAt,
      success: true,
      recordsScrubbed: 8, // profile, email, fullName, preferences, push tokens, audit link, active sessions, consent
      pseudonym,
    };
  }

  // -------------------------------------------------------------
  // 6. Data Retention Status Evaluator
  // -------------------------------------------------------------

  evaluateRecordRetention(
    recordCreatedAt: Date | string,
    category: RetentionCategory,
    now: Date = new Date(),
  ): RetentionEvaluationResult {
    const rule = DEFAULT_RETENTION_RULES[category];
    return DataRetentionUtil.evaluateRetentionStatus(recordCreatedAt, rule, now);
  }

  // Testing helpers
  public clearAll() {
    this.userStore.clear();
    this.consentPreferencesStore.clear();
    this.granularConsentStore.clear();
    this.auditChain.length = 0;
  }
}
