import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from '../src/modules/progress/progress.service';
import { UsersService } from '../src/modules/users/users.service';
import { WorkoutsService } from '../src/modules/workouts/workouts.service';
import { NutritionService } from '../src/modules/nutrition/nutrition.service';
import { ActivityService } from '../src/modules/activity/activity.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BMICategory,
  BodyMeasurementType,
  PersonalRecordType,
} from '@alpha/types';

describe('Progress, Body Metrics & Performance Analytics (Phase 06 Gate A)', () => {
  let service: ProgressService;
  let workoutsService: WorkoutsService;

  const userAId = 'user_athlete_A_1001';
  const userBId = 'user_athlete_B_2002';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        UsersService,
        WorkoutsService,
        NutritionService,
        ActivityService,
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    workoutsService = module.get<WorkoutsService>(WorkoutsService);
  });

  describe('1. Deterministic BMI & Classification Engine', () => {
    it('should accurately calculate normal BMI', () => {
      // 78 kg, 180 cm -> 78 / (1.8^2) = 24.07 -> 24.1 (NORMAL)
      const res = service.calculateBMI(78, 180);
      expect(res).not.toBeNull();
      expect(res?.bmi).toBe(24.1);
      expect(res?.category).toBe(BMICategory.NORMAL);
    });

    it('should classify underweight correctly (< 18.5)', () => {
      // 50 kg, 175 cm -> 50 / (1.75^2) = 16.33 -> 16.3 (UNDERWEIGHT)
      const res = service.calculateBMI(50, 175);
      expect(res?.bmi).toBe(16.3);
      expect(res?.category).toBe(BMICategory.UNDERWEIGHT);
    });

    it('should classify overweight correctly (25.0 - 29.9)', () => {
      // 85 kg, 175 cm -> 85 / (1.75^2) = 27.76 -> 27.8 (OVERWEIGHT)
      const res = service.calculateBMI(85, 175);
      expect(res?.bmi).toBe(27.8);
      expect(res?.category).toBe(BMICategory.OVERWEIGHT);
    });

    it('should classify obese correctly (>= 30.0)', () => {
      // 105 kg, 175 cm -> 105 / (1.75^2) = 34.29 -> 34.3 (OBESE)
      const res = service.calculateBMI(105, 175);
      expect(res?.bmi).toBe(34.3);
      expect(res?.category).toBe(BMICategory.OBESE);
    });

    it('should return null safely if height or weight is invalid or non-positive', () => {
      expect(service.calculateBMI(0, 180)).toBeNull();
      expect(service.calculateBMI(75, 0)).toBeNull();
      expect(service.calculateBMI(-80, 180)).toBeNull();
    });
  });

  describe('2. Deterministic Epley 1RM Calculator', () => {
    it('should return exact weight when reps is 1', () => {
      expect(service.calculateEstimated1RM(100, 1)).toBe(100);
    });

    it('should calculate Epley 1RM accurately for multi-rep sets', () => {
      // 100 kg for 10 reps -> 100 * (1 + 10/30) = 133.33 -> 133.3 kg
      expect(service.calculateEstimated1RM(100, 10)).toBe(133.3);

      // 80 kg for 5 reps -> 80 * (1 + 5/30) = 93.33 -> 93.3 kg
      expect(service.calculateEstimated1RM(80, 5)).toBe(93.3);
    });

    it('should handle zero or non-positive inputs safely', () => {
      expect(service.calculateEstimated1RM(0, 10)).toBe(0);
      expect(service.calculateEstimated1RM(100, 0)).toBe(0);
      expect(service.calculateEstimated1RM(-50, 5)).toBe(0);
    });
  });

  describe('3. Body Metrics Tracking & Weight Trajectory', () => {
    it('should log body metrics and retrieve the latest entry', async () => {
      const metric = await service.logBodyMetric(userAId, {
        weightKg: 82.5,
        bodyFatPercent: 14.2,
        muscleMassKg: 68.0,
        waterPercent: 60.5,
        source: 'SMART_SCALE',
      });

      expect(metric.id).toBeDefined();
      expect(metric.userId).toBe(userAId);
      expect(metric.weightKg).toBe(82.5);
      expect(metric.bodyFatPercent).toBe(14.2);

      const latest = await service.getLatestBodyMetric(userAId);
      expect(latest).not.toBeNull();
      expect(latest?.id).toBe(metric.id);
      expect(latest?.weightKg).toBe(82.5);
    });

    it('should calculate date-ordered weight trajectory and delta', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 14);

      await service.logBodyMetric(userAId, {
        weightKg: 84.0,
        recordedAt: pastDate.toISOString(),
      });

      await service.logBodyMetric(userAId, {
        weightKg: 82.5,
      });

      const trajectory = await service.getWeightTrajectory(userAId, 30);
      expect(trajectory.length).toBe(2);
      expect(trajectory[0]!.weightKg).toBe(84.0);
      expect(trajectory[1]!.weightKg).toBe(82.5);
    });
  });

  describe('4. Body Measurements Tracking', () => {
    it('should log body measurements and filter by type', async () => {
      await service.logMeasurement(userAId, {
        measurementType: BodyMeasurementType.WAIST,
        valueCm: 81.5,
      });

      await service.logMeasurement(userAId, {
        measurementType: BodyMeasurementType.CHEST,
        valueCm: 104.0,
      });

      const waistList = await service.getMeasurements(userAId, BodyMeasurementType.WAIST);
      expect(waistList.length).toBe(1);
      expect(waistList[0]!.measurementType).toBe(BodyMeasurementType.WAIST);
      expect(waistList[0]!.valueCm).toBe(81.5);

      const allMeasurements = await service.getMeasurements(userAId);
      expect(allMeasurements.length).toBe(2);
    });

    it('should reject non-positive measurement values', async () => {
      await expect(
        service.logMeasurement(userAId, {
          measurementType: BodyMeasurementType.BICEPS,
          valueCm: -5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Personal Records & Strength Trends', () => {
    it('should record PRs directly and filter by exercise', async () => {
      const pr = await service.recordPR(userAId, {
        exerciseId: 'ex_bench_press',
        exerciseName: 'Barbell Bench Press',
        prType: PersonalRecordType.HEAVIEST_WEIGHT,
        value: 120.0,
        weightKg: 120.0,
      });

      expect(pr.id).toBeDefined();
      expect(pr.exerciseId).toBe('ex_bench_press');
      expect(pr.value).toBe(120.0);

      const prs = await service.getPersonalRecords(userAId, 'ex_bench_press');
      expect(prs.length).toBe(1);
      expect(prs[0]!.value).toBe(120.0);
    });

    it('should automatically scan and detect PRs from workout session sets', async () => {
      const session = await workoutsService.startSession(userAId, {
        title: 'PR Push Day',
      });

      const exInstance = session.exercises[0]!;

      await workoutsService.logSet(userAId, session.id, {
        workoutSessionExerciseId: exInstance.id,
        setNumber: 1,
        actualReps: 5,
        weightKg: 140, // 140kg x 5 reps -> est 1RM = 163.3 kg
        isCompleted: true,
      });

      await workoutsService.completeSession(userAId, session.id, {
        durationSeconds: 3600,
      });

      const detectedPRs = await service.scanAndSyncWorkoutPRs(userAId);
      expect(detectedPRs.length).toBeGreaterThan(0);

      const exercisePRs = await service.getPersonalRecords(userAId, exInstance.exerciseId);
      const maxWeightPR = exercisePRs.find((p) => p.prType === PersonalRecordType.HEAVIEST_WEIGHT);
      const est1RMPR = exercisePRs.find((p) => p.prType === PersonalRecordType.ESTIMATED_1RM);

      expect(maxWeightPR).toBeDefined();
      expect(maxWeightPR?.value).toBe(140);
      expect(est1RMPR).toBeDefined();
      expect(est1RMPR?.value).toBe(163.3);
    });

    it('should generate strength trends from workout history', async () => {
      const session = await workoutsService.startSession(userAId, {
        title: 'Strength Trend Session',
      });
      const exInstance = session.exercises[0]!;

      await workoutsService.logSet(userAId, session.id, {
        workoutSessionExerciseId: exInstance.id,
        setNumber: 1,
        actualReps: 5,
        weightKg: 140,
        isCompleted: true,
      });

      await workoutsService.completeSession(userAId, session.id, {
        durationSeconds: 3600,
      });

      const trends = await service.getStrengthTrends(userAId);
      expect(trends.length).toBeGreaterThan(0);
      const trend = trends[0]!;
      expect(trend).toBeDefined();
      expect(trend.bestWeightKg).toBe(140);
      expect(trend.estimated1RM).toBe(163.3);
    });
  });

  describe('6. Progress Photos & Visual Timeline', () => {
    it('should log progress photo and filter by angle', async () => {
      const photo = await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/front1.jpg',
        s3Key: 'photos/front1.jpg',
        viewAngle: 'FRONT',
        notes: 'Morning physique check',
      });

      expect(photo.id).toBeDefined();
      expect(photo.viewAngle).toBe('FRONT');

      const frontPhotos = await service.getProgressPhotos(userAId, 'front');
      expect(frontPhotos.length).toBe(1);
      expect(frontPhotos[0]!.id).toBe(photo.id);

      const backPhotos = await service.getProgressPhotos(userAId, 'back');
      expect(backPhotos.length).toBe(0);
    });

    it('should compute photo comparison with accurate days between', async () => {
      const day1 = new Date();
      day1.setDate(day1.getDate() - 30);

      const photo1 = await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/day1.jpg',
        s3Key: 'photos/day1.jpg',
        viewAngle: 'FRONT',
        takenAt: day1.toISOString(),
      });

      const photo2 = await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/day30.jpg',
        s3Key: 'photos/day30.jpg',
        viewAngle: 'FRONT',
      });

      const comparison = await service.getPhotoComparison(userAId, photo1.id, photo2.id);
      expect(comparison.before.id).toBe(photo1.id);
      expect(comparison.after.id).toBe(photo2.id);
      expect(comparison.daysBetween).toBe(30);
    });

    it('should delete progress photo', async () => {
      const photo = await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/delete_me.jpg',
        s3Key: 'photos/delete_me.jpg',
        viewAngle: 'SIDE',
      });

      const res = await service.deleteProgressPhoto(userAId, photo.id);
      expect(res.success).toBe(true);

      await expect(service.getPhotoById(userAId, photo.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('7. Strict Multi-Tenant Isolation', () => {
    it('should prevent User B from viewing User A progress photos (CROSS_USER_ACCESS_DENIED)', async () => {
      const photo = await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/private.jpg',
        s3Key: 'photos/private.jpg',
        viewAngle: 'FRONT',
      });

      await expect(service.getPhotoById(userBId, photo.id)).rejects.toThrow(ForbiddenException);
    });

    it('should prevent User B from comparing User A progress photos', async () => {
      const p1 = await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/p1.jpg',
        s3Key: 'photos/p1.jpg',
        viewAngle: 'FRONT',
      });
      const p2 = await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/p2.jpg',
        s3Key: 'photos/p2.jpg',
        viewAngle: 'FRONT',
      });

      await expect(service.getPhotoComparison(userBId, p1.id, p2.id)).rejects.toThrow(ForbiddenException);
    });

    it('should prevent User B from deleting User A progress photos', async () => {
      const photo = await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/p_del.jpg',
        s3Key: 'photos/p_del.jpg',
        viewAngle: 'FRONT',
      });

      await expect(service.deleteProgressPhoto(userBId, photo.id)).rejects.toThrow(ForbiddenException);
    });

    it('should isolate metrics, PRs, and trajectory completely between users', async () => {
      const userBMetrics = await service.getBodyMetrics(userBId);
      expect(userBMetrics.length).toBe(0);

      const userBPRs = await service.getPersonalRecords(userBId);
      expect(userBPRs.length).toBe(0);

      const userBPhotos = await service.getProgressPhotos(userBId);
      expect(userBPhotos.length).toBe(0);
    });
  });

  describe('8. Unified Progress Overview Synthesis', () => {
    it('should synthesize full cross-module progress dashboard', async () => {
      await service.logBodyMetric(userAId, {
        weightKg: 82.5,
      });

      const session = await workoutsService.startSession(userAId, {
        title: 'Morning Push',
      });
      await workoutsService.completeSession(userAId, session.id, {
        durationSeconds: 3600,
      });

      await service.logProgressPhoto(userAId, {
        photoUrl: 'https://s3.amazonaws.com/alpha/photos/p_overview.jpg',
        s3Key: 'photos/p_overview.jpg',
        viewAngle: 'FRONT',
      });

      await service.recordPR(userAId, {
        exerciseId: 'ex_squat',
        exerciseName: 'Squat',
        prType: PersonalRecordType.HEAVIEST_WEIGHT,
        value: 150,
      });

      const overview = await service.getOverview(userAId);

      expect(overview).toBeDefined();
      expect(overview.currentWeightKg).toBe(82.5);
      expect(overview.weightTrajectory.length).toBeGreaterThan(0);
      expect(overview.bmi).toBeDefined();
      expect(overview.bmiCategory).toBeDefined();
      expect(overview.workoutsCompleted).toBeGreaterThanOrEqual(1);
      expect(overview.workoutConsistencyPercent).toBeGreaterThan(0);
      expect(overview.recentPRs.length).toBeGreaterThan(0);
      expect(overview.photosCount).toBeGreaterThanOrEqual(1);
    });
  });
});
