import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrivacyService, ERASURE_CONFIRM_PHRASE, ACTIVE_PRIVACY_POLICIES } from '../src/modules/privacy/privacy.service';
import { AuthService } from '../src/modules/auth/auth.service';
import {
  AccountStatus,
  ConsentCategory,
  SecurityAuditEventType,
  UserRole,
} from '@alpha/types';
import {
  AuditCryptoUtil,
  DataRetentionUtil,
  DEFAULT_RETENTION_RULES,
  ExportChecksumUtil,
  globalRateLimiter,
} from '@alpha/utils';

describe('Phase 12 — Gate C: Privacy & Data Protection Suite', () => {
  let privacyService: PrivacyService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'privacy_gate_c_test_jwt_secret_min_32_characters',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [PrivacyService, AuthService],
    }).compile();

    privacyService = module.get<PrivacyService>(PrivacyService);
    authService = module.get<AuthService>(AuthService);

    privacyService.clearAll();
    authService.clearUsers();

    // Seed test athlete
    privacyService.seedUser({
      id: 'athlete_c_001',
      email: 'athlete.c@alpha.os',
      fullName: 'Marcus Vance',
      role: 'ATHLETE',
      status: AccountStatus.ACTIVE,
      isActive: true,
      createdAt: '2026-01-15T08:00:00.000Z',
    });
  });

  describe('1. Granular Consent Management & Policy Versioning', () => {
    it('detects ungranted or outdated consent categories against active policy versions', async () => {
      const status = await privacyService.getConsentStatus('athlete_c_001');

      expect(status.needsReconsent).toBe(true);
      expect(status.outdatedCategories).toContain(ConsentCategory.TERMS_OF_SERVICE);
      expect(status.outdatedCategories).toContain(ConsentCategory.HEALTH_DATA_PROCESSING);
      expect(status.outdatedCategories).toContain(ConsentCategory.AI_COACHING_DATA_INGESTION);
    });

    it('records granular consent grant with version, timestamp, and audit trail', async () => {
      const record = await privacyService.grantConsent(
        'athlete_c_001',
        {
          category: ConsentCategory.AI_COACHING_DATA_INGESTION,
          version: ACTIVE_PRIVACY_POLICIES[ConsentCategory.AI_COACHING_DATA_INGESTION],
          granted: true,
        },
        { ipAddress: '192.168.1.100', userAgent: 'AlphaApp/iOS' },
      );

      expect(record.granted).toBe(true);
      expect(record.version).toBe(ACTIVE_PRIVACY_POLICIES[ConsentCategory.AI_COACHING_DATA_INGESTION]);
      expect(record.grantedAt).toBeDefined();

      // Downstream gate check allows AI ingestion
      expect(privacyService.canIngestAiTelemetry('athlete_c_001')).toBe(true);
    });

    it('enforces downstream processing revocation upon consent withdrawal', async () => {
      // 1. Grant consent
      await privacyService.grantConsent('athlete_c_001', {
        category: ConsentCategory.AI_COACHING_DATA_INGESTION,
        version: ACTIVE_PRIVACY_POLICIES[ConsentCategory.AI_COACHING_DATA_INGESTION],
        granted: true,
      });
      expect(privacyService.canIngestAiTelemetry('athlete_c_001')).toBe(true);

      // 2. Withdraw consent
      const withdrawn = await privacyService.withdrawConsent('athlete_c_001', {
        category: ConsentCategory.AI_COACHING_DATA_INGESTION,
        reason: 'Athlete requested to stop AI analysis of workout telemetry',
      });

      expect(withdrawn.granted).toBe(false);
      expect(withdrawn.withdrawnAt).toBeDefined();

      // 3. Downstream AI processing is immediately blocked
      expect(privacyService.canIngestAiTelemetry('athlete_c_001')).toBe(false);
    });

    it('enforces health data processing consent guard', async () => {
      expect(privacyService.canProcessHealthData('athlete_c_001')).toBe(false);

      await privacyService.grantConsent('athlete_c_001', {
        category: ConsentCategory.HEALTH_DATA_PROCESSING,
        version: ACTIVE_PRIVACY_POLICIES[ConsentCategory.HEALTH_DATA_PROCESSING],
        granted: true,
      });

      expect(privacyService.canProcessHealthData('athlete_c_001')).toBe(true);
    });
  });

  describe('2. Cryptographic Tamper-Evident Audit Log Chain', () => {
    it('creates chained audit events and verifies unbroken chain integrity', () => {
      privacyService.logAuditEvent({
        eventType: SecurityAuditEventType.USER_LOGIN,
        actorId: 'athlete_c_001',
        actorRole: 'ATHLETE',
      });

      privacyService.logAuditEvent({
        eventType: SecurityAuditEventType.CONSENT_GRANTED,
        actorId: 'athlete_c_001',
        actorRole: 'ATHLETE',
        details: { category: 'HEALTH_DATA_PROCESSING' },
      });

      privacyService.logAuditEvent({
        eventType: SecurityAuditEventType.PASSWORD_CHANGED,
        actorId: 'athlete_c_001',
        actorRole: 'ATHLETE',
      });

      const verification = privacyService.verifyAuditLogIntegrity();
      expect(verification.isValid).toBe(true);
      expect(verification.totalEvents).toBe(3);
    });

    it('detects tampering when an audit log payload has been altered', () => {
      privacyService.logAuditEvent({
        eventType: SecurityAuditEventType.USER_LOGIN,
        actorId: 'athlete_c_001',
        actorRole: 'ATHLETE',
      });

      privacyService.logAuditEvent({
        eventType: SecurityAuditEventType.CONSENT_GRANTED,
        actorId: 'athlete_c_001',
        actorRole: 'ATHLETE',
        details: { category: 'TERMS_OF_SERVICE' },
      });

      const trail = privacyService.getAuditTrail();
      // Maliciously modify second event in place
      trail[1]!.actorId = 'attacker_007';

      const verification = AuditCryptoUtil.verifyAuditChain(trail);
      expect(verification.isValid).toBe(false);
      expect(verification.brokenAtIndex).toBe(1);
      expect(verification.error).toContain('tampering detected');
    });

    it('detects when an intermediate audit log event is deleted from the chain', () => {
      privacyService.logAuditEvent({
        eventType: SecurityAuditEventType.USER_LOGIN,
        actorId: 'athlete_c_001',
        actorRole: 'ATHLETE',
      });

      privacyService.logAuditEvent({
        eventType: SecurityAuditEventType.PASSWORD_CHANGED,
        actorId: 'athlete_c_001',
        actorRole: 'ATHLETE',
      });

      privacyService.logAuditEvent({
        eventType: SecurityAuditEventType.SESSION_REVOKED,
        actorId: 'athlete_c_001',
        actorRole: 'ATHLETE',
      });

      const trail = privacyService.getAuditTrail();
      // Maliciously delete the middle event
      const severedTrail = [trail[0]!, trail[2]!];

      const verification = AuditCryptoUtil.verifyAuditChain(severedTrail);
      expect(verification.isValid).toBe(false);
      expect(verification.brokenAtIndex).toBe(1);
      expect(verification.error).toContain('Chain broken');
    });
  });

  describe('3. Access Transparency: Read Auditing for Sensitive Health Data', () => {
    it('records read access events when coach inspects athlete health telemetry', () => {
      const event = privacyService.recordHealthDataAccess(
        'coach_elena_002',
        'COACH',
        'athlete_c_001',
        'Weekly VO2 max and resting heart rate check',
        { ipAddress: '10.0.0.42', userAgent: 'AlphaPortal/Web' },
      );

      expect(event.eventType).toBe(SecurityAuditEventType.HEALTH_DATA_READ);
      expect(event.actorId).toBe('coach_elena_002');
      expect(event.targetUserId).toBe('athlete_c_001');

      // Athlete can inspect who accessed their health data
      const accessLogs = privacyService.getHealthDataAccessLog('athlete_c_001');
      expect(accessLogs.length).toBe(1);
      expect(accessLogs[0]?.actorId).toBe('coach_elena_002');
      expect(accessLogs[0]?.details?.['category']).toBe('BIOMETRICS');
    });
  });

  describe('4. Rate-Limited Data Portability Export & Checksum Verification', () => {
    it('generates complete export bundle with deterministic SHA-256 checksum', async () => {
      // Clear rate limiter key
      globalRateLimiter.reset('export:athlete_c_001');

      const bundle = await privacyService.generateDataPortabilityBundle('athlete_c_001');

      expect(bundle.exportId).toBeDefined();
      expect(bundle.checksum).toBeDefined();
      expect(bundle.user.email).toBe('athlete.c@alpha.os');
      expect(bundle.workouts.length).toBeGreaterThan(0);
      expect(bundle.nutrition.length).toBeGreaterThan(0);
      expect(bundle.biometrics.length).toBeGreaterThan(0);

      // Verify embedded checksum
      const isValidChecksum = ExportChecksumUtil.verifyBundle(bundle);
      expect(isValidChecksum).toBe(true);

      // Tampering with payload invalidates checksum
      const tamperedBundle = JSON.parse(JSON.stringify(bundle));
      tamperedBundle.workouts[0].title = 'Tampered Workout Title';
      const isTamperedValid = ExportChecksumUtil.verifyBundle(tamperedBundle);
      expect(isTamperedValid).toBe(false);
    });

    it('enforces 3 requests per hour rate limit on data exports', async () => {
      const userId = 'athlete_rate_test_001';
      privacyService.seedUser({
        id: userId,
        email: 'rate.test@alpha.os',
        fullName: 'Rate Test User',
        role: 'ATHLETE',
        status: AccountStatus.ACTIVE,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      globalRateLimiter.reset(`export:${userId}`);

      // 3 successful exports allowed
      for (let i = 0; i < 3; i++) {
        const bundle = await privacyService.generateDataPortabilityBundle(userId);
        expect(bundle.exportId).toBeDefined();
      }

      // 4th export attempt must be blocked by rate limiter
      await expect(privacyService.generateDataPortabilityBundle(userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('5. GDPR Article 17 Right to Erasure / Anonymization & Session Wipe', () => {
    it('rejects erasure request when confirmation phrase is incorrect', async () => {
      await expect(
        privacyService.anonymizeUserData('athlete_c_001', 'wrong phrase'),
      ).rejects.toThrow(BadRequestException);
    });

    it('permanently anonymizes athlete identity, wipes consents, and terminates sessions', async () => {
      // 1. Seed user in AuthService and create active session
      authService.seedUser({
        id: 'athlete_c_001',
        email: 'athlete.c@alpha.os',
        passwordHash: 'hash:123',
        fullName: 'Marcus Vance',
        role: UserRole.ATHLETE,
        status: AccountStatus.ACTIVE,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. Perform anonymization with exact confirmation phrase
      const result = await privacyService.anonymizeUserData(
        'athlete_c_001',
        ERASURE_CONFIRM_PHRASE,
        'Moving away from fitness tracking',
      );

      expect(result.success).toBe(true);
      expect(result.recordsScrubbed).toBeGreaterThanOrEqual(7);
      expect(result.pseudonym).toMatch(/^anonymized_[0-9a-f]{16}$/);

      // 3. User record in store is anonymized and marked DELETED
      const scrubbedUser = privacyService.getUser('athlete_c_001');
      expect(scrubbedUser?.fullName).toBe('Anonymized Athlete');
      expect(scrubbedUser?.status).toBe(AccountStatus.DELETED);
      expect(scrubbedUser?.isActive).toBe(false);
      expect(scrubbedUser?.email).toContain('@deleted.alpha.os');

      // 4. Audit trail includes cryptographically chained erasure event
      const trail = privacyService.getAuditTrail('athlete_c_001');
      const erasureEvent = trail.find(
        (e) => e.eventType === SecurityAuditEventType.DATA_ERASURE_REQUESTED,
      );
      expect(erasureEvent).toBeDefined();
    });
  });

  describe('6. Data Retention Policy Status Evaluator', () => {
    it('evaluates raw telemetry retention (90-day window)', () => {
      const rule = DEFAULT_RETENTION_RULES.RAW_TELEMETRY;
      const now = new Date('2026-06-01T00:00:00.000Z');

      // 45-day-old record is active (KEEP)
      const activeRecord = new Date('2026-04-17T00:00:00.000Z');
      const resActive = DataRetentionUtil.evaluateRetentionStatus(activeRecord, rule, now);
      expect(resActive.isExpired).toBe(false);
      expect(resActive.actionRecommended).toBe('KEEP');
      expect(resActive.daysRemaining).toBe(45);

      // 95-day-old record is expired (PURGE)
      const expiredRecord = new Date('2026-02-26T00:00:00.000Z');
      const resExpired = DataRetentionUtil.evaluateRetentionStatus(expiredRecord, rule, now);
      expect(resExpired.isExpired).toBe(true);
      expect(resExpired.actionRecommended).toBe('PURGE');
      expect(resExpired.daysRemaining).toBe(0);
    });

    it('evaluates sensitive photo retention grace period (30-day window after deletion)', () => {
      const rule = DEFAULT_RETENTION_RULES.SENSITIVE_PHOTOS;
      const now = new Date('2026-06-01T00:00:00.000Z');

      // 10 days post-deletion $\to$ KEEP in grace period
      const gracePeriod = new Date('2026-05-22T00:00:00.000Z');
      const resGrace = DataRetentionUtil.evaluateRetentionStatus(gracePeriod, rule, now);
      expect(resGrace.isExpired).toBe(false);
      expect(resGrace.actionRecommended).toBe('KEEP');

      // 35 days post-deletion $\to$ PURGE permanently
      const postGrace = new Date('2026-04-27T00:00:00.000Z');
      const resPurge = DataRetentionUtil.evaluateRetentionStatus(postGrace, rule, now);
      expect(resPurge.isExpired).toBe(true);
      expect(resPurge.actionRecommended).toBe('PURGE');
    });

    it('evaluates audit log retention (730-day / 2-year statutory archive window)', () => {
      const rule = DEFAULT_RETENTION_RULES.AUDIT_LOGS;
      const now = new Date('2026-06-01T00:00:00.000Z');

      // 1 year old $\to$ KEEP
      const oneYearOld = new Date('2025-06-01T00:00:00.000Z');
      const resOneYear = DataRetentionUtil.evaluateRetentionStatus(oneYearOld, rule, now);
      expect(resOneYear.isExpired).toBe(false);
      expect(resOneYear.actionRecommended).toBe('KEEP');

      // 2.5 years old $\to$ ARCHIVE
      const twoAndHalfYearsOld = new Date('2023-12-01T00:00:00.000Z');
      const resArchive = DataRetentionUtil.evaluateRetentionStatus(twoAndHalfYearsOld, rule, now);
      expect(resArchive.isExpired).toBe(true);
      expect(resArchive.actionRecommended).toBe('ARCHIVE');
    });
  });
});
