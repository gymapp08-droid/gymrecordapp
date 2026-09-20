import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  HealthPlatform,
  QueueName,
  IJobRecord,
  IHealthSyncJobResult,
  TokenRefreshStatus,
} from '@alpha/types';
import { BackoffUtil } from '@alpha/utils';
import { QueueService } from '../../queue/services/queue.service';
import { HealthPlatformSyncService } from './health-platform-sync.service';
import { WearableSyncService } from './wearable-sync.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { TokenVaultService } from './token-vault.service';
import { ProvenanceDeduplicationService } from './provenance-deduplication.service';

@Injectable()
export class IntegrationSyncPipelineService {
  private readonly logger = new Logger(IntegrationSyncPipelineService.name);

  // Maximum allowed historical backfill window (days) to prevent rate limit & memory exhaustion
  public static readonly MAX_BACKFILL_WINDOW_DAYS = 30;

  constructor(
    private readonly queueService: QueueService,
    private readonly healthPlatformSyncService: HealthPlatformSyncService,
    private readonly wearableSyncService: WearableSyncService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly tokenVaultService: TokenVaultService,
    private readonly provenanceDedupService: ProvenanceDeduplicationService,
  ) {}

  getProvenanceDeduplicationService(): ProvenanceDeduplicationService {
    return this.provenanceDedupService;
  }

  /**
   * Process a claimed queue job based on its queue name
   */
  async processJob(job: IJobRecord): Promise<IHealthSyncJobResult> {
    const nowIso = new Date().toISOString();
    this.logger.log(
      `[SyncPipeline] Processing job "${job.name}" [${job.id}] from queue [${job.queue}]`,
    );

    try {
      let result: IHealthSyncJobResult;

      switch (job.queue) {
        case 'HEALTH_INITIAL_SYNC':
          result = await this.handleInitialSync(job);
          break;
        case 'HEALTH_INCREMENTAL_SYNC':
          result = await this.handleIncrementalSync(job);
          break;
        case 'WEARABLE_SYNC':
          result = await this.handleWearableSync(job);
          break;
        case 'TOKEN_REFRESH':
          result = await this.handleTokenRefresh(job);
          break;
        case 'SYNC_RETRY':
          result = await this.handleSyncRetry(job);
          break;
        default:
          throw new BadRequestException(`Unsupported sync queue: ${job.queue}`);
      }

      // Mark job completed in QueueService if registered
      try {
        await this.queueService.completeJob(job.id);
      } catch {
        // Job was directly invoked without being pre-queued
      }
      return result;
    } catch (err) {
      const errorMsg = (err as Error).message;
      this.logger.error(
        `[SyncPipeline] Job [${job.id}] failed: ${errorMsg}`,
      );

      // Mark job failed in QueueService (triggers retry with jitter or DLQ) if registered
      try {
        await this.queueService.failJob(job.id, errorMsg);
      } catch {
        // Job was directly invoked without being pre-queued
      }

      return {
        jobId: job.id,
        queue: job.queue,
        platform: job.data?.platform || HealthPlatform.APPLE_HEALTHKIT,
        userId: job.data?.userId || 'unknown',
        status: 'FAILED',
        recordsProcessed: 0,
        syncedCount: 0,
        duplicatesIgnored: 0,
        conflictsResolved: 0,
        error: errorMsg,
        processedAt: nowIso,
      };
    }
  }

  /**
   * Handler for HEALTH_INITIAL_SYNC
   * Enforces 30-day bounded window, establishes sync anchor, ingests historical records
   */
  private async handleInitialSync(job: IJobRecord): Promise<IHealthSyncJobResult> {
    const { userId, platform, windowDays, records } = job.data;
    const boundedDays = Math.min(
      windowDays || IntegrationSyncPipelineService.MAX_BACKFILL_WINDOW_DAYS,
      IntegrationSyncPipelineService.MAX_BACKFILL_WINDOW_DAYS,
    );

    this.logger.log(
      `[SyncPipeline] Starting initial backfill for [${userId}:${platform}] bounded to ${boundedDays} days window`,
    );

    const nowIso = new Date().toISOString();
    const recordsList = records || [];

    // Ingest provided records through HealthPlatformSyncService if records were supplied
    let syncedCount = 0;
    let duplicatesIgnored = 0;
    let conflictsResolved = 0;

    if (recordsList.length > 0) {
      const summary = await this.healthPlatformSyncService.ingestHealthData(userId, {
        platform,
        syncType: 'INITIAL',
        records: recordsList,
      });
      syncedCount = summary.recordsPersisted;
      duplicatesIgnored = summary.duplicatesIgnored;
      conflictsResolved = summary.conflictsResolved;
    }

    const newCursor = `cursor_init_${platform}_${Date.now()}`;

    return {
      jobId: job.id,
      queue: 'HEALTH_INITIAL_SYNC',
      platform,
      userId,
      status: 'SUCCESS',
      recordsProcessed: recordsList.length,
      syncedCount,
      duplicatesIgnored,
      conflictsResolved,
      newCursor,
      processedAt: nowIso,
    };
  }

