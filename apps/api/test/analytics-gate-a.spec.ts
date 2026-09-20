import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/modules/database/prisma.service';
import { KpiCatalogService } from '../src/modules/analytics/services/kpi-catalog.service';
import { AnalyticsMathService } from '../src/modules/analytics/services/analytics-math.service';
import { AnalyticsAggregationService } from '../src/modules/analytics/services/analytics-aggregation.service';
import { AnalyticsAuthorizationGuard } from '../src/modules/analytics/guards/analytics-authorization.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@alpha/types';

describe('Phase 10 Gate A — Analytics Definitions, Models & Aggregation Engine', () => {
  let catalogService: KpiCatalogService;
  let mathService: AnalyticsMathService;
  let aggregationService: AnalyticsAggregationService;
  let authGuard: AnalyticsAuthorizationGuard;

  const orgA = 'org_enterprise_alpha';
  const orgB = 'org_competitor_beta';
  const coachA = 'usr_coach_01';
  const athleteA = 'usr_athlete_alpha';
  const athleteB = 'usr_athlete_beta';

  // In-memory mock Prisma
  const mockPrisma = {
    kPIDefinition: {
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'kpi_1', ...create })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === athleteA) {
          return Promise.resolve({ id: athleteA, organizationId: orgA, role: UserRole.ATHLETE });
        }
        if (where.id === athleteB) {
          return Promise.resolve({ id: athleteB, organizationId: orgB, role: UserRole.ATHLETE });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        if (where.organizationId === orgA) {
          if (where.role === 'ATHLETE') return Promise.resolve(10);
          return Promise.resolve(2);
        }
        return Promise.resolve(0);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.organizationId === orgA && where.role === 'ATHLETE') {
          return Promise.resolve([{ id: athleteA }]);
        }
        return Promise.resolve([]);
      }),
    },
    coachClientRelationship: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        // Coach A is assigned to Athlete A in Org A
        if (where.coachId === coachA && where.clientId === athleteA && where.isActive) {
          return Promise.resolve({ id: 'rel_1', coachId: coachA, clientId: athleteA, isActive: true, status: 'ACTIVE' });
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.coachId === coachA) {
          return Promise.resolve([
            {
              id: 'rel_1',
              coachId: coachA,
              clientId: athleteA,
              client: {
                id: athleteA,
                email: 'athlete.a@alpha.local',
                profile: { fullName: 'Alpha Athlete', avatarUrl: null },
              },
            },
          ]);
        }
        return Promise.resolve([]);
      }),
    },
    workoutSession: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'ws_1',
          userId: athleteA,
          status: 'COMPLETED',
          durationSeconds: 2700,
          totalVolumeKg: 1000,
          exercises: [
            {
              sets: [
                { isCompleted: true, weightKg: 100, actualReps: 5 }, // 500 kg
                { isCompleted: true, weightKg: 100, actualReps: 5 }, // 500 kg
              ],
            },
          ],
        },
        {
          id: 'ws_2',
          userId: athleteA,
          status: 'SKIPPED',
          durationSeconds: 0,
          totalVolumeKg: 0,
          exercises: [],
        },
      ]),
    },
    personalRecord: {
      count: jest.fn().mockResolvedValue(1),
    },
    dailyMealLog: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'dml_1',
          userId: athleteA,
          logDate: new Date('2026-09-18T12:00:00.000Z'),
          items: [
            { id: 'mi_1', calories: 1000, proteinGrams: 80, carbsGrams: 100, fatGrams: 30 },
            { id: 'mi_2', calories: 1500, proteinGrams: 100, carbsGrams: 150, fatGrams: 40 },
          ],
        },
      ]),
    },
    hydrationLog: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'h_1', amountMl: 1000, logDate: new Date('2026-09-18T12:00:00.000Z') },
        { id: 'h_2', amountMl: 1500, logDate: new Date('2026-09-18T16:00:00.000Z') },
      ]),
    },
    userGoal: {
      findUnique: jest.fn().mockResolvedValue({
        userId: athleteA,
        targetDailyCalories: 2500,
        targetDailyProteinGrams: 180,
      }),
    },
    activityRecord: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'ar_1', stepCount: 10500, activeMinutes: 60, activeCalories: 500 },
      ]),
    },
    cardioSession: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'cs_1', durationSeconds: 1800, distanceMeters: 5000 },
      ]),
    },
    bodyMetric: {
      findFirst: jest.fn().mockResolvedValue({ weightKg: 82.5, recordedAt: new Date() }),
    },
    analyticsDailyUser: {
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'adu_1', ...create })),
      findMany: jest.fn().mockResolvedValue([
        {
          userId: athleteA,
          date: '2026-09-18',
          plannedWorkouts: 2,
          completedWorkouts: 1,
          skippedWorkouts: 1,
          workoutVolumeKg: 1000,
          workoutDurationMinutes: 45,
          prsAchieved: 1,
          mealsLogged: 3,
          caloriesConsumed: 2500,
          calorieTarget: 2500,
          proteinGrams: 180,
          carbsGrams: 250,
          fatsGrams: 70,
          nutritionAdherenceScore: 100,
          waterMl: 2500,
          waterTargetMl: 2500,
          steps: 10500,
          activeMinutes: 60,
          cardioDurationMinutes: 30,
          cardioDistanceMeters: 5000,
          bodyWeightKg: 82.5,
          isActiveDay: true,
        },
      ]),
    },
    coachMessage: {
      count: jest.fn().mockResolvedValue(5),
    },
    programAssignment: {
      count: jest.fn().mockResolvedValue(1),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        KpiCatalogService,
        AnalyticsMathService,
        AnalyticsAggregationService,
        AnalyticsAuthorizationGuard,
      ],
    }).compile();

    catalogService = module.get<KpiCatalogService>(KpiCatalogService);
    mathService = module.get<AnalyticsMathService>(AnalyticsMathService);
    aggregationService = module.get<AnalyticsAggregationService>(AnalyticsAggregationService);
    authGuard = module.get<AnalyticsAuthorizationGuard>(AnalyticsAuthorizationGuard);
  });

  // -------------------------------------------------------------
  // 1. KPI CATALOG VERIFICATION
  // -------------------------------------------------------------
  describe('1. Centralized KPI Catalog & Definitions', () => {
    it('should provide comprehensive definitions for core client, coach, and org KPIs', () => {
      const allKpis = catalogService.getAllDefinitions();
      expect(allKpis.length).toBeGreaterThanOrEqual(12);

      const adherence = catalogService.getDefinition('WORKOUT_ADHERENCE');
      expect(adherence).toBeDefined();
      expect(adherence.unit).toBe('PERCENTAGE');
      expect(adherence.version).toBe(1);
      expect(adherence.calculationFormula).toContain('completed_planned_workouts');
      expect(adherence.sourceTables).toContain('workout_sessions');

      const activeClients = catalogService.getDefinition('ACTIVE_CLIENTS');
      expect(activeClients.unit).toBe('COUNT');
      expect(activeClients.qualifyingCriteria).toContain('Qualifying event');
    });

    it('should support category filtering', () => {
      const workoutKpis = catalogService.getAllDefinitions('WORKOUT');
      expect(workoutKpis.every((k) => k.category === 'WORKOUT')).toBe(true);
    });

    it('should verify KPI versioning accurately', () => {
      expect(catalogService.verifyVersion('WORKOUT_ADHERENCE', 1)).toBe(true);
      expect(catalogService.verifyVersion('WORKOUT_ADHERENCE', 2)).toBe(false);
    });

    it('should sync catalog definitions to database', async () => {
      const synced = await catalogService.syncCatalogToDatabase();
      expect(synced).toBeGreaterThanOrEqual(12);
      expect(mockPrisma.kPIDefinition.upsert).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------
  // 2. DETERMINISTIC MATH & DATA QUALITY CHECKS
  // -------------------------------------------------------------
  describe('2. Deterministic Math & Data Quality Checks', () => {
    it('should safely divide and avoid division by zero or NaN', () => {
      expect(mathService.safeDivide(10, 0)).toBeNull();
      expect(mathService.safeDivide(10, -5)).toBeNull();
      expect(mathService.safeDivide(10, 2)).toBe(5);
    });

    it('should bound percentages to [0, 100] and return null for empty denominator', () => {
      expect(mathService.calculatePercentage(0, 0)).toBeNull();
      expect(mathService.calculatePercentage(4, 5)).toBe(80);
      expect(mathService.calculatePercentage(150, 100)).toBe(100);
      expect(mathService.calculatePercentage(-10, 100)).toBe(0);
    });

    it('should calculate period comparison distinguishing percentage points vs relative growth', () => {
      // 84% current vs 78% previous:
      // Percentage points: 84 - 78 = +6.0 pp
      // Relative growth: ((84 - 78) / 78) * 100 = +7.7%
      const comparison = mathService.comparePeriods(84, 78, true);
      expect(comparison.changeAbsolute).toBe(6);
      expect(comparison.changePercentagePoints).toBe(6);
      expect(comparison.changePercentage).toBeCloseTo(7.7, 1);
      expect(comparison.trendDirection).toBe('UP');
    });

    it('should catch data quality violations (negative metrics or percentage > 100)', () => {
      expect(() => mathService.validateQuality('steps', -100)).toThrow('cannot be negative');
      expect(() => mathService.validateQuality('adherence', 120, true)).toThrow('cannot exceed 100%');
      expect(() => mathService.validateQuality('steps', 5000)).not.toThrow();
    });
  });

  // -------------------------------------------------------------
  // 3. DETERMINISTIC AGGREGATION ENGINE
  // -------------------------------------------------------------
  describe('3. Deterministic Aggregation Engine', () => {
    it('Level 1: should aggregate client daily performance from authoritative records', async () => {
      const daily = await aggregationService.aggregateClientDaily(athleteA, '2026-09-18', 'America/New_York');

      expect(daily).toBeDefined();
      expect(mockPrisma.analyticsDailyUser.upsert).toHaveBeenCalled();
      const callArg = (mockPrisma.analyticsDailyUser.upsert as jest.Mock).mock.calls[0][0];

      expect(callArg.create.plannedWorkouts).toBe(2);
      expect(callArg.create.completedWorkouts).toBe(1);
      expect(callArg.create.workoutVolumeKg).toBe(1000); // 100kg * 5 * 2 sets
      expect(callArg.create.prsAchieved).toBe(1);
      expect(callArg.create.caloriesConsumed).toBe(2500);
      expect(callArg.create.nutritionAdherenceScore).toBe(100); // exact match to 2500 target
      expect(callArg.create.waterMl).toBe(2500);
      expect(callArg.create.steps).toBe(10500);
      expect(callArg.create.bodyWeightKg).toBe(82.5);
      expect(callArg.create.isActiveDay).toBe(true);
    });

    it('Level 1: should calculate multi-day client analytics summary with adherence & weight trend', async () => {
      const summary = await aggregationService.getClientAnalyticsSummary(
        athleteA,
        '2026-09-01',
        '2026-09-18',
        '30_DAYS',
      );

      expect(summary.userId).toBe(athleteA);
      expect(summary.workout.totalPlanned).toBe(2);
      expect(summary.workout.totalCompleted).toBe(1);
      expect(summary.workout.adherencePercentage).toBe(50); // 1/2 = 50%
      expect(summary.workout.totalVolumeKg).toBe(1000);
      expect(summary.nutrition.adherencePercentage).toBe(100);
      expect(summary.activity.averageSteps).toBe(10500);
      expect(summary.progress.currentWeightKg).toBe(82.5);
    });

    it('Level 2: should aggregate coach portfolio and client adherence', async () => {
      const coachSummary = await aggregationService.getCoachAnalyticsSummary(
        coachA,
        '2026-09-01',
        '2026-09-18',
        '30_DAYS',
      );

      expect(coachSummary.coachId).toBe(coachA);
      expect(coachSummary.workload.totalAssignedClients).toBe(1);
      expect(coachSummary.workload.activeClientsCount).toBe(1);
      expect(coachSummary.workload.messagesSent).toBe(5);
      expect(coachSummary.overallWorkoutAdherence).toBe(50);
      expect(coachSummary.clientAdherenceList.length).toBe(1);
      const firstClient = coachSummary.clientAdherenceList[0];
      expect(firstClient).toBeDefined();
      expect(firstClient?.clientId).toBe(athleteA);
      expect(firstClient?.workoutAdherence).toBe(50);
      expect(firstClient?.isAtRisk).toBe(false);
    });

    it('Level 3: should aggregate organization executive metrics strictly within tenant', async () => {
      const orgOverview = await aggregationService.getOrganizationOverview(
        orgA,
        '2026-09-01',
        '2026-09-18',
        '30_DAYS',
      );

      expect(orgOverview.organizationId).toBe(orgA);
      expect(orgOverview.totalClients.value).toBe(10);
      expect(orgOverview.activeClients.value).toBe(1);
      expect(orgOverview.workoutAdherence.value).toBe(50);
      expect(orgOverview.nutritionAdherence.value).toBe(100);
    });
  });

  // -------------------------------------------------------------
  // 4. MULTI-TENANT AUTHORIZATION & SCOPE SECURITY
  // -------------------------------------------------------------
  describe('4. Multi-Tenant Authorization & Tenant Isolation', () => {
    const createMockContext = (user: any, path: string, query: any = {}, params: any = {}): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({
            user,
            path,
            query,
            params,
          }),
        }),
      } as unknown as ExecutionContext);

    it('Level 1: Athlete can access their own personal analytics', async () => {
      const ctx = createMockContext(
        { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA },
        '/api/v1/analytics/client/overview',
        { clientId: athleteA },
      );
      await expect(authGuard.canActivate(ctx)).resolves.toBe(true);
    });

    it('Level 1: Athlete A CANNOT access Athlete B analytics (DENIED)', async () => {
      const ctx = createMockContext(
        { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA },
        '/api/v1/analytics/client/overview',
        { clientId: athleteB },
      );
      await expect(authGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('Level 2: Coach A can access assigned Athlete A analytics', async () => {
      const ctx = createMockContext(
        { id: coachA, role: UserRole.COACH, organizationId: orgA },
        '/api/v1/analytics/client/overview',
        { clientId: athleteA },
      );
      await expect(authGuard.canActivate(ctx)).resolves.toBe(true);
    });

    it('Level 2: Coach A CANNOT access unassigned Athlete B analytics (DENIED)', async () => {
      const ctx = createMockContext(
        { id: coachA, role: UserRole.COACH, organizationId: orgA },
        '/api/v1/analytics/client/overview',
        { clientId: athleteB },
      );
      await expect(authGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('Level 3: Org Admin A can access Org A executive analytics', async () => {
      const ctx = createMockContext(
        { id: 'admin_a', role: UserRole.ORG_ADMIN, organizationId: orgA },
        '/api/v1/analytics/organization/overview',
        { organizationId: orgA },
      );
      await expect(authGuard.canActivate(ctx)).resolves.toBe(true);
    });

    it('Level 3: Org Admin A CANNOT access Org B executive analytics (CROSS-TENANT DENIED)', async () => {
      const ctx = createMockContext(
        { id: 'admin_a', role: UserRole.ORG_ADMIN, organizationId: orgA },
        '/api/v1/analytics/organization/overview',
        { organizationId: orgB },
      );
      await expect(authGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('Level 3: Athlete CANNOT access organization executive analytics (ROLE DENIED)', async () => {
      const ctx = createMockContext(
        { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA },
        '/api/v1/analytics/organization/overview',
        { organizationId: orgA },
      );
      await expect(authGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });
});
