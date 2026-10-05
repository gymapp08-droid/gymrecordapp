import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import {
  CreateExerciseDto,
  StartWorkoutSessionDto,
  LogWorkoutSetDto,
  UpdateWorkoutSetDto,
  CompleteWorkoutSessionDto,
} from '@alpha/validation';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  // --- Exercises ---
  @Get('exercises')
  async getExercises(
    @Query('muscle') muscleGroup?: string,
    @Query('equipment') equipment?: string,
    @Query('difficulty') difficulty?: string,
    @Query('movementPattern') movementPattern?: string,
    @Query('exerciseType') exerciseType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.workoutsService.getExercises({
      muscleGroup,
      equipment,
      difficulty,
      movementPattern,
      exerciseType,
      status,
      search,
    });
  }

  @Get('exercises/:id')
  async getExerciseById(@Param('id') id: string) {
    return this.workoutsService.getExerciseById(id);
  }

  @Post('exercises')
  async createExercise(@Body() dto: CreateExerciseDto & any) {
    return this.workoutsService.createExercise(dto);
  }

  @Patch('exercises/:id')
  async updateExercise(@Param('id') id: string, @Body() updates: any) {
    return this.workoutsService.updateExercise(id, updates);
  }

  @Delete('exercises/:id')
  async archiveExercise(@Param('id') id: string) {
    return this.workoutsService.archiveExercise(id);
  }

  // --- Standalone Workout Templates ---
  @Get('templates')
  async listWorkoutTemplates() {
    return this.workoutsService.listWorkoutTemplates();
  }

  @Get('templates/:id')
  async getWorkoutTemplateById(@Param('id') id: string) {
    return this.workoutsService.getWorkoutTemplateById(id);
  }

  @Post('templates')
  async createWorkoutTemplate(@Body() data: any) {
    return this.workoutsService.createWorkoutTemplate(data);
  }

  @Patch('templates/:id')
  async updateWorkoutTemplate(@Param('id') id: string, @Body() data: any) {
    return this.workoutsService.updateWorkoutTemplate(id, data);
  }

  @Delete('templates/:id')
  async deleteWorkoutTemplate(@Param('id') id: string) {
    return this.workoutsService.deleteWorkoutTemplate(id);
  }

  // --- Categories & Program Catalog ---
  @Get('categories')
  async getCategories() {
    return this.workoutsService.getCategories();
  }

  @Get('programs')
  async getPrograms(
    @CurrentUser() user: IAuthUser,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.workoutsService.getPrograms(user, categoryId, search);
  }

  @Get('programs/:id')
  async getProgramById(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.workoutsService.getProgramById(id, user);
  }

  @Get('programs/:id/nutrition')
  async getProgramNutrition(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.workoutsService.getProgramNutrition(id, user);
  }

  @Get('programs/:id/schedule')
  async getProgramSchedule(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.workoutsService.getProgramSchedule12Weeks(id, user);
  }

  @Get('programs/:id/progress')
  async getProgramProgress(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.workoutsService.getUserProgramProgress(user.id, id, user);
  }

  @Post('programs/:id/start')
  async startProgram(@Param('id') id: string, @CurrentUser() user: IAuthUser) {
    return this.workoutsService.startUserProgram(user.id, id, user);
  }

  @Post('programs/:id/progress/complete-day')
  async completeProgramDay(
    @Param('id') id: string,
    @CurrentUser() user: IAuthUser,
    @Body() body: { weekNumber: number; dayOfWeek: number; notes?: string },
  ) {
    return this.workoutsService.completeProgramDay(
      user.id,
      id,
      body.weekNumber,
      body.dayOfWeek,
      body.notes,
      user,
    );
  }

  @Post('programs/:id/progress/log-set')
  async logProgramSet(
    @Param('id') id: string,
    @CurrentUser() user: IAuthUser,
    @Body()
    body: {
      weekNumber: number;
      dayOfWeek: number;
      exerciseId: string;
      setNumber: number;
      weightKg: number;
      actualReps: number;
      notes?: string;
    },
  ) {
    return this.workoutsService.logProgramSet(
      user.id,
      id,
      body.weekNumber,
      body.dayOfWeek,
      body,
      user,
    );
  }

  @Get('program/active')
  async getActiveProgram(@CurrentUser() user: IAuthUser) {
    return this.workoutsService.getActiveProgram(user.id);
  }

  @Get('today')
  async getTodayWorkout(
    @CurrentUser() user: IAuthUser,
    @Query('dayOfWeek') dayOfWeek?: string,
  ) {
    const dow = dayOfWeek ? parseInt(dayOfWeek, 10) : undefined;
    return this.workoutsService.getTodayWorkout(user.id, dow);
  }

  // --- Sessions & Execution ---
  @Post('sessions/start')
  async startSession(@CurrentUser() user: IAuthUser, @Body() dto: StartWorkoutSessionDto) {
    return this.workoutsService.startSession(user.id, dto);
  }

  @Get('sessions')
  async getUserSessions(@CurrentUser() user: IAuthUser, @Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 20;
    return this.workoutsService.getUserSessions(user.id, lim);
  }

  @Get('sessions/:sessionId')
  async getSessionById(@CurrentUser() user: IAuthUser, @Param('sessionId') sessionId: string) {
    return this.workoutsService.getSessionById(user.id, sessionId);
  }

  @Post('sessions/:sessionId/sets')
  async logSet(
    @CurrentUser() user: IAuthUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: LogWorkoutSetDto,
  ) {
    return this.workoutsService.logSet(user.id, sessionId, dto);
  }

  @Put('sessions/:sessionId/sets/:setId')
  async updateSet(
    @CurrentUser() user: IAuthUser,
    @Param('sessionId') sessionId: string,
    @Param('setId') setId: string,
    @Body() dto: UpdateWorkoutSetDto,
  ) {
    return this.workoutsService.updateSet(user.id, sessionId, setId, dto);
  }

  @Post('sessions/:sessionId/complete')
  async completeSession(
    @CurrentUser() user: IAuthUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteWorkoutSessionDto,
  ) {
    return this.workoutsService.completeSession(user.id, sessionId, dto);
  }
}
