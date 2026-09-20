import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AnalyticsController } from '../src/modules/analytics/controllers/analytics.controller';
import { KpisController } from '../src/modules/analytics/controllers/kpis.controller';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service';
import { AnalyticsAggregationService } from '../src/modules/analytics/services/analytics-aggregation.service';
import { AnalyticsMathService } from '../src/modules/analytics/services/analytics-math.service';
import { KpiCatalogService } from '../src/modules/analytics/services/kpi-catalog.service';
import { AnalyticsAuthorizationGuard } from '../src/modules/analytics/guards/analytics-authorization.guard';
import { AnalyticsCacheService } from '../src/modules/analytics/services/analytics-cache.service';
import { AnalyticsRebuildService } from '../src/modules/analytics/services/analytics-rebuild.service';
import { AnalyticsQualityService } from '../src/modules/analytics/services/analytics-quality.service';
import { UserRole } from '@alpha/types';

describe('Phase 10 Gate B — Analytics API & Dashboards', () => {
  let analyticsController: AnalyticsController;
  let kpisController: KpisController;
  let analyticsService: AnalyticsService;

  const orgA = 'org_alpha_enterprise';
  const coachA = 'usr_coach_marcus';
  const athleteA = 'usr_athlete_vance';

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === athleteA) {
          return Promise.resolve({ id: athleteA, organizationId: orgA, role: UserRole.ATHLETE });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        if (where.organizationId === orgA) {
          if (where.role === 'ATHLETE') return Promise.resolve(25);
          return Promise.resolve(4);
        }
        return Promise.resolve(0);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.organizationId === orgA && where.role === 'ATHLETE') {
          return Promise.resolve([{ id: athleteA }]);
        }
        if (where.organizationId === orgA && where.role && where.role.in) {
          return Promise.resolve([
            {
              id: coachA,
              role: UserRole.COACH,
              email: 'coach.marcus@alpha.local',
              profile: { fullName: 'Coach Marcus', avatarUrl: null },
              clientsAsCoach: [{ clientId: athleteA }],
            },
          ]);
        }
        return Promise.resolve([]);
      }),
    },
    coachClientRelationship: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.coachId === coachA) {
          return Promise.resolve([
            {
              id: 'rel_1',
              coachId: coachA,
              clientId: athleteA,
              isActive: true,
              status: 'ACTIVE',
              client: {
                id: athleteA,
                email: 'vance@alpha.local',
                profile: { fullName: 'Marcus Vance', avatarUrl: null },
              },
            },
          ]);
        }
        return Promise.resolve([]);
      }),
    },
    analyticsDailyUser: {
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'adu_1', ...create })),
      findMany: jest.fn().mockResolvedValue([
        {
          userId: athleteA,
          date: '2026-09-18',
          plannedWorkouts: 4,
          completedWorkouts: 3,
          skippedWorkouts: 1,
          workoutVolumeKg: 4200,
          workoutDurationMinutes: 180,
          prsAchieved: 2,
          mealsLogged: 3,
          caloriesConsumed: 2600,
          calorieTarget: 2600,
          proteinGrams: 190,
          nutritionAdherenceScore: 98,
          waterMl: 3000,
          waterTargetMl: 2500,
          steps: 11200,
          activeMinutes: 75,
          cardioDurationMinutes: 30,
          cardioDistanceMeters: 5200,
          bodyWeightKg: 83.2,
          isActiveDay: true,
        },
      ]),
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
      findFirst: jest.fn().mockResolvedValue({ weightKg: 83.2, recordedAt: new Date() }),
    },
    personalRecord: {
      count: jest.fn().mockResolvedValue(2),
    },
    userGoal: {
      findUnique: jest.fn().mockResolvedValue({
        userId: athleteA,
        targetDailyCalories: 2600,
        targetDailyProteinGrams: 190,
      }),
    },
    coachMessage: {
      count: jest.fn().mockResolvedValue(12),
    },
    programAssignment: {
      count: jest.fn().mockResolvedValue(3),
    },
    program: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'prog_1',
          creatorId: coachA,
          name: 'Hypertrophy Split V1',
          status: 'PUBLISHED',
          assignments: [{ id: 'asgn_1', athleteId: athleteA, isActive: true }],
        },
      ]),
    },
    kPIDefinition: {
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'kpi_1', ...create })),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController, KpisController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        AnalyticsService,
        AnalyticsAggregationService,
        AnalyticsMathService,
        AnalyticsCacheService,
        AnalyticsRebuildService,
        AnalyticsQualityService,
        KpiCatalogService,
        AnalyticsAuthorizationGuard,
      ],
    }).compile();

    analyticsController = module.get<AnalyticsController>(AnalyticsController);
    kpisController = module.get<KpisController>(KpisController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  // -------------------------------------------------------------
  // 1. DATE RANGE RESOLUTION & PERIODS
  // -------------------------------------------------------------
  describe('1. Date Range Engine', () => {
    it('should resolve standard 30_DAYS period and matching comparison window', () => {
      const range = analyticsService.resolveDateRange('30_DAYS', undefined, undefined, 'UTC');
      expect(range.startDate).toBeDefined();
      expect(range.endDate).toBeDefined();
      expect(range.previousStartDate).toBeDefined();
      expect(range.previousEndDate).toBeDefined();

      const startMs = new Date(range.startDate).getTime();
      const endMs = new Date(range.endDate).getTime();
      const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(29); // 30 days inclusive
    });

    it('should resolve custom date range and matching comparison window', () => {
      const range = analyticsService.resolveDateRange(
        'CUSTOM',
        '2026-08-01',
        '2026-08-31',
        'America/New_York',
      );
      expect(range.startDate).toBe('2026-08-01');
      expect(range.endDate).toBe('2026-08-31');
      expect(range.previousStartDate).toBeDefined();
      expect(range.previousEndDate).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 2. LEVEL 1: CLIENT ANALYTICS API
  // -------------------------------------------------------------
  describe('2. Level 1 Client Analytics API', () => {
    it('GET client/overview: should return comprehensive client overview', async () => {
      const athleteUser = { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA, email: 'vance@alpha.local', status: 'ACTIVE' } as any;
      const res = await analyticsController.getClientOverview(athleteUser, athleteA, '30_DAYS');

      expect(res).toBeDefined();
      expect(res.userId).toBe(athleteA);
      expect(res.workout.totalPlanned).toBe(4);
      expect(res.workout.totalCompleted).toBe(3);
      expect(res.workout.adherencePercentage).toBe(75); // 3/4 = 75%
      expect(res.workout.totalVolumeKg).toBe(4200);
      expect(res.nutrition.adherencePercentage).toBe(98);
      expect(res.activity.averageSteps).toBe(11200);
      expect(res.progress.currentWeightKg).toBe(83.2);
    });

    it('GET client/trends: should return time series for charts', async () => {
      const athleteUser = { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA, email: 'vance@alpha.local', status: 'ACTIVE' } as any;
      const res = await analyticsController.getClientTrends(athleteUser, athleteA, '30_DAYS');

      expect(res).toBeDefined();
      expect(res.userId).toBe(athleteA);
      expect(res.trendSeries.dates).toContain('2026-09-18');
      expect(res.trendSeries.volumeKg).toContain(4200);
      expect(res.trendSeries.steps).toContain(11200);
    });
  });

  // -------------------------------------------------------------
  // 3. LEVEL 2: COACH ANALYTICS API
  // -------------------------------------------------------------
  describe('3. Level 2 Coach Analytics API', () => {
    it('GET coach/overview: should return coach portfolio and workload', async () => {
      const coachUser = { id: coachA, role: UserRole.COACH, organizationId: orgA, email: 'coach@alpha.local', status: 'ACTIVE' } as any;
      const res = await analyticsController.getCoachOverview(coachUser, coachA, '30_DAYS');

      expect(res.coachId).toBe(coachA);
      expect(res.workload.totalAssignedClients).toBe(1);
      expect(res.workload.activeClientsCount).toBe(1);
      expect(res.workload.messagesSent).toBe(12);
      expect(res.workload.activeProgramsCount).toBe(3);
      expect(res.overallWorkoutAdherence).toBe(75);
      expect(res.clientAdherenceList.length).toBe(1);
    });

    it('GET coach/clients: should return client adherence list', async () => {
      const coachUser = { id: coachA, role: UserRole.COACH, organizationId: orgA, email: 'coach@alpha.local', status: 'ACTIVE' } as any;
      const res = await analyticsController.getCoachClients(coachUser, coachA, '30_DAYS');

      expect(res.coachId).toBe(coachA);
      expect(res.totalClients).toBe(1);
      expect(res.clients[0]?.clientName).toBe('Marcus Vance');
      expect(res.clients[0]?.workoutAdherence).toBe(75);
    });

    it('GET coach/programs: should return program adoption metrics', async () => {
      const coachUser = { id: coachA, role: UserRole.COACH, organizationId: orgA, email: 'coach@alpha.local', status: 'ACTIVE' } as any;
      const res = await analyticsController.getCoachPrograms(coachUser, coachA);

      expect(res.length).toBe(1);
      expect(res[0]?.title).toBe('Hypertrophy Split V1');
      expect(res[0]?.totalAssignments).toBe(1);
      expect(res[0]?.activeAssignments).toBe(1);
    });
  });

  // -------------------------------------------------------------
  // 4. LEVEL 3: ORGANIZATION EXECUTIVE ANALYTICS API
  // -------------------------------------------------------------
  describe('4. Level 3 Organization Executive Analytics API', () => {
    it('GET organization/overview: should return executive KPIs with period comparisons', async () => {
      const adminUser = { id: 'admin_1', role: UserRole.ORG_ADMIN, organizationId: orgA, email: 'admin@alpha.local', status: 'ACTIVE' } as any;
      const res = await analyticsController.getOrganizationOverview(adminUser, orgA, '30_DAYS');

      expect(res.organizationId).toBe(orgA);
      expect(res.totalClients.value).toBe(25);
      expect(res.activeClients.value).toBe(1);
      expect(res.workoutAdherence.value).toBe(75);
      expect(res.nutritionAdherence.value).toBe(98);

      // Verify comparison object
      expect(res.workoutAdherence.comparison).toBeDefined();
      expect(res.workoutAdherence.comparison?.changePercentagePoints).toBeDefined();
    });

    it('GET organization/coaches: should return coach roster and load distribution', async () => {
      const adminUser = { id: 'admin_1', role: UserRole.ORG_ADMIN, organizationId: orgA, email: 'admin@alpha.local', status: 'ACTIVE' } as any;
      const res = await analyticsController.getOrganizationCoaches(adminUser, orgA);

      expect(res.length).toBe(1);
      expect(res[0]?.coachId).toBe(coachA);
      expect(res[0]?.name).toBe('Coach Marcus');
      expect(res[0]?.activeClientsCount).toBe(1);
    });
  });

  // -------------------------------------------------------------
  // 5. KPI CATALOG API
  // -------------------------------------------------------------
  describe('5. KPI Catalog API', () => {
    it('GET kpis: should return catalog with definitions and versions', async () => {
      const res = await kpisController.getAllKpis();
      expect(res.count).toBeGreaterThanOrEqual(12);
      expect(res.kpis.some((k) => k.code === 'WORKOUT_ADHERENCE')).toBe(true);
    });

    it('GET kpis/:code: should return exact KPI definition', async () => {
      const res = await kpisController.getKpiByCode('ACTIVE_CLIENTS');
      expect(res.code).toBe('ACTIVE_CLIENTS');
      expect(res.unit).toBe('COUNT');
      expect(res.version).toBe(1);
    });
  });
});
