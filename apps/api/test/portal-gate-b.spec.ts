import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { PortalService } from '../src/modules/portal/portal.service';
import { CoachClientGuard } from '../src/modules/portal/guards/coach-client.guard';
import { PrismaService } from '../src/modules/database/prisma.service';
import {
  UserRole,
  ClientStatus,
  ProgramStatus,
  IAuthUser,
  AccountStatus,
} from '@alpha/types';

describe('Phase 08 Gate B — Program Builder, Nutrition Builder, Assignment & Client Management', () => {
  let portalService: PortalService;

  // In-memory mock database state
  let programs: any[] = [];
  let programDays: any[] = [];
  let workoutTemplates: any[] = [];
  let templateExercises: any[] = [];
  let programAssignments: any[] = [];
  let mealPlans: any[] = [];
  let mealPlanAssignments: any[] = [];
  let exercises: any[] = [];
  let users: any[] = [];
  let relationships: any[] = [];
  let workoutSessions: any[] = [];
  let bodyMetrics: any[] = [];

  const mockPrisma = {
    program: {
      create: jest.fn().mockImplementation(({ data, include }) => {
        const prog = {
          id: `prog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          creatorId: data.creatorId,
          name: data.name,
          description: data.description,
          weeksCount: data.weeksCount,
          status: data.status,
          version: data.version || 1,
          parentProgramId: data.parentProgramId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        programs.push(prog);

        if (data.days?.create) {
          data.days.create.forEach((d: any) => {
            const day = {
              id: `day_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              programId: prog.id,
              dayOfWeek: d.dayOfWeek,
              weekNumber: d.weekNumber || 1,
              title: d.title,
            };
            programDays.push(day);

            if (d.templates?.create) {
              d.templates.create.forEach((t: any) => {
                const tpl = {
                  id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  programDayId: day.id,
                  name: t.name,
                  notes: t.notes,
                };
                workoutTemplates.push(tpl);

                if (t.exercises?.create) {
                  t.exercises.create.forEach((e: any) => {
                    templateExercises.push({
                      id: `tex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                      workoutTemplateId: tpl.id,
                      ...e,
                    });
                  });
                }
              });
            }
          });
        }

        if (include?.days) {
          return Promise.resolve(enrichProgram(prog));
        }
        return Promise.resolve(prog);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = programs;
        if (where?.creatorId) list = list.filter((p) => p.creatorId === where.creatorId);
        if (where?.status) list = list.filter((p) => p.status === where.status);
        return Promise.resolve(list.map((p) => enrichProgram(p)));
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const prog = programs.find((p) => p.id === where.id);
        if (!prog) return Promise.resolve(null);
        return Promise.resolve(enrichProgram(prog));
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = programs.findIndex((p) => p.id === where.id);
        if (idx >= 0) {
          programs[idx] = { ...programs[idx], ...data, updatedAt: new Date() };
          return Promise.resolve(programs[idx]);
        }
        return Promise.resolve(null);
      }),
    },
    programAssignment: {
      create: jest.fn().mockImplementation(({ data }) => {
        const prog = programs.find((p) => p.id === data.programId) || { name: 'Program Title', version: 1 };
        const assignment = {
          id: `pa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          programId: data.programId,
          athleteId: data.athleteId,
          startDate: data.startDate,
          endDate: data.endDate || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
          program: prog,
        };
        programAssignments.push(assignment);
        return Promise.resolve(assignment);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const found = programAssignments.find(
          (pa) => pa.athleteId === where.athleteId && (where.isActive === undefined || pa.isActive === where.isActive),
        );
        return Promise.resolve(found || null);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        programAssignments.forEach((pa) => {
          if (pa.athleteId === where.athleteId && (where.isActive === undefined || pa.isActive === where.isActive)) {
            Object.assign(pa, data, { updatedAt: new Date() });
            count++;
          }
        });
        return Promise.resolve({ count });
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const pa = programAssignments.find((p) => p.id === where.id);
        if (pa) {
          Object.assign(pa, data, { updatedAt: new Date() });
          return Promise.resolve(pa);
        }
        return Promise.resolve(null);
      }),
    },
    workoutSession: {
      count: jest.fn().mockImplementation(({ where }) => {
        const filtered = workoutSessions.filter(
          (s) => s.userId === where.userId && (where.status ? s.status === where.status : true),
        );
        return Promise.resolve(filtered.length);
      }),
    },
    mealPlan: {
      create: jest.fn().mockImplementation(({ data }) => {
        const plan = {
          id: `mp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          creatorId: data.creatorId,
          name: data.name,
          description: data.description,
          status: data.status,
          version: data.version || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          meals: (data.meals?.create || []).map((m: any, mIdx: number) => ({
            id: `meal_${mIdx}`,
            name: m.name,
            orderIndex: m.orderIndex,
            items: (m.items?.create || []).map((it: any) => ({
              ...it,
              foodItem: { name: 'Sample Food' },
            })),
          })),
        };
        mealPlans.push(plan);
        return Promise.resolve(plan);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const plan = mealPlans.find((p) => p.id === where.id);
        return Promise.resolve(plan || null);
      }),
    },
    mealPlanAssignment: {
      create: jest.fn().mockImplementation(({ data }) => {
        const plan = mealPlans.find((p) => p.id === data.mealPlanId) || { name: 'Nutrition Plan', version: 1 };
        const assignment = {
          id: `mpa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          mealPlanId: data.mealPlanId,
          athleteId: data.athleteId,
          startDate: data.startDate,
          endDate: data.endDate || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          mealPlan: plan,
          createdAt: new Date(),
        };
        mealPlanAssignments.push(assignment);
        return Promise.resolve(assignment);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        mealPlanAssignments.forEach((mpa) => {
          if (mpa.athleteId === where.athleteId && (where.isActive === undefined || mpa.isActive === where.isActive)) {
            Object.assign(mpa, data);
            count++;
          }
        });
        return Promise.resolve({ count });
      }),
    },
    exercise: {
      create: jest.fn().mockImplementation(({ data }) => {
        const ex = {
          id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        exercises.push(ex);
        return Promise.resolve(ex);
      }),
    },
    coachClientRelationship: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.coachId_clientId) {
          const rel = relationships.find(
            (r) => r.coachId === where.coachId_clientId.coachId && r.clientId === where.coachId_clientId.clientId,
          );
          return Promise.resolve(rel || null);
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const rel = relationships.find((r) => r.id === where.id);
        if (rel) {
          Object.assign(rel, data, { updatedAt: new Date() });
          return Promise.resolve(rel);
        }
        return Promise.resolve(null);
      }),
    },
    user: {
      findUnique: jest.fn().mockImplementation(({ where, include }) => {
        const u = users.find((x) => x.id === where.id);
        if (!u) return Promise.resolve(null);

        if (include) {
          const clientAssignedProgs = programAssignments.filter((pa) => pa.athleteId === u.id && pa.isActive);
          const clientAssignedMeals = mealPlanAssignments.filter((ma) => ma.athleteId === u.id && ma.isActive);
          const clientSessions = workoutSessions.filter((ws) => ws.userId === u.id);
          const clientMetrics = bodyMetrics.filter((bm) => bm.userId === u.id);

          return Promise.resolve({
            ...u,
            profile: u.profile || { fullName: 'Athlete Test', heightCm: 180, weightKg: 78 },
            preference: u.preference || { unitSystem: 'METRIC', timezone: 'UTC' },
            goal: u.goal || { primaryGoal: 'HYPERTROPHY' },
            assignedPrograms: clientAssignedProgs,
            assignedMealPlans: clientAssignedMeals,
            workoutSessions: clientSessions,
            bodyMetrics: clientMetrics,
            updatedAt: new Date(),
          });
        }
        return Promise.resolve(u);
      }),
    },
  };

  function enrichProgram(prog: any) {
    const days = programDays.filter((d) => d.programId === prog.id);
    return {
      ...prog,
      days: days.map((d) => {
        const templates = workoutTemplates.filter((t) => t.programDayId === d.id);
        return {
          ...d,
          templates: templates.map((t) => {
            const exList = templateExercises.filter((te) => te.workoutTemplateId === t.id);
            return {
              ...t,
              exercises: exList.map((e) => ({
                ...e,
                exercise: { name: 'Barbell Squat', primaryMuscle: 'Quadriceps' },
              })),
            };
          }),
        };
      }),
    };
  }

  const coachUser: IAuthUser = {
    id: 'coach_alpha',
    email: 'coach@alpha.os',
    role: UserRole.COACH,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  const trainerUser: IAuthUser = {
    id: 'trainer_beta',
    email: 'trainer@alpha.os',
    role: UserRole.TRAINER,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  const nutritionistUser: IAuthUser = {
    id: 'nutritionist_gamma',
    email: 'nutritionist@alpha.os',
    role: UserRole.NUTRITIONIST,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  const clientUser: IAuthUser = {
    id: 'client_athlete_1',
    email: 'athlete1@alpha.os',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  beforeEach(async () => {
    programs = [];
    programDays = [];
    workoutTemplates = [];
    templateExercises = [];
    programAssignments = [];
    mealPlans = [];
    mealPlanAssignments = [];
    exercises = [];
    users = [coachUser, trainerUser, nutritionistUser, clientUser];
    relationships = [];
    workoutSessions = [];
    bodyMetrics = [];

    // Establish active relationships with coach, trainer, nutritionist
    relationships.push({
      id: 'rel_coach_client',
      coachId: coachUser.id,
      clientId: clientUser.id,
      status: ClientStatus.ACTIVE,
      isActive: true,
    });
    relationships.push({
      id: 'rel_trainer_client',
      coachId: trainerUser.id,
      clientId: clientUser.id,
      status: ClientStatus.ACTIVE,
      isActive: true,
    });
    relationships.push({
      id: 'rel_nutritionist_client',
      coachId: nutritionistUser.id,
      clientId: clientUser.id,
      status: ClientStatus.ACTIVE,
      isActive: true,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalService,
        CoachClientGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    portalService = module.get<PortalService>(PortalService);
  });

  // -------------------------------------------------------------
  // SUITE 1: WORKOUT PROGRAM BUILDER
  // -------------------------------------------------------------
  describe('1. Workout Program Builder Engine', () => {
    it('Coach creates a new multi-day workout program with split days and exercise prescriptions', async () => {
      const program = await portalService.createProgram(coachUser.id, coachUser.role, {
        name: 'Hypertrophy Mastery Block A',
        description: '4-week high volume hypertrophy block',
        weeksCount: 4,
        days: [
          {
            dayOfWeek: 1,
            title: 'Lower Body Strength',
            exercises: [
              {
                exerciseId: 'ex_squat',
                orderIndex: 0,
                targetSets: 4,
                targetReps: 8,
                targetRpe: 8,
                restSeconds: 120,
                notes: 'Focus on depth and control',
              },
            ],
          },
        ],
      });

      expect(program).toBeDefined();
      expect(program.name).toBe('Hypertrophy Mastery Block A');
      expect(program.version).toBe(1);
      expect(program.status).toBe(ProgramStatus.PUBLISHED);
      expect(program.days).toHaveLength(1);
      expect(program.days[0]!.title).toBe('Lower Body Strength');
      expect(program.days[0]!.exercises).toHaveLength(1);
      expect(program.days[0]!.exercises[0]!.targetSets).toBe(4);
    });

    it('Trainer can create workout programs', async () => {
      const program = await portalService.createProgram(trainerUser.id, trainerUser.role, {
        name: 'Trainer Strength Routine',
        days: [
          {
            dayOfWeek: 2,
            title: 'Upper Body Power',
            exercises: [
              {
                exerciseId: 'ex_bench',
                orderIndex: 0,
                targetSets: 5,
                targetReps: 5,
                restSeconds: 180,
              },
            ],
          },
        ],
      });

      expect(program).toBeDefined();
      expect(program.creatorId).toBe(trainerUser.id);
    });

    it('NUTRITIONIST is REJECTED from creating workout programs (Strict Role Enforcement)', async () => {
      await expect(
        portalService.createProgram(nutritionistUser.id, nutritionistUser.role, {
          name: 'Unauthorized Nutritionist Workout',
          days: [],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------
  // SUITE 2: PROGRAM VERSIONING (V1 -> V2)
  // -------------------------------------------------------------
  describe('2. Program Versioning & Historical Immutability', () => {
    it('Creates Program V2 preserving V1 historical integrity', async () => {
      const v1 = await portalService.createProgram(coachUser.id, coachUser.role, {
        name: 'Periodized Block',
        weeksCount: 4,
        days: [
          {
            dayOfWeek: 1,
            title: 'Day 1 V1',
            exercises: [{ exerciseId: 'ex_sq', orderIndex: 0, targetSets: 3, targetReps: 10, restSeconds: 90 }],
          },
        ],
      });

      expect(v1.version).toBe(1);

      // Create Version 2
      const v2 = await portalService.versionProgram(coachUser.id, coachUser.role, v1.id, {
        name: 'Periodized Block (v2)',
        days: [
          {
            dayOfWeek: 1,
            title: 'Day 1 V2 (Increased Volume)',
            exercises: [{ exerciseId: 'ex_sq', orderIndex: 0, targetSets: 5, targetReps: 12, restSeconds: 90 }],
          },
        ],
      });

      expect(v2).toBeDefined();
      expect(v2.version).toBe(2);
      expect(v2.parentProgramId).toBe(v1.id);
      expect(v2.days[0]!.title).toBe('Day 1 V2 (Increased Volume)');
      expect(v2.days[0]!.exercises[0]!.targetSets).toBe(5);

      // Original V1 remains unchanged in database
      const originalV1 = await portalService.getProgram(coachUser.id, coachUser.role, v1.id);
      expect(originalV1.version).toBe(1);
      expect(originalV1.days[0]!.exercises[0]!.targetSets).toBe(3);
    });
  });

  // -------------------------------------------------------------
  // SUITE 3: WORKOUT PROGRAM ASSIGNMENT & REPLACEMENT
  // -------------------------------------------------------------
  describe('3. Workout Program Assignment & Safe Replacement', () => {
    let program1: any;
    let program2: any;

    beforeEach(async () => {
      program1 = await portalService.createProgram(coachUser.id, coachUser.role, {
        name: 'Phase 1 Program',
        days: [
          { dayOfWeek: 1, title: 'Leg Day', exercises: [{ exerciseId: 'e1', orderIndex: 0, targetSets: 3, targetReps: 10, restSeconds: 90 }] },
        ],
      });

      program2 = await portalService.createProgram(coachUser.id, coachUser.role, {
        name: 'Phase 2 Program',
        days: [
          { dayOfWeek: 1, title: 'Leg Day Heavy', exercises: [{ exerciseId: 'e1', orderIndex: 0, targetSets: 5, targetReps: 5, restSeconds: 150 }] },
        ],
      });
    });

    it('Assigns workout program to client; activates assignment', async () => {
      const assignment = await portalService.assignProgram(coachUser.id, coachUser.role, {
        clientId: clientUser.id,
        programId: program1.id,
        startDate: '2026-10-01T00:00:00.000Z',
      });

      expect(assignment).toBeDefined();
      expect(assignment.athleteId).toBe(clientUser.id);
      expect(assignment.programId).toBe(program1.id);
      expect(assignment.isActive).toBe(true);
    });

    it('NUTRITIONIST is REJECTED from assigning workout programs', async () => {
      await expect(
        portalService.assignProgram(nutritionistUser.id, nutritionistUser.role, {
          clientId: clientUser.id,
          programId: program1.id,
          startDate: '2026-10-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Replaces active program with confirmation; preserves past completed sessions', async () => {
      // 1. Assign initial program
      await portalService.assignProgram(coachUser.id, coachUser.role, {
        clientId: clientUser.id,
        programId: program1.id,
        startDate: '2026-09-01T00:00:00.000Z',
      });

      // 2. Simulate 4 completed workouts under initial program
      for (let i = 1; i <= 4; i++) {
        workoutSessions.push({
          id: `session_${i}`,
          userId: clientUser.id,
          status: 'COMPLETED',
          title: `Workout ${i}`,
          completedAt: new Date(`2026-09-0${i}T10:00:00.000Z`),
        });
      }

      // 3. Attempt replacement without confirmation => REJECTED
      await expect(
        portalService.replaceProgram(coachUser.id, coachUser.role, {
          clientId: clientUser.id,
          newProgramId: program2.id,
          effectiveDate: '2026-10-01T00:00:00.000Z',
          confirm: false,
        }),
      ).rejects.toThrow(BadRequestException);

      // 4. Execute replacement with explicit confirmation => SUCCEEDS
      const result = await portalService.replaceProgram(coachUser.id, coachUser.role, {
        clientId: clientUser.id,
        newProgramId: program2.id,
        effectiveDate: '2026-10-01T00:00:00.000Z',
        confirm: true,
      });

      expect(result.success).toBe(true);
      expect(result.replacedProgramId).toBe(program1.id);
      expect(result.newProgramId).toBe(program2.id);
      expect(result.preservedCompletedSessionsCount).toBe(4);

      // Verify old assignment is deactivated
      const oldAssignment = programAssignments.find((p) => p.programId === program1.id);
      expect(oldAssignment.isActive).toBe(false);

      // Verify new assignment is active
      const newAssignment = programAssignments.find((p) => p.programId === program2.id);
      expect(newAssignment.isActive).toBe(true);

      // Verify all 4 completed sessions remain untouched
      expect(workoutSessions.filter((s) => s.userId === clientUser.id && s.status === 'COMPLETED')).toHaveLength(4);
    });
  });

  // -------------------------------------------------------------
  // SUITE 4: NUTRITION PLAN BUILDER & ASSIGNMENT
  // -------------------------------------------------------------
  describe('4. Nutrition Plan Builder & Assignment', () => {
    it('Nutritionist creates custom nutrition plan with meals, portions and calculated macro totals', async () => {
      const plan = await portalService.createMealPlan(nutritionistUser.id, nutritionistUser.role, {
        name: 'High Protein Cutting Protocol',
        description: '2,200 kcal cutting plan with 190g protein',
        meals: [
          {
            name: 'Breakfast',
            orderIndex: 0,
            items: [
              {
                foodItemId: 'food_eggs',
                quantity: 3,
                totalWeightG: 150,
                calories: 210,
                proteinGrams: 18,
                carbsGrams: 2,
                fatGrams: 15,
              },
              {
                foodItemId: 'food_oats',
                quantity: 1,
                totalWeightG: 80,
                calories: 300,
                proteinGrams: 10,
                carbsGrams: 54,
                fatGrams: 5,
              },
            ],
          },
        ],
      });

      expect(plan).toBeDefined();
      expect(plan.name).toBe('High Protein Cutting Protocol');
      expect(plan.totalDailyCalories).toBe(510);
      expect(plan.totalDailyProtein).toBe(28);
      expect(plan.totalDailyCarbs).toBe(56);
      expect(plan.totalDailyFat).toBe(20);
      expect(plan.meals).toHaveLength(1);
    });

    it('TRAINER is REJECTED from creating nutrition plans (Strict Role Enforcement)', async () => {
      await expect(
        portalService.createMealPlan(trainerUser.id, trainerUser.role, {
          name: 'Unauthorized Trainer Meal Plan',
          meals: [],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Assigns nutrition plan to client; activates assignment', async () => {
      const plan = await portalService.createMealPlan(nutritionistUser.id, nutritionistUser.role, {
        name: 'Athlete Daily Fuel',
        meals: [],
      });

      const assignment = await portalService.assignMealPlan(nutritionistUser.id, nutritionistUser.role, {
        clientId: clientUser.id,
        mealPlanId: plan.id,
        startDate: '2026-10-01T00:00:00.000Z',
      });

      expect(assignment).toBeDefined();
      expect(assignment.athleteId).toBe(clientUser.id);
      expect(assignment.mealPlanId).toBe(plan.id);
      expect(assignment.isActive).toBe(true);
    });

    it('TRAINER is REJECTED from assigning nutrition plans', async () => {
      const plan = await portalService.createMealPlan(nutritionistUser.id, nutritionistUser.role, {
        name: 'Meal Plan Test',
        meals: [],
      });

      await expect(
        portalService.assignMealPlan(trainerUser.id, trainerUser.role, {
          clientId: clientUser.id,
          mealPlanId: plan.id,
          startDate: '2026-10-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------
  // SUITE 5: CUSTOM EXERCISE CREATION
  // -------------------------------------------------------------
  describe('5. Custom Exercise Creation', () => {
    it('Coach creates custom exercise into authoritative catalog', async () => {
      const ex = await portalService.createCustomExercise(coachUser.id, coachUser.role, {
        name: 'Deficit Romanian Deadlift',
        instructions: 'Stand on a 2-inch platform, hinge hips back keeping spine neutral',
        equipment: 'Barbell',
        primaryMuscle: 'Hamstrings',
        secondaryMuscles: ['Glutes', 'Lower Back'],
        movementCategory: 'STRENGTH',
      });

      expect(ex).toBeDefined();
      expect(ex.name).toBe('Deficit Romanian Deadlift');
      expect(ex.primaryMuscle).toBe('Hamstrings');
    });

    it('Nutritionist is rejected from creating exercises', async () => {
      await expect(
        portalService.createCustomExercise(nutritionistUser.id, nutritionistUser.role, {
          name: 'Unauthorized Exercise',
          instructions: 'None',
          equipment: 'Dumbbell',
          primaryMuscle: 'Chest',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------
  // SUITE 6: CLIENT DETAIL DOSSIER & SAFE OFFBOARDING
  // -------------------------------------------------------------
  describe('6. Client Detail Dossier & Safe Offboarding', () => {
    it('Retrieves comprehensive client detail dossier with profile, active programs, meals, metrics', async () => {
      // Seed a completed workout session
      workoutSessions.push({
        id: 'ws_comp_1',
        userId: clientUser.id,
        status: 'COMPLETED',
        title: 'Push Day',
        completedAt: new Date(),
        durationSeconds: 3600,
        totalVolumeKg: 12000,
        exercises: [{ id: '1' }, { id: '2' }],
      });

      // Seed a body metric
      bodyMetrics.push({
        id: 'bm_1',
        userId: clientUser.id,
        weightKg: 80,
        recordedAt: new Date(),
      });

      const dossier = await portalService.getClientDetail(coachUser.id, coachUser.role, clientUser.id);

      expect(dossier).toBeDefined();
      expect(dossier.overview.clientId).toBe(clientUser.id);
      expect(dossier.profile.heightCm).toBe(180);
      expect(dossier.profile.weightKg).toBe(78);
      expect(dossier.recentWorkouts).toHaveLength(1);
      expect(dossier.recentWorkouts[0]!.title).toBe('Push Day');
      expect(dossier.recentMetrics.bmi).toBe(24.7); // 80 / (1.8^2) = 24.69 -> 24.7
      expect(dossier.recentMetrics.bmiCategory).toBe('NORMAL');
    });

    it('MANDATORY: Safe Offboarding preserves all athlete data intact', async () => {
      workoutSessions.push({
        id: 'ws_comp_offboard',
        userId: clientUser.id,
        status: 'COMPLETED',
        title: 'Historical Workout Prior to Offboarding',
      });

      const rel = relationships.find((r) => r.coachId === coachUser.id && r.clientId === clientUser.id);
      expect(rel.status).toBe(ClientStatus.ACTIVE);

      // Offboard client
      const updated = await portalService.updateClientStatus(coachUser.id, coachUser.role, clientUser.id, {
        status: ClientStatus.ARCHIVED,
      });

      expect(updated.status).toBe(ClientStatus.ARCHIVED);
      expect(updated.isActive).toBe(false);

      // Verify athlete user record is NOT deleted
      const athlete = users.find((u) => u.id === clientUser.id);
      expect(athlete).toBeDefined();

      // Verify workout sessions remain intact
      expect(workoutSessions.filter((s) => s.userId === clientUser.id)).toHaveLength(1);
    });
  });
});
