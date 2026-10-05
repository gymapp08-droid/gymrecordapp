import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { HashUtil } from '@alpha/utils';
import {
  WorkoutStatus,
  UserRole,
  ProgramUserStatus,
  IAuthUser,
  IProgramAccessManagementSummary,
  IUserProgramProgress,
  IProgramCycleWeek,
} from '@alpha/types';
import { PrismaService } from '../database/prisma.service';
import {
  SIX_WEEK_SHREDDED_EXERCISES,
  SIX_WEEK_SHREDDED_PROGRAM_DETAIL,
  SIX_WEEK_SHREDDED_ID,
  build12WeekSchedule,
} from './data/six-week-shredded.data';
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
  creatorId?: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  slug?: string;
  description?: string;
  goal?: string;
  duration?: string;
  workoutDaysPerWeek?: number;
  restDaysPerWeek?: number;
  cardioDaysPerWeek?: number;
  absDaysPerWeek?: number;
  isTemplate?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  weeksCount: number;
  days: any[];
  nutritionPlans?: any[];
  sourceDocuments?: any[];
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

export interface StoredProgramAssignment {
  id: string;
  programId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  assignedAt: Date;
  assignedBy?: string;
  status: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';
  currentWeek: number;
  currentDay: number;
  completedDays: number;
  completedWorkouts: number;
  completedExercises: number;
  completionPercentage: number;
  lastWorkoutDate?: string;
  startDate?: string;
  endDate?: string;
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
  private readonly assignedUsers = new Map<string, StoredProgramAssignment>();
  private readonly programActiveState = new Map<string, boolean>();
  private readonly userProgress = new Map<string, IUserProgramProgress>();
  private readonly canonicalExerciseIds = new Set<string>();
  private readonly categories = new Map<string, any>();
  private readonly catalogPrograms = new Map<string, any>();

  constructor(@Optional() private readonly prisma?: PrismaService) {
    this.seedDefaultExercises();
    this.seedDefaultProgram();
    this.seedDefaultTemplates();
    this.seedSixWeekShredded();
    this.seedCatalogPrograms();
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
    if (this.canonicalExerciseIds.has(id)) {
      throw new BadRequestException({
        code: 'CANONICAL_EXERCISE_IMMUTABLE',
        message: `Canonical exercise [${id}] from 6 WEEK SHREDDED cannot be modified.`,
      });
    }
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
    if (this.canonicalExerciseIds.has(id)) {
      throw new BadRequestException({
        code: 'CANONICAL_EXERCISE_IMMUTABLE',
        message: `Canonical exercise [${id}] from 6 WEEK SHREDDED cannot be archived.`,
      });
    }
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
    if (id.includes('6w')) {
      throw new BadRequestException({
        code: 'CANONICAL_PROGRAM_IMMUTABLE',
        message: 'Canonical 6 WEEK SHREDDED workout templates cannot be modified.',
      });
    }
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
    if (id.includes('6w')) {
      throw new BadRequestException({
        code: 'CANONICAL_PROGRAM_IMMUTABLE',
        message: 'Canonical 6 WEEK SHREDDED workout templates cannot be deleted.',
      });
    }
    await this.getWorkoutTemplateById(id);
    this.standaloneTemplates.delete(id);
    return { success: true };
  }

  // -------------------------------------------------------------
  // 2. PROGRAMS, 12-WEEK ACCESS & PROGRESS ENGINE
  // -------------------------------------------------------------

  isUserAssignedToProgram(userId: string, programId: string): boolean {
    const compositeKey = `${userId}:${programId}`;
    if (this.assignedUsers.has(compositeKey)) {
      return true;
    }
    const legacy = this.programAssignments.get(userId);
    return legacy?.programId === programId;
  }

