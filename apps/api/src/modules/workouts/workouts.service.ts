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
  targetArea?: string;
  movementPattern?: string;
  exerciseType?: string;
  description?: string;
  technique?: string;
  commonMistakes?: string[];
  safetyNotes?: string;
  tempo?: string;
  defaultRest?: number;
  tags?: string[];
  status?: string;
  animationUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  isCustom?: boolean;
  creatorId?: string;
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
  category?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  exercises: StoredTemplateExercise[];
  createdAt?: Date;
  updatedAt?: Date;
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
  private readonly standaloneTemplates = new Map<string, StoredWorkoutTemplate>();
  private readonly programAssignments = new Map<string, { programId: string; athleteId: string }>();
  private readonly workoutSessions = new Map<string, StoredWorkoutSession>();

  constructor() {
    this.seedDefaultExercises();
    this.seedDefaultProgram();
    this.seedDefaultTemplates();
  }

  // -------------------------------------------------------------
  // 1. EXERCISE LIBRARY
  // -------------------------------------------------------------

  async getExercises(filter?: {
    muscleGroup?: string;
    equipment?: string;
    difficulty?: string;
    movementPattern?: string;
    exerciseType?: string;
    status?: string;
    search?: string;
  }): Promise<StoredExercise[]> {
    let list = Array.from(this.exercises.values());

    if (filter?.muscleGroup) {
      const mg = filter.muscleGroup.toLowerCase();
      list = list.filter(
        (e) =>
          e.primaryMuscle.toLowerCase() === mg ||
          e.secondaryMuscles.some((m) => m.toLowerCase() === mg),
      );
    }

    if (filter?.equipment) {
      const eq = filter.equipment.toLowerCase();
      list = list.filter((e) => e.equipment.toLowerCase() === eq);
    }

    if (filter?.difficulty) {
      const diff = filter.difficulty.toUpperCase();
      list = list.filter((e) => e.difficulty.toUpperCase() === diff);
    }

    if (filter?.movementPattern) {
      const mp = filter.movementPattern.toUpperCase();
      list = list.filter((e) => (e.movementPattern || '').toUpperCase() === mp);
    }

    if (filter?.exerciseType) {
      const et = filter.exerciseType.toUpperCase();
      list = list.filter((e) => (e.exerciseType || '').toUpperCase() === et);
    }

    if (filter?.status) {
      const st = filter.status.toUpperCase();
      list = list.filter((e) => (e.status || 'ACTIVE').toUpperCase() === st);
    }

    if (filter?.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(s) ||
          (e.description && e.description.toLowerCase().includes(s)) ||
          e.primaryMuscle.toLowerCase().includes(s),
      );
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

  async createExercise(dto: CreateExerciseDto & any): Promise<StoredExercise> {
    const id = HashUtil.generateUuid();
    const exercise: StoredExercise = {
      id,
      name: dto.name.trim(),
      category: dto.category || 'Compound',
      primaryMuscle: dto.primaryMuscle,
      secondaryMuscles: dto.secondaryMuscles || [],
      equipment: dto.equipment || 'Barbell',
      difficulty: dto.difficulty || 'INTERMEDIATE',
      instructions: dto.instructions || '',
      targetArea: dto.targetArea || dto.primaryMuscle,
      movementPattern: dto.movementPattern || 'PUSH',
      exerciseType: dto.exerciseType || 'HYPERTROPHY',
      description: dto.description || '',
      technique: dto.technique || dto.instructions || '',
      commonMistakes: dto.commonMistakes || [],
      safetyNotes: dto.safetyNotes || '',
      tempo: dto.tempo || '3-0-1-0',
      defaultRest: dto.defaultRest || 90,
      tags: dto.tags || [dto.primaryMuscle],
      status: dto.status || 'ACTIVE',
      animationUrl: dto.animationUrl,
      imageUrl: dto.imageUrl,
      videoUrl: dto.videoUrl,
      thumbnailUrl: dto.thumbnailUrl,
      isCustom: dto.isCustom || false,
      creatorId: dto.creatorId,
      createdAt: new Date(),
    };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async updateExercise(id: string, updates: Partial<StoredExercise>): Promise<StoredExercise> {
    const existing = await this.getExerciseById(id);
    const updated: StoredExercise = {
      ...existing,
      ...updates,
      id: existing.id,
    };
    this.exercises.set(id, updated);
    return updated;
  }

  async archiveExercise(id: string): Promise<StoredExercise> {
    const existing = await this.getExerciseById(id);
    existing.status = 'ARCHIVED';
    this.exercises.set(id, existing);
    return existing;
  }

  // -------------------------------------------------------------
  // 1B. STANDALONE WORKOUT TEMPLATES
  // -------------------------------------------------------------

  async listWorkoutTemplates(): Promise<StoredWorkoutTemplate[]> {
    return Array.from(this.standaloneTemplates.values());
  }

  async getWorkoutTemplateById(id: string): Promise<StoredWorkoutTemplate> {
    const template = this.standaloneTemplates.get(id);
    if (!template) {
      throw new NotFoundException({ code: 'TEMPLATE_NOT_FOUND', message: `Workout template [${id}] not found` });
    }
    return template;
  }

  async createWorkoutTemplate(data: {
    name: string;
    notes?: string;
    category?: string;
    difficulty?: string;
    estimatedMinutes?: number;
    exercises: Array<{
      exerciseId: string;
      exerciseName: string;
      targetSets: number;
      targetReps: number;
      targetRpe?: number;
      restSeconds: number;
    }>;
  }): Promise<StoredWorkoutTemplate> {
    const id = HashUtil.generateUuid();
    const exercises: StoredTemplateExercise[] = data.exercises.map((ex, idx) => ({
      id: HashUtil.generateUuid(),
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      orderIndex: idx,
      targetSets: ex.targetSets || 3,
      targetReps: ex.targetReps || 10,
      targetRpe: ex.targetRpe || 8,
      restSeconds: ex.restSeconds || 90,
    }));

    const template: StoredWorkoutTemplate = {
      id,
      name: data.name.trim(),
      notes: data.notes,
      category: data.category || 'Hypertrophy',
      difficulty: data.difficulty || 'INTERMEDIATE',
      estimatedMinutes: data.estimatedMinutes || 60,
      exercises,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.standaloneTemplates.set(id, template);
    return template;
  }

  async updateWorkoutTemplate(
    id: string,
    data: Partial<StoredWorkoutTemplate>,
  ): Promise<StoredWorkoutTemplate> {
    const existing = await this.getWorkoutTemplateById(id);
    const updated: StoredWorkoutTemplate = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date(),
    };
    this.standaloneTemplates.set(id, updated);
    return updated;
  }

  async deleteWorkoutTemplate(id: string): Promise<{ success: boolean }> {
    await this.getWorkoutTemplateById(id);
    this.standaloneTemplates.delete(id);
    return { success: true };
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
      {
        id: 'ex_bench_press',
        name: 'Barbell Bench Press',
        category: 'Compound',
        primaryMuscle: 'Chest',
        secondaryMuscles: ['Triceps', 'Shoulders'],
        equipment: 'Barbell',
        difficulty: 'INTERMEDIATE',
        targetArea: 'Middle & Lower Pectoralis',
        movementPattern: 'PUSH',
        exerciseType: 'HYPERTROPHY',
        description: 'Foundational horizontal pressing exercise maximizing pec activation and triceps mechanical tension.',
        technique: 'Lie flat on bench, retract scapulae, lower barbell to mid-sternum under control, drive feet into the floor.',
        commonMistakes: ['Bouncing bar off chest', 'Flaring elbows past 90 degrees', 'Lifting hips off the bench'],
        safetyNotes: 'Always use collars or a spotter on maximum load attempts. Keep wrists stacked directly above forearms.',
        tempo: '3-0-1-0',
        defaultRest: 120,
        status: 'ACTIVE',
        tags: ['Pectorals', 'Compound', 'Push'],
      },
      {
        id: 'ex_incline_db_press',
        name: 'Incline Dumbbell Press',
        category: 'Compound',
        primaryMuscle: 'Chest',
        secondaryMuscles: ['Shoulders', 'Triceps'],
        equipment: 'Dumbbell',
        difficulty: 'INTERMEDIATE',
        targetArea: 'Clavicular Head (Upper Chest)',
        movementPattern: 'PUSH',
        exerciseType: 'HYPERTROPHY',
        description: 'Incline bench dumbbell press targeting clavicular pectoral fibers with greater range of motion.',
        technique: 'Set bench to 30 degrees. Press dumbbells upward converging at top without touching. Control eccentric to armpit level.',
        commonMistakes: ['Bench angle set too steep (>45 deg shifting to delts)', 'Incomplete stretch at bottom'],
        safetyNotes: 'Kick dumbbells up with knees into position. Never drop weights directly to sides when fatigued.',
        tempo: '3-1-1-0',
        defaultRest: 90,
        status: 'ACTIVE',
        tags: ['Upper Chest', 'Hypertrophy', 'Dumbbell'],
      },
      {
        id: 'ex_cable_flyes',
        name: 'Cable Chest Flyes',
        category: 'Isolation',
        primaryMuscle: 'Chest',
        secondaryMuscles: [],
        equipment: 'Cable',
        difficulty: 'BEGINNER',
        targetArea: 'Sternal Pectoralis',
        movementPattern: 'ISOLATION',
        exerciseType: 'HYPERTROPHY',
        description: 'Continuous resistance flye creating maximum peak contraction and deep stretch across chest fibers.',
        technique: 'Maintain slight elbow bend throughout arc. Squeeze chest hard at full adduction.',
        commonMistakes: ['Bending elbows into a press', 'Using excessive momentum from hips'],
        safetyNotes: 'Step forward under control before initiating reps.',
        tempo: '2-0-1-1',
        defaultRest: 60,
        status: 'ACTIVE',
        tags: ['Chest', 'Isolation', 'Cable'],
      },
      {
        id: 'ex_tricep_pushdown',
        name: 'Cable Tricep Pushdown',
        category: 'Isolation',
        primaryMuscle: 'Triceps',
        secondaryMuscles: [],
        equipment: 'Cable',
        difficulty: 'BEGINNER',
        targetArea: 'Lateral & Medial Triceps Head',
        movementPattern: 'ISOLATION',
        exerciseType: 'HYPERTROPHY',
        description: 'High-tension cable triceps extension isolating elbow extension.',
        technique: 'Pin elbows to sides of torso. Extend forearms downwards until arms lock out completely.',
        commonMistakes: ['Letting elbows drift forward', 'Using shoulder body swing'],
        safetyNotes: 'Keep wrists firm and neutral.',
        tempo: '2-0-1-0',
        defaultRest: 60,
        status: 'ACTIVE',
        tags: ['Triceps', 'Isolation', 'Cables'],
      },
      {
        id: 'ex_overhead_extension',
        name: 'Overhead Tricep Extension',
        category: 'Isolation',
        primaryMuscle: 'Triceps',
        secondaryMuscles: [],
        equipment: 'Dumbbell',
        difficulty: 'BEGINNER',
        targetArea: 'Long Head Triceps',
        movementPattern: 'ISOLATION',
        exerciseType: 'HYPERTROPHY',
        description: 'Places long head of triceps in fully stretched position for maximum hypertrophic stimulus.',
        technique: 'Lower weight behind head until deep stretch in triceps, then press back to vertical overhead.',
        commonMistakes: ['Flaring elbows out too wide', 'Arching lower back'],
        safetyNotes: 'Keep core braced to protect lumbar spine.',
        tempo: '3-0-1-0',
        defaultRest: 60,
        status: 'ACTIVE',
        tags: ['Triceps', 'Stretch'],
      },
      {
        id: 'ex_squats',
        name: 'Barbell Back Squat',
        category: 'Compound',
        primaryMuscle: 'Legs',
        secondaryMuscles: ['Glutes', 'Calves', 'Core'],
        equipment: 'Barbell',
        difficulty: 'ADVANCED',
        targetArea: 'Quadriceps, Adductors & Gluteus Maximus',
        movementPattern: 'SQUAT',
        exerciseType: 'STRENGTH',
        description: 'The king of lower body development. Engages whole body musculature and neuromuscular drive.',
        technique: 'Bar rested on upper traps. Descend until hip crease is below top of knees while keeping spine neutral.',
        commonMistakes: ['Knee valgus collapse', 'Heels lifting off ground', 'Excessive forward chest lean'],
        safetyNotes: 'Set safety pins at appropriate depth in power rack. Breathe into abdomen to brace intra-abdominal pressure.',
        tempo: '3-1-1-0',
        defaultRest: 150,
        status: 'ACTIVE',
        tags: ['Legs', 'Quad', 'Compound', 'Strength'],
      },
      {
        id: 'ex_rdl',
        name: 'Romanian Deadlift',
        category: 'Compound',
        primaryMuscle: 'Legs',
        secondaryMuscles: ['Glutes', 'Back', 'Hamstrings'],
        equipment: 'Barbell',
        difficulty: 'INTERMEDIATE',
        targetArea: 'Hamstrings & Gluteal Fold',
        movementPattern: 'HINGE',
        exerciseType: 'HYPERTROPHY',
        description: 'Hip hinge movement loading hamstrings and glutes under stretch.',
        technique: 'Soft bend in knees. Hinge hips backwards as if touching a wall behind you. Bar tracks close to shins.',
        commonMistakes: ['Squatting instead of hinging', 'Rounding lumbar spine'],
        safetyNotes: 'Stop descent when hips stop moving backwards.',
        tempo: '3-1-1-0',
        defaultRest: 90,
        status: 'ACTIVE',
        tags: ['Hamstrings', 'Glutes', 'Hinge'],
      },
      {
        id: 'ex_pullups',
        name: 'Pull-up',
        category: 'Compound',
        primaryMuscle: 'Back',
        secondaryMuscles: ['Biceps', 'Forearms'],
        equipment: 'Bodyweight',
        difficulty: 'INTERMEDIATE',
        targetArea: 'Latissimus Dorsi & Teres Major',
        movementPattern: 'PULL',
        exerciseType: 'STRENGTH',
        description: 'Elite vertical pull developing lat width, scapular depression, and grip power.',
        technique: 'Overhand grip slightly wider than shoulders. Pull chest towards bar while driving elbows down into back pockets.',
        commonMistakes: ['Kipping or swinging legs', 'Partial range of motion at bottom'],
        safetyNotes: 'Control the descent completely to protect shoulder labrum.',
        tempo: '2-1-1-0',
        defaultRest: 90,
        status: 'ACTIVE',
        tags: ['Back', 'Lats', 'Vertical Pull'],
      },
      {
        id: 'ex_barbell_row',
        name: 'Barbell Bent-Over Row',
        category: 'Compound',
        primaryMuscle: 'Back',
        secondaryMuscles: ['Biceps', 'Rhomboids', 'Posterior Deltoid'],
        equipment: 'Barbell',
        difficulty: 'INTERMEDIATE',
        targetArea: 'Mid Back, Rhomboids & Lat Thickness',
        movementPattern: 'PULL',
        exerciseType: 'HYPERTROPHY',
        description: 'Heavy horizontal pull building dense back thickness and spinal erector isometric strength.',
        technique: 'Torso hinged at 45 degrees. Pull bar to upper abdomen/sternum squeezing shoulder blades together.',
        commonMistakes: ['Using momentum to bounce weight up', 'Standing up too upright'],
        safetyNotes: 'Keep lumbar spine neutral and core tight throughout set.',
        tempo: '2-0-1-1',
        defaultRest: 90,
        status: 'ACTIVE',
        tags: ['Back', 'Thickness', 'Horizontal Pull'],
      },
      {
        id: 'ex_ohp',
        name: 'Standing Overhead Press',
        category: 'Compound',
        primaryMuscle: 'Shoulders',
        secondaryMuscles: ['Triceps', 'Core'],
        equipment: 'Barbell',
        difficulty: 'INTERMEDIATE',
        targetArea: 'Anterior & Lateral Deltoid',
        movementPattern: 'PUSH',
        exerciseType: 'STRENGTH',
        description: 'Strict vertical pressing overhead demanding core stability and deltoid power.',
        technique: 'Grip just outside shoulders. Squeeze glutes and quads. Press bar overhead in straight line clearance.',
        commonMistakes: ['Excessive backward spinal arching', 'Pressing bar out in front'],
        safetyNotes: 'Never press without solid foot planting and braced glutes.',
        tempo: '2-0-1-0',
        defaultRest: 90,
        status: 'ACTIVE',
        tags: ['Shoulders', 'Deltoids', 'Vertical Push'],
      },
      {
        id: 'ex_bicep_curl',
        name: 'Barbell Bicep Curl',
        category: 'Isolation',
        primaryMuscle: 'Biceps',
        secondaryMuscles: ['Forearms', 'Brachialis'],
        equipment: 'Barbell',
        difficulty: 'BEGINNER',
        targetArea: 'Biceps Brachii Short & Long Heads',
        movementPattern: 'ISOLATION',
        exerciseType: 'HYPERTROPHY',
        description: 'Standard supinated barbell curl for arm hypertrophy.',
        technique: 'Supinated grip shoulder width. Flex elbows to raise bar to chest height while minimizing shoulder sway.',
        commonMistakes: ['Swinging torso backwards', 'Drifting elbows excessively forward'],
        safetyNotes: 'Use EZ bar if wrists experience discomfort.',
        tempo: '2-0-1-1',
        defaultRest: 60,
        status: 'ACTIVE',
        tags: ['Arms', 'Biceps', 'Isolation'],
      },
      {
        id: 'ex_leg_raises',
        name: 'Hanging Leg Raise',
        category: 'Isolation',
        primaryMuscle: 'Abs',
        secondaryMuscles: ['Hip Flexors'],
        equipment: 'Bodyweight',
        difficulty: 'INTERMEDIATE',
        targetArea: 'Rectus Abdominis & Deep Core',
        movementPattern: 'ISOLATION',
        exerciseType: 'HYPERTROPHY',
        description: 'Posterior pelvic tilt hang movement isolating abdominal wall compression.',
        technique: 'Hang from bar with active shoulders. Curl pelvis upward bringing knees or toes toward bar.',
        commonMistakes: ['Swinging momentum', 'Using only hip flexors without posterior pelvic tilt'],
        safetyNotes: 'Control descent to prevent shoulder hyperextension.',
        tempo: '2-1-1-1',
        defaultRest: 60,
        status: 'ACTIVE',
        tags: ['Core', 'Abs', 'Bodyweight'],
      },
    ];

    defaults.forEach((e) => {
      this.exercises.set(e.id, { ...e, createdAt: new Date() });
    });
  }

  private seedDefaultTemplates() {
    const templates: StoredWorkoutTemplate[] = [
      {
        id: 'tpl_push_hypertrophy',
        name: 'Push Power & Hypertrophy',
        category: 'Push',
        difficulty: 'INTERMEDIATE',
        estimatedMinutes: 65,
        notes: 'Focused on chest, front/side delts, and triceps volume with progressive overload.',
        exercises: [
          { id: 'te_push_1', exerciseId: 'ex_bench_press', exerciseName: 'Barbell Bench Press', orderIndex: 0, targetSets: 4, targetReps: 8, targetRpe: 8.5, restSeconds: 120 },
          { id: 'te_push_2', exerciseId: 'ex_incline_db_press', exerciseName: 'Incline Dumbbell Press', orderIndex: 1, targetSets: 3, targetReps: 10, targetRpe: 8, restSeconds: 90 },
          { id: 'te_push_3', exerciseId: 'ex_ohp', exerciseName: 'Standing Overhead Press', orderIndex: 2, targetSets: 3, targetReps: 8, targetRpe: 8, restSeconds: 90 },
          { id: 'te_push_4', exerciseId: 'ex_cable_flyes', exerciseName: 'Cable Chest Flyes', orderIndex: 3, targetSets: 3, targetReps: 15, targetRpe: 7.5, restSeconds: 60 },
          { id: 'te_push_5', exerciseId: 'ex_tricep_pushdown', exerciseName: 'Cable Tricep Pushdown', orderIndex: 4, targetSets: 4, targetReps: 12, targetRpe: 8, restSeconds: 60 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'tpl_pull_density',
        name: 'Pull Heavy Density',
        category: 'Pull',
        difficulty: 'ADVANCED',
        estimatedMinutes: 70,
        notes: 'Vertical and horizontal pulling to develop dense lats, traps, and peak biceps.',
        exercises: [
          { id: 'te_pull_1', exerciseId: 'ex_pullups', exerciseName: 'Pull-up', orderIndex: 0, targetSets: 4, targetReps: 8, targetRpe: 8.5, restSeconds: 120 },
          { id: 'te_pull_2', exerciseId: 'ex_barbell_row', exerciseName: 'Barbell Bent-Over Row', orderIndex: 1, targetSets: 4, targetReps: 10, targetRpe: 8, restSeconds: 90 },
          { id: 'te_pull_3', exerciseId: 'ex_bicep_curl', exerciseName: 'Barbell Bicep Curl', orderIndex: 2, targetSets: 3, targetReps: 12, targetRpe: 8, restSeconds: 60 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'tpl_lower_kinetic',
        name: 'Lower Body Kinetic Drive',
        category: 'Legs',
        difficulty: 'ADVANCED',
        estimatedMinutes: 75,
        notes: 'High neurological activation through barbell squats paired with posterior chain loading.',
        exercises: [
          { id: 'te_leg_1', exerciseId: 'ex_squats', exerciseName: 'Barbell Back Squat', orderIndex: 0, targetSets: 4, targetReps: 6, targetRpe: 9, restSeconds: 150 },
          { id: 'te_leg_2', exerciseId: 'ex_rdl', exerciseName: 'Romanian Deadlift', orderIndex: 1, targetSets: 4, targetReps: 10, targetRpe: 8.5, restSeconds: 120 },
          { id: 'te_leg_3', exerciseId: 'ex_leg_raises', exerciseName: 'Hanging Leg Raise', orderIndex: 2, targetSets: 3, targetReps: 15, targetRpe: 8, restSeconds: 60 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    templates.forEach((t) => {
      this.standaloneTemplates.set(t.id, t);
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
