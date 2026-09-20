import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface IQualityViolation {
  table: string;
  recordId: string;
  field: string;
  value: any;
  rule: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface IQualityAuditReport {
  timestamp: string;
  recordsAudited: number;
  violationsCount: number;
  criticalCount: number;
  warningCount: number;
  passed: boolean;
  violations: IQualityViolation[];
}

@Injectable()
export class AnalyticsQualityService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Performs an automated data quality audit across aggregated daily tables
   */
  async runAudit(lookbackDays = 30): Promise<IQualityAuditReport> {
    const violations: IQualityViolation[] = [];
    let recordsAudited = 0;

    const lookbackStart = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0] ?? '';

    // 1. Audit AnalyticsDailyUser
    const userDailies = await this.prisma.analyticsDailyUser.findMany({
      where: { date: { gte: lookbackStart } },
      take: 500,
    });
    recordsAudited += userDailies.length;

    for (const record of userDailies) {
      // Rule 1: No negative counts
      if (record.plannedWorkouts < 0) {
        violations.push({
          table: 'analytics_daily_users',
          recordId: record.id,
          field: 'plannedWorkouts',
          value: record.plannedWorkouts,
          rule: 'COUNT_CANNOT_BE_NEGATIVE',
          severity: 'CRITICAL',
        });
      }
      if (record.completedWorkouts < 0) {
        violations.push({
          table: 'analytics_daily_users',
          recordId: record.id,
          field: 'completedWorkouts',
          value: record.completedWorkouts,
          rule: 'COUNT_CANNOT_BE_NEGATIVE',
          severity: 'CRITICAL',
        });
      }
      if (record.workoutVolumeKg < 0) {
        violations.push({
          table: 'analytics_daily_users',
          recordId: record.id,
          field: 'workoutVolumeKg',
          value: record.workoutVolumeKg,
          rule: 'VOLUME_CANNOT_BE_NEGATIVE',
          severity: 'CRITICAL',
        });
      }
      if (record.steps < 0) {
        violations.push({
          table: 'analytics_daily_users',
          recordId: record.id,
          field: 'steps',
          value: record.steps,
          rule: 'STEPS_CANNOT_BE_NEGATIVE',
          severity: 'CRITICAL',
        });
      }

      // Rule 2: Adherence scores strictly between 0 and 100
      if (record.nutritionAdherenceScore !== null) {
        if (record.nutritionAdherenceScore < 0 || record.nutritionAdherenceScore > 100) {
          violations.push({
            table: 'analytics_daily_users',
            recordId: record.id,
            field: 'nutritionAdherenceScore',
            value: record.nutritionAdherenceScore,
            rule: 'PERCENTAGE_OUT_OF_BOUNDS',
            severity: 'CRITICAL',
          });
        }
      }

      // Rule 3: Valid Date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
        violations.push({
          table: 'analytics_daily_users',
          recordId: record.id,
          field: 'date',
          value: record.date,
          rule: 'INVALID_DATE_FORMAT',
          severity: 'CRITICAL',
        });
      }

      // Rule 4: Active day requires at least one qualifying event
      if (record.isActiveDay && record.qualifyingEventsCount === 0) {
        violations.push({
          table: 'analytics_daily_users',
          recordId: record.id,
          field: 'isActiveDay',
          value: record.isActiveDay,
          rule: 'ACTIVE_DAY_WITHOUT_QUALIFYING_EVENTS',
          severity: 'WARNING',
        });
      }
    }

    // 2. Audit AnalyticsDailyCoach
    const coachDailies = await this.prisma.analyticsDailyCoach.findMany({
      where: { date: { gte: lookbackStart } },
      take: 200,
    });
    recordsAudited += coachDailies.length;

    for (const record of coachDailies) {
      if (record.totalAssignedClients < 0 || record.activeClientsCount < 0) {
        violations.push({
          table: 'analytics_daily_coaches',
          recordId: record.id,
          field: 'clientsCount',
          value: { assigned: record.totalAssignedClients, active: record.activeClientsCount },
          rule: 'COUNT_CANNOT_BE_NEGATIVE',
          severity: 'CRITICAL',
        });
      }
      if (record.clientAdherenceAverage !== null) {
        if (record.clientAdherenceAverage < 0 || record.clientAdherenceAverage > 100) {
          violations.push({
            table: 'analytics_daily_coaches',
            recordId: record.id,
            field: 'clientAdherenceAverage',
            value: record.clientAdherenceAverage,
            rule: 'PERCENTAGE_OUT_OF_BOUNDS',
            severity: 'CRITICAL',
          });
        }
      }
    }

    // 3. Audit AnalyticsDailyOrganization
    const orgDailies = await this.prisma.analyticsDailyOrganization.findMany({
      where: { date: { gte: lookbackStart } },
      take: 200,
    });
    recordsAudited += orgDailies.length;

    for (const record of orgDailies) {
      if (record.totalClients < 0 || record.activeClients < 0 || record.newClients < 0) {
        violations.push({
          table: 'analytics_daily_organizations',
          recordId: record.id,
          field: 'clientCounts',
          value: { total: record.totalClients, active: record.activeClients, new: record.newClients },
          rule: 'COUNT_CANNOT_BE_NEGATIVE',
          severity: 'CRITICAL',
        });
      }
      if (record.avgWorkoutAdherence !== null) {
        if (record.avgWorkoutAdherence < 0 || record.avgWorkoutAdherence > 100) {
          violations.push({
            table: 'analytics_daily_organizations',
            recordId: record.id,
            field: 'avgWorkoutAdherence',
            value: record.avgWorkoutAdherence,
            rule: 'PERCENTAGE_OUT_OF_BOUNDS',
            severity: 'CRITICAL',
          });
        }
      }
      if (record.avgNutritionAdherence !== null) {
        if (record.avgNutritionAdherence < 0 || record.avgNutritionAdherence > 100) {
          violations.push({
            table: 'analytics_daily_organizations',
            recordId: record.id,
            field: 'avgNutritionAdherence',
            value: record.avgNutritionAdherence,
            rule: 'PERCENTAGE_OUT_OF_BOUNDS',
            severity: 'CRITICAL',
          });
        }
      }
    }

    const criticalCount = violations.filter((v) => v.severity === 'CRITICAL').length;
    const warningCount = violations.filter((v) => v.severity === 'WARNING').length;

    return {
      timestamp: new Date().toISOString(),
      recordsAudited,
      violationsCount: violations.length,
      criticalCount,
      warningCount,
      passed: criticalCount === 0,
      violations,
    };
  }
}