  assertUserProgramAccess(user: { id: string; role?: UserRole | string }, programId: string): void {
    const compositeKey = `${user.id}:${programId}`;
    const assignment = this.assignedUsers.get(compositeKey);
    if (assignment) {
      if (assignment.status === 'PAUSED' || assignment.status === 'REVOKED') {
        throw new ForbiddenException({
          code: 'PROGRAM_PAUSED',
          message: 'PROGRAM PAUSED: Your program is currently paused. Please contact your trainer.',
        });
      }
      if (assignment.endDate && new Date(assignment.endDate) < new Date()) {
        assignment.status = 'EXPIRED';
        throw new ForbiddenException({
          code: 'PROGRAM_EXPIRED',
          message: 'PROGRAM EXPIRED: Your program duration has completed. Please contact your trainer.',
        });
      }
    }

    if (programId === SIX_WEEK_SHREDDED_ID) {
      const isActive = this.programActiveState.get(programId) ?? true;
      if (user.role === UserRole.ATHLETE) {
        if (!isActive) {
          throw new ForbiddenException({
            code: 'PROGRAM_INACTIVE',
            message: 'The 6 WEEK SHREDDED program is currently inactive. Please contact your coach.',
          });
        }
        if (!this.isUserAssignedToProgram(user.id, programId)) {
          throw new ForbiddenException({
            code: 'PROGRAM_ACCESS_DENIED',
            message: 'You are not assigned to the 6 WEEK SHREDDED program. Please contact an admin or coach for access.',
          });
        }
      }
    } else {
      // Check if catalog program requires PRO authorization
      const catalogProg = this.catalogPrograms.get(programId);
      if (
        catalogProg &&
        (catalogProg.tier === 'PRO' || catalogProg.isPro === true) &&
        user.role === UserRole.ATHLETE
      ) {
        if (!this.isUserAssignedToProgram(user.id, programId)) {
          throw new ForbiddenException({
            code: 'PRO_ACCESS_DENIED',
            message: 'This is a PRO program. Please contact your trainer to obtain an active program assignment.',
          });
        }
      }
    }
  }

  getCategories(): any[] {
    return Array.from(this.categories.values());
  }

