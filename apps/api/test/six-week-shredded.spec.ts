import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutsService } from '../src/modules/workouts/workouts.service';
import { AdminService } from '../src/modules/admin/admin.service';
import { PrismaService } from '../src/modules/database/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserRole, ProgramUserStatus } from '@alpha/types';
import {
  SIX_WEEK_SHREDDED_EXERCISES,
  SIX_WEEK_SHREDDED_ID,
  SIX_WEEK_SHREDDED_PROGRAM_DETAIL,
  build12WeekSchedule,
  HIIC_TREADMILL_PROTOCOL,
} from '../src/modules/workouts/data/six-week-shredded.data';

describe('6 WEEK SHREDDED — 12-Week Canonical Program Verification Suite', () => {
  let workoutsService: WorkoutsService;
  let adminService: AdminService;

  const mockPrisma = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    programAssignment: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const athleteA = { id: 'athlete_assigned_1', email: 'athlete1@test.com', role: UserRole.ATHLETE };
  const athleteB = { id: 'athlete_unassigned_2', email: 'athlete2@test.com', role: UserRole.ATHLETE };
  const adminUser = { id: 'admin_master_1', email: 'admin@gymrecord.com', role: UserRole.ADMIN };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    workoutsService = module.get<WorkoutsService>(WorkoutsService);
    adminService = module.get<AdminService>(AdminService);
  });

  describe('1. Canonical Source Fidelity (68 Exercises from Authoritative PDF)', () => {
    it('should have loaded exactly 68 canonical exercises from Guru Mann PDF', async () => {
      expect(SIX_WEEK_SHREDDED_EXERCISES).toHaveLength(68);

      const exercises = await workoutsService.getExercises();
      expect(exercises.length).toBeGreaterThanOrEqual(68);

      // Verify every exercise from the PDF exists in the service
      for (const canonicalEx of SIX_WEEK_SHREDDED_EXERCISES) {
        const found = await workoutsService.getExerciseById(canonicalEx.id);
        expect(found).toBeDefined();
        expect(found.name).toBe(canonicalEx.name);
      }
    });

    it('should preserve exact source exercise names, set types, and typography', async () => {
      const dbShoulderPress = await workoutsService.getExerciseById('sws_db_shoulder_press');
      expect(dbShoulderPress.name).toBe('DB Shoulder Press');

      const rearDeltFly = await workoutsService.getExerciseById('sws_rear_delt_cable_fly');
      expect(rearDeltFly.name).toBe('Rear Delt Cable Fly');

      const shotHeadPreacher = await workoutsService.getExerciseById('sws_machine_preacher_curl_shot_head');
      expect(shotHeadPreacher.name).toBe('Machine Preacher Curl (Shot Head)');

      const midLowerCurl = await workoutsService.getExerciseById('sws_cable_conc_curl_mid_lower');
      expect(midLowerCurl.name).toBe('Cable Conc. Curl (Mid-Lower Angle)');

      const layingLegPullIn = await workoutsService.getExerciseById('sws_laying_leg_pull_in');
      expect(layingLegPullIn.name).toBe('Laying Leg Pull-in');

      const mtnClimber = await workoutsService.getExerciseById('sws_mountain_climber_cross_body');
      expect(mtnClimber.name).toBe('Mountain Climber Cross Body');
    });

    it('should prevent accidental modification or archiving of canonical exercises', async () => {
      await expect(
        workoutsService.updateExercise('sws_db_shoulder_press', { name: 'Dumbbell Shoulder Press' })
      ).rejects.toThrow(BadRequestException);

      await expect(
        workoutsService.archiveExercise('sws_rear_delt_cable_fly')
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify HIIC Treadmill Cardio Protocol 20-minute table', () => {
      expect(HIIC_TREADMILL_PROTOCOL.intervals).toHaveLength(22);
      expect(HIIC_TREADMILL_PROTOCOL.totalDurationMinutes).toBe(20);
      expect(HIIC_TREADMILL_PROTOCOL.intervals[0]?.activity).toContain('Warm up');
      expect(HIIC_TREADMILL_PROTOCOL.intervals[1]?.activity).toBe('Sprint');
      expect(HIIC_TREADMILL_PROTOCOL.intervals[1]?.speedMph).toBe('6.0');
    });
  });

  describe('2. 12-Week Structural Extension (Cycle 1: Weeks 1–6, Cycle 2: Weeks 7–12)', () => {
    it('should build exactly 12 weeks with two identical 6-week cycles', () => {
      const schedule = build12WeekSchedule();
      expect(schedule).toHaveLength(12);

      // Verify Cycle numbers
      for (let w = 1; w <= 6; w++) {
        expect(schedule[w - 1]?.cycleNumber).toBe(1);
        expect(schedule[w - 1]?.cycleSourceWeek).toBe(w);
      }
      for (let w = 7; w <= 12; w++) {
        expect(schedule[w - 1]?.cycleNumber).toBe(2);
        expect(schedule[w - 1]?.cycleSourceWeek).toBe(w - 6);
      }

      // Verify Week 7 references identical days as Week 1
      const week1 = schedule[0]!;
      const week7 = schedule[6]!;
      expect(week7.days).toBe(week1.days);

      // Verify 7-day split across all weeks
      for (const week of schedule) {
        expect(week.days).toHaveLength(7);
        expect(week.days[0]?.dayName).toBe('Monday');
        expect(week.days[0]?.title).toBe('Shoulders + Triceps & Upper Abs');
        expect(week.days[1]?.dayName).toBe('Tuesday');
        expect(week.days[1]?.title).toBe('Chest + Upper Back & Lower Abs');
        expect(week.days[2]?.dayName).toBe('Wednesday');
        expect(week.days[2]?.title).toBe('Cardio & Upper Abs');
        expect(week.days[3]?.dayName).toBe('Thursday');
        expect(week.days[3]?.title).toBe('Lat, Mid Back + Biceps & Lower Abs');
        expect(week.days[4]?.dayName).toBe('Friday');
        expect(week.days[4]?.title).toBe('Quads, Ham & Calves & Upper Abs');
        expect(week.days[5]?.dayName).toBe('Saturday');
        expect(week.days[5]?.title).toBe('Cardio & Lower Abs');
        expect(week.days[6]?.dayName).toBe('Sunday');
        expect(week.days[6]?.title).toBe('Recovery');
      }
    });

    it('should contain full Guru Mann, USA attribution', () => {
      expect(SIX_WEEK_SHREDDED_PROGRAM_DETAIL.sourceAttribution).toContain('Guru Mann, USA');
      expect(SIX_WEEK_SHREDDED_PROGRAM_DETAIL.sourceAttribution).toContain('Certified Advanced Fitness Trainer');
    });
  });

  describe('3. Admin Dashboard & RBAC Access Management', () => {
    it('CRITICAL: Non-assigned athlete CANNOT view 6 WEEK SHREDDED in programs list', async () => {
      const programs = await workoutsService.getPrograms(athleteB as any);
      const shredded = programs.find((p) => p.id === SIX_WEEK_SHREDDED_ID);
      expect(shredded).toBeUndefined();
    });

    it('CRITICAL: Non-assigned athlete receives 403 Forbidden when accessing program directly', async () => {
      await expect(
        workoutsService.getProgramById(SIX_WEEK_SHREDDED_ID, athleteB as any)
      ).rejects.toThrow(ForbiddenException);
    });

    it('Admin can view all programs including 6 WEEK SHREDDED', async () => {
      const programs = await workoutsService.getPrograms(adminUser as any);
      const shredded = programs.find((p) => p.id === SIX_WEEK_SHREDDED_ID);
      expect(shredded).toBeDefined();
      expect(shredded?.name).toBe('6 WEEK SHREDDED');
    });

    it('Admin can assign athlete to 6 WEEK SHREDDED by userId and by email', async () => {
      // 1. Assign Athlete A by ID via adminService
      const resA = await adminService.assignUserToProgram(adminUser.id, SIX_WEEK_SHREDDED_ID, {
        userId: athleteA.id,
        email: athleteA.email,
      });
      expect(resA.success).toBe(true);

      // 2. Assign Athlete by direct email input via adminService
      const resEmail = await adminService.assignUserToProgram(adminUser.id, SIX_WEEK_SHREDDED_ID, {
        email: 'client_special@fitness.com',
      });
      expect(resEmail.success).toBe(true);
      expect(resEmail.assignment.userEmail).toBe('client_special@fitness.com');

      // Verify Athlete A now has access
      const athleteAPrograms = await workoutsService.getPrograms(athleteA as any);
      expect(athleteAPrograms.some((p) => p.id === SIX_WEEK_SHREDDED_ID)).toBe(true);

      const programDetail = await workoutsService.getProgramById(SIX_WEEK_SHREDDED_ID, athleteA as any);
      expect(programDetail.id).toBe(SIX_WEEK_SHREDDED_ID);
      expect(programDetail.schedule12Weeks).toHaveLength(12);
    });

    it('Admin access summary lists assigned users with their 12-week progress', async () => {
      await adminService.assignUserToProgram(adminUser.id, SIX_WEEK_SHREDDED_ID, {
        userId: athleteA.id,
        email: athleteA.email,
      });

      const summary = await adminService.getProgramAccessSummary(SIX_WEEK_SHREDDED_ID);
      expect(summary.programId).toBe(SIX_WEEK_SHREDDED_ID);
      expect(summary.displayDuration).toBe('12 Weeks');
      expect(summary.sourceDuration).toBe('6 Weeks');
      expect(summary.assignedUsersCount).toBeGreaterThanOrEqual(1);
      const userEntry = summary.assignedUsers.find((u) => u.userId === athleteA.id);
      expect(userEntry).toBeDefined();
      expect(userEntry?.email).toBe(athleteA.email);

      // View assigned user progress via adminService
      const userProg = await adminService.getAssignedUserProgress(SIX_WEEK_SHREDDED_ID, athleteA.id);
      expect(userProg).toBeDefined();
      expect(userProg.programId).toBe(SIX_WEEK_SHREDDED_ID);
    });

    it('Admin can toggle program active/inactive status and block athlete access when inactive', async () => {
      await adminService.assignUserToProgram(adminUser.id, SIX_WEEK_SHREDDED_ID, {
        userId: athleteA.id,
        email: athleteA.email,
      });

      // Toggle inactive via adminService
      await adminService.toggleProgramStatus(adminUser.id, SIX_WEEK_SHREDDED_ID, false);

      // Athlete access now forbidden due to program inactivity
      await expect(
        workoutsService.getProgramById(SIX_WEEK_SHREDDED_ID, athleteA as any)
      ).rejects.toThrow(ForbiddenException);

      // Toggle active again via adminService
      await adminService.toggleProgramStatus(adminUser.id, SIX_WEEK_SHREDDED_ID, true);
      const restored = await workoutsService.getProgramById(SIX_WEEK_SHREDDED_ID, athleteA as any);
      expect(restored.id).toBe(SIX_WEEK_SHREDDED_ID);
    });

    it('Admin can remove program access from an athlete', async () => {
      await adminService.assignUserToProgram(adminUser.id, SIX_WEEK_SHREDDED_ID, {
        userId: athleteA.id,
        email: athleteA.email,
      });

      // Remove access via adminService
      await adminService.removeUserFromProgram(adminUser.id, SIX_WEEK_SHREDDED_ID, athleteA.id);

      // Athlete is once again rejected
      await expect(
        workoutsService.getProgramById(SIX_WEEK_SHREDDED_ID, athleteA as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. User Dashboard & 12-Week Progress Engine', () => {
    beforeEach(async () => {
      await workoutsService.assignProgramToUser(SIX_WEEK_SHREDDED_ID, {
        userId: athleteA.id,
        email: athleteA.email,
      }, adminUser.id);
    });

    it('should initialize athlete progress at Week 1, Day 1', async () => {
      const progress = await workoutsService.getUserProgramProgress(athleteA.id, SIX_WEEK_SHREDDED_ID, athleteA as any);
      expect(progress.currentWeek).toBe(1);
      expect(progress.currentDay).toBe(1);
      expect(progress.completedDays).toBe(0);
      expect(progress.completedWorkouts).toBe(0);
      expect(progress.completionPercentage).toBe(0);
      expect(progress.totalWeeks).toBe(12);
      expect(progress.activeCycle).toBe(1);
    });

    it('should start program and set status to ACTIVE', async () => {
      const started = await workoutsService.startUserProgram(athleteA.id, SIX_WEEK_SHREDDED_ID, athleteA as any);
      expect(started.programStatus).toBe(ProgramUserStatus.ACTIVE);
      expect(started.programStartDate).toBeDefined();
    });

    it('should log actual sets without altering canonical prescribed reps', async () => {
      await workoutsService.startUserProgram(athleteA.id, SIX_WEEK_SHREDDED_ID, athleteA as any);

      const logRes = await workoutsService.logProgramSet(
        athleteA.id,
        SIX_WEEK_SHREDDED_ID,
        1, // Week 1
        1, // Monday
        {
          exerciseId: 'sws_db_shoulder_press',
          setNumber: 1,
          weightKg: 24,
          actualReps: 15,
          notes: 'Felt great, clean tempo',
        },
        athleteA as any,
      );

      expect(logRes.success).toBe(true);
      expect(logRes.log.weightKg).toBe(24);
      expect(logRes.log.actualReps).toBe(15);
      expect(logRes.log.notes).toBe('Felt great, clean tempo');

      // Verify canonical prescription is completely unchanged in the program
      const program = await workoutsService.getProgramById(SIX_WEEK_SHREDDED_ID, athleteA as any);
      const monEx = program.days[0].exercises[0];
      expect(monEx.prescribedReps).toBe('15, 12, 10');
      expect(monEx.exerciseName).toBe('DB Shoulder Press');
    });

    it('should complete workout days and advance 12-week calendar with percentage progression', async () => {
      await workoutsService.startUserProgram(athleteA.id, SIX_WEEK_SHREDDED_ID, athleteA as any);

      // Complete Day 1 (Monday - Shoulders + Triceps)
      const afterDay1 = await workoutsService.completeProgramDay(
        athleteA.id,
        SIX_WEEK_SHREDDED_ID,
        1,
        1,
        'Crushed Monday workout',
        athleteA as any,
      );

      expect(afterDay1.completedDays).toBe(1);
      expect(afterDay1.completedWorkouts).toBe(1);
      // 1 workout / 72 total workouts = 1%
      expect(afterDay1.completionPercentage).toBeGreaterThanOrEqual(1);
      expect(afterDay1.currentDay).toBe(2); // Advanced to Tuesday
      expect(afterDay1.currentWeek).toBe(1);
      expect(afterDay1.lastWorkoutDate).toBeDefined();

      // Complete Day 2 (Tuesday)
      const afterDay2 = await workoutsService.completeProgramDay(
        athleteA.id,
        SIX_WEEK_SHREDDED_ID,
        1,
        2,
        'Chest & upper back done',
        athleteA as any,
      );
      expect(afterDay2.completedDays).toBe(2);
      expect(afterDay2.completedWorkouts).toBe(2);
      expect(afterDay2.currentDay).toBe(3); // Advanced to Wednesday
    });

    it('should correctly switch from Cycle 1 to Cycle 2 when passing Week 6', async () => {
      await workoutsService.startUserProgram(athleteA.id, SIX_WEEK_SHREDDED_ID, athleteA as any);

      // Simulate completing week 6 day 7
      const afterW6 = await workoutsService.completeProgramDay(
        athleteA.id,
        SIX_WEEK_SHREDDED_ID,
        6,
        7,
        'Finished Cycle 1',
        athleteA as any,
      );

      expect(afterW6.currentWeek).toBe(7);
      expect(afterW6.activeCycle).toBe(2); // Cycle 2 activated!
    });
  });
});
