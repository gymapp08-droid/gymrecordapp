import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import {
  QueueName,
  IJobRecord,
  IDispatchNotificationJobPayload,
  IScheduleReminderJobPayload,
  IEvaluateAutomationJobPayload,
  IWeeklyDigestJobPayload,
} from '@alpha/types';

export type JobHandler<T = any> = (job: IJobRecord<T>) => Promise<any>;

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly handlers = new Map<QueueName, JobHandler>();

  constructor(
    private readonly queueService: QueueService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.registerDefaultHandlers();
  }

  onModuleInit() {
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  /**
   * Register standard handlers for ALPHA queues
   */
  private registerDefaultHandlers(): void {
    // 1. Notification Dispatch Handler
    this.registerHandler('NOTIFICATIONS_DISPATCH', async (job: IJobRecord<IDispatchNotificationJobPayload>) => {
      const data = job.data;
      return this.notificationsService.sendNotification({
        userId: data.userId,
        title: data.title,
        body: data.body,
        category: data.category,
        type: data.type,
        data: data.data,
        deepLinkUrl: data.deepLinkUrl,
        forcePush: data.forcePush,
        skipPush: data.skipPush,
      });
    });

    // 2. Reminder Schedule Handler
    this.registerHandler('REMINDERS_SCHEDULE', async (job: IJobRecord<IScheduleReminderJobPayload>) => {
      const data = job.data;
      return this.notificationsService.sendNotification({
        userId: data.userId,
        title: data.title,
        body: `Reminder: Time for your ${data.category.toLowerCase()} (${data.scheduledTime})`,
        category: (data.category as any) || 'WORKOUT',
        type: 'SCHEDULED_REMINDER',
        data: { reminderId: data.reminderId, scheduledTime: data.scheduledTime },
      });
    });

    // 3. Automation Evaluation Handler
    this.registerHandler('AUTOMATIONS_EVALUATE', async (job: IJobRecord<IEvaluateAutomationJobPayload>) => {
      const data = job.data;
      let title = 'Alpha Automation';
      let body = 'System evaluated automation trigger.';

      if (data.eventType === 'MISSED_WORKOUT') {
        title = 'Workout Missed';
        body = "You didn't log your planned workout today. Would you like to reschedule or take a rest day?";
      } else if (data.eventType === 'MEAL_LOG_DUE') {
        title = 'Meal Logging Reminder';
        body = 'Stay on track with your nutrition goals. Log your recent meal.';
      } else if (data.eventType === 'STREAK_MILESTONE') {
        title = 'Streak Milestone!';
        body = `Incredible consistency! You have reached a ${data.payload?.streakDays || 7}-day streak.`;
      }

      return this.notificationsService.sendNotification({
        userId: data.userId,
        title,
        body,
        category: 'SYSTEM',
        type: data.eventType,
        data: data.payload,
      });
    });

    // 4. Weekly Digest Handler
    this.registerHandler('WEEKLY_DIGEST', async (job: IJobRecord<IWeeklyDigestJobPayload>) => {
      const data = job.data;
      return this.notificationsService.sendNotification({
        userId: data.userId,
        title: 'Weekly Performance Report Ready',
        body: `Your performance analytics for ${data.weekStartDate} to ${data.weekEndDate} are ready for review.`,
        category: 'PROGRESS',
        type: 'WEEKLY_DIGEST',
        deepLinkUrl: 'alpha://progress/weekly',
      });
    });
  }

  /**
   * Register a custom handler for a queue
   */
  registerHandler<T = any>(queue: QueueName, handler: JobHandler<T>): void {
    this.handlers.set(queue, handler);
  }

  /**
   * Start worker polling loop
   */
  start(intervalMs = 1000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log('Background Worker engine started.');

    this.timer = setInterval(async () => {
      try {
        await this.processAllQueues();
      } catch (err) {
        this.logger.error(`Error in worker loop: ${(err as Error).message}`);
      }
    }, intervalMs);
  }

  /**
   * Stop worker loop
   */
  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.logger.log('Background Worker engine stopped.');
  }

  /**
   * Process one job per queue if available
   */
  async processAllQueues(): Promise<number> {
    const queues: QueueName[] = [
      'NOTIFICATIONS_DISPATCH',
      'REMINDERS_SCHEDULE',
      'AUTOMATIONS_EVALUATE',
      'WEEKLY_DIGEST',
      'DAILY_ANALYTICS_AGGREGATION',
      'WEEKLY_ANALYTICS_AGGREGATION',
      'CLIENT_SUMMARY_REFRESH',
      'ORGANIZATION_SUMMARY_REFRESH',
    ];

    let processedCount = 0;
    for (const queue of queues) {
      const processed = await this.processQueueOnce(queue);
      if (processed) processedCount++;
    }

    return processedCount;
  }

  /**
   * Atomically claims and processes a single job from a given queue
   */
  async processQueueOnce(queue: QueueName): Promise<boolean> {
    const job = await this.queueService.claimNextJob(queue);
    if (!job) return false;

    const handler = this.handlers.get(queue);
    if (!handler) {
      await this.queueService.failJob(job.id, `No handler registered for queue ${queue}`);
      return true;
    }

    try {
      this.logger.debug(`[Worker] Executing job "${job.name}" [${job.id}] on queue [${queue}]`);
      await handler(job);
      await this.queueService.completeJob(job.id);
      return true;
    } catch (err) {
      const errorMsg = (err as Error).message || 'Job execution failed';
      this.logger.warn(`[Worker] Job "${job.name}" [${job.id}] failed: ${errorMsg}`);
      await this.queueService.failJob(job.id, errorMsg);
      return true;
    }
  }
}
