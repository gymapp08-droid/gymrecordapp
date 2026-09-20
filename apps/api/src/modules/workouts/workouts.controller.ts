import {
  Controller,
  Get,
  Post,
  Put,
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
    @Query('search') search?: string,
  ) {
    return this.workoutsService.getExercises({ muscleGroup, equipment, search });
  }

  @Get('exercises/:id')
  async getExerciseById(@Param('id') id: string) {
    return this.workoutsService.getExerciseById(id);
  }

  @Post('exercises')
  async createExercise(@Body() dto: CreateExerciseDto) {
    return this.workoutsService.createExercise(dto);
  }

  // --- Program & Split ---
  @Get('program/active')
  async getActiveProgram(@CurrentUser() user: IAuthUser) {
    return this.workoutsService.getActiveProgram(user.id);
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
