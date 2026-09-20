import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  HealthPlatform,
  TokenRefreshStatus,
  IAuthUser,
  UserRole,
  AccountStatus,
} from '@alpha/types';
import { IntegrationsModule } from '../src/modules/integrations/integrations.module';
import { WearableSyncService } from '../src/modules/integrations/services/wearable-sync.service';
import { TokenVaultService } from '../src/modules/integrations/services/token-vault.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('ALPHA — PHASE 14: GATE C — WEARABLE PROVIDERS TEST HARNESS', () => {
  let wearableSyncService: WearableSyncService;
  let tokenVault: TokenVaultService;

  const mockUser: IAuthUser = {
    id: 'user-athlete-gate-c-001',
    email: 'athlete.gatec@alpha.test',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  beforeAll(async () => {
    // Set test credentials for Oura and WHOOP to simulate available OAuth environments
    process.env.OURA_CLIENT_ID = 'oura_live_oauth_client_id_test';
    process.env.WHOOP_CLIENT_ID = 'whoop_live_oauth_client_id_test';
    delete process.env.GARMIN_CONSUMER_KEY; // Explicitly left missing to verify Architecture Ready status
    delete process.env.FITBIT_CLIENT_ID; // Explicitly left missing to verify Architecture Ready status

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        IntegrationsModule,
      ],
    }).compile();

    wearableSyncService = moduleRef.get<WearableSyncService>(WearableSyncService);

    tokenVault = moduleRef.get<TokenVaultService>(TokenVaultService);
  });

  afterAll(() => {
    delete process.env.OURA_CLIENT_ID;
    delete process.env.WHOOP_CLIENT_ID;
  });

  // -------------------------------------------------------------
  // 1. PROVIDER AVAILABILITY & ARCHITECTURE READY CLASSIFICATION
  // -------------------------------------------------------------
  describe('1. Provider Availability & Non-Fabrication Classification (Sections 48 & 91)', () => {
    it('should report AVAILABLE for providers with credentials, and ARCHITECTURE_READY_PENDING_CREDENTIALS for unconfigured providers', async () => {
      const providers = await wearableSyncService.getWearableProvidersStatus(mockUser.id);
      expect(providers).toHaveLength(4);

      const oura = providers.find((p) => p.platform === HealthPlatform.OURA)!;
      const whoop = providers.find((p) => p.platform === HealthPlatform.WHOOP)!;
      const garmin = providers.find((p) => p.platform === HealthPlatform.GARMIN)!;
      const fitbit = providers.find((p) => p.platform === HealthPlatform.FITBIT)!;

      // Oura and WHOOP have credentials in test env -> AVAILABLE
      expect(oura.availabilityStatus).toBe('AVAILABLE');
      expect(whoop.availabilityStatus).toBe('AVAILABLE');

      // Garmin and Fitbit have no credentials -> ARCHITECTURE_READY_PENDING_CREDENTIALS (Never fake connected)
      expect(garmin.availabilityStatus).toBe('ARCHITECTURE_READY_PENDING_CREDENTIALS');
      expect(fitbit.availabilityStatus).toBe('ARCHITECTURE_READY_PENDING_CREDENTIALS');
    });

    it('should transition provider status to CONNECTED once valid tokens are stored in vault', async () => {
      await tokenVault.storeTokens(mockUser.id, HealthPlatform.OURA, {
        accessToken: 'oura_user_access_token_123',
        refreshToken: 'oura_user_refresh_token_123',
        expiresIn: 3600,
      });

      const providers = await wearableSyncService.getWearableProvidersStatus(mockUser.id);
      const oura = providers.find((p) => p.platform === HealthPlatform.OURA)!;

      expect(oura.availabilityStatus).toBe('CONNECTED');
    });
  });

  // -------------------------------------------------------------
  // 2. OURA RING INGESTION & PROPRIETARY READINESS SCORE
  // -------------------------------------------------------------
  describe('2. Oura Ring Ingestion & Proprietary Readiness Score (Sections 36 & 42)', () => {
    it('should ingest Oura sleep, HRV, resting HR, and preserve proprietary readiness attribution', async () => {
      const recordedAt = '2026-09-19T06:30:00.000Z';
      const result = await wearableSyncService.ingestWearableData(mockUser.id, {
        platform: HealthPlatform.OURA,
        records: [
          {
            sourceRecordId: 'oura_sleep_session_101',
            metricType: 'SLEEP',
            recordedAt,
            value: 28800, // 8 hours in seconds
            unit: 'seconds',
            deviceModel: 'Oura Ring Gen3 Horizon',
            metadata: { remSeconds: 7200, deepSeconds: 6400, sleepEfficiency: 92 },
          },
          {
            sourceRecordId: 'oura_readiness_101',
            metricType: 'READINESS_SCORE',
            recordedAt,
            value: 88,
            unit: 'score',
            deviceModel: 'Oura Ring Gen3 Horizon',
          },
          {
            sourceRecordId: 'oura_hrv_101',
            metricType: 'HRV',
            recordedAt,
            value: 65, // rMSSD in ms
            unit: 'ms',
            deviceModel: 'Oura Ring Gen3 Horizon',
          },
        ],
      });

      expect(result.platform).toBe(HealthPlatform.OURA);
      expect(result.persistedCount).toBe(3);
      expect(result.duplicatesIgnored).toBe(0);

      const records = await wearableSyncService.getWearableRecords(mockUser.id, HealthPlatform.OURA);
      const readiness = records.find((r) => r.metricType === 'READINESS_SCORE')!;

      expect(readiness).toBeDefined();
      expect(readiness.value).toBe(88);
      expect(readiness.isProprietaryScore).toBe(true);
      expect(readiness.providerAttribution).toBe('Oura Readiness'); // CRITICAL: Preserves section 36 provider attribution
      expect(readiness.provenance.sourceProvider).toBe(HealthPlatform.OURA);
    });
  });

  // -------------------------------------------------------------
  // 3. WHOOP INGESTION & STRAIN / RECOVERY SCORING
  // -------------------------------------------------------------
  describe('3. WHOOP Ingestion & Strain / Recovery Scoring (Sections 36 & 43)', () => {
    it('should ingest WHOOP recovery, day strain, and workouts with proprietary scoring', async () => {
      const recordedAt = '2026-09-19T07:15:00.000Z';
      const result = await wearableSyncService.ingestWearableData(mockUser.id, {
        platform: HealthPlatform.WHOOP,
        records: [
          {
            sourceRecordId: 'whoop_rec_cycle_501',
            metricType: 'RECOVERY_SCORE',
            recordedAt,
            value: 78, // 78% recovery (Green)
            unit: 'percent',
            deviceModel: 'WHOOP 4.0',
          },
          {
            sourceRecordId: 'whoop_strain_cycle_501',
            metricType: 'STRAIN',
            recordedAt,
            value: 14.5, // 14.5 out of 21 Day Strain
            unit: 'strain',
            deviceModel: 'WHOOP 4.0',
          },
        ],
      });

      expect(result.persistedCount).toBe(2);

      const records = await wearableSyncService.getWearableRecords(mockUser.id, HealthPlatform.WHOOP);
      const recovery = records.find((r) => r.metricType === 'RECOVERY_SCORE')!;
      const strain = records.find((r) => r.metricType === 'STRAIN')!;

      expect(recovery.value).toBe(78);
      expect(recovery.isProprietaryScore).toBe(true);
      expect(recovery.providerAttribution).toBe('WHOOP Recovery');

      expect(strain.value).toBe(14.5);
      expect(strain.providerAttribution).toBe('WHOOP Day Strain');
    });
  });

  // -------------------------------------------------------------
  // 4. GARMIN TRAINING READINESS & VO2 MAX
  // -------------------------------------------------------------
  describe('4. Garmin Activities & Training Readiness (Section 44)', () => {
    it('should ingest Garmin training readiness and VO2 Max telemetry', async () => {
      const recordedAt = '2026-09-19T08:00:00.000Z';
      const result = await wearableSyncService.ingestWearableData(mockUser.id, {
        platform: HealthPlatform.GARMIN,
        records: [
          {
            sourceRecordId: 'garmin_tr_601',
            metricType: 'TRAINING_READINESS',
            recordedAt,
            value: 82,
            unit: 'score',
            deviceModel: 'Forerunner 965',
          },
          {
            sourceRecordId: 'garmin_vo2_601',
            metricType: 'VO2_MAX',
            recordedAt,
            value: 54.2,
            unit: 'ml/kg/min',
            deviceModel: 'Forerunner 965',
          },
        ],
      });

      expect(result.persistedCount).toBe(2);

      const records = await wearableSyncService.getWearableRecords(mockUser.id, HealthPlatform.GARMIN);
      const vo2 = records.find((r) => r.metricType === 'VO2_MAX')!;
      const readiness = records.find((r) => r.metricType === 'TRAINING_READINESS')!;

      expect(vo2.value).toBe(54.2);
      expect(vo2.unit).toBe('ml/kg/min');
      expect(readiness.providerAttribution).toBe('Garmin Training Readiness');
    });
  });

  // -------------------------------------------------------------
  // 5. OAUTH TOKEN REFRESH LIFECYCLE (SECTION 51)
  // -------------------------------------------------------------
  describe('5. OAuth Token Refresh Lifecycle (Section 51)', () => {
    it('should return TOKEN_VALID when token is not yet expired', async () => {
      // Store token valid for 2 hours
      await tokenVault.storeTokens(mockUser.id, HealthPlatform.OURA, {
        accessToken: 'oura_valid_access',
        refreshToken: 'oura_valid_refresh',
        expiresIn: 7200,
      });

      const refresh = await wearableSyncService.refreshProviderToken(mockUser.id, HealthPlatform.OURA);
      expect(refresh.status).toBe(TokenRefreshStatus.TOKEN_VALID);
    });

    it('should successfully rotate tokens when expired or expiring soon', async () => {
      // Store token expiring in 1 minute (within 5-minute safety threshold)
      await tokenVault.storeTokens(mockUser.id, HealthPlatform.OURA, {
        accessToken: 'oura_expiring_access',
        refreshToken: 'oura_expiring_refresh',
        expiresIn: 60,
      });

      const refresh = await wearableSyncService.refreshProviderToken(mockUser.id, HealthPlatform.OURA);
      expect(refresh.status).toBe(TokenRefreshStatus.REFRESH_SUCCESS);
      expect(refresh.expiresAt).toBeDefined();

      // Verify new tokens are present in vault
      const decrypted = await tokenVault.getDecryptedTokens(mockUser.id, HealthPlatform.OURA);
      expect(decrypted?.accessToken).toContain('oura_refreshed_access');
    });

    it('should return REAUTH_REQUIRED when refresh token is missing', async () => {
      // Store token without refresh token
      await tokenVault.storeTokens(mockUser.id, HealthPlatform.WHOOP, {
        accessToken: 'whoop_no_refresh_tok',
        expiresIn: 0, // Immediately expired
      });

      const refresh = await wearableSyncService.refreshProviderToken(mockUser.id, HealthPlatform.WHOOP);
      expect(refresh.status).toBe(TokenRefreshStatus.REAUTH_REQUIRED);
    });
  });

  // -------------------------------------------------------------
  // 6. DATA FRESHNESS & STALENESS DETECTION (SECTIONS 55-56)
  // -------------------------------------------------------------
  describe('6. Data Freshness & Staleness Detection (Sections 55-56)', () => {
    it('should flag data as stale when no sync has succeeded within 24 hours', async () => {
      const freshness = wearableSyncService.checkFreshness(mockUser.id, HealthPlatform.FITBIT);
      expect(freshness.isStale).toBe(true);
    });

    it('should report data as fresh immediately after successful ingestion', async () => {
      await wearableSyncService.ingestWearableData(mockUser.id, {
        platform: HealthPlatform.OURA,
        records: [
          {
            sourceRecordId: 'freshness_sample_1',
            metricType: 'HRV',
            recordedAt: new Date().toISOString(),
            value: 62,
            unit: 'ms',
          },
        ],
      });

      const freshness = wearableSyncService.checkFreshness(mockUser.id, HealthPlatform.OURA);
      expect(freshness.isStale).toBe(false);
      expect(freshness.lastSuccessfulSyncAt).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 7. RATE LIMITING & GRACEFUL DEGRADATION (SECTIONS 53-54)
  // -------------------------------------------------------------
  describe('7. Rate Limiting & Graceful Degradation (Sections 53-54)', () => {
    it('should calculate exponential backoff with jitter on transient rate limits', async () => {
      const delay1 = await wearableSyncService.handleProviderRateLimit(1, 100);
      const delay2 = await wearableSyncService.handleProviderRateLimit(2, 100);
      const delay3 = await wearableSyncService.handleProviderRateLimit(3, 100);

      expect(delay1).toBeGreaterThanOrEqual(0);
      expect(delay2).toBeGreaterThanOrEqual(0);
      expect(delay3).toBeGreaterThanOrEqual(0);
      expect(delay1).toBeLessThanOrEqual(2000);
    });

    it('should throw ServiceUnavailableException when retry attempts exceed maximum threshold', async () => {
      await expect(wearableSyncService.handleProviderRateLimit(6)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
