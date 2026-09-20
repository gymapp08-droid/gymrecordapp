import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsCacheService } from '../src/modules/analytics/services/analytics-cache.service';
import { AnalyticsRebuildService } from '../src/modules/analytics/services/analytics-rebuild.service';
import { AnalyticsQualityService } from '../src/modules/analytics/services/analytics-quality.service';
import { AnalyticsWorkerHandlerService } from '../src/modules/analytics/services/analytics-worker-handler.service';
import { AnalyticsAggregationService } from '../src/modules/analytics/services/analytics-aggregation.service';
import { AnalyticsMathService } from '../src/modules/analytics/services/analytics-math.service';
import { PrismaService } from '../src/modules/database/prisma.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { WorkerService } from '../src/modules/queue/services/worker.service';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';

describe('Phase 10 Gate D — Worker, Performance, Rebuild & Data Quality Suite', () => {
  let cacheService: AnalyticsCacheService;
  let rebuildService: AnalyticsRebuildService;
  let qualityService: AnalyticsQualityService;
  let workerHandler: AnalyticsWorkerHandlerService;
  let queueService: QueueService;
  let workerService: WorkerService;
  let mathService: AnalyticsMathService;

  const mockUsers = [
    { id: 'usr_athlete_1', role: 'ATHLETE', status: 'ACTIVE', organizationId: 'org_1' },
    { id: 'usr_athlete_2', role: 'ATHLETE', status: 'ACTIVE', organizationId: 'org_1' },
    { id: 'usr_coach_1', role: 'COACH', status: 'ACTIVE', organizationId: 'org_1' },
  ];

  const mockPrisma = {
    user: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where?.role === 'ATHLETE') {
          return Promise.resolve(mockUsers.filter((u) => u.role === 'ATHLETE'));
        }
        if (where?.role?.in) {
          return Promise.resolve(mockUsers.filter((u) => where.role.in.includes(u.role)));
        }
        return Promise.resolve(mockUsers);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(mockUsers.find((u) => u.id === where.id) || null);
      }),
      count: jest.fn().mockResolvedValue(2),
    },
    organization: {
      findMany: jest.fn().mockResolvedValue([{ id: 'org_1' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 'org_1', name: 'Alpha Org' }),
    },
    coachClientRelationship: {
      findMany: jest.fn().mockResolvedValue([{ clientId: 'usr_athlete_1' }]),
    },
    coachMessage: {
      count: jest.fn().mockResolvedValue(5),
    },
    programAssignment: {
      count: jest.fn().mockResolvedValue(1),
    },
    analyticsDailyUser: {
      upsert: jest.fn().mockResolvedValue({ id: 'daily_u_1' }),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            id: 'daily_u_1',
            userId: 'usr_athlete_1',
            date: '2026-09-18',
            timezone: 'UTC',
            plannedWorkouts: 2,
            completedWorkouts: 2,
            skippedWorkouts: 0,
            workoutVolumeKg: 1500,
            workoutDurationMinutes: 60,
            prsAchieved: 1,
            caloriesConsumed: 2400,
            calorieTarget: 2500,
            proteinGrams: 160,
            mealsLogged: 3,
            waterMl: 2500,
            waterTargetMl: 2500,
            nutritionAdherenceScore: 96,
            steps: 10500,
            activeMinutes: 60,
            cardioDurationMinutes: 20,
            cardioDistanceMeters: 3000,
            caloriesBurned: 450,
            bodyWeightKg: 82.5,
            qualifyingEventsCount: 5,
            isActiveDay: true,
          },
        ]);
      }),
    },
    analyticsDailyCoach: {
      upsert: jest.fn().mockResolvedValue({ id: 'daily_c_1' }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'daily_c_1',
          coachId: 'usr_coach_1',
          date: '2026-09-18',
          totalAssignedClients: 1,
          activeClientsCount: 1,
          clientWorkoutsCompleted: 2,
          clientMealsLogged: 3,
          clientAdherenceAverage: 100,
          messagesExchanged: 5,
          programsAssigned: 1,
        },
      ]),
    },
    analyticsDailyOrganization: {
      upsert: jest.fn().mockResolvedValue({ id: 'daily_o_1' }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'daily_o_1',
          organizationId: 'org_1',
          date: '2026-09-18',
          totalClients: 2,
          activeClients: 1,
          newClients: 0,
          totalCoaches: 1,
          activeCoaches: 1,
          totalWorkoutsCompleted: 2,
          avgWorkoutAdherence: 100,
          avgNutritionAdherence: 96,
          totalStepsRecorded: BigInt(10500),
          messagesCount: 5,
        },
      ]),
    },
    analyticsJobRun: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'job_run_123', ...data })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'job_run_123', ...data })),
    },
    workoutSession: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    dailyMealLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    hydrationLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    activityRecord: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    cardioSession: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    bodyMetric: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    personalRecord: {
      count: jest.fn().mockResolvedValue(0),
    },
    userGoal: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };

  const mockNotificationsService = {
    sendNotification: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsCacheService,
        AnalyticsRebuildService,
        AnalyticsQualityService,
        AnalyticsWorkerHandlerService,
        AnalyticsAggregationService,
        AnalyticsMathService,
        QueueService,
        WorkerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    cacheService = module.get<AnalyticsCacheService>(AnalyticsCacheService);
    rebuildService = module.get<AnalyticsRebuildService>(AnalyticsRebuildService);
    qualityService = module.get<AnalyticsQualityService>(AnalyticsQualityService);
    workerHandler = module.get<AnalyticsWorkerHandlerService>(AnalyticsWorkerHandlerService);
    queueService = module.get<QueueService>(QueueService);
    workerService = module.get<WorkerService>(WorkerService);
    mathService = module.get<AnalyticsMathService>(AnalyticsMathService);

    // Register handlers to workerService
    workerService.registerHandler('DAILY_ANALYTICS_AGGREGATION', async (job) => {
      return workerHandler.handleDailyAggregation(job);
    });
    workerService.registerHandler('CLIENT_SUMMARY_REFRESH', async (job) => {
      return workerHandler.handleClientSummaryRefresh(job);
    });
    workerService.registerHandler('ORGANIZATION_SUMMARY_REFRESH', async (job) => {
      return workerHandler.handleOrganizationSummaryRefresh(job);
    });
  });

  describe('1. Scoped Multi-Tenant Caching (AnalyticsCacheService)', () => {
    it('generates consistent namespaced keys and enforces TTL expiration', async () => {
      const key = cacheService.generateKey('organization', 'org_1', '30_DAYS', 'UTC');
      expect(key).toBe('analytics:organization:org_1:period:30_DAYS:tz:UTC');

      await cacheService.set(key, { data: 'test_payload' }, 1, ['org:org_1']);
      const fetched = await cacheService.get(key);
      expect(fetched).toEqual({ data: 'test_payload' });

      // Simulate expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const expired = await cacheService.get(key);
      expect(expired).toBeNull();
    });

    it('invalidates cache by tenant tag accurately', async () => {
      const userKey1 = cacheService.generateKey('client', 'usr_athlete_1', '30_DAYS');
      const userKey2 = cacheService.generateKey('client', 'usr_athlete_2', '30_DAYS');
      const orgKey = cacheService.generateKey('organization', 'org_1', '30_DAYS');

      await cacheService.set(userKey1, { u: 1 }, 300, ['user:usr_athlete_1', 'org:org_1']);
      await cacheService.set(userKey2, { u: 2 }, 300, ['user:usr_athlete_2', 'org:org_1']);
      await cacheService.set(orgKey, { o: 1 }, 300, ['org:org_1']);

      expect(cacheService.size()).toBe(3);

      // Invalidate single user tag
      const invalidatedUsers = await cacheService.invalidateTag('user:usr_athlete_1');
      expect(invalidatedUsers).toBe(1);
      expect(await cacheService.get(userKey1)).toBeNull();
      expect(await cacheService.get(userKey2)).not.toBeNull();

      // Invalidate org tag
      await cacheService.invalidateTag('org:org_1');
      expect(await cacheService.get(userKey2)).toBeNull();
      expect(await cacheService.get(orgKey)).toBeNull();
      expect(cacheService.size()).toBe(0);
    });
  });

  describe('2. Background Worker Aggregation Queues & Handlers', () => {
    it('enqueues and processes DAILY_ANALYTICS_AGGREGATION job via worker queue', async () => {
      const jobRecord = await workerHandler.enqueueDailyAggregation({
        date: '2026-09-18',
        targetUserId: 'usr_athlete_1',
      });

      expect(jobRecord.queue).toBe('DAILY_ANALYTICS_AGGREGATION');
      expect(jobRecord.status).toBe('WAITING');

      // Process queue job via WorkerService
      const processed = await workerService.processQueueOnce('DAILY_ANALYTICS_AGGREGATION');
      expect(processed).toBe(true);

      const completedJob = await queueService.getJob(jobRecord.id);
      expect(completedJob?.status).toBe('COMPLETED');
    });

    it('handles idempotent job deduplication in queue', async () => {
      const job1 = await workerHandler.enqueueDailyAggregation({
        date: '2026-09-18',
        targetUserId: 'usr_athlete_1',
      });

      const job2 = await workerHandler.enqueueDailyAggregation({
        date: '2026-09-18',
        targetUserId: 'usr_athlete_1',
      });

      // Both return same job record due to identical idempotency key
      expect(job1.id).toBe(job2.id);
    });

    it('enqueues and executes CLIENT_SUMMARY_REFRESH job', async () => {
      const job = await workerHandler.enqueueClientSummaryRefresh({
        userId: 'usr_athlete_1',
        invalidateCache: true,
      });

      expect(job.queue).toBe('CLIENT_SUMMARY_REFRESH');
      const processed = await workerService.processQueueOnce('CLIENT_SUMMARY_REFRESH');
      expect(processed).toBe(true);

      const completedJob = await queueService.getJob(job.id);
      expect(completedJob?.status).toBe('COMPLETED');
    });

    it('enqueues and executes ORGANIZATION_SUMMARY_REFRESH job', async () => {
      const job = await workerHandler.enqueueOrganizationSummaryRefresh({
        organizationId: 'org_1',
        invalidateCache: true,
      });

      expect(job.queue).toBe('ORGANIZATION_SUMMARY_REFRESH');
      const processed = await workerService.processQueueOnce('ORGANIZATION_SUMMARY_REFRESH');
      expect(processed).toBe(true);

      const completedJob = await queueService.getJob(job.id);
      expect(completedJob?.status).toBe('COMPLETED');
    });
  });

  describe('3. Historical Backfill & Idempotent Rebuild Service', () => {
    it('rebuilds client history across multiple days idempotently', async () => {
      const result = await rebuildService.rebuildClientHistory({
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        userId: 'usr_athlete_1',
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.recordsProcessed).toBe(3); // 3 days
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(mockPrisma.analyticsJobRun.create).toHaveBeenCalled();
      expect(mockPrisma.analyticsJobRun.update).toHaveBeenCalled();
    });

    it('rebuilds organization and coach history idempotently', async () => {
      const result = await rebuildService.rebuildOrganizationHistory({
        startDate: '2026-09-17',
        endDate: '2026-09-18',
        organizationId: 'org_1',
      });

      expect(result.status).toBe('COMPLETED');
      // 2 days * (1 coach + 1 org) = 4 records
      expect(result.recordsProcessed).toBe(4);
    });
  });

  describe('4. Automated Data Quality & Integrity Validation Engine', () => {
    it('passes audit when metrics satisfy all mathematical and schema rules', async () => {
      const audit = await qualityService.runAudit(30);

      expect(audit.passed).toBe(true);
      expect(audit.criticalCount).toBe(0);
      expect(audit.recordsAudited).toBeGreaterThan(0);
    });

    it('detects violations on impossible negative values or out-of-bounds percentages', async () => {
      // Mock an invalid daily record
      const originalFindMany = mockPrisma.analyticsDailyUser.findMany;
      mockPrisma.analyticsDailyUser.findMany = jest.fn().mockResolvedValue([
        {
          id: 'invalid_rec_1',
          userId: 'usr_bad',
          date: '2026-09-18',
          plannedWorkouts: -1, // Negative count violation
          completedWorkouts: 0,
          workoutVolumeKg: -50, // Negative volume violation
          steps: 100,
          nutritionAdherenceScore: 125, // Over 100% violation
          qualifyingEventsCount: 0,
          isActiveDay: true, // Active day without events violation
        },
      ]);

      const audit = await qualityService.runAudit(30);
      expect(audit.passed).toBe(false);
      expect(audit.criticalCount).toBe(3); // plannedWorkouts, workoutVolumeKg, nutritionAdherenceScore
      expect(audit.warningCount).toBe(1); // active day without qualifying events

      // Restore mock
      mockPrisma.analyticsDailyUser.findMany = originalFindMany;
    });

    it('validates safe division and prevents NaN/Infinity in math utility', () => {
      expect(mathService.safeDivide(10, 0)).toBeNull();
      expect(mathService.safeDivide(0, 0)).toBeNull();
      expect(mathService.safeDivide(100, -5)).toBeNull();
      expect(mathService.safeDivide(100, 2)).toBe(50);

      expect(mathService.calculatePercentage(5, 0)).toBeNull();
      expect(mathService.calculatePercentage(15, 10)).toBe(100); // Clamped to 100
      expect(mathService.calculatePercentage(-5, 10)).toBe(0);   // Clamped to 0
      expect(mathService.calculatePercentage(3, 4)).toBe(75);
    });
  });
});
