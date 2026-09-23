import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HashUtil } from '@alpha/utils';
import { WorkoutStatus } from '@alpha/types';
import {
  CreateExerciseDto,
  StartWorkoutSessionDto,
  LogWorkoutSetDto,
  UpdateWorkoutSetDto,
  CompleteWorkoutSessionDto,
} from '@alpha/validation';

export interface StoredExercise {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: string;
  instructions?: string;
  createdAt: Date;
}

export interface StoredProgram {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  weeksCount: number;
  days: StoredProgramDay[];
}

export interface StoredProgramDay {
  id: string;
  programId: string;
  dayOfWeek: number; // 1 = Mon, 7 = Sun
  title: string;
  templates: StoredWorkoutTemplate[];
}

export interface StoredWorkoutTemplate {
  id: string;
  name: string;
  notes?: string;
  exercises: StoredTemplateExercise[];
}

export interface StoredTemplateExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  targetSets: number;
  targetReps: number;
  targetRpe?: number;
  restSeconds: number;
}

export interface StoredWorkoutSession {
  id: string;
  userId: string;
  workoutTemplateId?: string;
  title: string;
  status: WorkoutStatus;
  startedAt: Date;
  completedAt?: Date | null;
  durationSeconds: number;
  totalVolumeKg: number;
  notes?: string;
  exercises: StoredSessionExercise[];
}

export interface StoredSessionExercise {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  sets: StoredWorkoutSet[];
}

export interface StoredWorkoutSet {
  id: string;
  workoutSessionExerciseId: string;
  setNumber: number;
  targetReps?: number;
  actualReps: number;
  weightKg: number;
  rpe?: number;
  isCompleted: boolean;
}

@Injectable()
export class WorkoutsService {
  private readonly logger = new Logger(WorkoutsService.name);

  // In-memory persistent stores for testing and execution
  private readonly exercises = new Map<string, StoredExercise>();
  private readonly programs = new Map<string, StoredProgram>();
  private readonly programAssignments = new Map<string, { programId: string; athleteId: string }>();
  private readonly workoutSessions = new Map<string, StoredWorkoutSession>();

  constructor() {
    this.seedDefaultExercises();
    this.seedDefaultProgram();
  }

  // -------------------------------------------------------------
  // 1. EXERCISE LIBRARY
  // -------------------------------------------------------------

  async getExercises(filter?: { muscleGroup?: string; equipment?: string; search?: string }): Promise<StoredExercise[]> {
    let list = Array.from(this.exercises.values());

    if (filter?.muscleGroup) {
      const mg = filter.muscleGroup.toLowerCase();
      list = list.filter((e) => e.primaryMuscle.toLowerCase() === mg || e.secondaryMuscles.some((m) => m.toLowerCase() === mg));
    }

    if (filter?.equipment) {
      const eq = filter.equipment.toLowerCase();
      list = list.filter((e) => e.equipment.toLowerCase() === eq);
    }

    if (filter?.search) {
      const s = filter.search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(s));
    }

