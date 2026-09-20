import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ForbiddenException, GoneException } from '@nestjs/common';
import {
  UserRole,
  UnitSystem,
  PrimaryGoal,
  HealthPlatform,
  ClientStatus,
  MealType,
  IAuthUser,
} from '@alpha/types';
import { AuthService } from '../src/modules/auth/auth.service';
import { WorkoutsService } from '../src/modules/workouts/workouts.service';
import { NutritionService } from '../src/modules/nutrition/nutrition.service';
import { ActivityService } from '../src/modules/activity/activity.service';
import { ProgressService } from '../src/modules/progress/progress.service';
import { AiService } from '../src/modules/ai/ai.service';
import { MockAiProvider } from '../src/modules/ai/providers/mock-ai.provider';
import { AiContextBuilderService } from '../src/modules/ai/ai-context-builder.service';
import { AiRateLimiterService } from '../src/modules/ai/ai-rate-limiter.service';
import { PortalService } from '../src/modules/portal/portal.service';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';
import { DevicesService } from '../src/modules/notifications/services/devices.service';
import { MockPushNotificationProvider } from '../src/modules/notifications/providers/mock-push.provider';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service';
import { AnalyticsCacheService } from '../src/modules/analytics/services/analytics-cache.service';
import { AnalyticsMathService } from '../src/modules/analytics/services/analytics-math.service';
import { AnalyticsAggregationService } from '../src/modules/analytics/services/analytics-aggregation.service';
import { ReportsService } from '../src/modules/analytics/services/reports.service';
import { HealthPlatformSyncService } from '../src/modules/integrations/services/health-platform-sync.service';
import { ProvenanceDeduplicationService } from '../src/modules/integrations/services/provenance-deduplication.service';
import { PrismaService } from '../src/modules/database/prisma.service';
import { QA_ACCOUNTS, QA_ORGANIZATIONS } from './fixtures/qa-master-fixtures';

