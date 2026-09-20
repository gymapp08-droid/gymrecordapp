import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { HashUtil } from '@alpha/utils';
import {
  BMICategory,
  BodyMeasurementType,
  PersonalRecordType,
  IBodyMetric,
  IBodyMeasurement,
  IPersonalRecord,
  IProgressPhotoMetadata,
  IStrengthTrend,
  IProgressOverview,
  WorkoutStatus,
} from '@alpha/types';
import {
  LogBodyMetricDto,
  LogBodyMeasurementDto,
  CreateProgressPhotoDto,
} from '@alpha/validation';
import { UsersService } from '../users/users.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  // In-memory persistent stores with strict multi-tenant partition
  private readonly bodyMetrics = new Map<string, IBodyMetric>();
  private readonly bodyMeasurements = new Map<string, IBodyMeasurement>();
  private readonly personalRecords = new Map<string, IPersonalRecord>();
  private readonly progressPhotos = new Map<string, IProgressPhotoMetadata>();

  constructor(
    @Optional() private readonly usersService?: UsersService,
    @Optional() private readonly workoutsService?: WorkoutsService,
    @Optional() private readonly nutritionService?: NutritionService,
    @Optional() private readonly activityService?: ActivityService,
  ) {}

  // -------------------------------------------------------------
  // 1. DETERMINISTIC BMI & CLASSIFICATION ENGINE
  // -------------------------------------------------------------

  public calculateBMI(
    weightKg: number,
    heightCm: number,
  ): { bmi: number; category: BMICategory } | null {
    if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
      return null;
    }
    const heightM = heightCm / 100;
    const rawBmi = weightKg / (heightM * heightM);
    const bmi = Math.round(rawBmi * 10) / 10;

    let category: BMICategory;
    if (bmi < 18.5) {
      category = BMICategory.UNDERWEIGHT;
    } else if (bmi < 25.0) {
      category = BMICategory.NORMAL;
    } else if (bmi < 30.0) {
      category = BMICategory.OVERWEIGHT;
    } else {
      category = BMICategory.OBESE;
    }

    return { bmi, category };
  }

  // -------------------------------------------------------------
  // 2. DETERMINISTIC 1RM CALCULATION (EPLEY FORMULA)
  // -------------------------------------------------------------

  public calculateEstimated1RM(weightKg: number, reps: number): number {
    if (weightKg <= 0 || reps <= 0) {
      return 0;
    }
    if (reps === 1) {
      return Math.round(weightKg * 10) / 10;
    }
    // Epley formula: 1RM = weight * (1 + reps / 30)
    const raw1RM = weightKg * (1 + reps / 30);
    return Math.round(raw1RM * 10) / 10;
  }

  // -------------------------------------------------------------
  // 3. BODY METRICS TRACKING
  // -------------------------------------------------------------

  async logBodyMetric(userId: string, dto: LogBodyMetricDto): Promise<IBodyMetric> {
    const id = 'metric_' + HashUtil.generateUuid();
    const now = new Date();
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : now;

    const metric: IBodyMetric = {
      id,
      userId,
      recordedAt,
      weightKg: dto.weightKg ?? null,
      bodyFatPercent: dto.bodyFatPercent ?? null,
      muscleMassKg: dto.muscleMassKg ?? null,
      waterPercent: dto.waterPercent ?? null,
      source: dto.source || 'MANUAL',
      createdAt: now,
      updatedAt: now,
    };

    this.bodyMetrics.set(id, metric);

    // Update user profile weight if available
    if (this.usersService && dto.weightKg) {
      try {
        await this.usersService.updateProfile(userId, { weightKg: dto.weightKg });
      } catch (err: unknown) {
        this.logger.warn(`Failed to update profile weight for user [${userId}]: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    this.logger.log(`Logged body metric [${id}] for user [${userId}], weight=${dto.weightKg}kg`);
    return metric;
  }

  async getBodyMetrics(userId: string, limit = 50): Promise<IBodyMetric[]> {
    return Array.from(this.bodyMetrics.values())
      .filter((m) => m.userId === userId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, limit);
  }

  async getLatestBodyMetric(userId: string): Promise<IBodyMetric | null> {
    const list = await this.getBodyMetrics(userId, 1);
    return list[0] ?? null;
  }

  async getWeightTrajectory(
    userId: string,
    days = 90,
  ): Promise<{ date: string; weightKg: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const metrics = Array.from(this.bodyMetrics.values())
      .filter((m) => m.userId === userId && m.weightKg !== null && m.recordedAt >= cutoff)
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

    return metrics.map((m) => ({
      date: m.recordedAt.toISOString().slice(0, 10),
      weightKg: m.weightKg!,
    }));
  }

  // -------------------------------------------------------------
  // 4. BODY MEASUREMENTS TRACKING
  // -------------------------------------------------------------

  async logMeasurement(
    userId: string,
    dto: LogBodyMeasurementDto,
  ): Promise<IBodyMeasurement> {
    if (!dto.valueCm || dto.valueCm <= 0) {
      throw new BadRequestException({
        code: 'INVALID_MEASUREMENT_VALUE',
        message: 'Measurement value must be greater than 0 cm',
      });
    }

    const id = 'msmt_' + HashUtil.generateUuid();
    const now = new Date();
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : now;

    const measurement: IBodyMeasurement = {
      id,
      userId,
      measurementType: dto.measurementType,
      valueCm: Math.round(dto.valueCm * 10) / 10,
      recordedAt,
      createdAt: now,
    };

    this.bodyMeasurements.set(id, measurement);
    this.logger.log(`Logged measurement [${id}] ${dto.measurementType}=${dto.valueCm}cm for user [${userId}]`);
    return measurement;
  }

  async getMeasurements(
    userId: string,
    type?: BodyMeasurementType,
  ): Promise<IBodyMeasurement[]> {
    return Array.from(this.bodyMeasurements.values())
      .filter((m) => m.userId === userId && (!type || m.measurementType === type))
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }

  // -------------------------------------------------------------
  // 5. PERSONAL RECORDS & STRENGTH PROGRESSION
  // -------------------------------------------------------------

  async recordPR(
    userId: string,
    data: {
      exerciseId: string;
      exerciseName: string;
      prType: PersonalRecordType;
      value: number;
      reps?: number | null;
      weightKg?: number | null;
      workoutSessionId?: string | null;
      achievedAt?: Date;
    },
  ): Promise<IPersonalRecord> {
    const id = 'pr_' + HashUtil.generateUuid();
    const achievedAt = data.achievedAt || new Date();

    const pr: IPersonalRecord = {
      id,
      userId,
      exerciseId: data.exerciseId,
      exerciseName: data.exerciseName,
      prType: data.prType,
      value: Math.round(data.value * 10) / 10,
      reps: data.reps ?? null,
      weightKg: data.weightKg ?? null,
      workoutSessionId: data.workoutSessionId ?? null,
      achievedAt,
      createdAt: new Date(),
    };

    this.personalRecords.set(id, pr);
    this.logger.log(`Registered PR [${id}] ${data.exerciseName} ${data.prType}=${data.value} for user [${userId}]`);
    return pr;
  }

  async getPersonalRecords(
    userId: string,
    exerciseId?: string,
  ): Promise<IPersonalRecord[]> {
    return Array.from(this.personalRecords.values())
      .filter((pr) => pr.userId === userId && (!exerciseId || pr.exerciseId === exerciseId))
      .sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());
  }

  async scanAndSyncWorkoutPRs(userId: string): Promise<IPersonalRecord[]> {
    if (!this.workoutsService) {
      return this.getPersonalRecords(userId);
    }

    const sessions = await this.workoutsService.getUserSessions(userId, 100);
    const newPRs: IPersonalRecord[] = [];

    // Map of current user PRs by exerciseId + prType
    const existingPRs = await this.getPersonalRecords(userId);
    const currentBestMap = new Map<string, number>();

    for (const pr of existingPRs) {
      const key = `${pr.exerciseId}:${pr.prType}`;
      const current = currentBestMap.get(key) || 0;
      if (pr.value > current) {
        currentBestMap.set(key, pr.value);
      }
    }

    for (const session of sessions) {
      for (const ex of session.exercises) {
        let maxWeight = 0;
        let maxReps = 0;
        let max1RM = 0;
        let exerciseVolume = 0;

        for (const set of ex.sets) {
          if (!set.isCompleted) continue;
          const weight = set.weightKg || 0;
          const reps = set.actualReps || 0;

          if (weight > maxWeight) maxWeight = weight;
          if (reps > maxReps) maxReps = reps;

          const est1RM = this.calculateEstimated1RM(weight, reps);
          if (est1RM > max1RM) max1RM = est1RM;

          exerciseVolume += weight * reps;
        }

        // Check HEAVIEST_WEIGHT
        const weightKey = `${ex.exerciseId}:${PersonalRecordType.HEAVIEST_WEIGHT}`;
        const prevWeight = currentBestMap.get(weightKey) || 0;
        if (maxWeight > prevWeight) {
          currentBestMap.set(weightKey, maxWeight);
          const pr = await this.recordPR(userId, {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            prType: PersonalRecordType.HEAVIEST_WEIGHT,
            value: maxWeight,
            weightKg: maxWeight,
            workoutSessionId: session.id,
            achievedAt: session.completedAt || session.startedAt,
          });
          newPRs.push(pr);
        }

        // Check ESTIMATED_1RM
        const rmKey = `${ex.exerciseId}:${PersonalRecordType.ESTIMATED_1RM}`;
        const prev1RM = currentBestMap.get(rmKey) || 0;
        if (max1RM > prev1RM) {
          currentBestMap.set(rmKey, max1RM);
          const pr = await this.recordPR(userId, {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            prType: PersonalRecordType.ESTIMATED_1RM,
            value: max1RM,
            weightKg: maxWeight,
            workoutSessionId: session.id,
            achievedAt: session.completedAt || session.startedAt,
          });
          newPRs.push(pr);
        }

        // Check MAX_VOLUME
        const volKey = `${ex.exerciseId}:${PersonalRecordType.MAX_VOLUME}`;
        const prevVol = currentBestMap.get(volKey) || 0;
        if (exerciseVolume > prevVol) {
          currentBestMap.set(volKey, exerciseVolume);
          const pr = await this.recordPR(userId, {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            prType: PersonalRecordType.MAX_VOLUME,
            value: exerciseVolume,
            workoutSessionId: session.id,
            achievedAt: session.completedAt || session.startedAt,
          });
          newPRs.push(pr);
        }
      }
    }

    return newPRs;
  }

  async getStrengthTrends(userId: string): Promise<IStrengthTrend[]> {
    if (!this.workoutsService) {
      return [];
    }

    const sessions = await this.workoutsService.getUserSessions(userId, 50);
    const exerciseMap = new Map<
      string,
      {
        exerciseName: string;
        sessionsCount: number;
        weights: number[];
        bestWeight: number;
        bestReps: number;
        best1RM: number;
        totalVolume: number;
      }
    >();

    for (const session of sessions) {
      for (const ex of session.exercises) {
        if (!exerciseMap.has(ex.exerciseId)) {
          exerciseMap.set(ex.exerciseId, {
            exerciseName: ex.exerciseName,
            sessionsCount: 0,
            weights: [],
            bestWeight: 0,
            bestReps: 0,
            best1RM: 0,
            totalVolume: 0,
          });
        }
        const data = exerciseMap.get(ex.exerciseId)!;
        data.sessionsCount += 1;

        for (const s of ex.sets) {
          if (!s.isCompleted) continue;
          const w = s.weightKg || 0;
          const r = s.actualReps || 0;
          if (w > 0) data.weights.push(w);
          if (w > data.bestWeight) data.bestWeight = w;
          if (r > data.bestReps) data.bestReps = r;
          const est1RM = this.calculateEstimated1RM(w, r);
          if (est1RM > data.best1RM) data.best1RM = est1RM;
          data.totalVolume += w * r;
        }
      }
    }

    const trends: IStrengthTrend[] = [];
    for (const [exerciseId, data] of exerciseMap.entries()) {
      const baselineWeight = data.weights.length > 0 ? (data.weights[data.weights.length - 1] ?? null) : null;
      const currentWeight = data.weights.length > 0 ? (data.weights[0] ?? null) : null;
      let percentageChange = 0;
      if (baselineWeight && currentWeight && baselineWeight > 0) {
        percentageChange = Math.round(((currentWeight - baselineWeight) / baselineWeight) * 1000) / 10;
      }

      trends.push({
        exerciseId,
        exerciseName: data.exerciseName,
        sessionsCount: data.sessionsCount,
        baselineWeightKg: baselineWeight,
        currentWeightKg: currentWeight,
        bestWeightKg: data.bestWeight,
        bestReps: data.bestReps,
        estimated1RM: data.best1RM,
        totalVolumeKg: Math.round(data.totalVolume * 10) / 10,
        percentageChange,
      });
    }

    return trends;
  }

  // -------------------------------------------------------------
  // 6. PROGRESS PHOTOS & VISUAL TIMELINE
  // -------------------------------------------------------------

  async logProgressPhoto(
    userId: string,
    dto: CreateProgressPhotoDto,
  ): Promise<IProgressPhotoMetadata> {
    const id = 'photo_' + HashUtil.generateUuid();
    const now = new Date();
    const takenAt = dto.takenAt ? new Date(dto.takenAt) : now;

    const photo: IProgressPhotoMetadata = {
      id,
      userId,
      photoUrl: dto.photoUrl,
      s3Key: dto.s3Key,
      viewAngle: dto.viewAngle.toUpperCase(),
      notes: dto.notes ?? null,
      takenAt,
      createdAt: now,
    };

    this.progressPhotos.set(id, photo);
    this.logger.log(`Logged progress photo [${id}] angle=${photo.viewAngle} for user [${userId}]`);
    return photo;
  }

  async getProgressPhotos(
    userId: string,
    angle?: string,
  ): Promise<IProgressPhotoMetadata[]> {
    return Array.from(this.progressPhotos.values())
      .filter((p) => p.userId === userId && (!angle || p.viewAngle.toLowerCase() === angle.toLowerCase()))
      .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime());
  }

  async getPhotoById(
    userId: string,
    photoId: string,
  ): Promise<IProgressPhotoMetadata> {
    const photo = this.progressPhotos.get(photoId);
    if (!photo) {
      throw new NotFoundException({
        code: 'PHOTO_NOT_FOUND',
        message: 'Progress photo not found',
      });
    }

    if (photo.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied: You are not authorized to view this progress photo',
      });
    }

    return photo;
  }

  async getPhotoComparison(
    userId: string,
    beforeId: string,
    afterId: string,
  ): Promise<{
    before: IProgressPhotoMetadata;
    after: IProgressPhotoMetadata;
    daysBetween: number;
  }> {
    const p1 = await this.getPhotoById(userId, beforeId);
    const p2 = await this.getPhotoById(userId, afterId);

    // Sort chronologically
    const [before, after] = p1.takenAt.getTime() <= p2.takenAt.getTime() ? [p1, p2] : [p2, p1];
    const msDiff = Math.abs(after.takenAt.getTime() - before.takenAt.getTime());
    const daysBetween = Math.round(msDiff / (1000 * 60 * 60 * 24));

    return { before, after, daysBetween };
  }

  async deleteProgressPhoto(
    userId: string,
    photoId: string,
  ): Promise<{ success: boolean }> {
    const photo = await this.getPhotoById(userId, photoId);
    this.progressPhotos.delete(photo.id);
    this.logger.log(`Deleted progress photo [${photoId}] for user [${userId}]`);
    return { success: true };
  }

  // -------------------------------------------------------------
  // 7. UNIFIED PROGRESS OVERVIEW & SYNTHESIS
  // -------------------------------------------------------------

  async getOverview(userId: string): Promise<IProgressOverview> {
    // 1. Weight & Trajectory
    const trajectory = await this.getWeightTrajectory(userId, 90);
    const latestMetric = await this.getLatestBodyMetric(userId);

    let currentWeightKg: number | null = null;
    let weightChangeKg: number | null = null;

    if (latestMetric?.weightKg) {
      currentWeightKg = latestMetric.weightKg;
    } else if (trajectory.length > 0 && trajectory[trajectory.length - 1]?.weightKg !== undefined) {
      currentWeightKg = trajectory[trajectory.length - 1]!.weightKg;
    } else if (this.usersService) {
      const profile = await this.usersService.getProfile(userId);
      if (profile.weightKg) currentWeightKg = profile.weightKg;
    }

    if (trajectory.length >= 2) {
      const first = trajectory[0];
      const last = trajectory[trajectory.length - 1];
      if (first && last) {
        weightChangeKg = Math.round((last.weightKg - first.weightKg) * 10) / 10;
      }
    }

    // 2. BMI Calculation
    let bmi: number | null = null;
    let bmiCategory: BMICategory | null = null;
    let heightCm = 180; // default standard if not found

    if (this.usersService) {
      const profile = await this.usersService.getProfile(userId);
      if (profile.heightCm) heightCm = profile.heightCm;
    }

    if (currentWeightKg && heightCm > 0) {
      const bmiResult = this.calculateBMI(currentWeightKg, heightCm);
      if (bmiResult) {
        bmi = bmiResult.bmi;
        bmiCategory = bmiResult.category;
      }
    }

    // 3. Workouts consistency
    let workoutsCompleted = 0;
    const workoutsPlanned = 16; // Standard 4-week monthly cycle target (4/week)
    let workoutConsistencyPercent = 0;

    if (this.workoutsService) {
      const sessions = await this.workoutsService.getUserSessions(userId, 50);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      workoutsCompleted = sessions.filter(
        (s) => s.status === WorkoutStatus.COMPLETED && (s.completedAt || s.startedAt) >= thirtyDaysAgo,
      ).length;

      workoutConsistencyPercent = Math.min(100, Math.round((workoutsCompleted / workoutsPlanned) * 100));
    }

    // 4. Nutrition Adherence
    let nutritionAdherencePercent: number | null = null;
    if (this.nutritionService) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const summary = await this.nutritionService.getDailySummary(userId, today);
        nutritionAdherencePercent = summary.calorieAdherencePercent ?? 85;
      } catch {
        nutritionAdherencePercent = null;
      }
    }

    // 5. Activity average daily steps
    let avgDailySteps = 0;
    if (this.activityService) {
      try {
        const todaySummary = await this.activityService.getDailySummary(userId);
        avgDailySteps = todaySummary.stepCount;
      } catch {
        avgDailySteps = 0;
      }
    }

    // 6. Recent PRs and Photos
    const allPRs = await this.getPersonalRecords(userId);
    const recentPRs = allPRs.slice(0, 5);

    const photos = await this.getProgressPhotos(userId);
    const recentPhotos = photos.slice(0, 4);

    return {
      currentWeightKg,
      weightChangeKg,
      weightTrajectory: trajectory,
      bmi,
      bmiCategory,
      bodyFatPercent: latestMetric?.bodyFatPercent ?? null,
      workoutConsistencyPercent,
      workoutsCompleted,
      workoutsPlanned,
      nutritionAdherencePercent,
      avgDailySteps,
      recentPRs,
      photosCount: photos.length,
      recentPhotos,
    };
  }
}
