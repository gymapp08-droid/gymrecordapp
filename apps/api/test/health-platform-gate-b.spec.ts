import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  HealthPlatform,
  IntegrationConnectionState,
  HealthPermissionState,
  IAuthUser,
  UserRole,
  AccountStatus,
} from '@alpha/types';
import { IntegrationsModule } from '../src/modules/integrations/integrations.module';
import { IntegrationsService } from '../src/modules/integrations/integrations.service';
import { HealthPlatformSyncService } from '../src/modules/integrations/services/health-platform-sync.service';
import { BadRequestException } from '@nestjs/common';

describe('ALPHA — PHASE 14: GATE B — HEALTH PLATFORM IMPLEMENTATION HARNESS', () => {
  let integrationsService: IntegrationsService;
  let syncService: HealthPlatformSyncService;


  const mockUser: IAuthUser = {
    id: 'user-athlete-gate-b-001',
    email: 'athlete.gateb@alpha.test',
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

    integrationsService = moduleRef.get<IntegrationsService>(IntegrationsService);
    syncService = moduleRef.get<HealthPlatformSyncService>(HealthPlatformSyncService);
  });


  // -------------------------------------------------------------
  // 1. APPLE HEALTH / HEALTHKIT INGESTION & NORMALIZATION
  // -------------------------------------------------------------
  describe('1. Apple HealthKit Ingestion & Normalization', () => {
    it('should ingest and normalize Apple HealthKit steps and biometrics with complete provenance', async () => {
      const recordedAt = '2026-09-19T08:30:00.000Z';
      const summary = await syncService.ingestHealthData(mockUser.id, {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        syncType: 'INITIAL',
        deviceModel: 'iPhone 15 Pro',
        deviceManufacturer: 'Apple Inc.',
        records: [
          {
            sourceRecordId: 'hk_steps_rec_001',
            metricType: 'STEPS',
            recordedAt,
            value: 8450,
            unit: 'count',
            sourceTimezone: 'America/Los_Angeles',
          },
          {
            sourceRecordId: 'hk_hr_rec_002',
            metricType: 'HEART_RATE',
            recordedAt,
            value: 72,
            unit: 'bpm',
            sourceTimezone: 'America/Los_Angeles',
          },
        ],
      });

      expect(summary.platform).toBe(HealthPlatform.APPLE_HEALTHKIT);
      expect(summary.recordsReceived).toBe(2);
      expect(summary.recordsPersisted).toBe(2);
      expect(summary.duplicatesIgnored).toBe(0);
      expect(summary.status).toBe(IntegrationConnectionState.CONNECTED);
      expect(summary.syncCursor).toBe(recordedAt);

      // Verify stored records and provenance
      const stepRecords = await syncService.getNormalizedRecords(mockUser.id, 'STEPS');
      expect(stepRecords.length).toBeGreaterThanOrEqual(1);

      const stepRecord = stepRecords.find((r) => r.provenance.sourceRecordId === 'hk_steps_rec_001')!;
      expect(stepRecord).toBeDefined();
      expect(stepRecord.value).toBe(8450);
      expect(stepRecord.unit).toBe('count');
      expect(stepRecord.provenance.sourceProvider).toBe(HealthPlatform.APPLE_HEALTHKIT);
      expect(stepRecord.provenance.deviceModel).toBe('iPhone 15 Pro');
      expect(stepRecord.provenance.deviceManufacturer).toBe('Apple Inc.');
      expect(stepRecord.provenance.isManualInput).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 2. ANDROID HEALTH CONNECT INGESTION & NORMALIZATION
  // -------------------------------------------------------------
  describe('2. Android Health Connect Ingestion & Normalization', () => {
    it('should ingest and normalize Health Connect records preserving platform source', async () => {
      const recordedAt = '2026-09-19T09:15:00.000Z';
      const summary = await syncService.ingestHealthData(mockUser.id, {
        platform: HealthPlatform.ANDROID_HEALTH_CONNECT,
        syncType: 'INCREMENTAL',
        deviceModel: 'Pixel 9 Pro',
        deviceManufacturer: 'Google',
        records: [
          {
            sourceRecordId: 'hc_active_cal_001',
            metricType: 'CALORIES',
            recordedAt,
            value: 450,
            unit: 'kcal',
            sourceTimezone: 'Europe/London',
          },
        ],
      });

      expect(summary.platform).toBe(HealthPlatform.ANDROID_HEALTH_CONNECT);
      expect(summary.recordsPersisted).toBe(1);

      const records = await syncService.getNormalizedRecords(mockUser.id, 'CALORIES');
      const calRecord = records.find((r) => r.provenance.sourceRecordId === 'hc_active_cal_001')!;
      expect(calRecord).toBeDefined();
      expect(calRecord.value).toBe(450);
      expect(calRecord.provenance.sourceProvider).toBe(HealthPlatform.ANDROID_HEALTH_CONNECT);
    });
  });

  // -------------------------------------------------------------
  // 3. ALPHA STRUCTURED WORKOUT VS EXTERNAL CARDIO SEPARATION
  // -------------------------------------------------------------
  describe('3. Separation of ALPHA Structured Workouts vs External Activities (Sections 31-32)', () => {
    it('should map external Apple Watch cardio sessions without converting them to ALPHA program completions', async () => {
      const recordedAt = '2026-09-19T07:00:00.000Z';
      await syncService.ingestHealthData(mockUser.id, {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        syncType: 'INCREMENTAL',
        deviceModel: 'Apple Watch Ultra 2',
        deviceManufacturer: 'Apple Inc.',
        records: [
          {
            sourceRecordId: 'hk_workout_run_991',
            metricType: 'WORKOUT',
            recordedAt,
            value: 3600, // 60 minutes
            unit: 'seconds',
            metadata: {
              activityType: 'RUNNING',
              distanceMeters: 10000,
              avgHeartRate: 152,
            },
          },
        ],
      });

      const workouts = await syncService.getNormalizedRecords(mockUser.id, 'WORKOUT');
      const runWorkout = workouts.find((w) => w.provenance.sourceRecordId === 'hk_workout_run_991')!;

      expect(runWorkout).toBeDefined();
      expect(runWorkout.metadata?.isAlphaProgramWorkout).toBe(false); // CRITICAL: Never auto-completes ALPHA strength program
      expect(runWorkout.metadata?.activityType).toBe('RUNNING');
    });
  });

  // -------------------------------------------------------------
  // 4. RANGE & SANITY VALIDATION
  // -------------------------------------------------------------
  describe('4. Range & Biometric Sanity Validation', () => {
    it('should reject absurd step counts with BadRequestException', async () => {
      await expect(
        syncService.ingestHealthData(mockUser.id, {
          platform: HealthPlatform.APPLE_HEALTHKIT,
          syncType: 'INCREMENTAL',
          records: [
            {
              sourceRecordId: 'absurd_steps_1',
              metricType: 'STEPS',
              recordedAt: '2026-09-19T11:00:00.000Z',
              value: 500000, // 500k steps in one day is biologically impossible
              unit: 'count',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject absurd heart rates with BadRequestException', async () => {
      await expect(
        syncService.ingestHealthData(mockUser.id, {
          platform: HealthPlatform.ANDROID_HEALTH_CONNECT,
          syncType: 'INCREMENTAL',
          records: [
            {
              sourceRecordId: 'absurd_hr_1',
              metricType: 'HEART_RATE',
              recordedAt: '2026-09-19T11:00:00.000Z',
              value: 300, // 300 bpm exceeds human physiological limits
              unit: 'bpm',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject negative step counts or values', async () => {
      await expect(
        syncService.ingestHealthData(mockUser.id, {
          platform: HealthPlatform.APPLE_HEALTHKIT,
          syncType: 'INCREMENTAL',
          records: [
            {
              sourceRecordId: 'neg_steps_1',
              metricType: 'STEPS',
              recordedAt: '2026-09-19T11:00:00.000Z',
              value: -50,
              unit: 'count',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------
  // 5. DETERMINISTIC DEDUPLICATION & IDEMPOTENT INGESTION
  // -------------------------------------------------------------
  describe('5. Deterministic Deduplication & Idempotent Ingestion', () => {
    it('should silently ignore duplicate records sent in repeated sync passes', async () => {
      const recordedAt = '2026-09-19T12:00:00.000Z';
      const payload = {
        platform: HealthPlatform.APPLE_HEALTHKIT as const,
        syncType: 'INCREMENTAL' as const,
        records: [
          {
            sourceRecordId: 'dedup_sample_steps_44',
            metricType: 'STEPS',
            recordedAt,
            value: 6200,
            unit: 'count',
          },
        ],
      };

      // Pass 1: Persists 1 record
      const summary1 = await syncService.ingestHealthData(mockUser.id, payload);
      expect(summary1.recordsPersisted).toBe(1);
      expect(summary1.duplicatesIgnored).toBe(0);

      // Pass 2: Identical payload sent again
      const summary2 = await syncService.ingestHealthData(mockUser.id, payload);
      expect(summary2.recordsPersisted).toBe(0);
      expect(summary2.duplicatesIgnored).toBe(1);
    });
  });

  // -------------------------------------------------------------
  // 6. HEALTH PERMISSIONS & PARTIAL PERMISSION STATES
  // -------------------------------------------------------------
  describe('6. Health Permissions & Partial Grants', () => {
    it('should support updating permissions to PARTIALLY_GRANTED and reflect in connection status', async () => {
      const conn = await integrationsService.updatePermissions(mockUser.id, {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        permissionState: HealthPermissionState.PARTIALLY_GRANTED,
        grantedPermissions: ['STEPS'],
        deniedPermissions: ['HEART_RATE'],
      });

      expect(conn.permissionState).toBe(HealthPermissionState.PARTIALLY_GRANTED);
      expect(conn.grantedPermissions).toEqual(['STEPS']);
    });

    it('should reject sync trigger when permissionState is DENIED', async () => {
      await integrationsService.updatePermissions(mockUser.id, {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        permissionState: HealthPermissionState.DENIED,
        grantedPermissions: [],
      });

      await expect(
        integrationsService.triggerSync(mockUser.id, {
          platform: HealthPlatform.APPLE_HEALTHKIT,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------
  // 7. NON-FABRICATION PRINCIPLE VERIFICATION
  // -------------------------------------------------------------
  describe('7. Non-Fabrication Principle (Zero Fake Biometrics)', () => {
    it('should never invent or fabricate missing biometric readings', async () => {
      // Ingest steps only, without heart rate or sleep
      const sync = await syncService.ingestHealthData(mockUser.id, {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        syncType: 'INCREMENTAL',
        records: [
          {
            sourceRecordId: 'steps_no_hr_99',
            metricType: 'STEPS',
            recordedAt: '2026-09-19T13:00:00.000Z',
            value: 4100,
            unit: 'count',
          },
        ],
      });

      expect(sync.recordsPersisted).toBe(1);

      // Verify that no synthetic HEART_RATE or SLEEP records were generated
      const hrRecords = await syncService.getNormalizedRecords(mockUser.id, 'HEART_RATE');
      const syntheticHR = hrRecords.find((r) => r.provenance.sourceRecordId === 'steps_no_hr_99');
      expect(syntheticHR).toBeUndefined();

      const sleepRecords = await syncService.getNormalizedRecords(mockUser.id, 'SLEEP');
      const syntheticSleep = sleepRecords.find((r) => r.provenance.sourceRecordId === 'steps_no_hr_99');
      expect(syntheticSleep).toBeUndefined();
    });
  });
});
