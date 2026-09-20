import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import {
  HealthPlatform,
  IJobRecord,
  IGpsCoordinate,
} from '@alpha/types';
import { GpsPrivacyUtil } from '@alpha/utils';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsModule } from '../src/modules/integrations/integrations.module';
import { IntegrationsController } from '../src/modules/integrations/integrations.controller';
import { HealthDataPrivacyService } from '../src/modules/integrations/services/health-data-privacy.service';
import { CircuitBreakerService } from '../src/modules/integrations/services/circuit-breaker.service';
import { IntegrationSyncPipelineService } from '../src/modules/integrations/services/integration-sync-pipeline.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { TokenVaultService } from '../src/modules/integrations/services/token-vault.service';

describe('Phase 14 Gate D: Sync Pipeline, Security, Privacy & Performance Hardening', () => {
  let module: TestingModule;
  let integrationsController: IntegrationsController;
  let privacyService: HealthDataPrivacyService;
  let circuitBreakerService: CircuitBreakerService;
  let syncPipelineService: IntegrationSyncPipelineService;
  let queueService: QueueService;
  let tokenVaultService: TokenVaultService;

  const testUser = {
    id: 'user_gate_d_001',
    email: 'athlete_d@alpha.os',
    role: 'ATHLETE',
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        IntegrationsModule,
      ],
    }).compile();

    integrationsController = module.get<IntegrationsController>(IntegrationsController);
    privacyService = module.get<HealthDataPrivacyService>(HealthDataPrivacyService);
    circuitBreakerService = module.get<CircuitBreakerService>(CircuitBreakerService);
    syncPipelineService = module.get<IntegrationSyncPipelineService>(IntegrationSyncPipelineService);
    queueService = module.get<QueueService>(QueueService);
    tokenVaultService = module.get<TokenVaultService>(TokenVaultService);
  });

  afterAll(async () => {
    await module.close();
  });

  // =========================================================================
  // 1. HEALTH DATA PRIVACY & GPS PROTECTION
  // =========================================================================
  describe('1. Health Data Privacy & GPS Protection', () => {
    it('should return secure default privacy preferences protecting GPS from coaches', async () => {
      const prefs = await privacyService.getPreferences(testUser.id);

      expect(prefs.userId).toBe(testUser.id);
      expect(prefs.shareSteps).toBe(true);
      expect(prefs.shareHeartRate).toBe(true);
      expect(prefs.shareSleep).toBe(true);
      expect(prefs.shareWeight).toBe(true);
      expect(prefs.shareGpsRoute).toBe(false); // GPS route hidden by default from coaches/orgs
      expect(prefs.trimRouteEndpoints).toBe(true); // Endpoint trimming active by default
      expect(prefs.routeEndpointTrimMeters).toBe(200);
    });

    it('should update user privacy preferences', async () => {
      const updated = await privacyService.updatePreferences(testUser.id, {
        shareGpsRoute: true,
        shareHeartRate: false,
        routeEndpointTrimMeters: 300,
      });

      expect(updated.shareGpsRoute).toBe(true);
      expect(updated.shareHeartRate).toBe(false);
      expect(updated.routeEndpointTrimMeters).toBe(300);
    });

    it('should manage Privacy Zones (create, retrieve, delete)', async () => {
      // Create Home privacy zone (e.g. San Francisco coordinates)
      const homeZone = await privacyService.createPrivacyZone(testUser.id, {
        name: 'Home Sanctuary',
        latitude: 37.7749,
        longitude: -122.4194,
        radiusMeters: 500,
      });

      expect(homeZone.id).toBeDefined();
      expect(homeZone.name).toBe('Home Sanctuary');
      expect(homeZone.radiusMeters).toBe(500);

      const zones = await privacyService.getPrivacyZones(testUser.id);
      expect(zones.length).toBeGreaterThanOrEqual(1);
      expect(zones.some((z) => z.id === homeZone.id)).toBe(true);

      // Delete zone
      const deleted = await privacyService.deletePrivacyZone(testUser.id, homeZone.id);
      expect(deleted).toBe(true);

      await expect(
        privacyService.deletePrivacyZone(testUser.id, 'non_existent_zone'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter GPS coordinates falling within a privacy zone', async () => {
      // Create a privacy zone around Point A (0, 0) with 1000m radius
      await privacyService.createPrivacyZone(testUser.id, {
        name: 'Sensitive Zone',
        latitude: 0.0,
        longitude: 0.0,
        radiusMeters: 1000,
      });

      const coordinates: IGpsCoordinate[] = [
        { latitude: 0.001, longitude: 0.001 }, // ~150m from center -> INSIDE zone
        { latitude: 0.05, longitude: 0.05 },   // ~7800m away -> OUTSIDE zone
        { latitude: 0.0001, longitude: 0.0001 }, // ~15m away -> INSIDE zone
        { latitude: 0.06, longitude: 0.06 },   // ~9400m away -> OUTSIDE zone
      ];

      // Disable endpoint trimming temporarily to test privacy zone filtering in isolation
      await privacyService.updatePreferences(testUser.id, {
        trimRouteEndpoints: false,
        shareGpsRoute: true,
      });

      const filtered = await privacyService.filterAndObfuscateRoute(
        testUser.id,
        coordinates,
        false,
      );

      // Points inside zone should be stripped
      expect(filtered.length).toBe(2);
      expect(filtered[0]?.latitude).toBe(0.05);
      expect(filtered[1]?.latitude).toBe(0.06);
    });

    it('should trim route endpoints (start and end) to protect departure/destination privacy', async () => {
      const start: IGpsCoordinate = { latitude: 37.7749, longitude: -122.4194 }; // Origin
      const mid1: IGpsCoordinate = { latitude: 37.7760, longitude: -122.4194 };  // ~122m away
      const mid2: IGpsCoordinate = { latitude: 37.7780, longitude: -122.4194 };  // ~344m away
      const mid3: IGpsCoordinate = { latitude: 37.7800, longitude: -122.4194 };  // ~567m away
      const end: IGpsCoordinate = { latitude: 37.7820, longitude: -122.4194 };   // ~789m away (Destination)

      const route = [start, mid1, mid2, mid3, end];

      // Trim 200m from start and end
      const trimmed = GpsPrivacyUtil.trimEndpoints(route, 200);

      // Points within 200m of start (start, mid1) and end (end) should be removed
      expect(trimmed.length).toBe(2);
      expect(trimmed[0]?.latitude).toBe(mid2.latitude);
      expect(trimmed[1]?.latitude).toBe(mid3.latitude);
    });

    it('should completely redact GPS route when viewed by coach if athlete opted out', async () => {
      await privacyService.updatePreferences(testUser.id, {
        shareGpsRoute: false, // Athlete does not share GPS with coach
      });

      const coordinates: IGpsCoordinate[] = [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.7800, longitude: -122.4194 },
      ];

      const coachView = await privacyService.filterAndObfuscateRoute(
        testUser.id,
        coordinates,
        true, // isCoachView = true
      );

      expect(coachView).toEqual([]);
    });

    it('should filter metrics for coach based on athlete privacy settings', async () => {
      await privacyService.updatePreferences(testUser.id, {
        shareSteps: true,
        shareHeartRate: false, // Do not share HR
        shareSleep: false,     // Do not share Sleep
        shareWeight: true,
        shareProprietaryScores: false, // Do not share Oura/Whoop scores
      });

      const sampleRecords = [
        { metricType: 'STEPS', value: 10000 },
        { metricType: 'HEART_RATE_RESTING', value: 58 },
        { metricType: 'SLEEP_DURATION', value: 28800 },
        { metricType: 'WEIGHT', value: 82.5 },
        { metricType: 'READINESS_SCORE', value: 85 },
      ];

      const filtered = await privacyService.filterMetricsForCoach(
        testUser.id,
        sampleRecords,
      );

      expect(filtered.length).toBe(2);
      expect(filtered.some((r) => r.metricType === 'STEPS')).toBe(true);
      expect(filtered.some((r) => r.metricType === 'WEIGHT')).toBe(true);
      expect(filtered.some((r) => r.metricType === 'HEART_RATE_RESTING')).toBe(false);
      expect(filtered.some((r) => r.metricType === 'SLEEP_DURATION')).toBe(false);
      expect(filtered.some((r) => r.metricType === 'READINESS_SCORE')).toBe(false);
    });

    it('should enforce data retention policies by pruning raw high-frequency telemetry', async () => {
      const now = Date.now();
      const oldDate = new Date(now - 120 * 24 * 60 * 60 * 1000).toISOString(); // 120 days ago
      const recentDate = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago

      privacyService.seedRawTelemetry([
        { id: 'raw_old_1', userId: testUser.id, recordedAt: oldDate, isRawHighFrequency: true },
        { id: 'raw_old_2', userId: testUser.id, recordedAt: oldDate, isRawHighFrequency: true },
        { id: 'raw_recent_1', userId: testUser.id, recordedAt: recentDate, isRawHighFrequency: true },
        { id: 'daily_summary_old', userId: testUser.id, recordedAt: oldDate, isRawHighFrequency: false }, // aggregate
      ]);

      const retentionResult = await privacyService.enforceRetention({
        rawIntradayCutoffDays: 90,
      });

      expect(retentionResult.purgedRawCount).toBe(2); // The two 120-day raw samples
      expect(retentionResult.preservedRollupCount).toBe(2); // Recent raw sample + permanent aggregate
    });
  });

  // =========================================================================
  // 2. CIRCUIT BREAKER & FAULT TOLERANCE
  // =========================================================================
  describe('2. Circuit Breaker & Fault Tolerance', () => {
    const platform = HealthPlatform.OURA;

    beforeEach(() => {
      circuitBreakerService.reset(platform);
    });

    it('should start in CLOSED state and execute operations successfully', async () => {
      const status = circuitBreakerService.getStatus(platform);
      expect(status.state).toBe('CLOSED');
      expect(status.failureCount).toBe(0);

      const result = await circuitBreakerService.execute(platform, async () => {
        return 'oura_data_ok';
      });

      expect(result).toBe('oura_data_ok');
      expect(circuitBreakerService.getStatus(platform).state).toBe('CLOSED');
    });

    it('should transition to OPEN after 3 consecutive failures and fast-fail', async () => {
      // Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreakerService.execute(platform, async () => {
            throw new Error(`503 Service Unavailable attempt ${i + 1}`);
          }),
        ).rejects.toThrow();
      }

      const openStatus = circuitBreakerService.getStatus(platform);
      expect(openStatus.state).toBe('OPEN');
      expect(openStatus.failureCount).toBe(3);

      // In OPEN state, requests must fast-fail with ServiceUnavailableException
      await expect(
        circuitBreakerService.execute(platform, async () => {
          return 'should_never_run';
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should support manual trip and reset controls', () => {
      circuitBreakerService.trip(platform);
      expect(circuitBreakerService.getStatus(platform).state).toBe('OPEN');

      circuitBreakerService.reset(platform);
      expect(circuitBreakerService.getStatus(platform).state).toBe('CLOSED');
      expect(circuitBreakerService.getStatus(platform).failureCount).toBe(0);
    });

    it('should transition from HALF_OPEN to CLOSED after consecutive successful probes', async () => {
      circuitBreakerService.trip(platform);

      // Force transition to HALF_OPEN
      (circuitBreakerService as any).breakers.get(platform).state = 'HALF_OPEN';
      (circuitBreakerService as any).breakers.get(platform).consecutiveSuccesses = 0;

      // First successful probe
      await circuitBreakerService.execute(platform, async () => 'probe_1_ok');
      expect(circuitBreakerService.getStatus(platform).state).toBe('HALF_OPEN');

      // Second successful probe -> reaches consecutiveSuccessesToClose threshold (2)
      await circuitBreakerService.execute(platform, async () => 'probe_2_ok');
      expect(circuitBreakerService.getStatus(platform).state).toBe('CLOSED');
    });
  });

  // =========================================================================
  // 3. BACKGROUND WORKER SYNC PIPELINE
  // =========================================================================
  describe('3. Background Worker Sync Pipeline', () => {
    const syncRecordDate = '2026-09-19T10:00:00.000Z';

    it('should handle HEALTH_INITIAL_SYNC with bounded 30-day window', async () => {
      const job: IJobRecord = {
        id: 'job_init_001',
        name: 'initial_sync_apple',
        queue: 'HEALTH_INITIAL_SYNC',
        data: {
          userId: testUser.id,
          platform: HealthPlatform.APPLE_HEALTHKIT,
          windowDays: 90, // Exceeds 30 days -> will be bounded to 30
          records: [
            {
              sourceRecordId: 'apple_step_init_1',
              metricType: 'STEPS',
              recordedAt: syncRecordDate,
              value: 7500,
              unit: 'count',
            },
          ],
        },
        attempts: 0,
        maxAttempts: 3,
        backoffMs: 1000,
        backoffStrategy: 'EXPONENTIAL',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await syncPipelineService.processJob(job);

      expect(result.status).toBe('SUCCESS');
      expect(result.queue).toBe('HEALTH_INITIAL_SYNC');
      expect(result.syncedCount).toBe(1);
      expect(result.newCursor).toBeDefined();
      expect(result.newCursor?.startsWith('cursor_init_APPLE_HEALTHKIT_')).toBe(true);
    });

    it('should handle HEALTH_INCREMENTAL_SYNC with cursor progression and deduplication', async () => {
      const job: IJobRecord = {
        id: 'job_incr_001',
        name: 'incremental_sync_apple',
        queue: 'HEALTH_INCREMENTAL_SYNC',
        data: {
          userId: testUser.id,
          platform: HealthPlatform.APPLE_HEALTHKIT,
          syncCursor: 'cursor_init_APPLE_HEALTHKIT_123',
          records: [
            {
              sourceRecordId: 'apple_step_init_1', // Duplicate from previous test with same timestamp
              metricType: 'STEPS',
              recordedAt: syncRecordDate,
              value: 7500,
              unit: 'count',
            },
            {
              sourceRecordId: 'apple_step_incr_2', // New record
              metricType: 'STEPS',
              recordedAt: syncRecordDate,
              value: 3200,
              unit: 'count',
            },
          ],
        },
        attempts: 0,
        maxAttempts: 3,
        backoffMs: 1000,
        backoffStrategy: 'EXPONENTIAL',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await syncPipelineService.processJob(job);

      expect(result.status).toBe('SUCCESS');
      expect(result.recordsProcessed).toBe(2);
      expect(result.syncedCount).toBe(1); // 1 new record persisted
      expect(result.duplicatesIgnored).toBe(1); // 1 duplicate suppressed
      expect(result.newCursor?.startsWith('cursor_incr_APPLE_HEALTHKIT_')).toBe(true);
    });

    it('should handle WEARABLE_SYNC under Circuit Breaker protection', async () => {
      const job: IJobRecord = {
        id: 'job_wearable_001',
        name: 'wearable_oura_sync',
        queue: 'WEARABLE_SYNC',
        data: {
          userId: testUser.id,
          platform: HealthPlatform.OURA,
          records: [
            {
              sourceRecordId: 'oura_readiness_001',
              metricType: 'READINESS_SCORE',
              value: 88,
              unit: 'score_0_100',
              recordedAt: new Date().toISOString(),
            },
          ],
        },
        attempts: 0,
        maxAttempts: 3,
        backoffMs: 1000,
        backoffStrategy: 'EXPONENTIAL',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await syncPipelineService.processJob(job);

      expect(result.status).toBe('SUCCESS');
      expect(result.queue).toBe('WEARABLE_SYNC');
      expect(result.syncedCount).toBe(1);
    });

    it('should proactively identify and refresh expiring OAuth tokens', async () => {
      // Store a token expiring in 3 minutes (< 5 minutes buffer so it rotates)
      await tokenVaultService.storeTokens(testUser.id, HealthPlatform.OURA, {
        accessToken: 'oura_expiring_token_123',
        refreshToken: 'oura_valid_refresh_token_456',
        expiresIn: 180, // 3 minutes
      });

      const refreshSummary = await syncPipelineService.runProactiveTokenRefreshCheck([
        { userId: testUser.id, platform: HealthPlatform.OURA },
      ]);

      expect(refreshSummary.evaluated).toBe(1);
      expect(refreshSummary.refreshed).toBe(1);
      expect(refreshSummary.failed).toBe(0);
    });

    it('should process SYNC_RETRY with jittered backoff computation', async () => {
      const job: IJobRecord = {
        id: 'job_retry_001',
        name: 'sync_retry_job',
        queue: 'SYNC_RETRY',
        data: {
          originalQueue: 'HEALTH_INCREMENTAL_SYNC',
          originalData: {
            userId: testUser.id,
            platform: HealthPlatform.APPLE_HEALTHKIT,
            records: [
              {
                sourceRecordId: 'apple_retry_rec_1',
                metricType: 'HEART_RATE_RESTING',
                value: 62,
                unit: 'bpm',
                recordedAt: new Date().toISOString(),
              },
            ],
          },
          attempt: 2,
        },
        attempts: 1,
        maxAttempts: 3,
        backoffMs: 1000,
        backoffStrategy: 'EXPONENTIAL_JITTER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await syncPipelineService.processJob(job);
      expect(result.status).toBe('SUCCESS');
      expect(result.syncedCount).toBe(1);
    });

    it('should claim and process next queued job from QueueService', async () => {
      // Add a job to queue
      await queueService.addJob(
        'HEALTH_INCREMENTAL_SYNC',
        'test_queue_process_next',
        {
          userId: testUser.id,
          platform: HealthPlatform.APPLE_HEALTHKIT,
          records: [
            {
              sourceRecordId: 'apple_queue_claim_1',
              metricType: 'DISTANCE',
              value: 5200,
              unit: 'm',
              recordedAt: new Date().toISOString(),
            },
          ],
        },
      );

      const processResult = await syncPipelineService.processNextQueuedJob(
        'HEALTH_INCREMENTAL_SYNC',
      );

      expect(processResult).not.toBeNull();
      expect(processResult?.status).toBe('SUCCESS');
      expect(processResult?.syncedCount).toBe(1);
    });
  });

  // =========================================================================
  // 4. REST CONTROLLER INTEGRATION
  // =========================================================================
  describe('4. REST Controller Integration', () => {
    it('GET /api/v1/integrations/privacy/preferences should return user preferences', async () => {
      const prefs = await integrationsController.getPrivacyPreferences(testUser as any);
      expect(prefs.userId).toBe(testUser.id);
    });

    it('PUT /api/v1/integrations/privacy/preferences should update preferences', async () => {
      const updated = await integrationsController.updatePrivacyPreferences(
        testUser as any,
        {
          shareSleep: true,
          trimRouteEndpoints: true,
        },
      );
      expect(updated.shareSleep).toBe(true);
    });

    it('POST /api/v1/integrations/privacy/zones should create a privacy zone', async () => {
      const zone = await integrationsController.createPrivacyZone(testUser as any, {
        name: 'Work Office',
        latitude: 37.7833,
        longitude: -122.4167,
        radiusMeters: 300,
      });

      expect(zone.id).toBeDefined();
      expect(zone.name).toBe('Work Office');
    });

    it('GET /api/v1/integrations/circuit-breakers should return statuses for all platforms', () => {
      const statuses = integrationsController.getAllCircuitBreakers();
      expect(statuses.length).toBeGreaterThanOrEqual(6);
      expect(statuses.some((s) => s.platform === HealthPlatform.OURA)).toBe(true);
    });

    it('POST /api/v1/integrations/circuit-breakers/:platform/reset should reset breaker', () => {
      const res = integrationsController.resetCircuitBreaker(HealthPlatform.OURA);
      expect(res.state).toBe('CLOSED');
      expect(res.failureCount).toBe(0);
    });

    it('POST /api/v1/integrations/retention/enforce should execute retention policy', async () => {
      const res = await integrationsController.enforceRetention({
        rawIntradayCutoffDays: 90,
      });
      expect(res.cutoffDate).toBeDefined();
      expect(res.purgedRawCount).toBeGreaterThanOrEqual(0);
    });
  });
});
