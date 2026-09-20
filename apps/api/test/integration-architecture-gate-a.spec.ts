import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationConnectionState,
  HealthPermissionState,
  IntegrationAuthType,
  IAuthUser,
  UserRole,
  AccountStatus,
} from '@alpha/types';
import {
  TokenVaultUtil,
  WebhookSecurityUtil,
} from '@alpha/utils';

import { IntegrationsModule } from '../src/modules/integrations/integrations.module';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import { TokenVaultService } from '../src/modules/integrations/services/token-vault.service';
import { ProvenanceDeduplicationService } from '../src/modules/integrations/services/provenance-deduplication.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('ALPHA — PHASE 14: GATE A — INTEGRATION ARCHITECTURE TEST HARNESS', () => {
  let service: IntegrationsService;
  let tokenVault: TokenVaultService;
  let dedupService: ProvenanceDeduplicationService;
  let queueService: QueueService;

  const mockUserA: IAuthUser = {
    id: 'user-athlete-alpha-001',
    email: 'athlete.a@alpha.test',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  const mockUserB: IAuthUser = {
    id: 'user-athlete-bravo-002',
    email: 'athlete.b@alpha.test',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        IntegrationsModule,
      ],
    }).compile();

    service = moduleRef.get<IntegrationsService>(IntegrationsService);
    tokenVault = moduleRef.get<TokenVaultService>(TokenVaultService);
    dedupService = moduleRef.get<ProvenanceDeduplicationService>(ProvenanceDeduplicationService);
    queueService = moduleRef.get<QueueService>(QueueService);
  });

  // -------------------------------------------------------------
  // 1. PROVIDER ABSTRACTION & CAPABILITY REGISTRY
  // -------------------------------------------------------------
  describe('1. Provider Abstraction & Capability Registry', () => {
    it('should register all 6 official wearable/health platforms', async () => {
      const providers = await service.getProviders(mockUserA.id);
      expect(providers).toHaveLength(6);

      const platforms = providers.map((p) => p.platform);
      expect(platforms).toContain(HealthPlatform.APPLE_HEALTHKIT);
      expect(platforms).toContain(HealthPlatform.ANDROID_HEALTH_CONNECT);
      expect(platforms).toContain(HealthPlatform.OURA);
      expect(platforms).toContain(HealthPlatform.WHOOP);
      expect(platforms).toContain(HealthPlatform.GARMIN);
      expect(platforms).toContain(HealthPlatform.FITBIT);
    });

    it('should declare capabilities explicitly per provider without cross-pollution', () => {
      const appleCaps = service.getProviderCapabilities(HealthPlatform.APPLE_HEALTHKIT);
      const ouraCaps = service.getProviderCapabilities(HealthPlatform.OURA);
      const garminCaps = service.getProviderCapabilities(HealthPlatform.GARMIN);

      // Apple HealthKit capabilities
      expect(appleCaps.capabilities).toContain(IntegrationCapability.STEPS);
      expect(appleCaps.capabilities).toContain(IntegrationCapability.WORKOUTS);
      expect(appleCaps.capabilities).not.toContain(IntegrationCapability.READINESS_SCORE);

      // Oura capabilities
      expect(ouraCaps.capabilities).toContain(IntegrationCapability.SLEEP);
      expect(ouraCaps.capabilities).toContain(IntegrationCapability.READINESS_SCORE);
      expect(ouraCaps.capabilities).toContain(IntegrationCapability.HRV);
      expect(ouraCaps.capabilities).not.toContain(IntegrationCapability.ROUTE);

      // Garmin capabilities
      expect(garminCaps.capabilities).toContain(IntegrationCapability.ROUTE);
      expect(garminCaps.capabilities).toContain(IntegrationCapability.VO2_MAX);
    });

    it('should distinguish mobile SDK integrations from cloud OAuth requiring credentials', async () => {
      const providers = await service.getProviders(mockUserA.id);
      const apple = providers.find((p) => p.platform === HealthPlatform.APPLE_HEALTHKIT)!;
      const whoop = providers.find((p) => p.platform === HealthPlatform.WHOOP)!;

      expect(apple.authType).toBe(IntegrationAuthType.MOBILE_SDK);
      expect(apple.requiresCredentials).toBe(false);

      expect(whoop.authType).toBe(IntegrationAuthType.OAUTH2);
      expect(whoop.requiresCredentials).toBe(true);
    });

    it('should throw NotFoundException for invalid or unregistered providers', () => {
      expect(() => service.getProviderCapabilities('UNKNOWN_DEVICE' as any)).toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------
  // 2. CONNECTION LIFECYCLE & STATE MACHINE
  // -------------------------------------------------------------
  describe('2. Connection Lifecycle & State Machine', () => {
    it('should report default AVAILABLE state for unlinked provider', async () => {
      const connection = await service.getConnection(mockUserA.id, HealthPlatform.APPLE_HEALTHKIT);
      expect(connection.status).toBe(IntegrationConnectionState.AVAILABLE);
      expect(connection.permissionState).toBe(HealthPermissionState.NOT_REQUESTED);
      expect(connection.grantedPermissions).toHaveLength(0);
    });

    it('should connect provider, store tokens safely, and enqueue initial sync job', async () => {
      const connected = await service.connect(mockUserA.id, {
        platform: HealthPlatform.OURA,
        accessToken: 'oura_live_pat_token_test_1234567890',
        refreshToken: 'oura_refresh_token_test_0987654321',
        expiresIn: 86400,
        scopes: ['daily', 'heartrate', 'sleep'],
      });

      expect(connected.status).toBe(IntegrationConnectionState.CONNECTED);
      expect(connected.permissionState).toBe(HealthPermissionState.GRANTED);
      expect(connected.grantedPermissions).toEqual(['daily', 'heartrate', 'sleep']);

      // Check initial sync job enqueued
      const hasInitSync = queueService.hasIdempotentJob(
        `init_sync:${mockUserA.id}:${HealthPlatform.OURA}`,
      );
      expect(hasInitSync).toBe(true);
    });

    it('should transition to SYNCING state when sync is triggered', async () => {
      const syncResult = await service.triggerSync(mockUserA.id, {
        platform: HealthPlatform.OURA,
        syncType: 'INCREMENTAL',
        syncWindowDays: 3,
      });

      expect(syncResult.status).toBe(IntegrationConnectionState.SYNCING);
      expect(syncResult.syncType).toBe('INCREMENTAL');
      expect(syncResult.jobId).toBeDefined();

      const connection = await service.getConnection(mockUserA.id, HealthPlatform.OURA);
      expect(connection.status).toBe(IntegrationConnectionState.SYNCING);
    });

    it('should disconnect provider, revoke tokens, and transition to DISCONNECTED', async () => {
      const disconnected = await service.disconnect(mockUserA.id, {
        platform: HealthPlatform.OURA,
        revokeRemoteTokens: true,
      });

      expect(disconnected.status).toBe(IntegrationConnectionState.DISCONNECTED);
      expect(disconnected.permissionState).toBe(HealthPermissionState.REVOKED);

      // Decrypted tokens should now be gone
      const tokens = await tokenVault.getDecryptedTokens(mockUserA.id, HealthPlatform.OURA);
      expect(tokens).toBeNull();
    });

    it('should reject sync on a disconnected provider', async () => {
      await expect(
        service.triggerSync(mockUserA.id, {
          platform: HealthPlatform.OURA,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------
  // 3. HEALTH PERMISSIONS & PARTIAL PERMISSIONS MODEL
  // -------------------------------------------------------------
  describe('3. Health Permissions & Partial Grants Model', () => {
    it('should support granular permission states including PARTIALLY_GRANTED', async () => {
      const updated = await service.updatePermissions(mockUserA.id, {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        permissionState: HealthPermissionState.PARTIALLY_GRANTED,
        grantedPermissions: ['STEPS', 'ACTIVE_CALORIES'],
        deniedPermissions: ['HEART_RATE', 'WORKOUTS'],
      });

      expect(updated.permissionState).toBe(HealthPermissionState.PARTIALLY_GRANTED);
      expect(updated.grantedPermissions).toContain('STEPS');
      expect(updated.grantedPermissions).not.toContain('HEART_RATE');
    });

    it('should prevent sync execution when permissions are DENIED', async () => {
      await service.updatePermissions(mockUserA.id, {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        permissionState: HealthPermissionState.DENIED,
        grantedPermissions: [],
      });

      await expect(
        service.triggerSync(mockUserA.id, {
          platform: HealthPlatform.APPLE_HEALTHKIT,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------
  // 4. DATA PROVENANCE & IMMUTABILITY
  // -------------------------------------------------------------
  describe('4. Data Provenance Tracking', () => {
    it('should build complete, immutable provenance record for imported metrics', () => {
      const recordedAt = '2026-09-19T06:00:00.000Z';
      const provenance = dedupService.createProvenance({
        sourceProvider: HealthPlatform.WHOOP,
        sourceRecordId: 'whoop_recovery_cycle_887192',
        userId: mockUserA.id,
        metricType: 'RECOVERY_SCORE',
        recordedAt,
        sourceTimezone: 'America/New_York',
        syncJobId: 'job-wearable-sync-4421',
        deviceModel: 'WHOOP 4.0 Strap',
        deviceManufacturer: 'WHOOP Inc',
        confidenceScore: 0.95,
      });

      expect(provenance.sourceProvider).toBe(HealthPlatform.WHOOP);
      expect(provenance.sourceRecordId).toBe('whoop_recovery_cycle_887192');
      expect(provenance.userId).toBe(mockUserA.id);
      expect(provenance.metricType).toBe('RECOVERY_SCORE');
      expect(provenance.recordedAt).toBe(recordedAt);
      expect(provenance.sourceTimezone).toBe('America/New_York');
      expect(provenance.isManualInput).toBe(false);
      expect(provenance.confidenceScore).toBe(0.95);
      expect(provenance.importedAt).toBeDefined();
    });

    it('should correctly flag manual entries in provenance', () => {
      const provenance = dedupService.createProvenance({
        sourceProvider: 'MANUAL',
        sourceRecordId: 'manual_weighin_101',
        userId: mockUserA.id,
        metricType: 'BODY_WEIGHT',
        recordedAt: '2026-09-19T07:30:00.000Z',
      });

      expect(provenance.sourceProvider).toBe('MANUAL');
      expect(provenance.isManualInput).toBe(true);
      expect(provenance.confidenceScore).toBe(1.0);
    });
  });

  // -------------------------------------------------------------
  // 5. DETERMINISTIC DEDUPLICATION
  // -------------------------------------------------------------
  describe('5. Deterministic Deduplication Engine', () => {
    it('should generate identical SHA-256 dedup keys for identical inputs', () => {
      const key1 = dedupService.getDedupKey(
        mockUserA.id,
        'STEPS',
        '2026-09-19',
        'apple_steps_rec_99',
      );
      const key2 = dedupService.getDedupKey(
        mockUserA.id,
        'STEPS',
        '2026-09-19',
        'apple_steps_rec_99',
      );
      const diffKey = dedupService.getDedupKey(
        mockUserB.id, // Different user
        'STEPS',
        '2026-09-19',
        'apple_steps_rec_99',
      );

      expect(key1).toHaveLength(64); // SHA-256 hex
      expect(key1).toBe(key2);
      expect(key1).not.toBe(diffKey);
    });

    it('should detect duplicate records and prevent re-ingestion', () => {
      const recDate = '2026-09-19T08:00:00.000Z';
      const sourceId = 'garmin_act_5521';

      expect(dedupService.isDuplicate(mockUserA.id, 'WORKOUT', recDate, sourceId)).toBe(false);

      dedupService.registerRecord(
        mockUserA.id,
        'WORKOUT',
        recDate,
        'canonical-workout-id-001',
        sourceId,
      );

      expect(dedupService.isDuplicate(mockUserA.id, 'WORKOUT', recDate, sourceId)).toBe(true);
      // User B should not be affected by User A's dedup registration
      expect(dedupService.isDuplicate(mockUserB.id, 'WORKOUT', recDate, sourceId)).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 6. MULTI-SOURCE CONFLICT RESOLUTION MATRIX
  // -------------------------------------------------------------
  describe('6. Conflict Resolution Matrix & Domain Policies', () => {
    it('should resolve STRENGTH_WORKOUT conflicts with MANUAL_OVERRIDE (Alpha manual wins)', () => {
      const manualRecord = {
        source: 'MANUAL' as const,
        value: 1250, // Alpha recorded training volume
        recordedAt: '2026-09-19T10:00:00.000Z',
        isManualInput: true,
      };

      const wearableRecord = {
        source: HealthPlatform.APPLE_HEALTHKIT,
        value: 950,
        recordedAt: '2026-09-19T10:00:00.000Z',
        isManualInput: false,
      };

      const result = dedupService.resolveConflict('STRENGTH_WORKOUT', manualRecord, wearableRecord);
      expect(result.strategy).toBe('MANUAL_OVERRIDE');
      expect(result.winner.source).toBe('MANUAL');
      expect(result.winner.value).toBe(1250);
      expect(result.reason).toContain('manual');
    });

    it('should resolve continuous HEART_RATE conflicts with HIGHER_CONFIDENCE (Wearable wins over Phone)', () => {
      const phoneHealthConnect = {
        source: HealthPlatform.ANDROID_HEALTH_CONNECT,
        value: 72, // Intermittent phone sample
        recordedAt: '2026-09-19T14:30:00.000Z',
        confidenceScore: 0.6,
      };

      const ouraRing = {
        source: HealthPlatform.OURA,
        value: 68, // Continuous PPG biometric sensor
        recordedAt: '2026-09-19T14:30:00.000Z',
        confidenceScore: 0.95,
      };

      const result = dedupService.resolveConflict('HEART_RATE', phoneHealthConnect, ouraRing);
      expect(result.winner.source).toBe(HealthPlatform.OURA);
      expect(result.winner.value).toBe(68);
    });

    it('should resolve STEPS conflicts with MAX_VALUE to prevent undercounting', () => {
      const phoneSteps = {
        source: HealthPlatform.APPLE_HEALTHKIT,
        value: 8400,
        recordedAt: '2026-09-19',
      };

      const watchSteps = {
        source: HealthPlatform.GARMIN,
        value: 10250,
        recordedAt: '2026-09-19',
      };

      const result = dedupService.resolveConflict('STEPS', phoneSteps, watchSteps);
      expect(result.strategy).toBe('MAX_VALUE');
      expect(result.winner.value).toBe(10250);
      expect(result.winner.source).toBe(HealthPlatform.GARMIN);
    });
  });

  // -------------------------------------------------------------
  // 7. TOKEN SECURITY & AES-256-GCM ENCRYPTION AT REST
  // -------------------------------------------------------------
  describe('7. Token Security & AES-256-GCM Encryption', () => {
    it('should encrypt tokens at rest with unique IV and authTag', async () => {
      const secretToken = 'garmin_oauth_secret_token_live_abc123';
      const enc1 = TokenVaultUtil.encrypt(secretToken);
      const enc2 = TokenVaultUtil.encrypt(secretToken);

      // Unique IV ensures identical plaintexts yield different ciphertexts
      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.encryptedData).not.toBe(enc2.encryptedData);
      expect(enc1.authTag).toBeDefined();

      const decrypted = TokenVaultUtil.decrypt(enc1);
      expect(decrypted).toBe(secretToken);
    });

    it('should fail decryption when ciphertext or authTag is tampered with', () => {
      const enc = TokenVaultUtil.encrypt('whoop_token_9999');
      // Tamper with authentication tag guaranteed
      const tamperedAuthTag = enc.authTag[0] === 'a' ? 'b' + enc.authTag.slice(1) : 'a' + enc.authTag.slice(1);
      const corrupted = { ...enc, authTag: tamperedAuthTag };

      expect(() => TokenVaultUtil.decrypt(corrupted)).toThrow();

    });

    it('should mask tokens and never expose plaintexts in sanitized client DTOs', async () => {
      await tokenVault.storeTokens(mockUserA.id, HealthPlatform.WHOOP, {
        accessToken: 'whoop_secret_tok_long_alpha_string_xyz',
        refreshToken: 'whoop_secret_refresh_long_string_abc',
        expiresIn: 3600,
      });

      const sanitized = tokenVault.getSanitizedTokenInfo(mockUserA.id, HealthPlatform.WHOOP);
      expect(sanitized.hasAccessToken).toBe(true);
      expect(sanitized.hasRefreshToken).toBe(true);
      expect(sanitized.maskedAccessToken).not.toContain('long_alpha_string');
      expect(sanitized.maskedAccessToken).toBe('********');
    });
  });

  // -------------------------------------------------------------
  // 8. WEBHOOK SECURITY & HMAC SIGNATURE VERIFICATION
  // -------------------------------------------------------------
  describe('8. Webhook Security & HMAC Verification', () => {
    const webhookSecret = 'test-secret-key-alpha-webhook-2026';
    const payload = JSON.stringify({
      eventId: 'evt_oura_sleep_updated_1001',
      event: 'sleep.updated',
      timestamp: Date.now(),
      data: { score: 88, sleepDuration: 28800 },
    });

    it('should verify valid HMAC-SHA256 webhook signatures and enqueue sync job', async () => {
      const validSig = WebhookSecurityUtil.generateSignature(payload, webhookSecret);
      const result = await service.processWebhook(
        HealthPlatform.OURA,
        payload,
        validSig,
        webhookSecret,
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('evt_oura_sleep_updated_1001');
      expect(result.enqueuedJobId).toBeDefined();
    });

    it('should reject invalid or forged webhook signatures with UnauthorizedException', async () => {
      const forgedSig = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';
      await expect(
        service.processWebhook(
          HealthPlatform.OURA,
          payload,
          forgedSig,
          webhookSecret,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // -------------------------------------------------------------
  // 9. STRICT TENANT ISOLATION
  // -------------------------------------------------------------
  describe('9. Strict Tenant Isolation', () => {
    it('should isolate user connections and tokens completely between tenants', async () => {
      // Connect Garmin for User A
      await service.connect(mockUserA.id, {
        platform: HealthPlatform.GARMIN,
        accessToken: 'garmin_token_user_a',
      });

      // Connect Whoop for User B
      await service.connect(mockUserB.id, {
        platform: HealthPlatform.WHOOP,
        accessToken: 'whoop_token_user_b',
      });

      // User A's connections should only show Garmin
      const userAConnections = await service.getUserConnections(mockUserA.id);
      expect(userAConnections.some((c) => c.platform === HealthPlatform.GARMIN)).toBe(true);
      expect(userAConnections.some((c) => c.platform === HealthPlatform.WHOOP)).toBe(false);

      // User B's connections should only show Whoop
      const userBConnections = await service.getUserConnections(mockUserB.id);
      expect(userBConnections.some((c) => c.platform === HealthPlatform.WHOOP)).toBe(true);
      expect(userBConnections.some((c) => c.platform === HealthPlatform.GARMIN)).toBe(false);

      // User B cannot decrypt User A's tokens
      const userBAttemptOnA = await tokenVault.getDecryptedTokens(
        mockUserB.id,
        HealthPlatform.GARMIN,
      );
      expect(userBAttemptOnA).toBeNull();
    });
  });
});
