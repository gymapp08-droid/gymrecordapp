import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsMathService } from './analytics-math.service';
import {
  IClientAnalyticsSummary,
  IClientWorkoutSummary,
  IClientNutritionSummary,
  IClientActivitySummary,
  IClientProgressSummary,
  ICoachAnalyticsSummary,
  ICoachWorkloadMetrics,
  ICoachClientAdherenceItem,
  IOrganizationExecutiveOverview,
  AnalyticsTimePeriod,
} from '@alpha/types';

@Injectable()
export class AnalyticsAggregationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly math: AnalyticsMathService,
  ) {}

  /**
   * Helper to format UTC Date into YYYY-MM-DD for a specific IANA timezone
   */
  formatDateInTimezone(date: Date, timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date); // YYYY-MM-DD
    } catch {
      return date.toISOString().split('T')[0] ?? '';
    }
  }

  // -------------------------------------------------------------
  // 1. CLIENT ANALYTICS (LEVEL 1)
  // -------------------------------------------------------------

  /**
   * Aggregates a single day for an athlete into AnalyticsDailyUser record
   */
  async aggregateClientDaily(
    userId: string,
    targetDateStr: string, // YYYY-MM-DD in user-local timezone
    timezone = 'UTC',
  ) {
    const dayStart = new Date(`${targetDateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${targetDateStr}T23:59:59.999Z`);

    // 1. Workouts
    const workouts = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    const plannedWorkouts = workouts.length;
    const completedWorkouts = workouts.filter((w) => w.status === 'COMPLETED').length;
    const skippedWorkouts = workouts.filter((w) => w.status === 'SKIPPED').length;

    let workoutVolumeKg = 0;
    let workoutDurationMinutes = 0;

    for (const w of workouts) {
      if (w.status === 'COMPLETED') {
        workoutDurationMinutes += Math.round(w.durationSeconds / 60);
        if (w.totalVolumeKg && w.totalVolumeKg > 0) {
          workoutVolumeKg += w.totalVolumeKg;
        } else {
          for (const ex of w.exercises) {
            for (const s of ex.sets) {
              if (s.isCompleted && s.weightKg && s.actualReps) {
                workoutVolumeKg += s.weightKg * s.actualReps;
              }
            }
          }
        }
      }
    }

    // PRs on this date
    const prsCount = await this.prisma.personalRecord.count({
      where: {
        userId,
        achievedAt: { gte: dayStart, lte: dayEnd },
      },
    });

    // 2. Nutrition
    const mealLogs = await this.prisma.dailyMealLog.findMany({
      where: {
        userId,
        logDate: { gte: dayStart, lte: dayEnd },
      },
      include: {
        items: true,
      },
    });

    let caloriesConsumed = 0;
    let proteinGrams = 0;
    let carbsGrams = 0;
    let fatsGrams = 0;
    const mealsLogged = mealLogs.length;

    for (const log of mealLogs) {
      for (const item of log.items) {
        caloriesConsumed += item.calories;
        proteinGrams += item.proteinGrams;
        carbsGrams += item.carbsGrams;
        fatsGrams += item.fatGrams;
      }
    }

    // Hydration
    const hydrationLogs = await this.prisma.hydrationLog.findMany({
      where: {
        userId,
        logDate: { gte: dayStart, lte: dayEnd },
      },
    });
    const waterMl = Math.round(hydrationLogs.reduce((acc, h) => acc + h.amountMl, 0));

    // Goal Targets
    const userGoal = await this.prisma.userGoal.findUnique({
      where: { userId },
    });

    const calorieTarget = userGoal?.targetDailyCalories ?? null;
    const proteinTarget = userGoal?.targetDailyProteinGrams ?? null;
    const waterTarget = 2500; // Standard daily hydration target (2500ml)

    let nutritionAdherenceScore: number | null = null;
    if (mealsLogged > 0 && calorieTarget && calorieTarget > 0) {
      const diffPct = (Math.abs(caloriesConsumed - calorieTarget) / calorieTarget) * 100;
      nutritionAdherenceScore = Math.max(0, Math.min(100, Math.round((100 - diffPct) * 10) / 10));
    }

    // 3. Activity
    const activityRecords = await this.prisma.activityRecord.findMany({
      where: {
        userId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });
    const steps = activityRecords.reduce((acc, a) => acc + a.stepCount, 0);
    const activeMinutes = activityRecords.reduce((acc, a) => acc + a.activeMinutes, 0);
    const caloriesBurned = activityRecords.reduce((acc, a) => acc + a.activeCalories, 0);

    const cardioSessions = await this.prisma.cardioSession.findMany({
      where: {
        userId,
        startedAt: { gte: dayStart, lte: dayEnd },
      },
    });
    const cardioDurationMinutes = Math.round(
      cardioSessions.reduce((acc, c) => acc + c.durationSeconds, 0) / 60,
    );
    const cardioDistanceMeters = cardioSessions.reduce((acc, c) => acc + (c.distanceMeters ?? 0), 0);

    // 4. Biometrics
    const latestBodyMetric = await this.prisma.bodyMetric.findFirst({
      where: {
        userId,
        recordedAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { recordedAt: 'desc' },
    });
    const bodyWeightKg = latestBodyMetric?.weightKg ?? null;

    // 5. Engagement & Qualifying activity
    let qualifyingEventsCount = 0;
    if (completedWorkouts > 0) qualifyingEventsCount++;
    if (mealsLogged > 0) qualifyingEventsCount++;
    if (steps >= 5000 || cardioDurationMinutes >= 20) qualifyingEventsCount++;
    if (bodyWeightKg !== null) qualifyingEventsCount++;

    const isActiveDay = qualifyingEventsCount > 0;

    // Upsert into AnalyticsDailyUser
    return this.prisma.analyticsDailyUser.upsert({
      where: {
        userId_date: {
          userId,
          date: targetDateStr,
        },
      },
      create: {
        userId,
        date: targetDateStr,
        timezone,
        plannedWorkouts,
        completedWorkouts,
        skippedWorkouts,
        workoutVolumeKg: Math.round(workoutVolumeKg * 10) / 10,
        workoutDurationMinutes,
        prsAchieved: prsCount,
        caloriesConsumed: Math.round(caloriesConsumed),
        calorieTarget,
        proteinGrams: Math.round(proteinGrams * 10) / 10,
        proteinTargetGrams: proteinTarget ? Number(proteinTarget) : null,
        carbsGrams: Math.round(carbsGrams * 10) / 10,
        fatsGrams: Math.round(fatsGrams * 10) / 10,
        mealsLogged,
        waterMl,
        waterTargetMl: waterTarget,
        nutritionAdherenceScore,
        steps,
        activeMinutes,
        cardioDurationMinutes,
        cardioDistanceMeters,
        caloriesBurned,
        bodyWeightKg,
        qualifyingEventsCount,
        isActiveDay,
      },
      update: {
        timezone,
        plannedWorkouts,
        completedWorkouts,
        skippedWorkouts,
        workoutVolumeKg: Math.round(workoutVolumeKg * 10) / 10,
        workoutDurationMinutes,
        prsAchieved: prsCount,
        caloriesConsumed: Math.round(caloriesConsumed),
        calorieTarget,
        proteinGrams: Math.round(proteinGrams * 10) / 10,
        proteinTargetGrams: proteinTarget ? Number(proteinTarget) : null,
        carbsGrams: Math.round(carbsGrams * 10) / 10,
        fatsGrams: Math.round(fatsGrams * 10) / 10,
        mealsLogged,
        waterMl,
        waterTargetMl: waterTarget,
        nutritionAdherenceScore,
        steps,
        activeMinutes,
        cardioDurationMinutes,
        cardioDistanceMeters,
        caloriesBurned,
        bodyWeightKg,
        qualifyingEventsCount,
        isActiveDay,
      },
    });
  }

  /**
   * Computes athlete summary across a multi-day reporting period
   */
  async getClientAnalyticsSummary(
    userId: string,
    startDateStr: string,
    endDateStr: string,
    period: AnalyticsTimePeriod = '30_DAYS',
    timezone = 'UTC',
  ): Promise<IClientAnalyticsSummary> {
    const dailyRecords = await this.prisma.analyticsDailyUser.findMany({
      where: {
        userId,
        date: { gte: startDateStr, lte: endDateStr },
      },
      orderBy: { date: 'asc' },
    });

    let totalPlanned = 0;
    let totalCompleted = 0;
    let totalSkipped = 0;
    let totalVolumeKg = 0;
    let totalDurationMinutes = 0;
    let prsAchieved = 0;

    let daysWithMeals = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let sumNutritionAdherence = 0;
    let daysWithWaterTargetMet = 0;

    let activeDaysCount = 0;
    let totalSteps = 0;
    let totalCardioMinutes = 0;
    let totalCardioDistance = 0;

    for (const d of dailyRecords) {
      totalPlanned += d.plannedWorkouts;
      totalCompleted += d.completedWorkouts;
      totalSkipped += d.skippedWorkouts;
      totalVolumeKg += d.workoutVolumeKg;
      totalDurationMinutes += d.workoutDurationMinutes;
      prsAchieved += d.prsAchieved;

      if (d.mealsLogged > 0) {
        daysWithMeals++;
        totalCalories += d.caloriesConsumed;
        totalProtein += d.proteinGrams;
        totalCarbs += d.carbsGrams;
        totalFats += d.fatsGrams;
        if (d.nutritionAdherenceScore !== null) {
          sumNutritionAdherence += d.nutritionAdherenceScore;
        }
      }

      if (d.waterTargetMl && d.waterMl >= d.waterTargetMl) {
        daysWithWaterTargetMet++;
      }

      if (d.isActiveDay) {
        activeDaysCount++;
      }
      totalSteps += d.steps;
      totalCardioMinutes += d.cardioDurationMinutes;
      totalCardioDistance += d.cardioDistanceMeters;
    }

    const adherencePercentage = this.math.calculatePercentage(totalCompleted, totalPlanned);
    const avgNutritionAdherence =
      daysWithMeals > 0 ? Math.round((sumNutritionAdherence / daysWithMeals) * 10) / 10 : null;
    const waterAdherencePct = this.math.calculatePercentage(daysWithWaterTargetMet, dailyRecords.length);

    const workout: IClientWorkoutSummary = {
      totalPlanned,
      totalCompleted,
      totalSkipped,
      adherencePercentage,
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
      totalDurationMinutes,
      prsAchieved,
      averageFrequencyPerWeek:
        dailyRecords.length > 0 ? Math.round((totalCompleted / (dailyRecords.length / 7)) * 10) / 10 : 0,
    };

    const nutrition: IClientNutritionSummary = {
      daysLogged: daysWithMeals,
      adherencePercentage: avgNutritionAdherence,
      averageCalories: daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0,
      averageProteinGrams: daysWithMeals > 0 ? Math.round((totalProtein / daysWithMeals) * 10) / 10 : 0,
      averageCarbsGrams: daysWithMeals > 0 ? Math.round((totalCarbs / daysWithMeals) * 10) / 10 : 0,
      averageFatsGrams: daysWithMeals > 0 ? Math.round((totalFats / daysWithMeals) * 10) / 10 : 0,
      waterAdherencePercentage: waterAdherencePct,
    };

    const activity: IClientActivitySummary = {
      activeDaysCount,
      averageSteps: dailyRecords.length > 0 ? Math.round(totalSteps / dailyRecords.length) : 0,
      totalCardioSessions: 0,
      totalCardioMinutes,
      totalCardioDistanceMeters: Math.round(totalCardioDistance),
    };

    // Body weight trend
    const weights = dailyRecords.filter((d) => d.bodyWeightKg !== null).map((d) => d.bodyWeightKg as number);
    let currentWeightKg: number | null = null;
    let weightDeltaKg: number | null = null;
    let weightTrend: 'GAINING' | 'LOSING' | 'MAINTAINING' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';

    if (weights.length >= 2) {
      const baseline = weights[0] ?? 0;
      const latest = weights[weights.length - 1] ?? 0;
      currentWeightKg = latest;
      weightDeltaKg = Math.round((latest - baseline) * 10) / 10;
      if (weightDeltaKg > 0.5) weightTrend = 'GAINING';
      else if (weightDeltaKg < -0.5) weightTrend = 'LOSING';
      else weightTrend = 'MAINTAINING';
    } else if (weights.length === 1) {
      currentWeightKg = weights[0] ?? null;
    }

    const progress: IClientProgressSummary = {
      currentWeightKg,
      weightDeltaKg,
      weightTrend,
      totalPRs: prsAchieved,
      goalsCompleted: 0,
      goalsActive: 1,
    };

    return {
      userId,
      timezone,
      period,
      startDate: startDateStr,
      endDate: endDateStr,
      freshness: 'LIVE',
      lastCalculated: new Date().toISOString(),
      workout,
      nutrition,
      activity,
      progress,
    };
  }

  // -------------------------------------------------------------
  // 2. COACH ANALYTICS (LEVEL 2)
  // -------------------------------------------------------------

  /**
   * Aggregates coach portfolio and client adherence
   */
  async getCoachAnalyticsSummary(
    coachId: string,
    startDateStr: string,
    endDateStr: string,
    period: AnalyticsTimePeriod = '30_DAYS',
  ): Promise<ICoachAnalyticsSummary> {
    // 1. Fetch authorized relationships
    const relationships = await this.prisma.coachClientRelationship.findMany({
      where: {
        coachId,
        isActive: true,
        status: 'ACTIVE',
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const clientIds = relationships.map((r) => r.clientId);

    // Fetch daily records for all assigned clients
    const clientDailyRecords = await this.prisma.analyticsDailyUser.findMany({
      where: {
        userId: { in: clientIds },
        date: { gte: startDateStr, lte: endDateStr },
      },
    });

    const clientAdherenceList: ICoachClientAdherenceItem[] = [];
    let totalCoachWorkoutsPlanned = 0;
    let totalCoachWorkoutsCompleted = 0;
    let totalNutritionScoreSum = 0;
    let clientsWithNutrition = 0;
    let activeClientsCount = 0;

    for (const rel of relationships) {
      const cId = rel.clientId;
      const clientRecords = clientDailyRecords.filter((r) => r.userId === cId);
      const name = rel.client?.profile?.fullName || rel.client?.email || 'Athlete';

      const planned = clientRecords.reduce((acc, r) => acc + r.plannedWorkouts, 0);
      const completed = clientRecords.reduce((acc, r) => acc + r.completedWorkouts, 0);
      const workoutAdherence = this.math.calculatePercentage(completed, planned);

      const mealsLoggedDays = clientRecords.filter((r) => r.mealsLogged > 0);
      const avgNutrition =
        mealsLoggedDays.length > 0
          ? Math.round(
              (mealsLoggedDays.reduce((acc, r) => acc + (r.nutritionAdherenceScore ?? 0), 0) /
                mealsLoggedDays.length) *
                10,
            ) / 10
          : null;

      const hasActivity = clientRecords.some((r) => r.isActiveDay);
      if (hasActivity) {
        activeClientsCount++;
      }

      // Check last active date
      const activeDaysSorted = clientRecords
        .filter((r) => r.isActiveDay)
        .map((r) => r.date)
        .sort();
      const lastActiveDate = activeDaysSorted.length > 0 ? activeDaysSorted[activeDaysSorted.length - 1] : null;

      // Deterministic at-risk signal: no active day in window or workoutAdherence < 50%
      let isAtRisk = false;
      let atRiskReason: string | null = null;
      if (!lastActiveDate) {
        isAtRisk = true;
        atRiskReason = 'No qualifying activity recorded in measurement period';
      } else if (workoutAdherence !== null && workoutAdherence < 50) {
        isAtRisk = true;
        atRiskReason = `Low workout adherence (${workoutAdherence}%)`;
      }

      clientAdherenceList.push({
        clientId: cId,
        clientName: name,
        avatarUrl: rel.client?.profile?.avatarUrl ?? null,
        workoutAdherence,
        nutritionAdherence: avgNutrition,
        lastActiveDate,
        isAtRisk,
        atRiskReason,
      });

      totalCoachWorkoutsPlanned += planned;
      totalCoachWorkoutsCompleted += completed;
      if (avgNutrition !== null) {
        totalNutritionScoreSum += avgNutrition;
        clientsWithNutrition++;
      }
    }

    const overallWorkoutAdherence = this.math.calculatePercentage(
      totalCoachWorkoutsCompleted,
      totalCoachWorkoutsPlanned,
    );
    const overallNutritionAdherence =
      clientsWithNutrition > 0
        ? Math.round((totalNutritionScoreSum / clientsWithNutrition) * 10) / 10
        : null;

    // Messages sent by coach
    const messagesCount = await this.prisma.coachMessage.count({
      where: {
        coachId,
        senderId: coachId,
        createdAt: {
          gte: new Date(`${startDateStr}T00:00:00.000Z`),
          lte: new Date(`${endDateStr}T23:59:59.999Z`),
        },
      },
    });

    const activeProgramsCount = await this.prisma.programAssignment.count({
      where: {
        athleteId: { in: clientIds },
        isActive: true,
      },
    });

    const workload: ICoachWorkloadMetrics = {
      totalAssignedClients: relationships.length,
      activeClientsCount,
      activeProgramsCount,
      messagesSent: messagesCount,
      reviewsPending: 0,
    };

    return {
      coachId,
      period,
      startDate: startDateStr,
      endDate: endDateStr,
      freshness: 'LIVE',
      lastCalculated: new Date().toISOString(),
      workload,
      overallWorkoutAdherence,
      overallNutritionAdherence,
      clientAdherenceList,
    };
  }

  // -------------------------------------------------------------
  // 3. ORGANIZATION & EXECUTIVE ANALYTICS (LEVEL 3)
  // -------------------------------------------------------------

  /**
   * Generates organization executive dashboard overview strictly scoped to organizationId
   */
  async getOrganizationOverview(
    organizationId: string,
    startDateStr: string,
    endDateStr: string,
    period: AnalyticsTimePeriod = '30_DAYS',
    reportingTimezone = 'UTC',
  ): Promise<IOrganizationExecutiveOverview> {
    const totalClientsCount = await this.prisma.user.count({
      where: {
        organizationId,
        role: 'ATHLETE',
        status: 'ACTIVE',
      },
    });

    const totalCoachesCount = await this.prisma.user.count({
      where: {
        organizationId,
        role: { in: ['COACH', 'TRAINER', 'NUTRITIONIST'] },
        status: 'ACTIVE',
      },
    });

    const newClientsCount = await this.prisma.user.count({
      where: {
        organizationId,
        role: 'ATHLETE',
        createdAt: {
          gte: new Date(`${startDateStr}T00:00:00.000Z`),
          lte: new Date(`${endDateStr}T23:59:59.999Z`),
        },
      },
    });

    // Client IDs in this organization
    const orgClients = await this.prisma.user.findMany({
      where: { organizationId, role: 'ATHLETE' },
      select: { id: true },
    });
    const orgClientIds = orgClients.map((c) => c.id);

    // Aggregate daily records
    const orgDailyRecords = await this.prisma.analyticsDailyUser.findMany({
      where: {
        userId: { in: orgClientIds },
        date: { gte: startDateStr, lte: endDateStr },
      },
    });

    // Distinct active clients in period
    const activeClientIds = new Set(
      orgDailyRecords.filter((r) => r.isActiveDay).map((r) => r.userId),
    );
    const activeClientsCount = activeClientIds.size;

    const plannedWorkouts = orgDailyRecords.reduce((acc, r) => acc + r.plannedWorkouts, 0);
    const completedWorkouts = orgDailyRecords.reduce((acc, r) => acc + r.completedWorkouts, 0);
    const orgWorkoutAdherence = this.math.calculatePercentage(completedWorkouts, plannedWorkouts);

    const mealsRecords = orgDailyRecords.filter((r) => r.nutritionAdherenceScore !== null);
    const orgNutritionAdherence =
      mealsRecords.length > 0
        ? Math.round(
            (mealsRecords.reduce((acc, r) => acc + (r.nutritionAdherenceScore ?? 0), 0) /
              mealsRecords.length) *
              10,
          ) / 10
        : null;

    // Average weekly active days per client
    const daysInPeriod =
      Math.max(
        1,
        Math.round(
          (new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ) || 30;
    const totalActiveDaysAllClients = orgDailyRecords.filter((r) => r.isActiveDay).length;
    const avgWeeklyActiveDays =
      totalClientsCount > 0
        ? Math.round(
            (totalActiveDaysAllClients / totalClientsCount / (daysInPeriod / 7)) * 10,
          ) / 10
        : 0;

    const lastCalculated = new Date().toISOString();

    return {
      organizationId,
      reportingTimezone,
      period,
      startDate: startDateStr,
      endDate: endDateStr,
      freshness: 'LIVE',
      lastCalculated,
      totalClients: {
        kpiCode: 'ORG_TOTAL_CLIENTS',
        title: 'Total Clients',
        value: totalClientsCount,
        unit: 'COUNT',
        period,
        freshness: 'LIVE',
        lastCalculated,
      },
      activeClients: {
        kpiCode: 'ORG_ACTIVE_CLIENTS',
        title: 'Active Clients',
        value: activeClientsCount,
        unit: 'COUNT',
        period,
        freshness: 'LIVE',
        lastCalculated,
      },
      workoutAdherence: {
        kpiCode: 'ORG_WORKOUT_ADHERENCE',
        title: 'Workout Adherence',
        value: orgWorkoutAdherence ?? 0,
        unit: 'PERCENTAGE',
        period,
        freshness: 'LIVE',
        lastCalculated,
        insufficientData: orgWorkoutAdherence === null,
      },
      nutritionAdherence: {
        kpiCode: 'ORG_NUTRITION_ADHERENCE',
        title: 'Nutrition Adherence',
        value: orgNutritionAdherence ?? 0,
        unit: 'PERCENTAGE',
        period,
        freshness: 'LIVE',
        lastCalculated,
        insufficientData: orgNutritionAdherence === null,
      },
      averageWeeklyActivityDays: {
        kpiCode: 'ORG_ACTIVITY_DAYS_AVG',
        title: 'Avg Weekly Activity',
        value: avgWeeklyActiveDays,
        unit: 'DAYS',
        period,
        freshness: 'LIVE',
        lastCalculated,
      },
      newClients: {
        kpiCode: 'ORG_NEW_CLIENTS',
        title: 'New Clients',
        value: newClientsCount,
        unit: 'COUNT',
        period,
        freshness: 'LIVE',
        lastCalculated,
      },
      totalCoaches: totalCoachesCount,
      activeCoaches: totalCoachesCount,
    };
  }

  /**
   * Aggregates a single day for a coach into AnalyticsDailyCoach record
   */
  async aggregateCoachDaily(
    coachId: string,
    targetDateStr: string,
    timezone = 'UTC',
  ) {
    const coachUser = await this.prisma.user.findUnique({
      where: { id: coachId },
      select: { organizationId: true },
    });
    const organizationId = coachUser?.organizationId || null;

    const relationships = await this.prisma.coachClientRelationship.findMany({
      where: {
        coachId,
        isActive: true,
        status: 'ACTIVE',
      },
      select: { clientId: true },
    });
    const clientIds = relationships.map((r) => r.clientId);

    let activeClientsCount = 0;
    let clientWorkoutsCompleted = 0;
    let clientMealsLogged = 0;
    let clientAdherenceSum = 0;
    let clientsWithAdherence = 0;

    if (clientIds.length > 0) {
      const dailyRecords = await this.prisma.analyticsDailyUser.findMany({
        where: {
          userId: { in: clientIds },
          date: targetDateStr,
        },
      });

      for (const r of dailyRecords) {
        if (r.isActiveDay) activeClientsCount++;
        clientWorkoutsCompleted += r.completedWorkouts;
        clientMealsLogged += r.mealsLogged;
        if (r.plannedWorkouts > 0) {
          const adh = (r.completedWorkouts / r.plannedWorkouts) * 100;
          clientAdherenceSum += Math.min(100, Math.max(0, adh));
          clientsWithAdherence++;
        }
      }
    }

    const clientAdherenceAverage =
      clientsWithAdherence > 0
        ? Math.round((clientAdherenceSum / clientsWithAdherence) * 10) / 10
        : null;

    const dayStart = new Date(`${targetDateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${targetDateStr}T23:59:59.999Z`);

    const messagesExchanged = await this.prisma.coachMessage.count({
      where: {
        coachId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    });

    const programsAssigned = await this.prisma.programAssignment.count({
      where: {
        athleteId: { in: clientIds },
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    });

    return this.prisma.analyticsDailyCoach.upsert({
      where: {
        coachId_date: {
          coachId,
          date: targetDateStr,
        },
      },
      create: {
        coachId,
        organizationId,
        date: targetDateStr,
        timezone,
        totalAssignedClients: clientIds.length,
        activeClientsCount,
        clientWorkoutsCompleted,
        clientMealsLogged,
        clientAdherenceAverage,
        messagesExchanged,
        programsAssigned,
        mealPlansAssigned: 0,
        reviewsConducted: 0,
      },
      update: {
        organizationId,
        timezone,
        totalAssignedClients: clientIds.length,
        activeClientsCount,
        clientWorkoutsCompleted,
        clientMealsLogged,
        clientAdherenceAverage,
        messagesExchanged,
        programsAssigned,
      },
    });
  }

  /**
   * Aggregates a single day for an organization into AnalyticsDailyOrganization record
   */
  async aggregateOrganizationDaily(
    organizationId: string,
    targetDateStr: string,
    timezone = 'UTC',
  ) {
    const totalClients = await this.prisma.user.count({
      where: { organizationId, role: 'ATHLETE', status: 'ACTIVE' },
    });

    const totalCoaches = await this.prisma.user.count({
      where: { organizationId, role: { in: ['COACH', 'TRAINER', 'NUTRITIONIST'] }, status: 'ACTIVE' },
    });

    const dayStart = new Date(`${targetDateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${targetDateStr}T23:59:59.999Z`);

    const newClients = await this.prisma.user.count({
      where: {
        organizationId,
        role: 'ATHLETE',
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    });

    const orgClients = await this.prisma.user.findMany({
      where: { organizationId, role: 'ATHLETE' },
      select: { id: true },
    });
    const clientIds = orgClients.map((c) => c.id);

    let activeClients = 0;
    let totalWorkoutsCompleted = 0;
    let totalPlannedWorkouts = 0;
    let nutritionAdherenceSum = 0;
    let nutritionRecordsCount = 0;
    let totalStepsRecorded = BigInt(0);

    if (clientIds.length > 0) {
      const clientDailies = await this.prisma.analyticsDailyUser.findMany({
        where: {
          userId: { in: clientIds },
          date: targetDateStr,
        },
      });

      for (const cd of clientDailies) {
        if (cd.isActiveDay) activeClients++;
        totalWorkoutsCompleted += cd.completedWorkouts;
        totalPlannedWorkouts += cd.plannedWorkouts;
        if (cd.nutritionAdherenceScore !== null) {
          nutritionAdherenceSum += cd.nutritionAdherenceScore;
          nutritionRecordsCount++;
        }
        totalStepsRecorded += BigInt(cd.steps);
      }
    }

    const avgWorkoutAdherence = this.math.calculatePercentage(totalWorkoutsCompleted, totalPlannedWorkouts);
    const avgNutritionAdherence =
      nutritionRecordsCount > 0
        ? Math.round((nutritionAdherenceSum / nutritionRecordsCount) * 10) / 10
        : null;

    const messagesCount = await this.prisma.coachMessage.count({
      where: {
        coach: { organizationId },
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    });

    return this.prisma.analyticsDailyOrganization.upsert({
      where: {
        organizationId_date: {
          organizationId,
          date: targetDateStr,
        },
      },
      create: {
        organizationId,
        date: targetDateStr,
        timezone,
        totalClients,
        activeClients,
        newClients,
        churnedClients: 0,
        totalCoaches,
        activeCoaches: totalCoaches,
        totalWorkoutsCompleted,
        avgWorkoutAdherence,
        avgNutritionAdherence,
        totalStepsRecorded,
        messagesCount,
      },
      update: {
        timezone,
        totalClients,
        activeClients,
        newClients,
        totalCoaches,
        activeCoaches: totalCoaches,
        totalWorkoutsCompleted,
        avgWorkoutAdherence,
        avgNutritionAdherence,
        totalStepsRecorded,
        messagesCount,
      },
    });
  }
}

