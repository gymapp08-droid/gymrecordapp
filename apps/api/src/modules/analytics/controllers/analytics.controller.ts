import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsRebuildService, IRebuildOptions } from '../services/analytics-rebuild.service';
import { AnalyticsQualityService } from '../services/analytics-quality.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AnalyticsAuthorizationGuard } from '../guards/analytics-authorization.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IAuthUser, AnalyticsTimePeriod, UserRole } from '@alpha/types';

@Controller('analytics')
@UseGuards(JwtAuthGuard, AnalyticsAuthorizationGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly rebuildService: AnalyticsRebuildService,
    private readonly qualityService: AnalyticsQualityService,
  ) {}

  // -------------------------------------------------------------
  // LEVEL 1: CLIENT ANALYTICS
  // -------------------------------------------------------------

  @Get('client/overview')
  async getClientOverview(
    @CurrentUser() user: IAuthUser,
    @Query('clientId') targetClientId?: string,
    @Query('period') period: AnalyticsTimePeriod = '30_DAYS',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('timezone') timezone?: string,
  ) {
    const effectiveUserId = targetClientId || user.id;
    return this.analyticsService.getClientOverview(
      effectiveUserId,
      period,
      startDate,
      endDate,
      timezone || 'UTC',
    );
  }

  @Get('client/trends')
  async getClientTrends(
    @CurrentUser() user: IAuthUser,
    @Query('clientId') targetClientId?: string,
    @Query('period') period: AnalyticsTimePeriod = '30_DAYS',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('timezone') timezone?: string,
  ) {
    const effectiveUserId = targetClientId || user.id;
    return this.analyticsService.getClientTrends(
      effectiveUserId,
      period,
      startDate,
      endDate,
      timezone || 'UTC',
    );
  }

  // -------------------------------------------------------------
  // LEVEL 2: COACH ANALYTICS
  // -------------------------------------------------------------

  @Get('coach/overview')
  async getCoachOverview(
    @CurrentUser() user: IAuthUser,
    @Query('coachId') targetCoachId?: string,
    @Query('period') period: AnalyticsTimePeriod = '30_DAYS',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('timezone') timezone?: string,
  ) {
    const effectiveCoachId = targetCoachId || user.id;
    return this.analyticsService.getCoachOverview(
      effectiveCoachId,
      period,
      startDate,
      endDate,
      timezone || 'UTC',
    );
  }

  @Get('coach/clients')
  async getCoachClients(
    @CurrentUser() user: IAuthUser,
    @Query('coachId') targetCoachId?: string,
    @Query('period') period: AnalyticsTimePeriod = '30_DAYS',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('timezone') timezone?: string,
  ) {
    const effectiveCoachId = targetCoachId || user.id;
    return this.analyticsService.getCoachClients(
      effectiveCoachId,
      period,
      startDate,
      endDate,
      timezone || 'UTC',
    );
  }

  @Get('coach/programs')
  async getCoachPrograms(
    @CurrentUser() user: IAuthUser,
    @Query('coachId') targetCoachId?: string,
  ) {
    const effectiveCoachId = targetCoachId || user.id;
    return this.analyticsService.getCoachPrograms(effectiveCoachId);
  }

  // -------------------------------------------------------------
  // LEVEL 3: ORGANIZATION ANALYTICS
  // -------------------------------------------------------------

  @Get('organization/overview')
  async getOrganizationOverview(
    @CurrentUser() user: IAuthUser,
    @Query('organizationId') targetOrgId?: string,
    @Query('period') period: AnalyticsTimePeriod = '30_DAYS',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('timezone') timezone?: string,
  ) {
    const effectiveOrgId = targetOrgId || user.organizationId;
    if (!effectiveOrgId) {
      throw new UnauthorizedException('User is not associated with an organization tenant');
    }
    return this.analyticsService.getOrganizationOverview(
      effectiveOrgId,
      period,
      startDate,
      endDate,
      timezone || 'UTC',
    );
  }

  @Get('organization/trends')
  async getOrganizationTrends(
    @CurrentUser() user: IAuthUser,
    @Query('organizationId') targetOrgId?: string,
    @Query('period') period: AnalyticsTimePeriod = '30_DAYS',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('timezone') timezone?: string,
  ) {
    const effectiveOrgId = targetOrgId || user.organizationId;
    if (!effectiveOrgId) {
      throw new UnauthorizedException('User is not associated with an organization tenant');
    }
    return this.analyticsService.getOrganizationTrends(
      effectiveOrgId,
      period,
      startDate,
      endDate,
      timezone || 'UTC',
    );
  }

  @Get('organization/coaches')
  async getOrganizationCoaches(
    @CurrentUser() user: IAuthUser,
    @Query('organizationId') targetOrgId?: string,
  ) {
    const effectiveOrgId = targetOrgId || user.organizationId;
    if (!effectiveOrgId) {
      throw new UnauthorizedException('User is not associated with an organization tenant');
    }
    return this.analyticsService.getOrganizationCoaches(effectiveOrgId);
  }

  // -------------------------------------------------------------
  // REBUILD & BACKFILL OPERATIONS
  // -------------------------------------------------------------

  @Post('rebuild/clients')
  async rebuildClientsHistory(
    @CurrentUser() user: IAuthUser,
    @Body() dto: IRebuildOptions,
  ) {
    // Athlete can only rebuild self; Org Admin can rebuild tenant; Admin can rebuild all
    if (user.role === UserRole.ATHLETE) {
      dto.userId = user.id;
    } else if (user.role === UserRole.ORG_ADMIN) {
      if (user.organizationId) {
        dto.organizationId = user.organizationId;
      }
    } else if (user.role !== UserRole.ADMIN && ![UserRole.COACH, UserRole.TRAINER].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions to trigger historical analytics rebuild');
    }

    return this.rebuildService.rebuildClientHistory(dto);
  }

  @Post('rebuild/organizations')
  async rebuildOrganizationsHistory(
    @CurrentUser() user: IAuthUser,
    @Body() dto: IRebuildOptions,
  ) {
    if (user.role !== UserRole.ORG_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only organization administrators can trigger organization rebuilds');
    }
    if (user.role === UserRole.ORG_ADMIN && user.organizationId) {
      dto.organizationId = user.organizationId;
    }
    return this.rebuildService.rebuildOrganizationHistory(dto);
  }

  // -------------------------------------------------------------
  // AUTOMATED DATA QUALITY AUDIT
  // -------------------------------------------------------------

  @Get('quality/audit')
  async auditDataQuality(
    @CurrentUser() user: IAuthUser,
    @Query('lookbackDays') lookbackDays?: string,
  ) {
    if (user.role !== UserRole.ORG_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access the automated data quality audit report');
    }
    const days = lookbackDays ? parseInt(lookbackDays, 10) : 30;
    return this.qualityService.runAudit(days);
  }
}