  async getPrograms(user?: IAuthUser, categoryId?: string, search?: string): Promise<any[]> {
    let list: any[] = [];

    // Always evaluate canonical 6 Week Shredded program access
    const shredded = this.programs.get(SIX_WEEK_SHREDDED_ID);
    if (shredded) {
      if (user && user.role === UserRole.ATHLETE) {
        if (this.isUserAssignedToProgram(user.id, SIX_WEEK_SHREDDED_ID)) {
          list.push({
            ...SIX_WEEK_SHREDDED_PROGRAM_DETAIL,
            id: SIX_WEEK_SHREDDED_ID,
            isActive: this.programActiveState.get(SIX_WEEK_SHREDDED_ID) ?? true,
          });
        }
      } else {
        list.push({
          ...SIX_WEEK_SHREDDED_PROGRAM_DETAIL,
          id: SIX_WEEK_SHREDDED_ID,
          isActive: this.programActiveState.get(SIX_WEEK_SHREDDED_ID) ?? true,
        });
      }
    }

    // Add all active catalog programs (skip duplicate 6 week shredded)
    for (const prog of this.catalogPrograms.values()) {
      if (prog.id === SIX_WEEK_SHREDDED_ID || prog.slug === '6-week-shredded') continue;
      if (prog.isActive !== false) {
        list.push(prog);
      }
    }

    if (categoryId) {
      list = list.filter((p) => p.categoryId === categoryId);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.goal && p.goal.toLowerCase().includes(q)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q)),
      );
    }

    return list;
  }

  async getProgramById(programId: string, user?: IAuthUser): Promise<any> {
    if (user && programId === SIX_WEEK_SHREDDED_ID) {
      this.assertUserProgramAccess(user, programId);
    }

    let program = this.programs.get(programId);
    if (!program) {
      // Look up in catalog programs by id or slug
      program = this.catalogPrograms.get(programId);
      if (!program) {
        for (const p of this.catalogPrograms.values()) {
          if (p.slug === programId || p.id === programId) {
            program = p;
            break;
          }
        }
      }
    }

    if (!program) {
      throw new NotFoundException({ code: 'PROGRAM_NOT_FOUND', message: `Program [${programId}] not found` });
    }

    if (programId === SIX_WEEK_SHREDDED_ID || program.slug === '6-week-shredded') {
      return {
        ...program,
        ...SIX_WEEK_SHREDDED_PROGRAM_DETAIL,
        id: SIX_WEEK_SHREDDED_ID,
        isActive: this.programActiveState.get(SIX_WEEK_SHREDDED_ID) ?? true,
        schedule12Weeks: build12WeekSchedule(),
      };
    }

    return program;
  }

  async getProgramNutrition(programId: string, user?: IAuthUser): Promise<any[]> {
    const prog = await this.getProgramById(programId, user);
    return prog.nutritionPlans || [];
  }

  async getProgramSchedule12Weeks(programId: string, user?: IAuthUser): Promise<IProgramCycleWeek[]> {
    if (user) {
      this.assertUserProgramAccess(user, programId);
    }

    if (programId === SIX_WEEK_SHREDDED_ID) {
      return build12WeekSchedule();
    }

    throw new NotFoundException({ code: 'PROGRAM_SCHEDULE_NOT_FOUND', message: `12-week schedule not available for program [${programId}]` });
  }

  async getActiveProgram(userId: string): Promise<StoredProgram> {
    // Check if user has an assigned program, otherwise return the default ALPHA Hypertrophy protocol
    const shreddedKey = `${userId}:${SIX_WEEK_SHREDDED_ID}`;
    if (this.assignedUsers.has(shreddedKey)) {
      return this.programs.get(SIX_WEEK_SHREDDED_ID)!;
    }

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
    if (programId === SIX_WEEK_SHREDDED_ID) {
      this.assignedUsers.set(`${athleteId}:${programId}`, {
        id: `assign_${Date.now()}_${athleteId}`,
        programId,
        userId: athleteId,
        userEmail: athleteId,
        userName: athleteId,
        assignedAt: new Date(),
        status: 'NOT_STARTED',
        currentWeek: 1,
        currentDay: 1,
        completedDays: 0,
        completedWorkouts: 0,
        completedExercises: 0,
        completionPercentage: 0,
      });
    }
    return { success: true, message: 'Program successfully assigned' };
  }

  // --- User Program Progress Engine ---
  async getUserProgramProgress(
    userId: string,
    programId: string = SIX_WEEK_SHREDDED_ID,
    requestingUser?: IAuthUser,
  ): Promise<IUserProgramProgress> {
    if (requestingUser) {
      if (requestingUser.role === UserRole.ATHLETE && requestingUser.id !== userId) {
        throw new ForbiddenException({
          code: 'ACCESS_DENIED',
          message: 'Cannot view progress of another athlete.',
        });
      }
      this.assertUserProgramAccess(requestingUser, programId);
    }

    const key = `${userId}:${programId}`;
    let progress = this.userProgress.get(key);
    if (!progress) {
      const schedule = build12WeekSchedule();
      const assignment = this.assignedUsers.get(key);

      progress = {
        userId,
        programId,
        programName: '6 WEEK SHREDDED',
        displayDuration: '12 Weeks',
        sourceDuration: '6 Weeks',
        programStatus: ((assignment?.status as unknown) as ProgramUserStatus) || ProgramUserStatus.NOT_STARTED,
        programStartDate: assignment?.startDate || null,
        currentWeek: assignment?.currentWeek || 1,
        currentDay: assignment?.currentDay || 1,
        completedDays: assignment?.completedDays || 0,
        completedWorkouts: assignment?.completedWorkouts || 0,
        completedExercises: assignment?.completedExercises || 0,
        completionPercentage: assignment?.completionPercentage || 0,
        lastWorkoutDate: assignment?.lastWorkoutDate || null,
        totalWeeks: 12,
        totalCycles: 2,
        activeCycle: (assignment?.currentWeek || 1) <= 6 ? 1 : 2,
        schedule,
        completedDayKeys: [],
        loggedSets: {},
      };
      this.userProgress.set(key, progress);
    }
    return progress;
  }

  async startUserProgram(
    userId: string,
    programId: string = SIX_WEEK_SHREDDED_ID,
    requestingUser?: IAuthUser,
  ): Promise<IUserProgramProgress> {
    if (requestingUser) {
      this.assertUserProgramAccess(requestingUser, programId);
    } else if (programId === SIX_WEEK_SHREDDED_ID && !this.isUserAssignedToProgram(userId, programId)) {
      throw new ForbiddenException({
        code: 'PROGRAM_ACCESS_DENIED',
        message: 'User is not assigned to this program.',
      });
    }

    const progress = await this.getUserProgramProgress(userId, programId);
    progress.programStatus = ProgramUserStatus.ACTIVE;
    progress.programStartDate = new Date().toISOString();
    progress.currentWeek = 1;
    progress.currentDay = 1;

    const assignKey = `${userId}:${programId}`;
    const assignment = this.assignedUsers.get(assignKey);
    if (assignment) {
      assignment.status = 'ACTIVE';
      assignment.startDate = progress.programStartDate;
      assignment.currentWeek = 1;
      assignment.currentDay = 1;
    }

    return progress;
  }

  async completeProgramDay(
    userId: string,
    programId: string = SIX_WEEK_SHREDDED_ID,
    weekNumber: number,
    dayOfWeek: number,
    notes?: string,
    requestingUser?: IAuthUser,
  ): Promise<IUserProgramProgress> {
    if (notes) {
      this.logger.log(`User [${userId}] completed Day [${dayOfWeek}] of Week [${weekNumber}] with notes: ${notes}`);
    }
    if (requestingUser) {
      this.assertUserProgramAccess(requestingUser, programId);
    } else if (programId === SIX_WEEK_SHREDDED_ID && !this.isUserAssignedToProgram(userId, programId)) {
      throw new ForbiddenException({
        code: 'PROGRAM_ACCESS_DENIED',
        message: 'User is not assigned to this program.',
      });
    }

    const progress = await this.getUserProgramProgress(userId, programId);
    const dayKey = `w${weekNumber}_d${dayOfWeek}`;

    if (!progress.completedDayKeys) {
      progress.completedDayKeys = [];
    }

    if (!progress.completedDayKeys.includes(dayKey)) {
      progress.completedDayKeys.push(dayKey);
      progress.completedDays += 1;
      if (dayOfWeek !== 7) {
        progress.completedWorkouts += 1;
      }
      // Total resistance/cardio workouts across 12 weeks = 12 * 6 = 72 workouts
      progress.completionPercentage = Math.min(100, Math.round((progress.completedWorkouts / 72) * 100));
      progress.lastWorkoutDate = new Date().toISOString();

      if (dayOfWeek < 7) {
        progress.currentDay = dayOfWeek + 1;
        progress.currentWeek = weekNumber;
      } else if (weekNumber < 12) {
        progress.currentWeek = weekNumber + 1;
        progress.currentDay = 1;
      }

      progress.activeCycle = progress.currentWeek <= 6 ? 1 : 2;

      if (progress.completedWorkouts >= 72 || (weekNumber === 12 && dayOfWeek >= 6)) {
        progress.programStatus = ProgramUserStatus.COMPLETED;
      } else {
        progress.programStatus = ProgramUserStatus.ACTIVE;
      }

      const assignKey = `${userId}:${programId}`;
      const assignment = this.assignedUsers.get(assignKey);
      if (assignment) {
        assignment.status = progress.programStatus as any;
        assignment.currentWeek = progress.currentWeek;
        assignment.currentDay = progress.currentDay;
        assignment.completedDays = progress.completedDays;
        assignment.completedWorkouts = progress.completedWorkouts;
        assignment.completionPercentage = progress.completionPercentage;
        assignment.lastWorkoutDate = progress.lastWorkoutDate;
      }
    }

    return progress;
  }

  async logProgramSet(
    userId: string,
    programId: string = SIX_WEEK_SHREDDED_ID,
    weekNumber: number,
    dayOfWeek: number,
    data: {
      exerciseId: string;
      setNumber: number;
      weightKg: number;
      actualReps: number;
      notes?: string;
    },
    requestingUser?: IAuthUser,
  ): Promise<{ success: boolean; log: any }> {
    if (requestingUser) {
      this.assertUserProgramAccess(requestingUser, programId);
    } else if (programId === SIX_WEEK_SHREDDED_ID && !this.isUserAssignedToProgram(userId, programId)) {
      throw new ForbiddenException({
        code: 'PROGRAM_ACCESS_DENIED',
        message: 'User is not assigned to this program.',
      });
    }

    const progress = await this.getUserProgramProgress(userId, programId);
    const setKey = `w${weekNumber}_d${dayOfWeek}_${data.exerciseId}`;

    if (!progress.loggedSets) {
      progress.loggedSets = {};
    }

    if (!progress.loggedSets[setKey]) {
      progress.loggedSets[setKey] = [];
      progress.completedExercises += 1;
    }

    const logEntry = {
      id: HashUtil.generateUuid(),
      exerciseId: data.exerciseId,
      setNumber: data.setNumber,
      weightKg: data.weightKg,
      actualReps: data.actualReps,
      notes: data.notes || '',
      loggedAt: new Date().toISOString(),
      isCompleted: true,
    };

    const existingIndex = progress.loggedSets[setKey].findIndex((s: any) => s.setNumber === data.setNumber);
    if (existingIndex >= 0) {
      progress.loggedSets[setKey][existingIndex] = logEntry;
    } else {
      progress.loggedSets[setKey].push(logEntry);
    }

    return { success: true, log: logEntry };
  }

  // --- Admin Access Management ---
  async getProgramAccessSummary(programId: string = SIX_WEEK_SHREDDED_ID): Promise<IProgramAccessManagementSummary> {
    const assignedList = Array.from(this.assignedUsers.values()).filter((a) => a.programId === programId);
    const isActive = this.programActiveState.get(programId) ?? true;

    return {
      programId,
      programName: '6 WEEK SHREDDED',
      programStatus: isActive ? 'ACTIVE' : 'INACTIVE',
      displayDuration: '12 Weeks',
      sourceDuration: '6 Weeks',
      sourceAttribution: 'Designed & Created by Guru Mann, USA. Certified Advanced Fitness Trainer, Certified Nutrition Specialist, Sports Nutritionist & Strength Coach.',
      assignedUsersCount: assignedList.length,
      availableUsersCount: 0,
      assignedUsers: assignedList.map((a) => ({
        userId: a.userId,
        name: a.userName || a.userEmail || 'Assigned Athlete',
        email: a.userEmail || a.userId,
        programStatus: ((a.status as unknown) as ProgramUserStatus) || ProgramUserStatus.NOT_STARTED,
        assignedDate: a.assignedAt.toISOString(),
        currentWeek: a.currentWeek,
        currentDay: a.currentDay,
        completedDays: a.completedDays,
        completedWorkouts: a.completedWorkouts,
        completedExercises: a.completedExercises,
        completionPercentage: a.completionPercentage,
        lastWorkoutDate: a.lastWorkoutDate || null,
      })),
      availableUsers: [],
    };
  }

  async assignProgramToUser(
    programId: string,
    target: { userId?: string; email?: string },
    adminId: string = 'system_admin',
  ): Promise<{ success: boolean; message: string; assignment: any }> {
    let userId = target.userId;
    let userEmail = target.email;
    let userName = userEmail ? userEmail.split('@')[0] : 'Athlete';

    if (this.prisma && userEmail) {
      try {
        const found = await this.prisma.user.findFirst({
          where: { email: { equals: userEmail, mode: 'insensitive' } },
          include: { profile: true },
        });
        if (found) {
          userId = found.id;
          userName = found.profile?.fullName || userName;
        }
      } catch (err) {
        this.logger.warn(`Could not lookup user by email in database: ${(err as Error).message}`);
      }
    }

    if (!userId) {
      if (userEmail) {
        userId = `user_${Buffer.from(userEmail).toString('hex').slice(0, 16)}`;
      } else {
        throw new BadRequestException({
          code: 'USER_IDENTIFIER_REQUIRED',
          message: 'Either userId or email must be provided to assign a program.',
        });
      }
    }

    const compositeKey = `${userId}:${programId}`;
    const existing = this.assignedUsers.get(compositeKey);

    const assignment: StoredProgramAssignment = {
      id: existing ? existing.id : `assign_${Date.now()}_${userId}`,
      programId,
      userId,
      userEmail: userEmail || existing?.userEmail || userId,
      userName: userName || existing?.userName || 'Assigned Athlete',
      assignedAt: existing ? existing.assignedAt : new Date(),
      assignedBy: adminId,
      status: existing ? existing.status : 'NOT_STARTED',
      currentWeek: existing ? existing.currentWeek : 1,
      currentDay: existing ? existing.currentDay : 1,
      completedDays: existing ? existing.completedDays : 0,
      completedWorkouts: existing ? existing.completedWorkouts : 0,
      completedExercises: existing ? existing.completedExercises : 0,
      completionPercentage: existing ? existing.completionPercentage : 0,
      lastWorkoutDate: existing?.lastWorkoutDate,
      startDate: existing?.startDate,
    };

    this.assignedUsers.set(compositeKey, assignment);
    this.programAssignments.set(userId, { programId, athleteId: userId });

    this.logger.log(`Admin [${adminId}] assigned program [${programId}] to user [${userEmail || userId}]`);

    if (this.prisma) {
      try {
        const existingRecord = await this.prisma.programAssignment.findFirst({
          where: { programId, athleteId: userId },
        });
        if (existingRecord) {
          await this.prisma.programAssignment.update({
            where: { id: existingRecord.id },
            data: {
              isActive: true,
              assignmentStatus: 'ACTIVE',
            },
          });
        } else {
          await this.prisma.programAssignment.create({
            data: {
              programId,
              athleteId: userId,
              startDate: new Date(),
              isActive: true,
              currentWeek: 1,
              currentDay: 1,
              completedDays: 0,
              completedWorkouts: 0,
              completedExercises: 0,
              completionPercentage: 0,
              assignmentStatus: 'ACTIVE',
            },
          });
        }
      } catch (err) {
        this.logger.warn(`Could not sync program assignment to database: ${(err as Error).message}`);
      }
    }

    return {
      success: true,
      message: `User [${userEmail || userId}] successfully assigned to ${programId === SIX_WEEK_SHREDDED_ID ? '6 WEEK SHREDDED' : programId}`,
      assignment,
    };
  }

  async removeProgramFromUser(
    programId: string,
    userId: string,
    adminId: string = 'system_admin',
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Admin [${adminId}] removed user [${userId}] from program [${programId}]`);
    const compositeKey = `${userId}:${programId}`;
    this.assignedUsers.delete(compositeKey);
    const currentLegacy = this.programAssignments.get(userId);
    if (currentLegacy?.programId === programId) {
      this.programAssignments.delete(userId);
    }

    if (this.prisma) {
      try {
        await this.prisma.programAssignment.deleteMany({
          where: { programId, athleteId: userId },
        });
      } catch (err) {
        this.logger.warn(`Could not delete assignment in database: ${(err as Error).message}`);
      }
    }

    return {
      success: true,
      message: `User [${userId}] access removed from program [${programId}]`,
    };
  }

  async setProgramActiveStatus(
    programId: string,
    isActive: boolean,
    adminId: string = 'system_admin',
  ): Promise<{ success: boolean; programId: string; isActive: boolean }> {
    this.logger.log(`Admin [${adminId}] set program [${programId}] active status to ${isActive}`);
    if (!this.programs.has(programId)) {
      throw new NotFoundException({ code: 'PROGRAM_NOT_FOUND', message: `Program [${programId}] not found` });
    }
    this.programActiveState.set(programId, isActive);
    return { success: true, programId, isActive };
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
          if (!d.templates || !Array.isArray(d.templates)) continue;
          const t = d.templates.find((tpl: any) => tpl.id === dto.workoutTemplateId);
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
      name: 'ALPHA 12-Week Performance Split (Legacy Archive)',
      description: 'Legacy template archived safely for historical user data integrity.',
      isTemplate: false,
      isActive: false,
      isArchived: true,
      weeksCount: 12,
      days,
    });
  }

  private seedSixWeekShredded() {
    this.programActiveState.set(SIX_WEEK_SHREDDED_ID, true);

    // 1. Seed 68 Canonical Exercises from source PDF
    for (const ex of SIX_WEEK_SHREDDED_EXERCISES) {
      this.canonicalExerciseIds.add(ex.id);
      this.exercises.set(ex.id, {
        id: ex.id,
        name: ex.name,
        category: ex.category,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        targetArea: ex.targetArea,
        movementPattern: ex.movementPattern || 'ISOLATION',
        exerciseType: ex.exerciseType || 'HYPERTROPHY',
        description: ex.description || `Canonical exercise from Guru Mann's 6 WEEK SHREDDED program.`,
        technique: ex.technique || '',
        commonMistakes: ex.commonMistakes || [],
        safetyNotes: ex.safetyNotes || '',
        tempo: ex.tempo || '1-0-2-0',
        defaultRest: ex.defaultRest || 60,
        tags: ex.tags || [ex.primaryMuscle, '6 WEEK SHREDDED'],
        status: 'ACTIVE',
        isCustom: false,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
    }

    // 2. Seed 6 WEEK SHREDDED Program
    const days: StoredProgramDay[] = SIX_WEEK_SHREDDED_PROGRAM_DETAIL.days.map((d) => ({
      id: `day_${d.dayOfWeek}_6w`,
      programId: SIX_WEEK_SHREDDED_ID,
      dayOfWeek: d.dayOfWeek,
      title: d.title,
      templates: [
        {
          id: `tpl_day_${d.dayOfWeek}_6w`,
          name: `${d.title} [${d.muscleGroup}]`,
          notes: d.notes || undefined,
          category: d.dayOfWeek === 3 || d.dayOfWeek === 6 ? 'Cardio & Abs' : 'Hypertrophy & Shred',
          difficulty: 'ADVANCED',
          estimatedMinutes: 60,
          exercises: d.exercises.map((e) => ({
            id: `te_${e.exerciseId}`,
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName || '',
            orderIndex: e.orderIndex,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            restSeconds: e.restSeconds,
          })),
        },
      ],
    }));

    this.programs.set(SIX_WEEK_SHREDDED_ID, {
      id: SIX_WEEK_SHREDDED_ID,
      creatorId: 'author_guru_mann',
      name: SIX_WEEK_SHREDDED_PROGRAM_DETAIL.name,
      description: SIX_WEEK_SHREDDED_PROGRAM_DETAIL.description || undefined,
      isTemplate: true,
      weeksCount: 12,
      days,
    });

    // 3. Pre-seed default athlete assignments for out-of-the-box demo & development access
    const defaultAthletes = [
      { id: 'ath_1', email: 'marcus.v@alpha.fit', name: 'Marcus Vance' },
      { id: 'ath_2', email: 'elena.rostova@alpha.fit', name: 'Elena Rostova' },
      { id: 'user_athlete_1', email: 'athlete@alpha.io', name: 'Alpha Athlete' },
      { id: 'demo_athlete', email: 'athlete@alpha.fit', name: 'Demo Athlete' },
    ];
    for (const ath of defaultAthletes) {
      const key = `${ath.id}:${SIX_WEEK_SHREDDED_ID}`;
      this.assignedUsers.set(key, {
        id: `assign_${ath.id}_shredded`,
        programId: SIX_WEEK_SHREDDED_ID,
        userId: ath.id,
        userEmail: ath.email,
        userName: ath.name,
        assignedAt: new Date('2026-01-01T00:00:00Z'),
        status: 'ACTIVE',
        currentWeek: 1,
        currentDay: 1,
        completedDays: 0,
        completedWorkouts: 0,
        completedExercises: 0,
        completionPercentage: 0,
      });
      this.programAssignments.set(ath.id, { programId: SIX_WEEK_SHREDDED_ID, athleteId: ath.id });
    }
  }

  private seedCatalogPrograms() {
    try {
      const possiblePaths = [
        path.join(__dirname, 'data/program-catalog.json'),
        path.join(process.cwd(), 'apps/api/src/modules/workouts/data/program-catalog.json'),
        path.join(process.cwd(), 'storage/catalog/program-catalog.json'),
      ];
      let foundPath: string | null = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          foundPath = p;
          break;
        }
      }

      if (foundPath) {
        const raw = fs.readFileSync(foundPath, 'utf8');
        const catalog = JSON.parse(raw);
        if (Array.isArray(catalog.categories)) {
          catalog.categories.forEach((cat: any) => {
            const count = (catalog.programs || []).filter((p: any) => p.categoryId === cat.id && p.isActive).length;
            this.categories.set(cat.id, { ...cat, programsCount: count });
          });
        }
        if (Array.isArray(catalog.programs)) {
          catalog.programs.forEach((prog: any) => {
            this.catalogPrograms.set(prog.id, prog);
            this.programs.set(prog.id, prog);
            this.programs.set(prog.slug, prog);
            this.programActiveState.set(prog.id, prog.isActive ?? true);
          });
        }
        this.logger.log(`Loaded ${this.catalogPrograms.size} programs across ${this.categories.size} categories from catalog.`);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to seed catalog programs: ${err.message}`);
    }
  }

  // Testing helpers
  public clearAll() {
    this.workoutSessions.clear();
    this.programAssignments.clear();
    this.assignedUsers.clear();
    this.userProgress.clear();
  }
}