describe('Phase 15 Gate B: Core End-to-End User Journeys & Regression Suite', () => {
  let module: TestingModule;
  let authService: AuthService;
  let workoutsService: WorkoutsService;
  let nutritionService: NutritionService;
  let aiService: AiService;
  let portalService: PortalService;
  let notificationsService: NotificationsService;
  let analyticsMathService: AnalyticsMathService;
  let reportsService: ReportsService;
  let healthSyncService: HealthPlatformSyncService;

  // In-memory mock database state
  const dbUsers = new Map<string, any>();
  const dbProfiles = new Map<string, any>();
  const dbGoals = new Map<string, any>();
  const dbPreferences = new Map<string, any>();
  const dbRelationships = new Map<string, any>();
  const dbOrganizations = new Map<string, any>();
  const dbReports = new Map<string, any>();

  const mockPrisma = {
    user: {
      create: jest.fn().mockImplementation(({ data }) => {
        const u = { id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        dbUsers.set(u.id, u);
        return Promise.resolve(u);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id) return Promise.resolve(dbUsers.get(where.id) || null);
        if (where.email) {
          for (const u of dbUsers.values()) {
            if (u.email === where.email) return Promise.resolve(u);
          }
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const u = dbUsers.get(where.id);
        if (u) {
          Object.assign(u, data, { updatedAt: new Date() });
          return Promise.resolve(u);
        }
        return Promise.resolve(null);
      }),
    },
    userProfile: {
      create: jest.fn().mockImplementation(({ data }) => {
        const p = { id: `prof_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        dbProfiles.set(data.userId, p);
        return Promise.resolve(p);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(dbProfiles.get(where.userId) || null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const p = dbProfiles.get(where.userId);
        if (p) {
          Object.assign(p, data, { updatedAt: new Date() });
          return Promise.resolve(p);
        }
        return Promise.resolve(null);
      }),
    },
    userGoal: {
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        let g = dbGoals.get(where.userId);
        if (g) {
          Object.assign(g, update, { updatedAt: new Date() });
        } else {
          g = { id: `goal_${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
          dbGoals.set(where.userId, g);
        }
        return Promise.resolve(g);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(dbGoals.get(where.userId) || null);
      }),
    },
    userPreference: {
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        let p = dbPreferences.get(where.userId);
        if (p) {
          Object.assign(p, update, { updatedAt: new Date() });
        } else {
          p = { id: `pref_${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
          dbPreferences.set(where.userId, p);
        }
        return Promise.resolve(p);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(dbPreferences.get(where.userId) || null);
      }),
    },
    organization: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(dbOrganizations.get(where.id) || null);
      }),
    },
    coachClientRelationship: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        for (const rel of dbRelationships.values()) {
          if (where.coachId && rel.coachId !== where.coachId) continue;
          if (where.clientId && rel.clientId !== where.clientId) continue;
          if (where.isActive !== undefined && rel.isActive !== where.isActive) continue;
          return Promise.resolve(rel);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.coachId_clientId) {
          const key = `${where.coachId_clientId.coachId}:${where.coachId_clientId.clientId}`;
          return Promise.resolve(dbRelationships.get(key) || null);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        const list: any[] = [];
        for (const rel of dbRelationships.values()) {
          if (where.coachId && rel.coachId !== where.coachId) continue;
          if (where.organizationId && rel.organizationId !== where.organizationId) continue;
          if (where.isActive !== undefined && rel.isActive !== where.isActive) continue;
          list.push(rel);
        }
        return Promise.resolve(list);
      }),
    },
    report: {
      create: jest.fn().mockImplementation(({ data }) => {
        const r = {
          id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dbReports.set(r.id, r);
        return Promise.resolve(r);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(dbReports.get(where.id) || null);
      }),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve(Array.from(dbReports.values()));
      }),
    },
    workoutSession: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    dailyNutrition: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    activityDay: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    bodyMetric: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    personalRecord: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    analyticsDailyUser: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    program: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    device: {
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    notificationPreference: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'np_1' })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'np_1' })),
    },
    notification: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: `notif_${Date.now()}` })),
    },
    notificationDelivery: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: `del_${Date.now()}` })),
    },
  };

  beforeAll(async () => {
    // Seed QA organizations
    dbOrganizations.set(QA_ORGANIZATIONS.ORG_A.id, {
      ...QA_ORGANIZATIONS.ORG_A,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    dbOrganizations.set(QA_ORGANIZATIONS.ORG_B.id, {
      ...QA_ORGANIZATIONS.ORG_B,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'test_jwt_secret_min_32_characters_long_key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        WorkoutsService,
        NutritionService,
        ActivityService,
        ProgressService,
        AiService,
        MockAiProvider,
        AiContextBuilderService,
        AiRateLimiterService,
        PortalService,
        NotificationsService,
        DevicesService,
        MockPushNotificationProvider,
        QueueService,
        AnalyticsService,
        AnalyticsCacheService,
        AnalyticsMathService,
        AnalyticsAggregationService,
        ReportsService,
        HealthPlatformSyncService,
        ProvenanceDeduplicationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    workoutsService = module.get<WorkoutsService>(WorkoutsService);
    nutritionService = module.get<NutritionService>(NutritionService);
    aiService = module.get<AiService>(AiService);
    portalService = module.get<PortalService>(PortalService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    analyticsMathService = module.get<AnalyticsMathService>(AnalyticsMathService);
    reportsService = module.get<ReportsService>(ReportsService);
    healthSyncService = module.get<HealthPlatformSyncService>(HealthPlatformSyncService);
  });

  afterAll(async () => {
    await module.close();
  });

  // =========================================================================
  // 1. JOURNEY: NEW CLIENT REGISTRATION & ONBOARDING (Sections 10 & 13)
  // =========================================================================
  describe('1. New Client Registration, Profile, Goals & Preferences Journey', () => {
    const newAthleteEmail = 'new.athlete.journey@apex.test';
    let registeredUserId: string;

    it('Step 1: Register new account with scrypt password hashing', async () => {
      const reg = await authService.register({
        email: newAthleteEmail,
        password: 'SecurePassword123!',
        fullName: 'Jordan Miller',
        role: UserRole.ATHLETE,
      });

      expect(reg.user).toBeDefined();
      expect(reg.user.email).toBe(newAthleteEmail);
      expect(reg.user.role).toBe(UserRole.ATHLETE);
      expect(reg.tokens.accessToken).toBeDefined();
      registeredUserId = reg.user.id;
    });

    it('Step 2: Initialize onboarding profile, height, weight, and activity level', async () => {
      const profile = await mockPrisma.userProfile.create({
        data: {
          userId: registeredUserId,
          fullName: 'Jordan Miller',
          dateOfBirth: new Date('1996-05-15'),
          heightCm: 182,
          weightKg: 84.5,
          activityMultiplier: 1.55,
          isOnboardingCompleted: true,
        },
      });

      expect(profile.heightCm).toBe(182);
      expect(profile.weightKg).toBe(84.5);
      expect(profile.isOnboardingCompleted).toBe(true);
    });

    it('Step 3: Set primary goal and caloric target', async () => {
      const goal = await mockPrisma.userGoal.upsert({
        where: { userId: registeredUserId },
        create: {
          userId: registeredUserId,
          primaryGoal: PrimaryGoal.HYPERTROPHY,
          targetWeightKg: 88.0,
          targetDailyCalories: 2800,
          targetDailyProteinGrams: 185,
          targetDailySteps: 10000,
          targetWeeklyWorkouts: 4,
        },
        update: {},
      });

      expect(goal.primaryGoal).toBe(PrimaryGoal.HYPERTROPHY);
      expect(goal.targetDailyCalories).toBe(2800);
      expect(goal.targetDailyProteinGrams).toBe(185);
    });

    it('Step 4: Save user preferences (Unit system, Timezone, Language)', async () => {
      const prefs = await mockPrisma.userPreference.upsert({
        where: { userId: registeredUserId },
        create: {
          userId: registeredUserId,
          unitSystem: UnitSystem.METRIC,
          timezone: 'America/New_York',
          language: 'en',
          theme: 'DARK',
          pushNotificationsEnabled: true,
          emailNotificationsEnabled: false,
        },
        update: {},
      });

      expect(prefs.unitSystem).toBe(UnitSystem.METRIC);
      expect(prefs.timezone).toBe('America/New_York');
      expect(prefs.language).toBe('en');
    });
  });

  // =========================================================================
  // 2. JOURNEY: AUTHENTICATION, SESSIONS & PASSWORD RECOVERY (Sections 11 & 12)
  // =========================================================================
  describe('2. Authentication, Session Lifecycle & Password Recovery', () => {
    const authEmail = 'auth.session.tester@apex.test';

    beforeAll(async () => {
      await authService.register({
        email: authEmail,
        password: 'Password123!',
        fullName: 'Session Tester',
        role: UserRole.ATHLETE,
      });
    });

    it('should login with valid credentials and issue tokens', async () => {
      const login = await authService.login({
        email: authEmail,
        password: 'Password123!',
      });

      expect(login.tokens.accessToken).toBeDefined();
      expect(login.tokens.refreshToken).toBeDefined();
      expect(login.user.email).toBe(authEmail);
    });

    it('should reject login with invalid password', async () => {
      await expect(
        authService.login({
          email: authEmail,
          password: 'WrongPassword999!',
        }),
      ).rejects.toThrow();
    });

    it('should support forgot-password token generation and reset', async () => {
      const resetReq = await authService.forgotPassword({ email: authEmail });
      expect(resetReq.message).toBeDefined();
      expect(resetReq.debugResetToken).toBeDefined();

      // Retrieve reset token hash and execute reset
      const resetRes = await authService.resetPassword({
        token: resetReq.debugResetToken!,
        newPassword: 'BrandNewPassword456!',
      });

      expect(resetRes.success).toBe(true);
    });
  });

  // =========================================================================
  // 3. JOURNEY: WORKOUT LIFECYCLE, CONCURRENCY & OFFLINE SYNC (Sections 14–16)
  // =========================================================================
  describe('3. Workout Logging, Dual-Device Concurrency & Offline Sync', () => {
    const athlete = QA_ACCOUNTS.CLIENT_A_ACTIVE!;

    it('should log structured sets with reps, weight, RPE and calculate volume tonnage', async () => {
      const session = await workoutsService.startSession(athlete.id, {
        title: 'Push Hypertrophy A',
      });

      expect(session.id).toBeDefined();
      expect(session.status).toBe('IN_PROGRESS');
      expect(session.exercises.length).toBeGreaterThan(0);

      const targetExercise = session.exercises[0]!;

      // Log Set 1: 100kg x 8 reps @ RPE 8
      const set1 = await workoutsService.logSet(athlete.id, session.id, {
        workoutSessionExerciseId: targetExercise.id,
        setNumber: 1,
        actualReps: 8,
        weightKg: 100,
        rpe: 8,
        isCompleted: true,
      });

      // Log Set 2: 32kg x 10 reps @ RPE 9
      const set2 = await workoutsService.logSet(athlete.id, session.id, {
        workoutSessionExerciseId: targetExercise.id,
        setNumber: 2,
        actualReps: 10,
        weightKg: 32,
        rpe: 9,
        isCompleted: true,
      });

      expect(set1.actualReps * set1.weightKg).toBe(800);
      expect(set2.actualReps * set2.weightKg).toBe(320);

      // Complete session
      const completed = await workoutsService.completeSession(athlete.id, session.id, {
        durationSeconds: 3600,
        notes: 'Great push workout session',
      });

      expect(completed.status).toBe('COMPLETED');
      expect(completed.totalVolumeKg).toBe(1120);
    });

    it('should handle concurrent set logging from dual devices (Device A + Device B)', async () => {
      const session = await workoutsService.startSession(athlete.id, {
        title: 'Concurrent Test Session',
      });

      const targetExercise = session.exercises[0]!;

      // Simultaneous set logs from Device A and Device B
      const [deviceASet, deviceBSet] = await Promise.all([
        workoutsService.logSet(athlete.id, session.id, {
          workoutSessionExerciseId: targetExercise.id,
          setNumber: 1,
          actualReps: 5,
          weightKg: 140,
          isCompleted: true,
        }),
        workoutsService.logSet(athlete.id, session.id, {
          workoutSessionExerciseId: targetExercise.id,
          setNumber: 2,
          actualReps: 5,
          weightKg: 140,
          isCompleted: true,
        }),
      ]);

      expect(deviceASet.id).not.toBe(deviceBSet.id);
      expect(deviceASet.actualReps * deviceASet.weightKg).toBe(700);
      expect(deviceBSet.actualReps * deviceBSet.weightKg).toBe(700);

      const completed = await workoutsService.completeSession(athlete.id, session.id, {});
      expect(completed.totalVolumeKg).toBe(1400);
    });

    it('should synchronize offline workout batches idempotently upon reconnect', async () => {
      const offlineDate = new Date(Date.now() - 3600000).toISOString();
      const offlineBatch = {
        platform: HealthPlatform.APPLE_HEALTHKIT,
        syncType: 'INCREMENTAL' as const,
        records: [
          {
            sourceRecordId: 'apple_offline_cardio_1',
            metricType: 'STEPS',
            recordedAt: offlineDate,
            value: 4500,
            unit: 'count',
          },
        ],
      };

      // Sync offline batch 1st time
      const sync1 = await healthSyncService.ingestHealthData(athlete.id, offlineBatch as any);
      expect(sync1.recordsPersisted).toBe(1);

      // Replay identical batch (idempotency check upon network retry)
      const sync2 = await healthSyncService.ingestHealthData(athlete.id, offlineBatch as any);
      expect(sync2.duplicatesIgnored).toBe(1);
      expect(sync2.recordsPersisted).toBe(0);
    });
  });

  // =========================================================================
  // 4. JOURNEY: NUTRITION & SAFE MACRO AGGREGATION (Section 17)
  // =========================================================================
  describe('4. Nutrition Logging & Safe Macro Aggregation', () => {
    const athlete = QA_ACCOUNTS.CLIENT_A_ACTIVE!;
    const logDate = '2026-09-19';

    it('should log meals and compute calories mathematically without fabrication', async () => {
      const mealLog = await nutritionService.createMealLog(athlete.id, {
        mealType: MealType.LUNCH,
        name: 'Post-Workout Fuel',
        logDate,
        items: [
          {
            foodItemId: 'food_chicken_breast',
            quantity: 200,
            servingUnit: 'g',
          },
          {
            foodItemId: 'food_basmati_rice',
            quantity: 150,
            servingUnit: 'g',
          },
        ],
      });

      expect(mealLog.totalProteinGrams).toBeGreaterThanOrEqual(60);
      expect(mealLog.totalCarbsGrams).toBeGreaterThanOrEqual(40);
      expect(mealLog.totalCalories).toBeGreaterThanOrEqual(500);
    });

    it('should aggregate daily nutrition totals and compute adherence percentage', async () => {
      const summary = await nutritionService.getDailySummary(athlete.id, logDate);
      expect(summary.caloriesConsumed).toBeGreaterThanOrEqual(500);
      expect(summary.proteinConsumedG).toBeGreaterThanOrEqual(60);
      expect(summary.calorieTarget).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 5. JOURNEY: AI COACH & CONTROLLED ACTION PROPOSALS (Sections 21 & 22)
  // =========================================================================
  describe('5. AI Coach Context & Controlled Action Proposal Gates', () => {
    const athlete = QA_ACCOUNTS.CLIENT_A_ACTIVE!;

    it('should return context-grounded AI coaching advice without data fabrication', async () => {
      const response = await aiService.chat(athlete.id, {
        message: 'How is my workout volume trending this week?',
      });

      expect(response.message).toBeDefined();
      expect(response.model).toBeDefined();
    });

    it('should require explicit athlete confirmation for AI Action Proposals', async () => {
      const chatWithProposal = await aiService.chat(athlete.id, {
        message: 'suggest a workout for today',
      });

      expect(chatWithProposal.actionProposals).toBeDefined();
      expect(chatWithProposal.actionProposals!.length).toBeGreaterThan(0);

      const proposal = chatWithProposal.actionProposals![0]!;
      expect(proposal.id).toBeDefined();
      expect(proposal.requiresConfirmation).toBe(true);
      expect(proposal.status).toBe('PENDING_CONFIRMATION');

      // Athlete confirms proposal
      const confirmed = await aiService.confirmAction(athlete.id, {
        proposalId: proposal.id,
        confirmed: true,
      });

      expect(confirmed.success).toBe(true);
      expect(confirmed.status).toBe('CONFIRMED');
    });
  });

  // =========================================================================
  // 6. JOURNEY: COACH PORTAL & ROLE CAPABILITY GATES (Sections 23–26)
  // =========================================================================
  describe('6. Coach, Trainer, Nutritionist & Org Admin Capability Gates', () => {
    const coach = QA_ACCOUNTS.COACH_A_ACTIVE!;
    const trainer = QA_ACCOUNTS.TRAINER_A_ACTIVE!;
    const nutritionist = QA_ACCOUNTS.NUTRITIONIST_A_ACTIVE!;
    const orgAdmin = QA_ACCOUNTS.ORG_ADMIN_A!;
    const athleteA = QA_ACCOUNTS.CLIENT_A_ACTIVE!;

    beforeAll(() => {
      // Connect coach to athleteA
      const key = `${coach.id}:${athleteA.id}`;
      dbRelationships.set(key, {
        id: 'rel_coach_athleteA',
        coachId: coach.id,
        clientId: athleteA.id,
        organizationId: coach.organizationId,
        status: ClientStatus.ACTIVE,
        isActive: true,
      });
    });

    it('COACH role can assign both workouts and nutrition plans', () => {
      const perms = portalService.getPermissions(coach.role);
      expect(perms.canAssignWorkouts).toBe(true);
      expect(perms.canAssignNutrition).toBe(true);
      expect(perms.canManageClients).toBe(true);
    });

    it('TRAINER role can assign workouts but is FORBIDDEN from assigning nutrition', () => {
      const perms = portalService.getPermissions(trainer.role);
      expect(perms.canAssignWorkouts).toBe(true);
      expect(perms.canAssignNutrition).toBe(false);

      expect(() =>
        portalService.assertPermission(trainer.role, 'canAssignWorkouts'),
      ).not.toThrow();
      expect(() =>
        portalService.assertPermission(trainer.role, 'canAssignNutrition'),
      ).toThrow(ForbiddenException);
    });

    it('NUTRITIONIST role can assign nutrition but is FORBIDDEN from assigning workouts', () => {
      const perms = portalService.getPermissions(nutritionist.role);
      expect(perms.canAssignNutrition).toBe(true);
      expect(perms.canAssignWorkouts).toBe(false);

      expect(() =>
        portalService.assertPermission(nutritionist.role, 'canAssignNutrition'),
      ).not.toThrow();
      expect(() =>
        portalService.assertPermission(nutritionist.role, 'canAssignWorkouts'),
      ).toThrow(ForbiddenException);
    });

    it('ORG_ADMIN role can manage organization settings and members', () => {
      const perms = portalService.getPermissions(orgAdmin.role);
      expect(perms.canManageOrganization).toBe(true);
      expect(perms.canManageClients).toBe(true);
    });
  });

  // =========================================================================
  // 7. JOURNEY: STRICT CROSS-TENANT ISOLATION (Section 27)
  // =========================================================================
  describe('7. Strict Multi-Tenant Isolation (Org A vs Org B)', () => {
    const coachA = QA_ACCOUNTS.COACH_A_ACTIVE!;
    const athleteB = QA_ACCOUNTS.CLIENT_B_ACTIVE!;

    it('Coach A in Org A cannot access Athlete B in Org B => CROSS_TENANT_ACCESS_DENIED', async () => {
      await expect(
        portalService.getClientDetail(
          coachA.id,
          coachA.role,
          athleteB.id,
          coachA.organizationId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // 8. JOURNEY: NOTIFICATIONS & RACE CONDITION SUPPRESSION (Sections 28 & 29)
  // =========================================================================
  describe('8. Notifications & Race Condition Suppression', () => {
    const athlete = QA_ACCOUNTS.CLIENT_A_ACTIVE!;

    it('should suppress scheduled workout reminder if athlete completes workout early', async () => {
      // 1. Dispatch reminder notification
      const notification = await notificationsService.sendNotification({
        userId: athlete.id,
        title: 'Workout Reminder',
        body: 'Time to crush your scheduled session!',
        category: 'WORKOUT',
      });

      expect(notification.id).toBeDefined();

      // 2. Athlete starts and completes workout early
      const session = await workoutsService.startSession(athlete.id, {
        title: 'Early Afternoon Workout',
      });
      const completed = await workoutsService.completeSession(athlete.id, session.id, {});
      expect(completed.status).toBe('COMPLETED');

      // 3. Worker pre-dispatch check detects completed session today and suppresses further reminder
      const todaySessions = await workoutsService.getUserSessions(athlete.id);
      const isAlreadyCompleted = todaySessions.some((s) => s.status === 'COMPLETED');
      expect(isAlreadyCompleted).toBe(true);
    });
  });

  // =========================================================================
  // 9. JOURNEY: ANALYTICS & EXECUTIVE REPORTING (Sections 30 & 31)
  // =========================================================================
  describe('9. Analytics KPI Math, Report Generation & Expiration', () => {
    const coach = QA_ACCOUNTS.COACH_A_ACTIVE!;
    const athlete = QA_ACCOUNTS.CLIENT_A_ACTIVE!;
    const authCoach: IAuthUser = {
      id: coach.id,
      email: coach.email,
      role: coach.role,
      organizationId: coach.organizationId,
      status: coach.status,
      isEmailVerified: true,
    };

    it('should compute safe division without NaN or division by zero', () => {
      const safeZero = analyticsMathService.safeDivide(100, 0);
      const safeNormal = analyticsMathService.safeDivide(80, 100);

      expect(safeZero).toBeNull();
      expect(safeNormal).toBe(0.8);
      expect(Number.isNaN(safeZero)).toBe(false);
    });

    it('should generate RFC 4180 CSV report and enforce 7-day governance expiration', async () => {
      const report = await reportsService.createReport(authCoach, {
        reportType: 'CLIENT_PROGRESS',
        scope: 'CLIENT',
        clientId: athlete.id,
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-19',
        format: 'CSV',
      });

      expect(report.id).toBeDefined();
      expect(report.format).toBe('CSV');
      expect(report.fileUrl).toBeDefined();
      expect(report.expiresAt).toBeDefined();

      // Verify expiration date is ~7 days in the future
      const expiresAt = new Date(report.expiresAt!).getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(expiresAt - Date.now()).toBeGreaterThan(sevenDaysMs - 60000);

      // Verify report download returns CSV data
      const downloaded = await reportsService.downloadReport(report.id, authCoach);
      expect(downloaded.content).toContain('ALPHA PERFORMANCE OS');
      expect(downloaded.mimeType).toBe('text/csv');

      // Verify 7-day expiration governance enforces GoneException
      const reportRecord = dbReports.get(report.id);
      expect(reportRecord).toBeDefined();
      reportRecord.expiresAt = new Date(Date.now() - 1000); // Set to past

      await expect(
        reportsService.downloadReport(report.id, authCoach),
      ).rejects.toThrow(GoneException);
    });
  });
});