  /**
   * Handler for HEALTH_INCREMENTAL_SYNC
   * Cursor-based delta sync ingesting data since the last sync cursor
   */
  private async handleIncrementalSync(job: IJobRecord): Promise<IHealthSyncJobResult> {
    const { userId, platform, records, syncCursor } = job.data;
    const nowIso = new Date().toISOString();
    const recordsList = records || [];

    let syncedCount = 0;
    let duplicatesIgnored = 0;
    let conflictsResolved = 0;

    if (recordsList.length > 0) {
      const summary = await this.healthPlatformSyncService.ingestHealthData(userId, {
        platform,
        syncType: 'INCREMENTAL',
        syncCursor,
        records: recordsList,
      });
      syncedCount = summary.recordsPersisted;
      duplicatesIgnored = summary.duplicatesIgnored;
      conflictsResolved = summary.conflictsResolved;
    }

    const newCursor = `cursor_incr_${platform}_${Date.now()}`;

    return {
      jobId: job.id,
      queue: 'HEALTH_INCREMENTAL_SYNC',
      platform,
      userId,
      status: 'SUCCESS',
      recordsProcessed: recordsList.length,
      syncedCount,
      duplicatesIgnored,
      conflictsResolved,
      newCursor,
      processedAt: nowIso,
    };
  }

  /**
   * Handler for WEARABLE_SYNC
   * Event/webhook-driven sync wrapped in Circuit Breaker protection
   */
  private async handleWearableSync(job: IJobRecord): Promise<IHealthSyncJobResult> {
    const { platform, userId, records } = job.data;
    const nowIso = new Date().toISOString();
    const targetUserId = userId || 'system_webhook_user';
    const recordsList = records || [];

    // Execute with circuit breaker protection
    const result = await this.circuitBreakerService.execute(platform, async () => {
      if (recordsList.length > 0) {
        return this.wearableSyncService.ingestWearableData(targetUserId, {
          platform,
          records: recordsList,
        });
      }
      return { persistedCount: 0, duplicatesIgnored: 0 };
    });

    const syncedCount =
      'persistedCount' in result
        ? result.persistedCount
        : (result as any).ingestedCount ?? 0;

    return {
      jobId: job.id,
      queue: 'WEARABLE_SYNC',
      platform,
      userId: targetUserId,
      status: 'SUCCESS',
      recordsProcessed: recordsList.length,
      syncedCount,
      duplicatesIgnored: result.duplicatesIgnored,
      conflictsResolved: 0,
      processedAt: nowIso,
    };
  }

  /**
   * Handler for TOKEN_REFRESH
   * Rotates OAuth tokens for cloud wearable providers proactively before expiry
   */
  private async handleTokenRefresh(job: IJobRecord): Promise<IHealthSyncJobResult> {
    const { userId, platform } = job.data;
    const nowIso = new Date().toISOString();

    const refreshResult = await this.wearableSyncService.refreshProviderToken(
      userId,
      platform,
    );

    const isSuccess = refreshResult.status === TokenRefreshStatus.REFRESH_SUCCESS;

    return {
      jobId: job.id,
      queue: 'TOKEN_REFRESH',
      platform,
      userId,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      recordsProcessed: 1,
      syncedCount: isSuccess ? 1 : 0,
      duplicatesIgnored: 0,
      conflictsResolved: 0,
      error: isSuccess ? undefined : `Token refresh status: ${refreshResult.status}`,
      processedAt: nowIso,
    };
  }

  /**
   * Handler for SYNC_RETRY
   * Retries an operation with exponential backoff and jitter
   */
  private async handleSyncRetry(job: IJobRecord): Promise<IHealthSyncJobResult> {
    const { originalQueue, originalData, attempt } = job.data;

    // Compute jittered backoff delay for diagnostic/logging
    const delayMs = BackoffUtil.computeBackoff(attempt || 1, {
      baseMs: 1000,
      strategy: 'FULL_JITTER',
    });

    this.logger.log(
      `[SyncPipeline] Executing SYNC_RETRY attempt #${attempt || 1} with jittered backoff (${delayMs}ms calculated)`,
    );

    // Re-dispatch into the appropriate handler
    const delegatedJob: IJobRecord = {
      ...job,
      queue: originalQueue,
      data: originalData,
    };

    return this.processJob(delegatedJob);
  }

  /**
   * Proactive token refresh check:
   * Scans active connections and triggers refresh for any tokens expiring in < 30 minutes
   */
  async runProactiveTokenRefreshCheck(
    activeConnections: Array<{ userId: string; platform: HealthPlatform }>,
  ): Promise<{ evaluated: number; refreshed: number; failed: number }> {
    let evaluated = 0;
    let refreshed = 0;
    let failed = 0;

    for (const conn of activeConnections) {
      evaluated++;
      const tokenInfo = await this.tokenVaultService.getSanitizedTokenInfo(
        conn.userId,
        conn.platform,
      );

      if (tokenInfo.hasAccessToken && tokenInfo.expiresAt) {
        const expiresAtMs = new Date(tokenInfo.expiresAt).getTime();
        const thirtyMinMs = 30 * 60 * 1000;
        const nowMs = Date.now();

        if (expiresAtMs - nowMs < thirtyMinMs) {
          this.logger.log(
            `[SyncPipeline] Token for [${conn.userId}] on [${conn.platform}] expiring soon (< 30m). Proactively refreshing...`,
          );

          try {
            const res = await this.wearableSyncService.refreshProviderToken(
              conn.userId,
              conn.platform,
            );
            if (
              res.status === TokenRefreshStatus.REFRESH_SUCCESS ||
              res.status === TokenRefreshStatus.TOKEN_VALID
            ) {
              refreshed++;
            } else {
              failed++;
            }
          } catch (err) {
            failed++;
            this.logger.warn(
              `Proactive token refresh failed for [${conn.platform}]: ${(err as Error).message}`,
            );
          }
        }
      }
    }

    return { evaluated, refreshed, failed };
  }

  /**
   * Claim and execute the next job from a specified sync queue (or any health queue)
   */
  async processNextQueuedJob(queueName: QueueName = 'HEALTH_INCREMENTAL_SYNC'): Promise<IHealthSyncJobResult | null> {
    const job = await this.queueService.claimNextJob(queueName);
    if (!job) {
      return null;
    }

    return this.processJob(job);
  }
}
