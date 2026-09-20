import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../queue/services/queue.service';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import { AnalyticsCacheService } from './analytics-cache.service';
import { PrismaService } from '../../database/prisma.service';
import {
  IDailyAnalyticsJobPayload,
  IWeeklyAnalyticsJobPayload,
  IClientSummaryRefreshJobPayload,
  IOrganizationSummaryRefreshJobPayload,
  IJobRecord,
} from '@alpha/types';

@Injectable()
export class AnalyticsWorkerHandlerService {
  private readonly logger = new Logger(AnalyticsWorkerHandlerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly aggregation: AnalyticsAggregationService,
    private readonly cache: AnalyticsCacheService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Dispatches a daily analytics aggregation job to the background queue
   */
  async enqueueDailyAggregation(payload: IDailyAnalyticsJobPayload = {}) {
    const today = new Date().toISOString().split('T')[0] || '';
    const targetDate = payload.date ? payload.date : today;
    const idempotencyKey = `job_daily_agg_${targetDate}_${payload.targetUserId || 'all'}_${payload.targetOrgId || 'all'}`;

    return this.queueService.addJob<IDailyAnalyticsJobPayload>(
      'DAILY_ANALYTICS_AGGREGATION',
      `Daily Analytics Aggregation: ${targetDate}`,
      { ...payload, date: targetDate },
      { idempotencyKey, maxAttempts: 3, backoffMs: 2000 },
    );
  }

  /**
   * Dispatches a weekly analytics aggregation job to the background queue
   */
  async enqueueWeeklyAggregation(payload: IWeeklyAnalyticsJobPayload = {}) {
    const today = new Date().toISOString().split('T')[0] || '';
    const idempotencyKey = `job_weekly_agg_${payload.weekEndDate || today}_${payload.targetOrgId || 'all'}`;

    return this.queueService.addJob<IWeeklyAnalyticsJobPayload>(
      'WEEKLY_ANALYTICS_AGGREGATION',
      `Weekly Analytics Aggregation: ${payload.weekEndDate || today}`,
      payload,
      { idempotencyKey, maxAttempts: 3, backoffMs: 2000 },
    );
  }

  /**
   * Dispatches client summary refresh job
   */
  async enqueueClientSummaryRefresh(payload: IClientSummaryRefreshJobPayload) {
    const idempotencyKey = `job_client_refresh_${payload.userId}_${Date.now()}`;
    return this.queueService.addJob<IClientSummaryRefreshJobPayload>(
      'CLIENT_SUMMARY_REFRESH',
      `Client Summary Refresh: ${payload.userId}`,
      payload,
      { idempotencyKey, maxAttempts: 2 },
    );
  }

  /**
   * Dispatches organization summary refresh job
   */
  async enqueueOrganizationSummaryRefresh(payload: IOrganizationSummaryRefreshJobPayload) {
    const idempotencyKey = `job_org_refresh_${payload.organizationId}_${Date.now()}`;
    return this.queueService.addJob<IOrganizationSummaryRefreshJobPayload>(
      'ORGANIZATION_SUMMARY_REFRESH',
      `Organization Summary Refresh: ${payload.organizationId}`,
      payload,
      { idempotencyKey, maxAttempts: 2 },
    );
  }

  /**
   * Handler for DAILY_ANALYTICS_AGGREGATION
   */
  async handleDailyAggregation(job: IJobRecord<IDailyAnalyticsJobPayload>) {
    const today = new Date().toISOString().split('T')[0] || '';
    const targetDate = job.data.date ? job.data.date : today;
    this.logger.log(`Processing DAILY_ANALYTICS_AGGREGATION for date: ${targetDate}`);

    let userIds: string[] = [];
    if (job.data.targetUserId) {
      userIds = [job.data.targetUserId];
    } else {
      const activeUsers = await this.prisma.user.findMany({
        where: { role: 'ATHLETE', status: 'ACTIVE' },
        select: { id: true },
      });
      userIds = activeUsers.map((u) => u.id);
    }

    // 1. Process client aggregates
    for (const userId of userIds) {
      await this.aggregation.aggregateClientDaily(userId, targetDate);
      await this.cache.invalidateTag(`user:${userId}`);
    }

    // 2. Process coach aggregates
    const activeCoaches = await this.prisma.user.findMany({
      where: { role: { in: ['COACH', 'TRAINER', 'NUTRITIONIST'] }, status: 'ACTIVE' },
      select: { id: true },
    });
    for (const coach of activeCoaches) {
      await this.aggregation.aggregateCoachDaily(coach.id, targetDate);
      await this.cache.invalidateTag(`coach:${coach.id}`);
    }

    // 3. Process organization aggregates
    const orgs = await this.prisma.organization.findMany({
      select: { id: true },
    });
    for (const org of orgs) {
      await this.aggregation.aggregateOrganizationDaily(org.id, targetDate);
      await this.cache.invalidateTag(`org:${org.id}`);
    }

    return { success: true, processedUsers: userIds.length, targetDate };
  }

  /**
   * Handler for WEEKLY_ANALYTICS_AGGREGATION
   */
  async handleWeeklyAggregation(job: IJobRecord<IWeeklyAnalyticsJobPayload>) {
    this.logger.log(`Processing WEEKLY_ANALYTICS_AGGREGATION for: ${job.data.weekEndDate}`);
    // Invalidates cached weekly views across scopes
    await this.cache.clear();
    return { success: true, clearedCache: true };
  }

  /**
   * Handler for CLIENT_SUMMARY_REFRESH
   */
  async handleClientSummaryRefresh(job: IJobRecord<IClientSummaryRefreshJobPayload>) {
    const { userId, invalidateCache } = job.data;
    if (invalidateCache !== false) {
      await this.cache.invalidateTag(`user:${userId}`);
    }
    const today = new Date().toISOString().split('T')[0] ?? '';
    await this.aggregation.aggregateClientDaily(userId, today);
    return { success: true, userId };
  }

  /**
   * Handler for ORGANIZATION_SUMMARY_REFRESH
   */
  async handleOrganizationSummaryRefresh(job: IJobRecord<IOrganizationSummaryRefreshJobPayload>) {
    const { organizationId, invalidateCache } = job.data;
    if (invalidateCache !== false) {
      await this.cache.invalidateTag(`org:${organizationId}`);
    }
    const today = new Date().toISOString().split('T')[0] ?? '';
    await this.aggregation.aggregateOrganizationDaily(organizationId, today);
    return { success: true, organizationId };
  }
}
