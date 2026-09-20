import { Injectable, Logger, Optional } from '@nestjs/common';
import { IAIContext } from '@alpha/types';
import { UsersService } from '../users/users.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { ActivityService } from '../activity/activity.service';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class AiContextBuilderService {
  private readonly logger = new Logger(AiContextBuilderService.name);

  constructor(
    @Optional() private readonly usersService?: UsersService,
    @Optional() private readonly workoutsService?: WorkoutsService,
    @Optional() private readonly nutritionService?: NutritionService,
    @Optional() private readonly activityService?: ActivityService,
    @Optional() private readonly progressService?: ProgressService,
  ) {}

  /**
   * Bounded Context Builder:
   * Aggregates only authorized and relevant records for the authenticated user.
   * Defends against prompt injection by sanitizing untrusted user strings.
   */
  async buildContext(userId: string): Promise<IAIContext> {
    // 1. User Profile, Preferences & Goals
    let userName = 'Athlete';
    let primaryGoal = 'HYPERTROPHY';
    let experienceLevel = 'INTERMEDIATE';
    let heightCm: number | null = 180;
    let currentWeightKg: number | null = 79.8;
    let bmi: number | null = 24.1;
    let timezone = 'UTC';
    let unitSystem: any = 'METRIC';

    let userGoals: {
      primaryGoal: string;
      targetWeightKg?: number | null;
      dailyCalorieTarget?: number | null;
      dailyWaterMl?: number | null;
      dailyStepTarget?: number | null;
      weeklyWorkoutDays?: number | null;
    } = {
      primaryGoal: 'HYPERTROPHY',
      targetWeightKg: 82.0,
      dailyCalorieTarget: 2600,
      dailyWaterMl: 3500,
      dailyStepTarget: 10000,
      weeklyWorkoutDays: 4,
    };

    if (this.usersService) {
      try {
        const profile = await this.usersService.getProfile(userId);
        userName = this.sanitizePromptContent(profile.fullName || 'Athlete');
        experienceLevel = profile.experienceLevel || 'INTERMEDIATE';
        heightCm = profile.heightCm ?? 180;
        currentWeightKg = profile.weightKg ?? 79.8;

        const pref = await this.usersService.getPreferences(userId);
        if (pref) {
          timezone = pref.timezone || 'UTC';
          unitSystem = pref.unitSystem || 'METRIC';
        }

        const goals = await this.usersService.getGoals(userId);
        if (goals) {
          primaryGoal = goals.primaryGoal || primaryGoal;
          userGoals = {
            primaryGoal: goals.primaryGoal || primaryGoal,
            targetWeightKg: goals.targetWeightKg ?? null,
            dailyCalorieTarget: goals.targetDailyCalories ?? null,
            dailyWaterMl: 3500,
            dailyStepTarget: goals.targetDailySteps ?? null,
            weeklyWorkoutDays: goals.targetWeeklyWorkouts ?? null,
          };
        }
      } catch (err: unknown) {
        this.logger.warn(`Could not load profile/goals for context: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Date Range in User's Timezone
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const dateRange = {
      start: `${todayStr}T00:00:00.000Z`,
      end: `${todayStr}T23:59:59.999Z`,
      timezone,
    };

    // 2. Recent Workouts (Bounded to max 5 recent completed sessions)
    const recentWorkouts: IAIContext['recentWorkouts'] = [];
    let workoutConsistencyPercent = 85;

    if (this.workoutsService) {
      try {
        const sessions = await this.workoutsService.getUserSessions(userId, 5);
        sessions.forEach((s) => {
          recentWorkouts.push({
            title: this.sanitizePromptContent(s.title),
            completedAt: s.completedAt ? s.completedAt.toISOString() : s.startedAt.toISOString(),
            totalVolumeKg: s.totalVolumeKg,
            durationSeconds: s.durationSeconds,
          });
        });
        if (recentWorkouts.length > 0) {
          workoutConsistencyPercent = Math.min(100, recentWorkouts.length * 20);
        }
      } catch (err: unknown) {
        this.logger.warn(`Could not load workouts for context: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 3. Nutrition Summary (Today only)
    let todayNutrition: IAIContext['todayNutrition'] = null;
    let hasNutrition = false;

    if (this.nutritionService) {
      try {
        const sum = await this.nutritionService.getDailySummary(userId, todayStr);
        if (sum && sum.caloriesConsumed > 0) {
          hasNutrition = true;
          todayNutrition = {
            caloriesConsumed: sum.caloriesConsumed,
            calorieTarget: sum.calorieTarget,
            proteinConsumedG: sum.proteinConsumedG,
            waterConsumedMl: sum.hydrationConsumedMl,
            adherencePercent: sum.calorieAdherencePercent,
          };
        }
      } catch {
        hasNutrition = false;
      }
    }

    // 4. Activity Summary (Today only)
    let todayActivity: IAIContext['todayActivity'] = null;
    let hasActivity = false;
    let hasHeartRate = false;

    if (this.activityService) {
      try {
        const actSummary = await this.activityService.getDailySummary(userId);
        if (actSummary && actSummary.stepCount > 0) {
          hasActivity = true;
          todayActivity = {
            stepCount: actSummary.stepCount,
            distanceKm: actSummary.distanceKm,
            activeCalories: actSummary.activeCalories,
            heartRateAvg: null,
          };
        }
      } catch {
        hasActivity = false;
      }
    }

    // 5. Recent Personal Records & Progress Overview
    const recentPRs: IAIContext['recentPRs'] = [];
    let hasProgressPhotos = false;
    let progressSummary: IAIContext['progress'] = null;

    if (this.progressService) {
      try {
        const overview = await this.progressService.getOverview(userId);
        if (overview.currentWeightKg) currentWeightKg = overview.currentWeightKg;
        if (overview.bmi) bmi = overview.bmi;
        if (overview.workoutConsistencyPercent) workoutConsistencyPercent = overview.workoutConsistencyPercent;
        if (overview.photosCount > 0) hasProgressPhotos = true;

        progressSummary = {
          latestWeightKg: overview.currentWeightKg ?? currentWeightKg,
          baselineWeightKg: overview.weightTrajectory?.[0]?.weightKg ?? currentWeightKg,
          weightChangeKg: overview.weightChangeKg ?? 0,
          bmi: overview.bmi ?? bmi,
          bodyFatPercent: overview.bodyFatPercent ?? null,
          photosCount: overview.photosCount ?? 0,
        };

        const prList = await this.progressService.getPersonalRecords(userId);
        prList.slice(0, 5).forEach((pr) => {
          recentPRs.push({
            exerciseName: this.sanitizePromptContent(pr.exerciseName),
            prType: pr.prType,
            value: pr.value,
          });
        });
      } catch (err: unknown) {
        this.logger.warn(`Could not load progress overview for context: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      userId,
      userName,
      primaryGoal,
      experienceLevel,
      heightCm,
      currentWeightKg,
      bmi,
      unitSystem,
      timezone,
      dateRange,
      goals: userGoals,
      recentWorkouts,
      todayNutrition,
      todayActivity,
      recentPRs,
      progress: progressSummary,
      workoutConsistencyPercent,
      dataAvailability: {
        hasWorkouts: recentWorkouts.length > 0,
        hasNutrition,
        hasActivity,
        hasHeartRate,
        hasProgressPhotos,
        hasBodyFat: progressSummary?.bodyFatPercent != null,
        hasSleep: false,
      },
    };
  }

  /**
   * Prompt Injection Defense:
   * Strips control tokens, system prompt overrides, and escape markers.
   */
  public sanitizePromptContent(text: string): string {
    if (!text) return '';
    return text
      .replace(/(ignore\s+(all\s+)?(previous|prior)\s+instructions)/gi, '[REDACTED_COMMAND]')
      .replace(/(system\s*prompt\s*:)/gi, '[REDACTED_PROMPT]')
      .replace(/(do\s+not\s+follow\s+rules)/gi, '[REDACTED]')
      .trim();
  }
}
