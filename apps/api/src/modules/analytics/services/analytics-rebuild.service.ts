import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import { AnalyticsCacheService } from './analytics-cache.service';

export interface IRebuildOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  userId?: string;
  coachId?: string;
  organizationId?: string;
  timezone?: string;
}

export interface IRebuildResult {
  jobRunId: string;
  status: 'COMPLETED' | 'FAILED';
  recordsProcessed: number;
  durationMs: number;
  startDate: string;
  endDate: string;
  errorMessage?: string;
}

@Injectable()
export class AnalyticsRebuildService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregation: AnalyticsAggregationService,
    private readonly cache: AnalyticsCacheService,
  ) {}

  /**
   * Helper to generate array of date strings between start and end inclusive
   */
  getDateRangeList(startStr: string, endStr: string): string[] {
    const dates: string[] = [];
    const current = new Date(startStr + 'T00:00:00.000Z');
    const end = new Date(endStr + 'T00:00:00.000Z');

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0] ?? '');
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
   * Idempotent rebuild of client daily aggregates over a historical range
   */
  async rebuildClientHistory(options: IRebuildOptions): Promise<IRebuildResult> {
    const startTime = Date.now();
    const dateList = this.getDateRangeList(options.startDate, options.endDate);
    const timezone = options.timezone || 'UTC';

    // Track job run
    const jobRun = await this.prisma.analyticsJobRun.create({
      data: {
        jobType: 'CLIENT_HISTORY_REBUILD',
        scope: options.userId ? 'CLIENT' : 'ALL_CLIENTS',
        targetId: options.userId || null,
        periodStart: new Date(options.startDate + 'T00:00:00.000Z'),
        periodEnd: new Date(options.endDate + 'T23:59:59.999Z'),
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    try {
      // Find target users
      let users: { id: string }[] = [];
      if (options.userId) {
        users = [{ id: options.userId }];
      } else {
        users = await this.prisma.user.findMany({
          where: { role: 'ATHLETE', status: 'ACTIVE' },
          select: { id: true },
        });
      }

      let recordsProcessed = 0;
      for (const u of users) {
        for (const dateStr of dateList) {
          await this.aggregation.aggregateClientDaily(u.id, dateStr, timezone);
          recordsProcessed++;
        }
        await this.cache.invalidateTag('user:' + u.id);
      }

      const durationMs = Date.now() - startTime;
      await this.prisma.analyticsJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: 'COMPLETED',
          recordsProcessed,
          durationMs,
          completedAt: new Date(),
        },
      });

      return {
        jobRunId: jobRun.id,
        status: 'COMPLETED',
        recordsProcessed,
        durationMs,
        startDate: options.startDate,
        endDate: options.endDate,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = (err as Error).message;
      await this.prisma.analyticsJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: 'FAILED',
          durationMs,
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });

      return {
        jobRunId: jobRun.id,
        status: 'FAILED',
        recordsProcessed: 0,
        durationMs,
        startDate: options.startDate,
        endDate: options.endDate,
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * Idempotent rebuild of organization and coach aggregates over a historical range
   */
  async rebuildOrganizationHistory(options: IRebuildOptions): Promise<IRebuildResult> {
    const startTime = Date.now();
    const dateList = this.getDateRangeList(options.startDate, options.endDate);
    const timezone = options.timezone || 'UTC';

    const jobRun = await this.prisma.analyticsJobRun.create({
      data: {
        jobType: 'ORGANIZATION_HISTORY_REBUILD',
        scope: options.organizationId ? 'ORGANIZATION' : 'ALL_ORGS',
        targetId: options.organizationId || null,
        periodStart: new Date(options.startDate + 'T00:00:00.000Z'),
        periodEnd: new Date(options.endDate + 'T23:59:59.999Z'),
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    try {
      let orgs: { id: string }[] = [];
      if (options.organizationId) {
        orgs = [{ id: options.organizationId }];
      } else {
        orgs = await this.prisma.organization.findMany({
          select: { id: true },
        });
      }

      let recordsProcessed = 0;
      for (const org of orgs) {
        // Find coaches in org
        const coaches = await this.prisma.user.findMany({
          where: {
            organizationId: org.id,
            role: { in: ['COACH', 'TRAINER', 'NUTRITIONIST'] },
          },
          select: { id: true },
        });

        for (const dateStr of dateList) {
          // Aggregate each coach daily
          for (const coach of coaches) {
            await this.aggregation.aggregateCoachDaily(coach.id, dateStr, timezone);
            recordsProcessed++;
          }
          // Aggregate org daily
          await this.aggregation.aggregateOrganizationDaily(org.id, dateStr, timezone);
          recordsProcessed++;
        }

        await this.cache.invalidateTag('org:' + org.id);
      }

      const durationMs = Date.now() - startTime;
      await this.prisma.analyticsJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: 'COMPLETED',
          recordsProcessed,
          durationMs,
          completedAt: new Date(),
        },
      });

      return {
        jobRunId: jobRun.id,
        status: 'COMPLETED',
        recordsProcessed,
        durationMs,
        startDate: options.startDate,
        endDate: options.endDate,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = (err as Error).message;
      await this.prisma.analyticsJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: 'FAILED',
          durationMs,
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });

      return {
        jobRunId: jobRun.id,
        status: 'FAILED',
        recordsProcessed: 0,
        durationMs,
        startDate: options.startDate,
        endDate: options.endDate,
        errorMessage: errorMsg,
      };
    }
  }
}
