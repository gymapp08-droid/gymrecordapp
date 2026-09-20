import { Test, TestingModule } from '@nestjs/testing';
import { AutomationsService } from '../src/modules/queue/services/automations.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { WorkerService } from '../src/modules/queue/services/worker.service';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';
import { DevicesService } from '../src/modules/notifications/services/devices.service';
import { RemindersService } from '../src/modules/notifications/services/reminders.service';
import { MockPushNotificationProvider } from '../src/modules/notifications/providers/mock-push.provider';
import { PrismaService } from '../src/modules/database/prisma.service';

describe('Phase 09 Gate D — Automations & Cross-Module Event Engine', () => {
  let automationsService: AutomationsService;
  let queueService: QueueService;
  let workerService: WorkerService;

  const athleteA = 'usr_athlete_alpha_01';
  const athleteB = 'usr_athlete_beta_02';
  const coach = 'usr_coach_01';

  // In-memory mock Prisma
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
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: `notif_${Date.now()}`, ...data, isRead: false, readAt: null, createdAt: new Date() })),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      delete: jest.fn().mockResolvedValue({ id: '1' }),
    },
    notificationDelivery: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: `deliv_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    notificationPreference: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'pref_1', ...data, createdAt: new Date(), updatedAt: new Date() })),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
    },
    reminder: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'rem_1', ...data, createdAt: new Date(), updatedAt: new Date() })),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      delete: jest.fn().mockResolvedValue({ id: 'rem_1' }),
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
        AutomationsService,
      ],
    }).compile();

    automationsService = module.get<AutomationsService>(AutomationsService);
    queueService = module.get<QueueService>(QueueService);
    workerService = module.get<WorkerService>(WorkerService);

    // Stop continuous loop for deterministic test ticks
    workerService.stop();
  });

  beforeEach(async () => {
    await queueService.purge();
    workerService['registerDefaultHandlers']();
  });

  // =============================================================
  // 1. WORKOUT AUTOMATIONS
  // =============================================================
  describe('1. Workout Domain Automations', () => {
    it('should trigger notification on workout completion and notify assigned coach', async () => {
      await automationsService.handleWorkoutCompleted({
        workoutId: 'ws_hypertrophy_101',
        userId: athleteA,
        name: 'Heavy Push Day',
        volumeKg: 14500,
        prCount: 2,
        coachId: coach,
      });

      const metrics = await queueService.getMetrics();
      // 1 job for athlete, 1 job for coach
      expect(metrics.waiting).toBe(2);

      // Process athlete notification
      await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      // Process coach notification
      await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');

      const completedMetrics = await queueService.getMetrics();
      expect(completedMetrics.completed).toBe(2);
    });

    it('IDEMPOTENCY: should suppress duplicate workout completed triggers for same workoutId', async () => {
      await automationsService.handleWorkoutCompleted({
        workoutId: 'ws_repeat_999',
        userId: athleteA,
        name: 'Pull Day',
        volumeKg: 11000,
      });

      // Repeat identical trigger
      await automationsService.handleWorkoutCompleted({
        workoutId: 'ws_repeat_999',
        userId: athleteA,
        name: 'Pull Day',
        volumeKg: 11000,
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1); // Exactly 1 job enqueued!
    });

    it('should trigger missed workout notification with reschedule prompt', async () => {
      await automationsService.handleMissedWorkout({
        userId: athleteA,
        routineName: 'Upper Hypertrophy B',
        scheduledDate: '2026-09-19',
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });

    it('should trigger celebratory alert with delta weight on new PR', async () => {
      await automationsService.handlePersonalRecord({
        userId: athleteA,
        exerciseName: 'Barbell Incline Bench',
        weightKg: 105,
        previousMaxKg: 100,
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });
  });

  // =============================================================
  // 2. NUTRITION AUTOMATIONS
  // =============================================================
  describe('2. Nutrition Domain Automations', () => {
    it('should trigger notification on meal logged', async () => {
      await automationsService.handleMealLogged({
        userId: athleteA,
        mealId: 'meal_post_workout_01',
        name: 'Whey Protein & Oatmeal',
        calories: 520,
        proteinGrams: 45,
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });

    it('should trigger daily milestone notification when macros are met', async () => {
      await automationsService.handleDailyMacrosMet(athleteA, '2026-09-19', {
        calories: 2600,
        proteinGrams: 180,
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });
  });

  // =============================================================
  // 3. ACTIVITY & STREAK AUTOMATIONS
  // =============================================================
  describe('3. Activity & Consistency Automations', () => {
    it('should trigger step milestone notification at 10,000 steps', async () => {
      await automationsService.handleStepMilestone(athleteA, '2026-09-19', 10000);

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });

    it('should trigger streak preservation notification on milestone day', async () => {
      await automationsService.handleStreakPreserved(athleteA, 14);

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });
  });

  // =============================================================
  // 4. COACH PORTAL AUTOMATIONS
  // =============================================================
  describe('4. Coach Portal Automations', () => {
    it('should trigger notification to athlete when coach assigns workout program', async () => {
      await automationsService.handleCoachAssignment({
        coachId: coach,
        coachName: 'Coach Marcus',
        athleteId: athleteA,
        assignmentType: 'PROGRAM',
        assignmentId: 'prog_ppl_advanced',
        assignmentName: '6-Week PPL Hypertrophy Phase 2',
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });

    it('should trigger notification to athlete when coach assigns meal plan', async () => {
      await automationsService.handleCoachAssignment({
        coachId: coach,
        coachName: 'Coach Sarah (Nutritionist)',
        athleteId: athleteA,
        assignmentType: 'MEAL_PLAN',
        assignmentId: 'plan_high_protein_2800',
        assignmentName: 'Lean Bulk 2800 kcal Protocol',
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });

    it('should trigger message notification to athlete when coach sends direct message', async () => {
      await automationsService.handleCoachMessage({
        senderId: coach,
        senderName: 'Coach Marcus',
        recipientId: athleteA,
        preview: 'Great form on that last set of squats! Notice how your bar path improved.',
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });
  });

  // =============================================================
  // 5. AI COACH INSIGHT AUTOMATIONS
  // =============================================================
  describe('5. AI Coach Automations', () => {
    it('should trigger notification when new AI insight is generated', async () => {
      await automationsService.handleAiInsight(athleteA, 'insight_recov_01', {
        title: 'Recovery Opportunity Detected',
        summary: 'Your sleep telemetry indicates optimal readiness for a high-intensity session today.',
      });

      const metrics = await queueService.getMetrics();
      expect(metrics.waiting).toBe(1);

      const processed = await workerService.processQueueOnce('NOTIFICATIONS_DISPATCH');
      expect(processed).toBe(true);
    });
  });

  // =============================================================
  // 6. MULTI-TENANT ISOLATION
  // =============================================================
  describe('6. Multi-Tenant Automation Isolation', () => {
    it('SECURITY: Athlete B event does not generate notification for Athlete A', async () => {
      await automationsService.handleWorkoutCompleted({
        workoutId: 'ws_athlete_b_secret',
        userId: athleteB,
        name: 'Private Session',
        volumeKg: 5000,
      });

      // Claim job and verify it is addressed strictly to athleteB
      const job = await queueService.claimNextJob('NOTIFICATIONS_DISPATCH');
      expect(job).toBeDefined();
      expect(job?.data.userId).toBe(athleteB);
      expect(job?.data.userId).not.toBe(athleteA);
    });
  });
});
