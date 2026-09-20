import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PortalService } from '../src/modules/portal/portal.service';
import { PrismaService } from '../src/modules/database/prisma.service';
import { UserRole, ClientStatus, PrimaryGoal } from '@alpha/types';

describe('Phase 08 Gate C — Progress, Activity, Analytics, Calendar & Reporting', () => {
  let portalService: PortalService;

  // In-memory mock database state
  let users: any[] = [];
  let relationships: any[] = [];
  let bodyMetrics: any[] = [];
  let personalRecords: any[] = [];
  let workoutSessions: any[] = [];
  let dailyMealLogs: any[] = [];
  let hydrationLogs: any[] = [];
  let activityRecords: any[] = [];
  let cardioSessions: any[] = [];
  let progressPhotos: any[] = [];
  let userGoals: any[] = [];
  let calendarEvents: any[] = [];
  let coachingReports: any[] = [];
  let auditLogs: any[] = [];

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const user = users.find((u) => u.id === where.id || u.email === where.email);
        if (!user) return null;
        return {
          ...user,
          profile: user.profile,
          goal: userGoals.find((g) => g.userId === user.id) || null,
          assignedPrograms: [],
          workoutSessions: workoutSessions.filter((w) => w.userId === user.id),
        };
      }),
    },
    coachClientRelationship: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return (
          relationships.find(
            (r) =>
              r.coachId === where.coachId_clientId.coachId &&
              r.clientId === where.coachId_clientId.clientId,
          ) || null
        );
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return relationships
          .filter((r) => {
            if (where.coachId && r.coachId !== where.coachId) return false;
            if (where.organizationId && r.organizationId !== where.organizationId) return false;
            if (where.isActive !== undefined && r.isActive !== where.isActive) return false;
            if (where.status && r.status !== where.status) return false;
            return true;
          })
          .map((r) => {
            const clientUser = users.find((u) => u.id === r.clientId);
            return {
              ...r,
              client: {
                ...clientUser,
                profile: clientUser?.profile,
                goal: userGoals.find((g) => g.userId === r.clientId) || null,
                assignedPrograms: [],
                workoutSessions: workoutSessions.filter((w) => w.userId === r.clientId),
              },
            };
          });
      }),
    },
    bodyMetric: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return bodyMetrics
          .filter((m) => m.userId === where.userId)
          .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
      }),
    },
    personalRecord: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return personalRecords
          .filter((pr) => pr.userId === where.userId)
          .sort((a, b) => a.achievedAt.getTime() - b.achievedAt.getTime());
      }),
    },
    workoutSession: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return workoutSessions.filter(
          (ws) => ws.userId === where.userId && (!where.status || ws.status === where.status),
        );
      }),
    },
    dailyMealLog: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return dailyMealLogs.filter((l) => l.userId === where.userId);
      }),
    },
    hydrationLog: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return hydrationLogs.filter((h) => h.userId === where.userId);
      }),
    },
    activityRecord: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return activityRecords.filter((a) => a.userId === where.userId);
      }),
    },
    cardioSession: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return cardioSessions.filter((c) => c.userId === where.userId);
      }),
    },
    progressPhoto: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return progressPhotos.filter((p) => p.userId === where.userId);
      }),
    },
    userGoal: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return userGoals.find((g) => g.userId === where.userId) || null;
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        const existingIdx = userGoals.findIndex((g) => g.userId === where.userId);
        if (existingIdx >= 0) {
          userGoals[existingIdx] = { ...userGoals[existingIdx], ...update, updatedAt: new Date() };
          return userGoals[existingIdx];
        } else {
          const newGoal = { id: `goal_${Date.now()}`, ...create, updatedAt: new Date() };
          userGoals.push(newGoal);
          return newGoal;
        }
      }),
    },
    coachCalendarEvent: {
      create: jest.fn().mockImplementation(({ data }) => {
        const event = {
          id: `cal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        calendarEvents.push(event);
        return event;
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return calendarEvents
          .filter((e) => e.coachId === where.coachId)
          .map((e) => {
            const client = users.find((u) => u.id === e.clientId);
            return {
              ...e,
              client: { ...client, profile: client?.profile },
            };
          });
      }),
    },
    coachingReport: {
      create: jest.fn().mockImplementation(({ data }) => {
        const report = {
          id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          createdAt: new Date(),
        };
        coachingReports.push(report);
        return report;
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return coachingReports.find((r) => r.id === where.id) || null;
      }),
    },
    auditLog: {
      create: jest.fn().mockImplementation(({ data }) => {
        const log = { id: `audit_${Date.now()}`, ...data, createdAt: new Date() };
        auditLogs.push(log);
        return log;
      }),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    portalService = module.get<PortalService>(PortalService);
  });

  beforeEach(() => {
    // Reset databases
    users = [];
    relationships = [];
    bodyMetrics = [];
    personalRecords = [];
    workoutSessions = [];
    dailyMealLogs = [];
    hydrationLogs = [];
    activityRecords = [];
    cardioSessions = [];
    progressPhotos = [];
    userGoals = [];
    calendarEvents = [];
    coachingReports = [];
    auditLogs = [];

    // Seed Coach
    users.push({
      id: 'coach_1',
      email: 'headcoach@alpha.fit',
      role: UserRole.COACH,
      organizationId: 'org_apex',
      profile: { fullName: 'Marcus Coach' },
      updatedAt: new Date(),
    });

    // Seed Nutritionist
    users.push({
      id: 'nutr_1',
      email: 'nutritionist@alpha.fit',
      role: UserRole.NUTRITIONIST,
      organizationId: 'org_apex',
      profile: { fullName: 'Sarah Nutrition' },
      updatedAt: new Date(),
    });

    // Seed Unassigned Coach
    users.push({
      id: 'coach_stranger',
      email: 'stranger@alpha.fit',
      role: UserRole.COACH,
      organizationId: 'org_apex',
      profile: { fullName: 'Stranger Coach' },
      updatedAt: new Date(),
    });

    // Seed Athlete
    users.push({
      id: 'athlete_1',
      email: 'athlete.david@alpha.fit',
      role: UserRole.ATHLETE,
      organizationId: 'org_apex',
      profile: { fullName: 'David Athlete', heightCm: 180 },
      updatedAt: new Date(),
    });

    // Seed Cross-Tenant Athlete
    users.push({
      id: 'athlete_rival',
      email: 'rival@rival.fit',
      role: UserRole.ATHLETE,
      organizationId: 'org_rival',
      profile: { fullName: 'Rival Athlete', heightCm: 175 },
      updatedAt: new Date(),
    });

    // Seed Relationships
    relationships.push({
      id: 'rel_1',
      coachId: 'coach_1',
      clientId: 'athlete_1',
      organizationId: 'org_apex',
      status: ClientStatus.ACTIVE,
      isActive: true,
    });

    relationships.push({
      id: 'rel_nutr_1',
      coachId: 'nutr_1',
      clientId: 'athlete_1',
      organizationId: 'org_apex',
      status: ClientStatus.ACTIVE,
      isActive: true,
    });

    // Seed Metrics for David
    bodyMetrics.push(
      { userId: 'athlete_1', weightKg: 85.0, recordedAt: new Date('2026-02-01') },
      { userId: 'athlete_1', weightKg: 83.5, recordedAt: new Date('2026-02-15') },
      { userId: 'athlete_1', weightKg: 82.0, recordedAt: new Date('2026-03-01') },
    );

    // Seed PRs
    personalRecords.push(
      {
        userId: 'athlete_1',
        exerciseId: 'ex_squat',
        exerciseName: 'Barbell Back Squat',
        value: 150,
        weightKg: 150,
        reps: 5,
        achievedAt: new Date('2026-02-10'),
      },
      {
        userId: 'athlete_1',
        exerciseId: 'ex_bench',
        exerciseName: 'Barbell Bench Press',
        value: 110,
        weightKg: 110,
        reps: 3,
        achievedAt: new Date('2026-02-20'),
      },
    );

    // Seed Completed Workout Session with Sets
    workoutSessions.push({
      id: 'ws_1',
      userId: 'athlete_1',
      title: 'Lower Strength',
      status: 'COMPLETED',
      durationSeconds: 4500,
      completedAt: new Date('2026-03-01T11:00:00Z'),
      exercises: [
        {
          exerciseId: 'ex_squat',
          sets: [
            { isCompleted: true, weightKg: 140, actualReps: 5, rpe: 8.5 },
            { isCompleted: true, weightKg: 145, actualReps: 5, rpe: 9.0 },
          ],
        },
      ],
    });

    // Seed Daily Meal Log
    dailyMealLogs.push({
      id: 'dml_1',
      userId: 'athlete_1',
      logDate: new Date('2026-03-01'),
      items: [
        {
          foodItemId: 'oats',
          calories: 300,
          proteinGrams: 12,
          carbsGrams: 54,
          fatGrams: 5,
        },
        {
          foodItemId: 'chicken',
          calories: 350,
          proteinGrams: 60,
          carbsGrams: 0,
          fatGrams: 8,
        },
      ],
    });

    // Seed Hydration
    hydrationLogs.push({
      userId: 'athlete_1',
      amountMl: 3000,
      logDate: new Date('2026-03-01'),
    });

    // Seed Activity & Cardio
    activityRecords.push({
      userId: 'athlete_1',
      date: new Date('2026-03-01'),
      stepCount: 11500,
      activeCalories: 480,
      distanceKm: 8.4,
    });

    cardioSessions.push({
      id: 'cardio_1',
      userId: 'athlete_1',
      activityType: 'RUNNING',
      durationSeconds: 2400,
      distanceMeters: 5500,
      avgPaceSecondsPerKm: 436,
      avgHeartRate: 155,
      activeCalories: 410,
      startedAt: new Date('2026-03-01T07:00:00Z'),
    });

    // Seed Progress Photo
    progressPhotos.push({
      id: 'photo_1',
      userId: 'athlete_1',
      takenAt: new Date('2026-03-01'),
      photoUrl: 's3://alpha-vault/photos/front.jpg',
      viewAngle: 'FRONT',
      notes: 'Starting cycle check',
    });

    // Seed Goal
    userGoals.push({
      id: 'goal_1',
      userId: 'athlete_1',
      primaryGoal: 'HYPERTROPHY',
      targetWeightKg: 80,
      targetDailyCalories: 2600,
      targetDailyProteinGrams: 180,
      targetDailySteps: 10000,
      updatedAt: new Date('2026-02-01'),
    });
  });

  // -------------------------------------------------------------
  // TEST CASES
  // -------------------------------------------------------------

  it('1. should retrieve client progress analytics (weight history, net change, strength curves, PRs)', async () => {
    const res = await portalService.getClientProgressAnalytics('coach_1', UserRole.COACH, 'athlete_1', 'org_apex');

    expect(res.clientId).toBe('athlete_1');
    expect(res.weightHistory.length).toBe(3);
    expect(res.netWeightChangeKg).toBe(-3.0); // 82 - 85
    expect(res.personalRecordsCount).toBe(2);
    expect(res.strengthProgression.length).toBe(2);
    expect(res.recentPrs.length).toBe(2);
  });

  it('2. should reject progress analytics for unassigned coach (403 CLIENT_NOT_ASSIGNED_TO_COACH)', async () => {
    await expect(
      portalService.getClientProgressAnalytics('coach_stranger', UserRole.COACH, 'athlete_1', 'org_apex'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('3. should reject progress analytics for client in another organization (403 CROSS_TENANT_ACCESS_DENIED)', async () => {
    await expect(
      portalService.getClientProgressAnalytics('coach_1', UserRole.ORG_ADMIN, 'athlete_rival', 'org_apex'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('4. should retrieve client progress photos with secure watermarked access', async () => {
    const photos = await portalService.getClientProgressPhotos('coach_1', UserRole.COACH, 'athlete_1', 'org_apex');

    expect(Array.isArray(photos)).toBe(true);
    expect(photos.length).toBe(1);
    expect(photos[0]!.isCoachAuthorized).toBe(true);
    expect(photos[0]!.photoUrl).toContain('/api/v1/storage/progress-photos/');
  });

  it('5. should block unassigned coach from viewing client progress photos', async () => {
    await expect(
      portalService.getClientProgressPhotos('coach_stranger', UserRole.COACH, 'athlete_1', 'org_apex'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('6. should retrieve workout analytics with total tonnage, volume trends, and intensity ratings', async () => {
    const analytics = await portalService.getClientWorkoutAnalytics(
      'coach_1',
      UserRole.COACH,
      'athlete_1',
      'org_apex',
    );

    expect(analytics.totalWorkoutsCompleted).toBe(1);
    expect(analytics.totalTonnageKg).toBe(1425); // (140*5) + (145*5) = 700 + 725
    expect(analytics.averageSessionDurationMinutes).toBe(75);
    expect(analytics.averageIntensityRpe).toBe(8.8); // (8.5 + 9.0) / 2 = 8.75 -> 8.8
    expect(analytics.weeklyVolumeTrend.length).toBe(1);
  });

  it('7. should retrieve nutrition analytics with caloric adherence and macro trends', async () => {
    const analytics = await portalService.getClientNutritionAnalytics(
      'nutr_1',
      UserRole.NUTRITIONIST,
      'athlete_1',
      'org_apex',
    );

    expect(analytics.clientId).toBe('athlete_1');
    expect(analytics.daysLogged).toBe(1);
    expect(analytics.targetDailyCalories).toBe(2600);
    expect(analytics.averageDailyCalories).toBe(650); // 300 + 350
    expect(analytics.averageProteinGrams).toBe(72); // 12 + 60
    expect(analytics.averageWaterMl).toBe(3000);
    expect(analytics.macroTrend.length).toBe(1);
  });

  it('8. should retrieve activity analytics with step averages and cardio sessions without raw GPS leak', async () => {
    const analytics = await portalService.getClientActivityAnalytics(
      'coach_1',
      UserRole.COACH,
      'athlete_1',
      'org_apex',
    );

    expect(analytics.averageDailySteps).toBe(11500);
    expect(analytics.stepGoalAchievedDays).toBe(1);
    expect(analytics.cardioSessionsCount).toBe(1);
    expect(analytics.cardioSessions[0]!.type).toBe('RUNNING');
    expect(analytics.cardioSessions[0]!.distanceKm).toBe(5.5);
    expect((analytics.cardioSessions[0] as any).coordinates).toBeUndefined(); // Zero GPS leak
  });

  it('9. should retrieve client goals and progress toward target weight', async () => {
    const goal = await portalService.getClientGoals('coach_1', UserRole.COACH, 'athlete_1', 'org_apex');

    expect(goal.primaryGoal).toBe('HYPERTROPHY');
    expect(goal.startWeightKg).toBe(85);
    expect(goal.currentWeightKg).toBe(82);
    expect(goal.targetWeightKg).toBe(80);
    expect(goal.progressPercent).toBe(60); // 3kg delta out of 5kg total delta = 60%
  });

  it('10. should update client goals and record audit log', async () => {
    const updated = await portalService.updateClientGoal(
      'coach_1',
      UserRole.COACH,
      'athlete_1',
      {
        primaryGoal: PrimaryGoal.STRENGTH,
        targetWeightKg: 78,
        targetDailyCalories: 2750,
      },
      'org_apex',
    );

    expect(updated.targetWeightKg).toBe(78);

    // Verify audit log
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0]!.action).toBe('COACH_UPDATE_CLIENT_GOAL');
    expect(auditLogs[0]!.userId).toBe('coach_1');
    expect(auditLogs[0]!.resourceId).toBe('athlete_1');
  });

  it('11. should create coaching calendar events with scheduled status', async () => {
    const event = await portalService.createCalendarEvent(
      'coach_1',
      UserRole.COACH,
      {
        clientId: 'athlete_1',
        title: 'Weekly 1-on-1 Performance Check-in',
        eventType: 'CHECKIN',
        startDateTime: '2026-03-20T15:00:00Z',
        endDateTime: '2026-03-20T15:30:00Z',
        notes: 'Review squat form and nutrition compliance.',
      },
      'org_apex',
    );

    expect(event.title).toBe('Weekly 1-on-1 Performance Check-in');
    expect(event.eventType).toBe('CHECKIN');
    expect(event.status).toBe('SCHEDULED');
    expect(calendarEvents.length).toBe(1);
  });

  it('12. should block scheduling calendar event for unassigned athlete (403)', async () => {
    await expect(
      portalService.createCalendarEvent(
        'coach_stranger',
        UserRole.COACH,
        {
          clientId: 'athlete_1',
          title: 'Unauthorized Consultation',
          eventType: 'CHECKIN',
          startDateTime: '2026-03-21T10:00:00Z',
        },
        'org_apex',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('13. should list calendar events for coach within date range', async () => {
    calendarEvents.push({
      id: 'cal_existing',
      coachId: 'coach_1',
      clientId: 'athlete_1',
      eventType: 'PLANNED_WORKOUT',
      title: 'Leg Day Volume',
      startDateTime: new Date('2026-03-22T09:00:00Z'),
      endDateTime: null,
      status: 'SCHEDULED',
      notes: null,
    });

    const events = await portalService.listCalendarEvents('coach_1', UserRole.COACH);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events.some((e) => e.title === 'Leg Day Volume')).toBe(true);
  });

  it('14. should generate client progress and organization overview reports', async () => {
    // Client Progress Report
    const clientReport = await portalService.generateReport(
      'coach_1',
      UserRole.COACH,
      {
        type: 'CLIENT_PROGRESS',
        clientId: 'athlete_1',
      },
      'org_apex',
    );

    expect(clientReport.type).toBe('CLIENT_PROGRESS');
    expect(clientReport.clientSummary?.length).toBe(1);
    expect(clientReport.clientSummary![0]!.clientId).toBe('athlete_1');
    expect(clientReport.metrics['totalTonnageKg']).toBe(1425);

    // Organization Overview Report
    const orgReport = await portalService.generateReport(
      'coach_1',
      UserRole.COACH,
      {
        type: 'ORGANIZATION_OVERVIEW',
      },
      'org_apex',
    );

    expect(orgReport.type).toBe('ORGANIZATION_OVERVIEW');
    expect(orgReport.metrics['totalActiveClients']).toBeGreaterThanOrEqual(1);
    expect(coachingReports.length).toBe(2);
  });

  it('15. should export generated reports as downloadable CSV and JSON, preventing cross-tenant export abuse', async () => {
    const reportSummary = await portalService.generateReport(
      'coach_1',
      UserRole.COACH,
      {
        type: 'CLIENT_PROGRESS',
        clientId: 'athlete_1',
      },
      'org_apex',
    );

    // Export CSV
    const csvExport = await portalService.exportReport('coach_1', UserRole.COACH, reportSummary.reportId, 'CSV', 'org_apex');
    expect(csvExport.format).toBe('CSV');
    expect(csvExport.mimeType).toBe('text/csv');
    expect(csvExport.content).toContain('Client ID,Client Name,Compliance Rate');
    expect(csvExport.content).toContain('athlete_1');

    // Export JSON
    const jsonExport = await portalService.exportReport('coach_1', UserRole.COACH, reportSummary.reportId, 'JSON', 'org_apex');
    expect(jsonExport.format).toBe('JSON');
    expect(jsonExport.mimeType).toBe('application/json');

    // Cross-tenant report export blocked
    await expect(
      portalService.exportReport('coach_rival', UserRole.COACH, reportSummary.reportId, 'CSV', 'org_rival'),
    ).rejects.toThrow(ForbiddenException);
  });
});