    return list;
  }

  async getExerciseById(id: string): Promise<StoredExercise> {
    const exercise = this.exercises.get(id);
    if (!exercise) {
      throw new NotFoundException({ code: 'EXERCISE_NOT_FOUND', message: `Exercise with ID [${id}] not found` });
    }
    return exercise;
  }

  async createExercise(dto: CreateExerciseDto): Promise<StoredExercise> {
    const id = HashUtil.generateUuid();
    const exercise: StoredExercise = {
      id,
      name: dto.name.trim(),
      category: dto.category,
      primaryMuscle: dto.primaryMuscle,
      secondaryMuscles: dto.secondaryMuscles || [],
      equipment: dto.equipment || 'Barbell',
      difficulty: dto.difficulty || 'INTERMEDIATE',
      instructions: dto.instructions,
      createdAt: new Date(),
    };
    this.exercises.set(id, exercise);
    return exercise;
  }

  // -------------------------------------------------------------
  // 2. PROGRAMS & ASSIGNMENTS
  // -------------------------------------------------------------

  async getActiveProgram(userId: string): Promise<StoredProgram> {
    // Check if user has an assigned program, otherwise return the default ALPHA Hypertrophy protocol
    const assigned = this.programAssignments.get(userId);
    const programId = assigned ? assigned.programId : 'default_program_alpha_split';
    const program = this.programs.get(programId);
    if (!program) {
      throw new NotFoundException({ code: 'PROGRAM_NOT_FOUND', message: 'No active workout program found for athlete' });
    }
    return program;
  }

  async getTodayWorkout(userId: string, dayOfWeekParam?: number): Promise<StoredProgramDay | null> {
    const program = await this.getActiveProgram(userId);
    // 1=Mon ... 7=Sun
    const dow = dayOfWeekParam || (new Date().getDay() === 0 ? 7 : new Date().getDay());
    const day = program.days.find((d) => d.dayOfWeek === dow);
    return day || null;
  }

  async assignProgram(athleteId: string, programId: string) {
    if (!this.programs.has(programId)) {
      throw new NotFoundException({ code: 'PROGRAM_NOT_FOUND', message: 'Program not found' });
    }
    this.programAssignments.set(athleteId, { programId, athleteId });
    return { success: true, message: 'Program successfully assigned' };
  }

  // -------------------------------------------------------------
  // 3. WORKOUT SESSIONS & EXECUTION HUD
  // -------------------------------------------------------------

  async startSession(userId: string, dto: StartWorkoutSessionDto): Promise<StoredWorkoutSession> {
    const sessionId = HashUtil.generateUuid();
    let templateExercises: StoredTemplateExercise[] = [];

    // If template specified, look up exercises
    if (dto.workoutTemplateId) {
      for (const p of this.programs.values()) {
        for (const d of p.days) {
          const t = d.templates.find((tpl) => tpl.id === dto.workoutTemplateId);
          if (t) {
            templateExercises = t.exercises;
            break;
          }
        }
      }
    }

    // Initialize session exercises and default empty sets
    const sessionExercises: StoredSessionExercise[] = [];

    if (templateExercises.length > 0) {
      templateExercises.forEach((tEx, idx) => {
        const sessionExId = HashUtil.generateUuid();
        const sets: StoredWorkoutSet[] = [];
        for (let s = 1; s <= tEx.targetSets; s++) {
          sets.push({
            id: HashUtil.generateUuid(),
            workoutSessionExerciseId: sessionExId,
            setNumber: s,
            targetReps: tEx.targetReps,
            actualReps: 0,
            weightKg: 0,
            rpe: tEx.targetRpe,
            isCompleted: false,
          });
        }
        sessionExercises.push({
          id: sessionExId,
          workoutSessionId: sessionId,
          exerciseId: tEx.exerciseId,
          exerciseName: tEx.exerciseName,
          orderIndex: idx,
          sets,
        });
      });
    } else {
      // Default initial exercise if starting a blank workout session (matching Stitch Chest + Triceps)
      const defaultEx = Array.from(this.exercises.values())[0];
      if (defaultEx) {
        const sessionExId = HashUtil.generateUuid();
        sessionExercises.push({
          id: sessionExId,
          workoutSessionId: sessionId,
          exerciseId: defaultEx.id,
          exerciseName: defaultEx.name,
          orderIndex: 0,
          sets: [
            { id: HashUtil.generateUuid(), workoutSessionExerciseId: sessionExId, setNumber: 1, targetReps: 15, actualReps: 0, weightKg: 60, isCompleted: false },
            { id: HashUtil.generateUuid(), workoutSessionExerciseId: sessionExId, setNumber: 2, targetReps: 12, actualReps: 0, weightKg: 70, isCompleted: false },
            { id: HashUtil.generateUuid(), workoutSessionExerciseId: sessionExId, setNumber: 3, targetReps: 10, actualReps: 0, weightKg: 80, isCompleted: false },
          ],
        });
      }
    }

    const session: StoredWorkoutSession = {
      id: sessionId,
      userId,
      workoutTemplateId: dto.workoutTemplateId,
      title: dto.title,
      status: WorkoutStatus.IN_PROGRESS,
      startedAt: new Date(),
      durationSeconds: 0,
      totalVolumeKg: 0,
      exercises: sessionExercises,
    };

    this.workoutSessions.set(sessionId, session);
    this.logger.log(`Workout session [${sessionId}] started for user [${userId}]`);
    return session;
  }

  async getSessionById(userId: string, sessionId: string): Promise<StoredWorkoutSession> {
    const session = this.workoutSessions.get(sessionId);
    if (!session) {
      throw new NotFoundException({ code: 'SESSION_NOT_FOUND', message: 'Workout session not found' });
    }

    // Strict User Isolation
    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied: You are not authorized to access this workout session',
      });
    }

    return session;
  }

  async logSet(userId: string, sessionId: string, dto: LogWorkoutSetDto): Promise<StoredWorkoutSet> {
    const session = await this.getSessionById(userId, sessionId);

    if (session.status !== WorkoutStatus.IN_PROGRESS) {
      throw new BadRequestException({ code: 'SESSION_NOT_ACTIVE', message: 'Cannot log sets to an inactive or completed session' });
    }

    const sessionExercise = session.exercises.find((e) => e.id === dto.workoutSessionExerciseId);
    if (!sessionExercise) {
      throw new NotFoundException({ code: 'EXERCISE_NOT_IN_SESSION', message: 'Exercise not found in this workout session' });
    }

    let existingSet = sessionExercise.sets.find((s) => s.setNumber === dto.setNumber);

    if (existingSet) {
      existingSet.actualReps = dto.actualReps;
      existingSet.weightKg = dto.weightKg;
      existingSet.isCompleted = dto.isCompleted !== undefined ? dto.isCompleted : true;
      if (dto.rpe !== undefined) existingSet.rpe = dto.rpe;
    } else {
      existingSet = {
        id: HashUtil.generateUuid(),
        workoutSessionExerciseId: sessionExercise.id,
        setNumber: dto.setNumber,
        targetReps: dto.targetReps,
        actualReps: dto.actualReps,
        weightKg: dto.weightKg,
        rpe: dto.rpe,
        isCompleted: dto.isCompleted !== undefined ? dto.isCompleted : true,
      };
      sessionExercise.sets.push(existingSet);
    }

    // Recalculate total workout volume
    this.recalculateVolume(session);
    return existingSet;
  }

  async updateSet(userId: string, sessionId: string, setId: string, dto: UpdateWorkoutSetDto): Promise<StoredWorkoutSet> {
    const session = await this.getSessionById(userId, sessionId);

    let targetSet: StoredWorkoutSet | undefined;
    for (const ex of session.exercises) {
      targetSet = ex.sets.find((s) => s.id === setId);
      if (targetSet) break;
    }

    if (!targetSet) {
      throw new NotFoundException({ code: 'SET_NOT_FOUND', message: 'Workout set not found' });
    }

    if (dto.actualReps !== undefined) targetSet.actualReps = dto.actualReps;
    if (dto.weightKg !== undefined) targetSet.weightKg = dto.weightKg;
    if (dto.rpe !== undefined) targetSet.rpe = dto.rpe;
    if (dto.isCompleted !== undefined) targetSet.isCompleted = dto.isCompleted;

    this.recalculateVolume(session);
    return targetSet;
  }

  async completeSession(userId: string, sessionId: string, dto: CompleteWorkoutSessionDto): Promise<StoredWorkoutSession> {
    const session = await this.getSessionById(userId, sessionId);

    if (session.status === WorkoutStatus.COMPLETED) {
      return session;
    }

    session.status = WorkoutStatus.COMPLETED;
    session.completedAt = new Date();
    session.durationSeconds = dto.durationSeconds || Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 1000);
    if (dto.notes) session.notes = dto.notes;

    this.recalculateVolume(session);
    this.logger.log(`Workout session [${sessionId}] completed by user [${userId}]. Volume: ${session.totalVolumeKg}kg`);
    return session;
  }

  async getUserSessions(userId: string, limit = 20): Promise<StoredWorkoutSession[]> {
    return Array.from(this.workoutSessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  private recalculateVolume(session: StoredWorkoutSession) {
    let volume = 0;
    for (const ex of session.exercises) {
      for (const s of ex.sets) {
        if (s.isCompleted && s.actualReps > 0 && s.weightKg > 0) {
          volume += s.actualReps * s.weightKg;
        }
      }
    }
    session.totalVolumeKg = Math.round(volume * 10) / 10;
  }

  // -------------------------------------------------------------
  // DEFAULT SEED DATA
  // -------------------------------------------------------------

  private seedDefaultExercises() {
    const defaults = [
      { id: 'ex_bench_press', name: 'Barbell Bench Press', category: 'Compound', primaryMuscle: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Barbell', difficulty: 'INTERMEDIATE' },
      { id: 'ex_incline_db_press', name: 'Incline Dumbbell Press', category: 'Compound', primaryMuscle: 'Chest', secondaryMuscles: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', difficulty: 'INTERMEDIATE' },
      { id: 'ex_cable_flyes', name: 'Cable Chest Flyes', category: 'Isolation', primaryMuscle: 'Chest', secondaryMuscles: [], equipment: 'Cable', difficulty: 'BEGINNER' },
      { id: 'ex_tricep_pushdown', name: 'Cable Tricep Pushdown', category: 'Isolation', primaryMuscle: 'Triceps', secondaryMuscles: [], equipment: 'Cable', difficulty: 'BEGINNER' },
      { id: 'ex_overhead_extension', name: 'Overhead Tricep Extension', category: 'Isolation', primaryMuscle: 'Triceps', secondaryMuscles: [], equipment: 'Dumbbell', difficulty: 'BEGINNER' },
      { id: 'ex_squats', name: 'Barbell Back Squat', category: 'Compound', primaryMuscle: 'Legs', secondaryMuscles: ['Glutes', 'Calves'], equipment: 'Barbell', difficulty: 'ADVANCED' },
      { id: 'ex_rdl', name: 'Romanian Deadlift', category: 'Compound', primaryMuscle: 'Legs', secondaryMuscles: ['Glutes', 'Back'], equipment: 'Barbell', difficulty: 'INTERMEDIATE' },
      { id: 'ex_pullups', name: 'Pull-up', category: 'Compound', primaryMuscle: 'Back', secondaryMuscles: ['Biceps'], equipment: 'Bodyweight', difficulty: 'INTERMEDIATE' },
      { id: 'ex_barbell_row', name: 'Barbell Bent-Over Row', category: 'Compound', primaryMuscle: 'Back', secondaryMuscles: ['Biceps'], equipment: 'Barbell', difficulty: 'INTERMEDIATE' },
      { id: 'ex_ohp', name: 'Standing Overhead Press', category: 'Compound', primaryMuscle: 'Shoulders', secondaryMuscles: ['Triceps'], equipment: 'Barbell', difficulty: 'INTERMEDIATE' },
      { id: 'ex_bicep_curl', name: 'Barbell Bicep Curl', category: 'Isolation', primaryMuscle: 'Biceps', secondaryMuscles: [], equipment: 'Barbell', difficulty: 'BEGINNER' },
      { id: 'ex_leg_raises', name: 'Hanging Leg Raise', category: 'Isolation', primaryMuscle: 'Abs', secondaryMuscles: [], equipment: 'Bodyweight', difficulty: 'INTERMEDIATE' },
    ];

    defaults.forEach((e) => {
      this.exercises.set(e.id, { ...e, createdAt: new Date() });
    });
  }

  private seedDefaultProgram() {
    const programId = 'default_program_alpha_split';
    const days: StoredProgramDay[] = [
      {
        id: 'day_mon',
        programId,
        dayOfWeek: 1,
        title: 'Chest + Triceps',
        templates: [
          {
            id: 'tpl_mon_chest_tri',
            name: 'Chest + Triceps Hypertrophy',
            exercises: [
              { id: 'te_1', exerciseId: 'ex_bench_press', exerciseName: 'Barbell Bench Press', orderIndex: 0, targetSets: 4, targetReps: 10, restSeconds: 90 },
              { id: 'te_2', exerciseId: 'ex_incline_db_press', exerciseName: 'Incline Dumbbell Press', orderIndex: 1, targetSets: 3, targetReps: 12, restSeconds: 60 },
              { id: 'te_3', exerciseId: 'ex_cable_flyes', exerciseName: 'Cable Chest Flyes', orderIndex: 2, targetSets: 3, targetReps: 15, restSeconds: 60 },
              { id: 'te_4', exerciseId: 'ex_tricep_pushdown', exerciseName: 'Cable Tricep Pushdown', orderIndex: 3, targetSets: 4, targetReps: 12, restSeconds: 45 },
            ],
          },
        ],
      },
      {
        id: 'day_tue',
        programId,
        dayOfWeek: 2,
        title: 'Back + Biceps',
        templates: [
          {
            id: 'tpl_tue_back_bi',
            name: 'Back + Biceps Hypertrophy',
            exercises: [
              { id: 'te_5', exerciseId: 'ex_pullups', exerciseName: 'Pull-up', orderIndex: 0, targetSets: 4, targetReps: 8, restSeconds: 90 },
              { id: 'te_6', exerciseId: 'ex_barbell_row', exerciseName: 'Barbell Bent-Over Row', orderIndex: 1, targetSets: 4, targetReps: 10, restSeconds: 90 },
              { id: 'te_7', exerciseId: 'ex_bicep_curl', exerciseName: 'Barbell Bicep Curl', orderIndex: 2, targetSets: 3, targetReps: 12, restSeconds: 60 },
            ],
          },
        ],
      },
      {
        id: 'day_wed',
        programId,
        dayOfWeek: 3,
        title: 'Shoulders + Abs',
        templates: [
          {
            id: 'tpl_wed_shld_abs',
            name: 'Shoulders & Core Stability',
            exercises: [
              { id: 'te_8', exerciseId: 'ex_ohp', exerciseName: 'Standing Overhead Press', orderIndex: 0, targetSets: 4, targetReps: 8, restSeconds: 90 },
              { id: 'te_9', exerciseId: 'ex_leg_raises', exerciseName: 'Hanging Leg Raise', orderIndex: 1, targetSets: 3, targetReps: 15, restSeconds: 60 },
            ],
          },
        ],
      },
      {
        id: 'day_thu',
        programId,
        dayOfWeek: 4,
        title: 'Legs',
        templates: [
          {
            id: 'tpl_thu_legs',
            name: 'Lower Body Strength & Hypertrophy',
            exercises: [
              { id: 'te_10', exerciseId: 'ex_squats', exerciseName: 'Barbell Back Squat', orderIndex: 0, targetSets: 4, targetReps: 8, restSeconds: 120 },
              { id: 'te_11', exerciseId: 'ex_rdl', exerciseName: 'Romanian Deadlift', orderIndex: 1, targetSets: 4, targetReps: 10, restSeconds: 90 },
            ],
          },
        ],
      },
      {
        id: 'day_fri',
        programId,
        dayOfWeek: 5,
        title: 'Upper Body',
        templates: [
          {
            id: 'tpl_fri_upper',
            name: 'Upper Body Volume Power',
            exercises: [
              { id: 'te_12', exerciseId: 'ex_bench_press', exerciseName: 'Barbell Bench Press', orderIndex: 0, targetSets: 3, targetReps: 8, restSeconds: 90 },
              { id: 'te_13', exerciseId: 'ex_pullups', exerciseName: 'Pull-up', orderIndex: 1, targetSets: 3, targetReps: 8, restSeconds: 90 },
            ],
          },
        ],
      },
      {
        id: 'day_sat',
        programId,
        dayOfWeek: 6,
        title: 'Cardio / Optional',
        templates: [],
      },
      {
        id: 'day_sun',
        programId,
        dayOfWeek: 7,
        title: 'Rest & Recovery',
        templates: [],
      },
    ];

    this.programs.set(programId, {
      id: programId,
      creatorId: 'system_coach_admin',
      name: 'ALPHA 12-Week Performance Split',
      description: 'Elite hypertrophy and functional strength split engineered for maximum biological momentum.',
      isTemplate: true,
      weeksCount: 12,
      days,
    });
  }

  // Testing helpers
  public clearAll() {
    this.workoutSessions.clear();
    this.programAssignments.clear();
  }
}
