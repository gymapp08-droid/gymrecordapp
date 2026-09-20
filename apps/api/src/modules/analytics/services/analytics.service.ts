import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import { AnalyticsMathService } from './analytics-math.service';
import { AnalyticsCacheService } from './analytics-cache.service';
import {
  IClientAnalyticsSummary,
  ICoachAnalyticsSummary,
  IOrganizationExecutiveOverview,
  AnalyticsTimePeriod,
} from '@alpha/types';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregation: AnalyticsAggregationService,
    private readonly math: AnalyticsMathService,
    private readonly cache: AnalyticsCacheService,
  ) {}

  /**
   * Helper to resolve start and end dates from period enum or custom query
   */
  resolveDateRange(
    period: AnalyticsTimePeriod = '30_DAYS',
    customStart?: string,
    customEnd?: string,
    timezone = 'UTC',
  ): { startDate: string; endDate: string; previousStartDate: string; previousEndDate: string } {
    const now = new Date();
    const todayStr = this.aggregation.formatDateInTimezone(now, timezone);

    if (period === 'CUSTOM') {
      if (!customStart || !customEnd) {
        throw new BadRequestException('CUSTOM period requires both startDate and endDate query parameters');
      }
      const durationMs = new Date(customEnd).getTime() - new Date(customStart).getTime();
      const prevEnd = new Date(new Date(customStart).getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);
      return {
        startDate: customStart,
        endDate: customEnd,
        previousStartDate: this.aggregation.formatDateInTimezone(prevStart, timezone),
        previousEndDate: this.aggregation.formatDateInTimezone(prevEnd, timezone),
      };
    }

    let days = 30;
    switch (period) {
      case 'TODAY':
        days = 1;
        break;
      case '7_DAYS':
        days = 7;
        break;
      case '30_DAYS':
        days = 30;
        break;
      case '90_DAYS':
        days = 90;
        break;
      case '6_MONTHS':
        days = 180;
        break;
      case '12_MONTHS':
        days = 365;
        break;
      default:
        days = 30;
    }

    const currentStart = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const prevEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
    const prevStart = new Date(prevEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    return {
      startDate: this.aggregation.formatDateInTimezone(currentStart, timezone),
      endDate: todayStr,
      previousStartDate: this.aggregation.formatDateInTimezone(prevStart, timezone),
      previousEndDate: this.aggregation.formatDateInTimezone(prevEnd, timezone),
    };
  }

  // -------------------------------------------------------------
  // LEVEL 1: CLIENT ANALYTICS
  // -------------------------------------------------------------

  async getClientOverview(
    userId: string,
    period: AnalyticsTimePeriod = '30_DAYS',
    customStart?: string,
    customEnd?: string,
    timezone = 'UTC',
  ): Promise<IClientAnalyticsSummary> {
    const range = this.resolveDateRange(period, customStart, customEnd, timezone);
    const cacheKey = this.cache.generateKey('client', userId, `${period}_${range.startDate}_${range.endDate}`, timezone);

    const cached = await this.cache.get<IClientAnalyticsSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    // Aggregate today if requested to ensure freshness
    await this.aggregation.aggregateClientDaily(userId, range.endDate, timezone);

    const result = await this.aggregation.getClientAnalyticsSummary(
      userId,
      range.startDate,
      range.endDate,
      period,
      timezone,
    );

    await this.cache.set(cacheKey, result, 300, [`user:${userId}`]);
    return result;
  }

  async getClientTrends(
    userId: string,
    period: AnalyticsTimePeriod = '30_DAYS',
    customStart?: string,
    customEnd?: string,
    timezone = 'UTC',
  ) {
    const range = this.resolveDateRange(period, customStart, customEnd, timezone);

    const records = await this.prisma.analyticsDailyUser.findMany({
      where: {
        userId,
        date: { gte: range.startDate, lte: range.endDate },
      },
      orderBy: { date: 'asc' },
    });

    const dates = records.map((r) => r.date);
    const volumeKg = records.map((r) => r.workoutVolumeKg);
    const calories = records.map((r) => r.caloriesConsumed);
    const steps = records.map((r) => r.steps);
    const weights = records.map((r) => ({ date: r.date, weightKg: r.bodyWeightKg })).filter((w) => w.weightKg !== null);

    return {
      userId,
      period,
      startDate: range.startDate,
      endDate: range.endDate,
      dataPointsCount: records.length,
      trendSeries: {
        dates,
        volumeKg,
        calories,
        steps,
        weights,
      },
    };
  }

  // -------------------------------------------------------------
  // LEVEL 2: COACH ANALYTICS
  // -------------------------------------------------------------

  async getCoachOverview(
    coachId: string,
    period: AnalyticsTimePeriod = '30_DAYS',
    customStart?: string,
    customEnd?: string,
    timezone = 'UTC',
  ): Promise<ICoachAnalyticsSummary> {
    const range = this.resolveDateRange(period, customStart, customEnd, timezone);
    const cacheKey = this.cache.generateKey('coach', coachId, `${period}_${range.startDate}_${range.endDate}`, timezone);

    const cached = await this.cache.get<ICoachAnalyticsSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.aggregation.getCoachAnalyticsSummary(
      coachId,
      range.startDate,
      range.endDate,
      period,
    );

    await this.cache.set(cacheKey, result, 300, [`coach:${coachId}`]);
    return result;
  }

  async getCoachClients(
    coachId: string,
    period: AnalyticsTimePeriod = '30_DAYS',
    customStart?: string,
    customEnd?: string,
    timezone = 'UTC',
  ) {
    const summary = await this.getCoachOverview(coachId, period, customStart, customEnd, timezone);
    return {
      coachId,
      period,
      totalClients: summary.clientAdherenceList.length,
      clients: summary.clientAdherenceList,
    };
  }

  async getCoachPrograms(coachId: string) {
    const programs = await this.prisma.program.findMany({
      where: { creatorId: coachId },
      include: {
        assignments: {
          select: {
            id: true,
            athleteId: true,
            isActive: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return programs.map((p) => {
      const activeAssignments = p.assignments.filter((a) => a.isActive).length;
      return {
        programId: p.id,
        title: p.name,
        status: p.status,
        totalAssignments: p.assignments.length,
        activeAssignments,
      };
    });
  }

  // -------------------------------------------------------------
  // LEVEL 3: ORGANIZATION ANALYTICS
  // -------------------------------------------------------------

  async getOrganizationOverview(
    organizationId: string,
    period: AnalyticsTimePeriod = '30_DAYS',
    customStart?: string,
    customEnd?: string,
    reportingTimezone = 'UTC',
  ): Promise<IOrganizationExecutiveOverview> {
    const range = this.resolveDateRange(period, customStart, customEnd, reportingTimezone);
    const cacheKey = this.cache.generateKey('organization', organizationId, `${period}_${range.startDate}_${range.endDate}`, reportingTimezone);

    const cached = await this.cache.get<IOrganizationExecutiveOverview>(cacheKey);
    if (cached) {
      return cached;
    }

    const currentOverview = await this.aggregation.getOrganizationOverview(
      organizationId,
      range.startDate,
      range.endDate,
      period,
      reportingTimezone,
    );

    const prevOverview = await this.aggregation.getOrganizationOverview(
      organizationId,
      range.previousStartDate,
      range.previousEndDate,
      period,
      reportingTimezone,
    );

    // Compute period comparisons with strict percentage point vs relative change distinction
    currentOverview.totalClients.comparison = this.math.comparePeriods(
      currentOverview.totalClients.value,
      prevOverview.totalClients.value,
      false,
    );

    currentOverview.activeClients.comparison = this.math.comparePeriods(
      currentOverview.activeClients.value,
      prevOverview.activeClients.value,
      false,
    );

    currentOverview.workoutAdherence.comparison = this.math.comparePeriods(
      currentOverview.workoutAdherence.value,
      prevOverview.workoutAdherence.value,
      true, // isRateOrPercentage
    );

    currentOverview.nutritionAdherence.comparison = this.math.comparePeriods(
      currentOverview.nutritionAdherence.value,
      prevOverview.nutritionAdherence.value,
      true, // isRateOrPercentage
    );

    currentOverview.newClients.comparison = this.math.comparePeriods(
      currentOverview.newClients.value,
      prevOverview.newClients.value,
      false,
    );

    await this.cache.set(cacheKey, currentOverview, 300, [`org:${organizationId}`]);
    return currentOverview;
  }

  async getOrganizationTrends(
    organizationId: string,
    period: AnalyticsTimePeriod = '30_DAYS',
    customStart?: string,
    customEnd?: string,
    reportingTimezone = 'UTC',
  ) {
    const range = this.resolveDateRange(period, customStart, customEnd, reportingTimezone);

    const orgClients = await this.prisma.user.findMany({
      where: { organizationId, role: 'ATHLETE' },
      select: { id: true },
    });
    const clientIds = orgClients.map((c) => c.id);

    const dailyRecords = await this.prisma.analyticsDailyUser.findMany({
      where: {
        userId: { in: clientIds },
        date: { gte: range.startDate, lte: range.endDate },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, { workouts: number; volumeKg: number; steps: number; activeClients: Set<string> }>();

    for (const r of dailyRecords) {
      const existing = dateMap.get(r.date) || { workouts: 0, volumeKg: 0, steps: 0, activeClients: new Set<string>() };
      existing.workouts += r.completedWorkouts;
      existing.volumeKg += r.workoutVolumeKg;
      existing.steps += r.steps;
      if (r.isActiveDay) existing.activeClients.add(r.userId);
      dateMap.set(r.date, existing);
    }

    const series = Array.from(dateMap.entries()).map(([date, d]) => ({
      date,
      workoutsCompleted: d.workouts,
      volumeKg: Math.round(d.volumeKg),
      totalSteps: d.steps,
      activeClientsCount: d.activeClients.size,
    }));

    return {
      organizationId,
      period,
      startDate: range.startDate,
      endDate: range.endDate,
      series,
    };
  }

  async getOrganizationCoaches(organizationId: string) {
    const coaches = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['COACH', 'TRAINER', 'NUTRITIONIST'] },
      },
      include: {
        profile: {
          select: { fullName: true, avatarUrl: true },
        },
        clientsAsCoach: {
          where: { isActive: true },
          select: { clientId: true },
        },
      },
    });

    return coaches.map((coach) => ({
      coachId: coach.id,
      name: coach.profile?.fullName || coach.email,
      role: coach.role,
      activeClientsCount: coach.clientsAsCoach.length,
      avatarUrl: coach.profile?.avatarUrl ?? null,
    }));
  }
}
