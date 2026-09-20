import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutsService } from '../src/modules/workouts/workouts.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkoutStatus } from '@alpha/types';

describe('Workouts Engine & Cross-User Security Suite', () => {
  let service: WorkoutsService;

  const userAId = 'user_athlete_A_1111';
  const userBId = 'user_athlete_B_2222';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkoutsService],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
  });

  describe('1. Exercise Library Engine', () => {
    it('should list all built-in exercises', async () => {
      const exercises = await service.getExercises();
      expect(exercises.length).toBeGreaterThanOrEqual(10);
    });

    it('should list exercises filtered by muscle group', async () => {
      const result = await service.getExercises({ muscleGroup: 'Chest' });
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.every((e) => e.primaryMuscle === 'Chest' || e.secondaryMuscles.includes('Chest'))).toBe(true);
    });

    it('should list exercises filtered by equipment', async () => {
      const result = await service.getExercises({ equipment: 'Barbell' });
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.every((e) => e.equipment === 'Barbell')).toBe(true);
    });

    it('should retrieve a specific exercise by ID', async () => {
      const exercise = await service.getExerciseById('ex_bench_press');
      expect(exercise).toBeDefined();
      expect(exercise.name).toBe('Barbell Bench Press');
      expect(exercise.primaryMuscle).toBe('Chest');
    });
  });

  describe('2. Active Program Split Engine', () => {
    it('should return active program with 7-day split matching Stitch design', async () => {
      const program = await service.getActiveProgram(userAId);
      expect(program).toBeDefined();
      expect(program.days).toHaveLength(7);
      
      const mon = program.days.find((d) => d.dayOfWeek === 1);
      expect(mon).toBeDefined();
      expect(mon?.title).toBe('Chest + Triceps');
      expect(mon?.templates[0]?.exercises.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('3. Active Workout Session Lifecycle', () => {
    it('should start a new workout session for User A', async () => {
      const session = await service.startSession(userAId, {
        title: 'Hypertrophy Push A',
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(userAId);
      expect(session.title).toBe('Hypertrophy Push A');
      expect(session.status).toBe(WorkoutStatus.IN_PROGRESS);
      expect(session.startedAt).toBeDefined();
      expect(session.totalVolumeKg).toBe(0);
      expect(session.exercises.length).toBeGreaterThanOrEqual(1);
    });

    it('should log sets and automatically calculate volume (weight * reps)', async () => {
      const session = await service.startSession(userAId, {
        title: 'Heavy Chest & Triceps',
      });

      const sessionEx = session.exercises[0]!;

      // Log Set 1: 100kg x 10 reps = 1000 kg volume
      const set1 = await service.logSet(userAId, session.id, {
        workoutSessionExerciseId: sessionEx.id,
        setNumber: 1,
        weightKg: 100,
        actualReps: 10,
        rpe: 8,
        isCompleted: true,
      });

      expect(set1).toBeDefined();
      expect(set1.weightKg).toBe(100);
      expect(set1.actualReps).toBe(10);
      expect(set1.isCompleted).toBe(true);

      // Log Set 2: 105kg x 8 reps = 840 kg volume
      const set2 = await service.logSet(userAId, session.id, {
        workoutSessionExerciseId: sessionEx.id,
        setNumber: 2,
        weightKg: 105,
        actualReps: 8,
        rpe: 9,
        isCompleted: true,
      });

      expect(set2).toBeDefined();

      // Retrieve full session with total volume
      const updatedSession = await service.getSessionById(userAId, session.id);
      expect(updatedSession.totalVolumeKg).toBe(1840); // 1000 + 840
      expect(updatedSession.exercises[0]!.sets.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a set and recalculate session volume', async () => {
      const session = await service.startSession(userAId, {
        title: 'Leg Day Volume',
      });
      const sessionEx = session.exercises[0]!;

      const set1 = await service.logSet(userAId, session.id, {
        workoutSessionExerciseId: sessionEx.id,
        setNumber: 1,
        weightKg: 100,
        actualReps: 10,
        isCompleted: true,
      });

      let updatedSession = await service.getSessionById(userAId, session.id);
      expect(updatedSession.totalVolumeKg).toBe(1000);

      // Update to 120kg x 10 reps
      await service.updateSet(userAId, session.id, set1.id, {
        weightKg: 120,
        actualReps: 10,
      });

      updatedSession = await service.getSessionById(userAId, session.id);
      expect(updatedSession.totalVolumeKg).toBe(1200);
    });

    it('should complete workout session, calculate duration, and set status to COMPLETED', async () => {
      const session = await service.startSession(userAId, {
        title: 'Leg Day Volume',
      });

      const completed = await service.completeSession(userAId, session.id, {
        durationSeconds: 3600,
        notes: 'Felt strong, solid depth on squats',
      });

      expect(completed.status).toBe(WorkoutStatus.COMPLETED);
      expect(completed.completedAt).toBeDefined();
      expect(completed.durationSeconds).toBe(3600);
      expect(completed.notes).toBe('Felt strong, solid depth on squats');

      // Attempting to log a set to a completed session must fail
      await expect(
        service.logSet(userAId, session.id, {
          workoutSessionExerciseId: session.exercises[0]!.id,
          setNumber: 4,
          weightKg: 100,
          actualReps: 5,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Strict User Isolation & Cross-User Security', () => {
    it('CRITICAL: User B CANNOT read User A workout session', async () => {
      const sessionA = await service.startSession(userAId, {
        title: "User A's Secret Session",
      });

      await expect(service.getSessionById(userBId, sessionA.id)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('CRITICAL: User B CANNOT log sets into User A workout session', async () => {
      const sessionA = await service.startSession(userAId, {
        title: "User A's Workout",
      });

      await expect(
        service.logSet(userBId, sessionA.id, {
          workoutSessionExerciseId: sessionA.exercises[0]!.id,
          setNumber: 1,
          weightKg: 80,
          actualReps: 10,
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('CRITICAL: User B CANNOT complete or modify User A workout session', async () => {
      const sessionA = await service.startSession(userAId, {
        title: "User A's Leg Day",
      });

      await expect(
        service.completeSession(userBId, sessionA.id, {
          notes: 'Malicious modification attempt',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('CRITICAL: User cannot log set on non-existent session', async () => {
      await expect(
        service.logSet(userAId, 'non_existent_session_id', {
          workoutSessionExerciseId: 'fake_ex',
          setNumber: 1,
          weightKg: 100,
          actualReps: 10,
        })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
