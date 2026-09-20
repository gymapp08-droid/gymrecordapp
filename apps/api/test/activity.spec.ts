import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from '../src/modules/activity/activity.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CardioType,
  ActivitySource,
  HeartRateZone,
  HealthPlatform,
} from '@alpha/types';

describe('Activity, Steps & Cardio Engine (Gate A Verification Suite)', () => {
  let service: ActivityService;

  const userAId = 'user_athlete_A_1111';
  const userBId = 'user_athlete_B_2222';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityService],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  describe('1. Deterministic Metric Calculations', () => {
    it('should accurately calculate pace and speed from distance and duration', () => {
      // 5.0 km in 30 minutes (1800 seconds)
      const res = service.calculatePaceAndSpeed(5000, 1800);
      expect(res.distanceKm).toBe(5.0);
      expect(res.avgPaceSecondsPerKm).toBe(360);
      expect(res.formattedPace).toBe('6:00 / km');
      expect(res.avgSpeedKmh).toBe(10.0);
    });

    it('should format irregular pace with leading zero on seconds', () => {
      // 10.0 km in 3050 seconds = 305s/km = 5:05 / km
      const res = service.calculatePaceAndSpeed(10000, 3050);
      expect(res.formattedPace).toBe('5:05 / km');
    });

    it('should handle zero distance or zero duration safely without division by zero', () => {
      const res = service.calculatePaceAndSpeed(0, 1800);
      expect(res.distanceKm).toBe(0);
      expect(res.formattedPace).toBe('0:00 / km');
      expect(res.avgSpeedKmh).toBe(0);
    });

    it('should calculate 5-zone heart rate distribution based on max HR', () => {
      const zones = service.calculateHeartRateZones(200);

      expect(zones[HeartRateZone.ZONE_1_RECOVERY]).toEqual({ minBpm: 100, maxBpm: 119 });
      expect(zones[HeartRateZone.ZONE_2_AEROBIC]).toEqual({ minBpm: 120, maxBpm: 139 });
      expect(zones[HeartRateZone.ZONE_3_TEMPO]).toEqual({ minBpm: 140, maxBpm: 159 });
      expect(zones[HeartRateZone.ZONE_4_THRESHOLD]).toEqual({ minBpm: 160, maxBpm: 179 });
      expect(zones[HeartRateZone.ZONE_5_ANAEROBIC]).toEqual({ minBpm: 180, maxBpm: 200 });
    });

    it('should reject invalid max HR values', () => {
      expect(() => service.calculateHeartRateZones(50)).toThrow(BadRequestException);
      expect(() => service.calculateHeartRateZones(250)).toThrow(BadRequestException);
    });
  });

  describe('2. Cardio Sessions Engine', () => {
    it('should create and retrieve a cardio session with computed metrics', async () => {
      const session = await service.createCardioSession(userAId, {
        activityType: CardioType.RUNNING,
        startedAt: new Date().toISOString(),
        durationSeconds: 1800,
        distanceMeters: 5000,
        avgHeartRate: 152,
        maxHeartRate: 174,
        activeCalories: 380,
        notes: 'Morning outdoor interval run',
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(userAId);
      expect(session.activityType).toBe(CardioType.RUNNING);
      expect(session.distanceMeters).toBe(5000);
      expect(session.avgPaceSecondsPerKm).toBe(360);
      expect(session.avgSpeedKmh).toBe(10.0);
      expect(session.activeCalories).toBe(380);

      // Retrieve by ID
      const fetched = await service.getCardioSessionById(userAId, session.id);
      expect(fetched.id).toBe(session.id);
    });

    it('should update notes and recompute pace when distance is modified', async () => {
      const session = await service.createCardioSession(userAId, {
        activityType: CardioType.CYCLING,
        startedAt: new Date().toISOString(),
        durationSeconds: 3600,
        distanceMeters: 20000, // 20km in 1 hr = 20 km/h
      });

      expect(session.avgSpeedKmh).toBe(20.0);

      // Update distance to 25km
      const updated = await service.updateCardioSession(userAId, session.id, {
        distanceMeters: 25000,
        notes: 'Pushed higher resistance in second half',
      });

      expect(updated.distanceMeters).toBe(25000);
      expect(updated.avgSpeedKmh).toBe(25.0);
      expect(updated.notes).toBe('Pushed higher resistance in second half');
    });

    it('should delete a cardio session', async () => {
      const session = await service.createCardioSession(userAId, {
        activityType: CardioType.ROWING,
        startedAt: new Date().toISOString(),
        durationSeconds: 900,
      });

      await service.deleteCardioSession(userAId, session.id);
      await expect(service.getCardioSessionById(userAId, session.id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('3. Daily Activity & Manual Logging', () => {
    it('should log manual activity and aggregate in daily summary', async () => {
      const today = '2026-09-18';
      await service.logManualActivity(userAId, {
        date: today,
        stepCount: 8421,
        distanceKm: 6.3,
        activeMinutes: 52,
        activeCalories: 340,
      });

      const summary = await service.getDailySummary(userAId, today);
      expect(summary.date).toBe(today);
      expect(summary.stepCount).toBe(8421);
      expect(summary.stepTarget).toBe(10000);
      expect(summary.stepProgressPercent).toBe(84); // 8421 / 10000 = 84%
      expect(summary.distanceKm).toBe(6.3);
      expect(summary.activeMinutes).toBe(52);
      expect(summary.activeCalories).toBe(340);
    });
  });

  describe('4. Idempotent Health Sync & Deduplication Engine', () => {
    it('CRITICAL: Ingesting the same health payload multiple times must NEVER create duplicate records', async () => {
      const syncPayload = {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        records: [
          {
            sourceRecordId: 'hk_step_sample_101',
            type: 'STEPS' as const,
            date: '2026-09-18',
            stepCount: 7500,
            distanceMeters: 5600,
            calories: 310,
          },
          {
            sourceRecordId: 'hk_workout_run_999',
            type: 'CARDIO' as const,
            date: '2026-09-18T07:30:00.000Z',
            cardioType: CardioType.RUNNING,
            durationSeconds: 1800,
            distanceMeters: 5000,
            avgHeartRate: 155,
            calories: 380,
          },
        ],
      };

      // First sync
      const sync1 = await service.syncHealthData(userAId, syncPayload);
      expect(sync1.syncedCount).toBe(2);
      expect(sync1.duplicatesIgnored).toBe(0);

      // Verify records stored
      let cardioList = await service.getCardioSessions(userAId);
      expect(cardioList).toHaveLength(1);
      expect(cardioList[0]!.source).toBe(ActivitySource.APPLE_HEALTH);

      // Second sync with identical payload -> MUST BE IDEMPOTENT
      const sync2 = await service.syncHealthData(userAId, syncPayload);
      expect(sync2.syncedCount).toBe(0);
      expect(sync2.duplicatesIgnored).toBe(2);

      // Third sync with identical payload -> MUST STILL BE IDEMPOTENT
      const sync3 = await service.syncHealthData(userAId, syncPayload);
      expect(sync3.syncedCount).toBe(0);
      expect(sync3.duplicatesIgnored).toBe(2);

      // Cardio sessions count must remain strictly 1
      cardioList = await service.getCardioSessions(userAId);
      expect(cardioList).toHaveLength(1);
    });
  });

  describe('5. Strict Multi-Tenant User Isolation', () => {
    it('CRITICAL: User B CANNOT read User A cardio session', async () => {
      const sessionA = await service.createCardioSession(userAId, {
        activityType: CardioType.RUNNING,
        startedAt: new Date().toISOString(),
        durationSeconds: 1200,
        distanceMeters: 3000,
      });

      await expect(service.getCardioSessionById(userBId, sessionA.id)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('CRITICAL: User B CANNOT modify or delete User A cardio session', async () => {
      const sessionA = await service.createCardioSession(userAId, {
        activityType: CardioType.CYCLING,
        startedAt: new Date().toISOString(),
        durationSeconds: 2400,
      });

      await expect(
        service.updateCardioSession(userBId, sessionA.id, { notes: 'Hacked notes' })
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.deleteCardioSession(userBId, sessionA.id)
      ).rejects.toThrow(ForbiddenException);
    });

    it('CRITICAL: User B sync does not leak or contaminate User A activity data', async () => {
      await service.syncHealthData(userBId, {
        platform: HealthPlatform.ANDROID_HEALTH_CONNECT,
        records: [
          {
            sourceRecordId: 'hc_step_b',
            type: 'STEPS',
            date: '2026-09-18',
            stepCount: 15000,
          },
        ],
      });

      const summaryA = await service.getDailySummary(userAId, '2026-09-18');
      expect(summaryA.stepCount).not.toBe(15000);
    });
  });
});
