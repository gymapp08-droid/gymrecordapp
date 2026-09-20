import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import { ActivityService } from './activity.service';
import {
  CreateCardioSessionDto,
  UpdateCardioSessionDto,
  LogManualActivityDto,
  SyncHealthDataDto,
} from '@alpha/validation';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  // -------------------------------------------------------------
  // ACTIVITY & DAILY SUMMARY
  // -------------------------------------------------------------

  @Get('activity/today')
  async getTodayActivity(
    @CurrentUser() user: IAuthUser,
    @Query('date') date?: string
  ) {
    return this.activityService.getDailySummary(user.id, date);
  }

  @Post('activity/manual')
  @HttpCode(HttpStatus.CREATED)
  async logManualActivity(
    @CurrentUser() user: IAuthUser,
    @Body() dto: LogManualActivityDto
  ) {
    return this.activityService.logManualActivity(user.id, dto);
  }

  // -------------------------------------------------------------
  // CARDIO SESSIONS
  // -------------------------------------------------------------

  @Get('cardio')
  async getCardioSessions(
    @CurrentUser() user: IAuthUser,
    @Query('date') date?: string
  ) {
    return this.activityService.getCardioSessions(user.id, date);
  }

  @Get('cardio/:id')
  async getCardioSessionById(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string
  ) {
    return this.activityService.getCardioSessionById(user.id, id);
  }

  @Post('cardio')
  @HttpCode(HttpStatus.CREATED)
  async createCardioSession(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateCardioSessionDto
  ) {
    return this.activityService.createCardioSession(user.id, dto);
  }

  @Patch('cardio/:id')
  async updateCardioSession(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCardioSessionDto
  ) {
    return this.activityService.updateCardioSession(user.id, id, dto);
  }

  @Delete('cardio/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCardioSession(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string
  ) {
    return this.activityService.deleteCardioSession(user.id, id);
  }

  // -------------------------------------------------------------
  // HEALTH INTEGRATION & SYNC
  // -------------------------------------------------------------

  @Get('health/connections')
  async getHealthConnections(@CurrentUser() user: IAuthUser) {
    return this.activityService.getHealthConnections(user.id);
  }

  @Post('health/sync')
  @HttpCode(HttpStatus.OK)
  async syncHealthData(
    @CurrentUser() user: IAuthUser,
    @Body() dto: SyncHealthDataDto
  ) {
    return this.activityService.syncHealthData(user.id, dto);
  }
}
