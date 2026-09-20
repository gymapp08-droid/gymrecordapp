import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { WorkerService } from '../src/modules/queue/services/worker.service';
import { ReminderSchedulerService } from '../src/modules/queue/services/reminder-scheduler.service';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';
import { DevicesService } from '../src/modules/notifications/services/devices.service';
import { RemindersService } from '../src/modules/notifications/services/reminders.service';
import { MockPushNotificationProvider } from '../src/modules/notifications/providers/mock-push.provider';
import { PrismaService } from '../src/modules/database/prisma.service';

describe('Phase 09 Gate B — Redis Queues, Background Worker & Scheduling Engine', () => {
  let queueService: QueueService;
  let workerService: WorkerService;
  let reminderSchedulerService: ReminderSchedulerService;
  let remindersService: RemindersService;

  const testUser = 'usr_athlete_b_worker_01';

  // In-memory state for mock Prisma
  let remindersList: any[] = [];
  let preferencesList: any[] = [];
  let notificationsList: any[] = [];

  const mockPrisma = {
    device: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'dev_1', ...data, createdAt: new Date(), updatedAt: new Date() })),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    notification: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `notif_${Date.now()}`, ...data, isRead: false, readAt: null, createdAt: new Date() };
        notificationsList.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => Promise.resolve(notificationsList.find((n) => n.id === where.id) || null)),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(notificationsList.filter((n) => !where?.userId || n.userId === where.userId));
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(notificationsList.filter((n) => !where?.userId || n.userId === where.userId).length);
      }),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      delete: jest.fn().mockResolvedValue({ id: '1' }),
    },
    notificationDelivery: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: `deliv_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    notificationPreference: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: 'pref_1', ...data, createdAt: new Date(), updatedAt: new Date() };
        preferencesList.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => Promise.resolve(preferencesList.find((p) => p.userId === where.userId) || null)),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
    },
    reminder: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        remindersList.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => Promise.resolve(remindersList.find((r) => r.id === where.id) || null)),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(remindersList.filter((r) => !where?.userId || r.userId === where.userId));
      }),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      delete: jest.fn().mockImplementation(({ where }) => {
        const idx = remindersList.findIndex((r) => r.id === where.id);
        if (idx >= 0) remindersList.splice(idx, 1);
        return Promise.resolve({ id: where.id });
      }),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        MockPushNotificationProvider,
        DevicesService,
        RemindersService,
        NotificationsService,
        QueueService,
        WorkerService,
        ReminderSchedulerService,
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
    workerService = module.get<WorkerService>(WorkerService);
    reminderSchedulerService = module.get<ReminderSchedulerService>(ReminderSchedulerService);
    remindersService = module.get<RemindersService>(RemindersService);

    // Stop continuous loop so tests control tick execution deterministically
    workerService.stop();
  });

  beforeEach(async () => {
    await queueService.purge();
    // Reset handlers to default ALPHA implementations
    workerService['registerDefaultHandlers']();
  });

  // =============================================================
  // 1. BASIC JOB LIFECYCLE & WORKER PROCESSING
  // =============================================================
  describe('1. Job Enqueue & Worker Lifecycle', () => {
    it('should enqueue a job in WAITING status and process it to COMPLETED', async () => {
      const job = await queueService.addJob(
        'NOTIFICATIONS_DISPATCH',
        'Dispatch Morning Push',
        {
          userId: testUser,
          title: 'Good Morning Athlete',
          body: 'Your upper body workout is scheduled for 8:00 AM',
          category: 'WORKOUT',
        },
      );

      expect(job).toBeDefined();
      expect(job.status).toBe('WAITING');
      expect(job.attempts).toBe(0);

      // Execute worker cycle
      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);

      const updated = await queueService.getJob(job.id);
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.attempts).toBe(1);
      expect(updated?.completedAt).toBeDefined();
      expect(updated?.error).toBeNull();
    });
  });

  // =============================================================
  // 2. IDEMPOTENCY & DEDUPLICATION
  // =============================================================
  describe('2. Idempotency & Deduplication Protection', () => {
    it('should suppress duplicate job submissions with the same idempotencyKey', async () => {
      const idempotencyKey = 'unique_workout_reminder_2026_09_19_0800';

      const job1 = await queueService.addJob(
        'NOTIFICATIONS_DISPATCH',
        'Workout Reminder',
        { userId: testUser, title: 'Workout Due', body: 'Push day' },
        { idempotencyKey },
      );

      const job2 = await queueService.addJob(
        'NOTIFICATIONS_DISPATCH',
        'Workout Reminder Duplicate',
        { userId: testUser, title: 'Workout Due', body: 'Push day' },
        { idempotencyKey },
      );

      // Second enqueue must return the exact same job without creating a duplicate
      expect(job2.id).toBe(job1.id);

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);
      expect(metrics.total).toBe(1);
    });
  });

  // =============================================================
  // 3. RETRY & EXPONENTIAL BACKOFF
  // =============================================================
  describe('3. Transient Failures & Exponential Backoff', () => {
    it('should transition to DELAYED with exponential backoff on transient failure', async () => {
      let attemptsCount = 0;
      workerService.registerHandler('NOTIFICATIONS_DISPATCH', async () => {
        attemptsCount++;
        if (attemptsCount === 1) {
          throw new Error('Transient network timeout to push gateway');
        }
        return { success: true };
      });

      const job = await queueService.addJob(
        'NOTIFICATIONS_DISPATCH',
        'Flaky Job',
        { userId: testUser, title: 'Flaky', body: 'Test' },
        { maxAttempts: 3, backoffMs: 50, backoffStrategy: 'EXPONENTIAL' },
      );

      // Attempt 1: Fails
      await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');

      const failedJob = await queueService.getJob(job.id);
      expect(failedJob?.status).toBe('DELAYED');
      expect(failedJob?.attempts).toBe(1);
      expect(failedJob?.error).toBe('Transient network timeout to push gateway');
      expect(failedJob?.delayMs).toBe(50); // 50 * 2^0 = 50

      // Advance clock past backoff delay and promote
      await new Promise((resolve) => setTimeout(resolve, 60));
      queueService.promoteDelayedJobs();

      // Attempt 2: Succeeds
      await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');

      const finalJob = await queueService.getJob(job.id);
      expect(finalJob?.status).toBe('COMPLETED');
      expect(finalJob?.attempts).toBe(2);
      expect(finalJob?.error).toBeNull();
    });
  });

  // =============================================================
  // 4. DEAD LETTER QUEUE (DLQ) & MANUAL RETRY
  // =============================================================
  describe('4. Dead Letter Queue (DLQ) & Manual Retry', () => {
    it('should move permanently failing jobs to DLQ (FAILED) when maxAttempts is reached', async () => {
      workerService.registerHandler('NOTIFICATIONS_DISPATCH', async () => {
        throw new Error('Fatal database constraint error');
      });

      const job = await queueService.addJob(
        'NOTIFICATIONS_DISPATCH',
        'Fatal Job',
        { userId: testUser },
        { maxAttempts: 2, backoffMs: 10 },
      );

      // Attempt 1 -> Delayed
      await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      await new Promise((resolve) => setTimeout(resolve, 15));
      queueService.promoteDelayedJobs();

      // Attempt 2 -> Reached maxAttempts -> FAILED (DLQ)
      await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');

      const dlqJob = await queueService.getJob(job.id);
      expect(dlqJob?.status).toBe('FAILED');
      expect(dlqJob?.attempts).toBe(2);
      expect(dlqJob?.failedAt).toBeDefined();
      expect(dlqJob?.error).toBe('Fatal database constraint error');

      // Manual retry from DLQ resets to WAITING
      const retried = await queueService.retryJob(job.id);
      expect(retried.status).toBe('WAITING');
      expect(retried.attempts).toBe(0);
      expect(retried.error).toBeNull();
    });
  });

  // =============================================================
  // 5. DELAYED & SCHEDULED JOBS
  // =============================================================
  describe('5. Delayed Jobs Processing', () => {
    it('should not process a delayed job until its delay period elapses', async () => {
      const delayMs = 100;
      const job = await queueService.addJob(
        'NOTIFICATIONS_DISPATCH',
        'Future Reminder',
        { userId: testUser, title: 'In 100ms', body: 'Hello' },
        { delayMs },
      );

      expect(job.status).toBe('DELAYED');

      // Worker tries to process immediately: nothing eligible
      const processedImmediately = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processedImmediately).toBe(false);

      // Wait for delay to expire
      await new Promise((resolve) => setTimeout(resolve, 120));

      // Worker processes after delay
      const processedAfterDelay = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processedAfterDelay).toBe(true);

      const completed = await queueService.getJob(job.id);
      expect(completed?.status).toBe('COMPLETED');
    });
  });

  // =============================================================
  // 6. JOB CANCELLATION
  // =============================================================
  describe('6. Job Cancellation', () => {
    it('should allow cancelling a waiting or delayed job', async () => {
      const job = await queueService.addJob(
        'NOTIFICATIONS_DISPATCH',
        'Cancel Me',
        { userId: testUser },
        { delayMs: 5000 },
      );

      expect(job.status).toBe('DELAYED');

      const cancelled = await queueService.cancelJob(job.id);
      expect(cancelled).toBe(true);

      const cancelledJob = await queueService.getJob(job.id);
      expect(cancelledJob?.status).toBe('CANCELLED');

      // Worker will not process a cancelled job
      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(false);
    });
  });

  // =============================================================
  // 7. CONCURRENCY & RACE CONDITION PROTECTION
  // =============================================================
  describe('7. Concurrency & Race Condition Defense', () => {
    it('should prevent race condition duplicates when multiple workers claim jobs concurrently', async () => {
      // Enqueue 5 jobs
      await Promise.all([
        queueService.addJob('NOTIFICATIONS_DISPATCH', 'Job 1', { idx: 1 }),
        queueService.addJob('NOTIFICATIONS_DISPATCH', 'Job 2', { idx: 2 }),
        queueService.addJob('NOTIFICATIONS_DISPATCH', 'Job 3', { idx: 3 }),
        queueService.addJob('NOTIFICATIONS_DISPATCH', 'Job 4', { idx: 4 }),
        queueService.addJob('NOTIFICATIONS_DISPATCH', 'Job 5', { idx: 5 }),
      ]);

      // Simulate 5 simultaneous worker claims at the exact same instant
      const claimedJobs = await Promise.all([
        queueService.claimNextJob('NOTIFICATIONS_DISPATCH'),
        queueService.claimNextJob('NOTIFICATIONS_DISPATCH'),
        queueService.claimNextJob('NOTIFICATIONS_DISPATCH'),
        queueService.claimNextJob('NOTIFICATIONS_DISPATCH'),
        queueService.claimNextJob('NOTIFICATIONS_DISPATCH'),
      ]);

      // All claimed jobs must be non-null and have unique IDs (zero duplicates claimed!)
      const validClaimed = claimedJobs.filter((j) => j !== null);
      expect(validClaimed.length).toBe(5);

      const claimedIds = new Set(validClaimed.map((j) => j?.id));
      expect(claimedIds.size).toBe(5);
    });
  });

  // =============================================================
  // 8. REMINDER SCHEDULER & TIMEZONE EVALUATION
  // =============================================================
  describe('8. Reminder Scheduler Engine', () => {
    it('should evaluate user local time and enqueue reminder with idempotency', async () => {
      // Create user reminder for 07:30 on Mondays (day 1)
      const rem = await remindersService.createReminder(testUser, {
        title: 'Morning Conditioning',
        timeOfDay: '07:30',
        daysOfWeek: [1], // Monday
        category: 'WORKOUT',
      });
      expect(rem.id).toBeDefined();

      // Target Date: 2026-09-21 (Monday) at 07:30 UTC
      const mondayMorning = new Date('2026-09-21T07:30:00Z');

      const scheduledCount = await reminderSchedulerService.evaluateRemindersForUser(
        testUser,
        mondayMorning,
      );
      expect(scheduledCount).toBe(1);

      // Running evaluation again for the exact same target instant MUST be suppressed by idempotency
      const secondRunCount = await reminderSchedulerService.evaluateRemindersForUser(
        testUser,
        mondayMorning,
      );
      expect(secondRunCount).toBe(0); // Deduplicated!

      // Worker processes the reminder schedule job
      const processed = await workerService.processQueueOnce('REMINDERS_SCHEDULE');
      expect(processed).toBe(true);
    });
  });

  // =============================================================
  // 9. AUTOMATIONS EVALUATION HANDLER
  // =============================================================
  describe('9. Automation Evaluation Job', () => {
    it('should process MISSED_WORKOUT automation event and dispatch notification', async () => {
      const job = await queueService.addJob(
        'AUTOMATIONS_EVALUATE',
        'Evaluate Missed Workout',
        {
          eventType: 'MISSED_WORKOUT',
          userId: testUser,
          entityId: 'ws_planned_123',
        },
      );

      const processed = await workerService.processQueueOnce('AUTOMATIONS_EVALUATE');
      expect(processed).toBe(true);

      const completed = await queueService.getJob(job.id);
      expect(completed?.status).toBe('COMPLETED');
    });
  });

  // =============================================================
  // 10. QUEUE METRICS & PURGE
  // =============================================================
  describe('10. Queue Metrics & Purge', () => {
    it('should accurately aggregate queue metrics and purge completed jobs', async () => {
      // Enqueue and complete a job to test metrics and purge
      await queueService.addJob('NOTIFICATIONS_DISPATCH', 'Job to Complete', { userId: testUser });
      await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');

      const metricsBefore = await queueService.getMetrics();
      expect(metricsBefore.total).toBeGreaterThan(0);
      expect(metricsBefore.completed).toBe(1);

      const purged = await queueService.purge(undefined, 'COMPLETED');
      expect(purged).toBe(1);

      const metricsAfter = await queueService.getMetrics();
      expect(metricsAfter.completed).toBe(0);
    });
  });
});
