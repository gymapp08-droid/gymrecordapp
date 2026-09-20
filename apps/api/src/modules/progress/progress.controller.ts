import {
  Controller,
  Get,
  Post,
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
import { IAuthUser, BodyMeasurementType } from '@alpha/types';
import { ProgressService } from './progress.service';
import {
  LogBodyMetricDto,
  LogBodyMeasurementDto,
  CreateProgressPhotoDto,
} from '@alpha/validation';

@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // -------------------------------------------------------------
  // PROGRESS OVERVIEW
  // -------------------------------------------------------------

  @Get('overview')
  async getOverview(@CurrentUser() user: IAuthUser) {
    return this.progressService.getOverview(user.id);
  }

  // -------------------------------------------------------------
  // BODY METRICS & WEIGHT
  // -------------------------------------------------------------

  @Post('metrics')
  @HttpCode(HttpStatus.CREATED)
  async logBodyMetric(
    @CurrentUser() user: IAuthUser,
    @Body() dto: LogBodyMetricDto,
  ) {
    return this.progressService.logBodyMetric(user.id, dto);
  }

  @Get('metrics')
  async getBodyMetrics(
    @CurrentUser() user: IAuthUser,
    @Query('limit') limit?: number,
  ) {
    return this.progressService.getBodyMetrics(user.id, limit ? Number(limit) : 50);
  }

  @Get('metrics/latest')
  async getLatestBodyMetric(@CurrentUser() user: IAuthUser) {
    return this.progressService.getLatestBodyMetric(user.id);
  }

  @Get('weight-trajectory')
  async getWeightTrajectory(
    @CurrentUser() user: IAuthUser,
    @Query('days') days?: number,
  ) {
    return this.progressService.getWeightTrajectory(user.id, days ? Number(days) : 90);
  }

  // -------------------------------------------------------------
  // BODY MEASUREMENTS
  // -------------------------------------------------------------

  @Post('measurements')
  @HttpCode(HttpStatus.CREATED)
  async logMeasurement(
    @CurrentUser() user: IAuthUser,
    @Body() dto: LogBodyMeasurementDto,
  ) {
    return this.progressService.logMeasurement(user.id, dto);
  }

  @Get('measurements')
  async getMeasurements(
    @CurrentUser() user: IAuthUser,
    @Query('type') type?: BodyMeasurementType,
  ) {
    return this.progressService.getMeasurements(user.id, type);
  }

  // -------------------------------------------------------------
  // PERSONAL RECORDS & STRENGTH
  // -------------------------------------------------------------

  @Get('prs')
  async getPersonalRecords(
    @CurrentUser() user: IAuthUser,
    @Query('exerciseId') exerciseId?: string,
  ) {
    return this.progressService.getPersonalRecords(user.id, exerciseId);
  }

  @Post('prs/sync')
  async syncWorkoutPRs(@CurrentUser() user: IAuthUser) {
    return this.progressService.scanAndSyncWorkoutPRs(user.id);
  }

  @Get('strength-trends')
  async getStrengthTrends(@CurrentUser() user: IAuthUser) {
    return this.progressService.getStrengthTrends(user.id);
  }

  // -------------------------------------------------------------
  // PROGRESS PHOTOS
  // -------------------------------------------------------------

  @Post('photos')
  @HttpCode(HttpStatus.CREATED)
  async logProgressPhoto(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateProgressPhotoDto,
  ) {
    return this.progressService.logProgressPhoto(user.id, dto);
  }

  @Get('photos')
  async getProgressPhotos(
    @CurrentUser() user: IAuthUser,
    @Query('angle') angle?: string,
  ) {
    return this.progressService.getProgressPhotos(user.id, angle);
  }

  @Get('photos/compare')
  async getPhotoComparison(
    @CurrentUser() user: IAuthUser,
    @Query('beforeId') beforeId: string,
    @Query('afterId') afterId: string,
  ) {
    return this.progressService.getPhotoComparison(user.id, beforeId, afterId);
  }

  @Delete('photos/:id')
  async deleteProgressPhoto(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ) {
    return this.progressService.deleteProgressPhoto(user.id, id);
  }
}
