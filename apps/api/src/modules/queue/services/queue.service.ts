import { Injectable, Logger } from '@nestjs/common';
import {
  QueueName,
  JobStatus,
  IJobOptions,
  IJobRecord,
  IQueueMetrics,
} from '@alpha/types';
import { QueueJobQueryDto } from '@alpha/validation';
import { BackoffUtil } from '@alpha/utils';
import * as crypto from 'crypto';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  // Persistent in-memory job store (or Redis-backed in production)
  private readonly jobs = new Map<string, IJobRecord>();

  // Fast index for idempotency keys to job IDs
  private readonly idempotencyIndex = new Map<string, string>();

  // Mutex lock for atomic claim execution
  private isClaiming = false;

  /**
   * Check if a job with the given idempotencyKey is already queued, active, delayed, or completed.
   */
  hasIdempotentJob(idempotencyKey: string): boolean {
    const existingJobId = this.idempotencyIndex.get(idempotencyKey);
    if (!existingJobId) return false;
    const existingJob = this.jobs.get(existingJobId);
    return (
      !!existingJob &&
      (existingJob.status === 'WAITING' ||
        existingJob.status === 'ACTIVE' ||
        existingJob.status === 'DELAYED' ||
        existingJob.status === 'COMPLETED')
    );
  }

  /**
   * Enqueue a new job with optional idempotency deduplication, delay, and backoff config.
   */
  async addJob<T = any>(
    queue: QueueName,
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<IJobRecord<T>> {
    // 1. Idempotency Check: prevent duplicate enqueuing
    if (options?.idempotencyKey) {
      const existingJobId = this.idempotencyIndex.get(options.idempotencyKey);
      if (existingJobId) {
        const existingJob = this.jobs.get(existingJobId);
        if (
          existingJob &&
          (existingJob.status === 'WAITING' ||
            existingJob.status === 'ACTIVE' ||
            existingJob.status === 'DELAYED' ||
            existingJob.status === 'COMPLETED')
        ) {
          this.logger.debug(
            `[Queue:${queue}] Idempotent duplicate suppressed for key: ${options.idempotencyKey} (Job: ${existingJob.id})`,
          );
          return existingJob as IJobRecord<T>;
        }
      }
    }

    const id = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();
    const delayMs = options?.delayMs || 0;
    const isDelayed = delayMs > 0;
    const scheduledFor = isDelayed
      ? new Date(now.getTime() + delayMs).toISOString()
      : null;

    const jobRecord: IJobRecord<T> = {
      id,
      name,
      queue,
      data,
      idempotencyKey: options?.idempotencyKey || null,
      attempts: 0,
      maxAttempts: options?.maxAttempts !== undefined ? options.maxAttempts : 3,
      backoffMs: options?.backoffMs !== undefined ? options.backoffMs : 1000,
      backoffStrategy: options?.backoffStrategy || 'EXPONENTIAL',
      status: isDelayed ? 'DELAYED' : 'WAITING',
      delayMs: isDelayed ? delayMs : null,
      scheduledFor,
      processedAt: null,
      completedAt: null,
      failedAt: null,
      error: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.jobs.set(id, jobRecord);

    if (options?.idempotencyKey) {
      this.idempotencyIndex.set(options.idempotencyKey, id);
    }

    this.logger.debug(
      `[Queue:${queue}] Enqueued job "${name}" [${id}] with status: ${jobRecord.status}`,
    );

    return jobRecord;
  }

  /**
   * Get a job by ID
   */
  async getJob<T = any>(jobId: string): Promise<IJobRecord<T> | null> {
    const job = this.jobs.get(jobId);
    return (job as IJobRecord<T>) || null;
  }

  /**
   * Promote any delayed jobs whose scheduled time has arrived to WAITING
   */
  promoteDelayedJobs(): number {
    const now = Date.now();
    let promoted = 0;

    for (const job of this.jobs.values()) {
      if (job.status === 'DELAYED' && job.scheduledFor) {
        const schedTime = new Date(job.scheduledFor).getTime();
        if (now >= schedTime) {
          job.status = 'WAITING';
          job.updatedAt = new Date().toISOString();
          promoted++;
        }
      }
    }

    return promoted;
  }

  /**
   * Atomically claim the next eligible WAITING job from the specified queue.
   * Protects against race conditions with atomic lock.
   */
  async claimNextJob(queue: QueueName): Promise<IJobRecord | null> {
    while (this.isClaiming) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    this.isClaiming = true;
    try {
      this.promoteDelayedJobs();

      // Find the first WAITING job for this queue
      for (const job of this.jobs.values()) {
        if (job.queue === queue && job.status === 'WAITING') {
          job.status = 'ACTIVE';
          job.attempts += 1;
          job.processedAt = new Date().toISOString();
          job.updatedAt = new Date().toISOString();
          return job;
        }
      }

      return null;
    } finally {
      this.isClaiming = false;
    }
  }

  /**
   * Atomically claim up to `batchSize` eligible WAITING jobs from the specified queue.
   * Enables high-throughput batch worker processing.
   */
  async claimBatch(queue: QueueName, batchSize = 10): Promise<IJobRecord[]> {
    while (this.isClaiming) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    this.isClaiming = true;
    try {
      this.promoteDelayedJobs();

      const claimed: IJobRecord[] = [];
      const nowIso = new Date().toISOString();

      for (const job of this.jobs.values()) {
        if (claimed.length >= batchSize) break;
        if (job.queue === queue && job.status === 'WAITING') {
          job.status = 'ACTIVE';
          job.attempts += 1;
          job.processedAt = nowIso;
          job.updatedAt = nowIso;
          claimed.push(job);
        }
      }

      return claimed;
    } finally {
      this.isClaiming = false;
    }
  }

  /**
   * Complete an active job
   */
  async completeJob(jobId: string): Promise<IJobRecord> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'COMPLETED';
    job.completedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
    job.error = null;

    this.logger.debug(`[Queue:${job.queue}] Completed job "${job.name}" [${jobId}]`);
    return job;
  }

  /**
   * Mark an active job as failed. Handles retry logic with jitter and Dead Letter Queue (DLQ).
   */
  async failJob(jobId: string, error: string): Promise<IJobRecord> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const now = new Date();
    job.error = error;
    job.updatedAt = now.toISOString();

    if (job.attempts < job.maxAttempts) {
      let delayMs: number;
      if (job.backoffStrategy === 'EXPONENTIAL_JITTER') {
        delayMs = BackoffUtil.computeBackoff(job.attempts, {
          baseMs: job.backoffMs,
          strategy: 'FULL_JITTER',
        });
      } else if (job.backoffStrategy === 'EXPONENTIAL') {
        delayMs = job.backoffMs * Math.pow(2, job.attempts - 1);
      } else {
        delayMs = job.backoffMs;
      }

      job.status = 'DELAYED';
      job.delayMs = delayMs;
      job.scheduledFor = new Date(now.getTime() + delayMs).toISOString();

      this.logger.warn(
        `[Queue:${job.queue}] Job "${job.name}" [${jobId}] failed (Attempt ${job.attempts}/${job.maxAttempts}). Retrying in ${delayMs}ms. Error: ${error}`,
      );
    } else {
      // Exceeded maxAttempts -> move to DLQ (Dead Letter Queue)
      job.status = 'FAILED';
      job.failedAt = now.toISOString();

      this.logger.error(
        `[Queue:${job.queue}] Job "${job.name}" [${jobId}] permanently FAILED after ${job.attempts} attempts -> Dead Letter Queue. Error: ${error}`,
      );
    }

    return job;
  }

  /**
   * Cancel a pending or delayed job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'WAITING' || job.status === 'DELAYED') {
      job.status = 'CANCELLED';
      job.updatedAt = new Date().toISOString();
      this.logger.debug(`[Queue:${job.queue}] Cancelled job "${job.name}" [${jobId}]`);
      return true;
    }

    return false;
  }

  /**
   * Manually retry a failed job from the Dead Letter Queue
   */
  async retryJob(jobId: string): Promise<IJobRecord> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'WAITING';
    job.attempts = 0;
    job.error = null;
    job.failedAt = null;
    job.completedAt = null;
    job.scheduledFor = null;
    job.updatedAt = new Date().toISOString();

    this.logger.log(`[Queue:${job.queue}] Manually retried job "${job.name}" [${jobId}]`);
    return job;
  }

  /**
   * Aggregate queue metrics
   */
  async getMetrics(): Promise<IQueueMetrics> {
    this.promoteDelayedJobs();

    let waiting = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;
    let delayed = 0;
    let cancelled = 0;

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case 'WAITING':
          waiting++;
          break;
        case 'ACTIVE':
          active++;
          break;
        case 'COMPLETED':
          completed++;
          break;
        case 'FAILED':
          failed++;
          break;
        case 'DELAYED':
          delayed++;
          break;
        case 'CANCELLED':
          cancelled++;
          break;
      }
    }

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      cancelled,
      total: this.jobs.size,
    };
  }

  /**
   * List and filter jobs with pagination
   */
  async listJobs(query: QueueJobQueryDto): Promise<{
    data: IJobRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.promoteDelayedJobs();

    let list = Array.from(this.jobs.values());

    if (query.queue) {
      list = list.filter((j) => j.queue === query.queue);
    }
    if (query.status) {
      list = list.filter((j) => j.status === query.status);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const total = list.length;
    const data = list.slice(skip, skip + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Purge jobs from store
   */
  async purge(queue?: QueueName, status?: JobStatus): Promise<number> {
    let count = 0;
    for (const [id, job] of this.jobs.entries()) {
      let shouldDelete = true;
      if (queue && job.queue !== queue) shouldDelete = false;
      if (status && job.status !== status) shouldDelete = false;

      if (shouldDelete) {
        if (job.idempotencyKey) {
          this.idempotencyIndex.delete(job.idempotencyKey);
        }
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }
}
