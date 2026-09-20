import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/modules/database/prisma.service';
import { ReportsService, ICreateReportDto } from '../src/modules/analytics/services/reports.service';
import { ReportsController } from '../src/modules/analytics/controllers/reports.controller';
import { AnalyticsAggregationService } from '../src/modules/analytics/services/analytics-aggregation.service';
import { AnalyticsMathService } from '../src/modules/analytics/services/analytics-math.service';
import { UserRole } from '@alpha/types';
import { ForbiddenException, GoneException } from '@nestjs/common';

describe('Phase 10 Gate C — Reporting & Secure Export Engine', () => {
  let reportsService: ReportsService;

  const orgA = 'org_alpha_enterprise';
  const orgB = 'org_competitor_beta';
  const coachA = 'usr_coach_marcus';
  const athleteA = 'usr_athlete_vance';
  const athleteB = 'usr_athlete_stranger';

  const mockReportDatabase = new Map<string, any>();

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === athleteA) {
          return Promise.resolve({
            id: athleteA,
            organizationId: orgA,
            role: UserRole.ATHLETE,
            email: 'vance@alpha.local',
            profile: { fullName: 'Marcus Vance' },
          });
        }
        if (where.id === athleteB) {
          return Promise.resolve({
            id: athleteB,
            organizationId: orgB,
            role: UserRole.ATHLETE,
            email: 'stranger@beta.local',
            profile: { fullName: 'Bob Stranger' },
          });
        }
        return Promise.resolve(null);
      }),
      count: jest.fn().mockResolvedValue(20),
      findMany: jest.fn().mockResolvedValue([{ id: athleteA }]),
    },
    coachClientRelationship: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.coachId === coachA && where.clientId === athleteA && where.isActive) {
          return Promise.resolve({
            id: 'rel_1',
            coachId: coachA,
            clientId: athleteA,
            isActive: true,
            status: 'ACTIVE',
          });
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue([
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
      ]),
    },
    analyticsDailyUser: {
      findMany: jest.fn().mockResolvedValue([
        {
          userId: athleteA,
          date: '2026-09-18',
          plannedWorkouts: 4,
          completedWorkouts: 4,
          skippedWorkouts: 0,
          workoutVolumeKg: 5000,
          workoutDurationMinutes: 200,
          prsAchieved: 1,
          mealsLogged: 3,
          caloriesConsumed: 2600,
          calorieTarget: 2600,
          proteinGrams: 200,
          nutritionAdherenceScore: 100,
          waterMl: 3000,
          waterTargetMl: 2500,
          steps: 12000,
          activeMinutes: 80,
          cardioDurationMinutes: 30,
          cardioDistanceMeters: 5000,
          bodyWeightKg: 82.5,
          isActiveDay: true,
        },
      ]),
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'adu_1', ...create })),
    },
    program: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'prog_alpha_1',
          name: 'Hypertrophy Mastery',
          status: 'PUBLISHED',
          version: 1,
          assignments: [{ id: 'asgn_1', athleteId: athleteA, isActive: true }],
        },
      ]),
    },
    coachMessage: {
      count: jest.fn().mockResolvedValue(10),
    },
    programAssignment: {
      count: jest.fn().mockResolvedValue(1),
    },
    report: {
      create: jest.fn().mockImplementation(({ data }) => {
        const id = `rep_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockReportDatabase.set(id, record);
        return Promise.resolve(record);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(mockReportDatabase.get(where.id) || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        const list = Array.from(mockReportDatabase.values());
        return Promise.resolve(
          list.filter((r) => !where.organizationId || r.organizationId === where.organizationId),
        );
      }),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        ReportsService,
        AnalyticsAggregationService,
        AnalyticsMathService,
      ],
    }).compile();

    reportsService = module.get<ReportsService>(ReportsService);
  });

  // -------------------------------------------------------------
  // 1. REPORT BUILDER & FORMAT EXPORTS
  // -------------------------------------------------------------
  describe('1. Report Builder & Format Serialization', () => {
    it('should generate Client Progress Report in CSV format with deterministic data', async () => {
      const athleteUser = { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA } as any;
      const dto: ICreateReportDto = {
        reportType: 'CLIENT_PROGRESS',
        format: 'CSV',
        scope: 'CLIENT',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        clientId: athleteA,
      };

      const report = await reportsService.createReport(athleteUser, dto);

      expect(report.id).toBeDefined();
      expect(report.reportType).toBe('CLIENT_PROGRESS');
      expect(report.format).toBe('CSV');
      expect(report.status).toBe('COMPLETED');
      expect(report.expiresAt).toBeDefined();

      // Download content check
      const download = await reportsService.downloadReport(report.id, athleteUser);
      expect(download.mimeType).toBe('text/csv');
      expect(download.filename).toContain('client_progress');
      expect(download.content).toContain('ALPHA PERFORMANCE OS');
      expect(download.content).toContain('Reporting Period: 2026-09-01 to 2026-09-18');
      expect(download.content).toContain('Workouts,Total Completed,4,COUNT');
      expect(download.content).toContain('Workouts,Total Volume Lifted,5000,KG');
      expect(download.content).toContain('Nutrition,Average Daily Calories,2600,KCAL');
    });

    it('should generate Coach Performance Report in CSV format with athlete roster', async () => {
      const coachUser = { id: coachA, role: UserRole.COACH, organizationId: orgA } as any;
      const dto: ICreateReportDto = {
        reportType: 'COACH_PERFORMANCE',
        format: 'CSV',
        scope: 'COACH',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        coachId: coachA,
      };

      const report = await reportsService.createReport(coachUser, dto);
      expect(report.status).toBe('COMPLETED');

      const download = await reportsService.downloadReport(report.id, coachUser);
      expect(download.content).toContain('COACH WORKLOAD METRICS');
      expect(download.content).toContain('ATHLETE ADHERENCE ROSTER');
      expect(download.content).toContain('Marcus Vance');
    });

    it('should generate Organization Summary Report in JSON format', async () => {
      const adminUser = { id: 'adm_1', role: UserRole.ORG_ADMIN, organizationId: orgA } as any;
      const dto: ICreateReportDto = {
        reportType: 'ORGANIZATION_SUMMARY',
        format: 'JSON',
        scope: 'ORGANIZATION',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        organizationId: orgA,
      };

      const report = await reportsService.createReport(adminUser, dto);
      expect(report.format).toBe('JSON');

      const download = await reportsService.downloadReport(report.id, adminUser);
      expect(download.mimeType).toBe('application/json');
      const parsed = JSON.parse(download.content);
      expect(parsed.organizationId).toBe(orgA);
      expect(parsed.totalClients).toBe(20);
    });

    it('should generate PDF / formatted text report representation', async () => {
      const athleteUser = { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA } as any;
      const dto: ICreateReportDto = {
        reportType: 'CLIENT_PROGRESS',
        format: 'PDF',
        scope: 'CLIENT',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        clientId: athleteA,
      };

      const report = await reportsService.createReport(athleteUser, dto);
      expect(report.format).toBe('PDF');

      const download = await reportsService.downloadReport(report.id, athleteUser);
      expect(download.mimeType).toBe('application/pdf');
      expect(download.content).toContain('ALPHA PERFORMANCE OS — EXECUTIVE REPORT');
    });
  });

  // -------------------------------------------------------------
  // 2. EXPORT SECURITY & TENANT ISOLATION
  // -------------------------------------------------------------
  describe('2. Export Security & Scoped Access Authorization', () => {
    it('Athlete A CANNOT export Athlete B report (DENIED)', async () => {
      const athleteUser = { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA } as any;
      const dto: ICreateReportDto = {
        reportType: 'CLIENT_PROGRESS',
        scope: 'CLIENT',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        clientId: athleteB,
      };

      await expect(reportsService.createReport(athleteUser, dto)).rejects.toThrow(ForbiddenException);
    });

    it('Coach A CANNOT export unassigned Athlete B report (DENIED)', async () => {
      const coachUser = { id: coachA, role: UserRole.COACH, organizationId: orgA } as any;
      const dto: ICreateReportDto = {
        reportType: 'CLIENT_PROGRESS',
        scope: 'CLIENT',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        clientId: athleteB,
      };

      await expect(reportsService.createReport(coachUser, dto)).rejects.toThrow(ForbiddenException);
    });

    it('Coach A CANNOT export Organization Summary report (ROLE DENIED)', async () => {
      const coachUser = { id: coachA, role: UserRole.COACH, organizationId: orgA } as any;
      const dto: ICreateReportDto = {
        reportType: 'ORGANIZATION_SUMMARY',
        scope: 'ORGANIZATION',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        organizationId: orgA,
      };

      await expect(reportsService.createReport(coachUser, dto)).rejects.toThrow(ForbiddenException);
    });

    it('Org Admin A CANNOT export Org B report (CROSS-TENANT DENIED)', async () => {
      const adminUser = { id: 'adm_1', role: UserRole.ORG_ADMIN, organizationId: orgA } as any;
      const dto: ICreateReportDto = {
        reportType: 'ORGANIZATION_SUMMARY',
        scope: 'ORGANIZATION',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        organizationId: orgB,
      };

      await expect(reportsService.createReport(adminUser, dto)).rejects.toThrow(ForbiddenException);
    });

    it('Cross-tenant report download attempt is strictly denied', async () => {
      const adminUser = { id: 'adm_1', role: UserRole.ORG_ADMIN, organizationId: orgA } as any;
      const foreignUser = { id: 'adm_2', role: UserRole.ORG_ADMIN, organizationId: orgB } as any;

      const report = await reportsService.createReport(adminUser, {
        reportType: 'ORGANIZATION_SUMMARY',
        scope: 'ORGANIZATION',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        organizationId: orgA,
      });

      await expect(reportsService.downloadReport(report.id, foreignUser)).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------
  // 3. REPORT EXPIRATION
  // -------------------------------------------------------------
  describe('3. Report Expiration Enforcement', () => {
    it('Expired report throws 410 GoneException on download attempt', async () => {
      const athleteUser = { id: athleteA, role: UserRole.ATHLETE, organizationId: orgA } as any;

      const report = await reportsService.createReport(athleteUser, {
        reportType: 'CLIENT_PROGRESS',
        scope: 'CLIENT',
        dateRangeStart: '2026-09-01',
        dateRangeEnd: '2026-09-18',
        clientId: athleteA,
      });

      // Manually simulate expired report (expiresAt in the past)
      const stored = mockReportDatabase.get(report.id);
      stored.expiresAt = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago

      await expect(reportsService.downloadReport(report.id, athleteUser)).rejects.toThrow(GoneException);
    });
  });
});
