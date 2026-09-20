import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CoachClientGuard } from './guards/coach-client.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser, InvitationStatus, ClientStatus } from '@alpha/types';
import {
  InviteClientDto,
  AcceptInvitationDto,
  UpdateClientStatusDto,
} from '@alpha/validation';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly portalService: PortalService) {}

  @Get('permissions')
  async getPermissions(@CurrentUser() user: IAuthUser) {
    return this.portalService.getPermissions(user.role);
  }

  @Get()
  async listClients(@CurrentUser() user: IAuthUser) {
    return this.portalService.listClients(user.id, user.role, user.organizationId);
  }

  @Post('invite')
  async inviteClient(@CurrentUser() user: IAuthUser, @Body() dto: InviteClientDto) {
    return this.portalService.inviteClient(user.id, user.role, user.organizationId, dto);
  }

  @Get('invitations')
  async listInvitations(
    @CurrentUser() user: IAuthUser,
    @Query('status') status?: InvitationStatus,
  ) {
    return this.portalService.listInvitations(user.id, status);
  }

  @Post('invitations/:id/cancel')
  async cancelInvitation(
    @CurrentUser() user: IAuthUser,
    @Param('id') invitationId: string,
  ) {
    return this.portalService.cancelInvitation(user.id, invitationId);
  }

  @Post('accept-invite')
  async acceptInvitation(
    @CurrentUser() user: IAuthUser,
    @Body() dto: AcceptInvitationDto,
  ) {
    return this.portalService.acceptInvitation(user.id, user.email, dto);
  }

  @Get(':id')
  @UseGuards(CoachClientGuard)
  async getClientSummary(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.getClientSummary(user.id, user.role, clientId, user.organizationId);
  }

  @Patch(':id/status')
  @UseGuards(CoachClientGuard)
  async updateClientStatus(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
    @Body() dto: UpdateClientStatusDto,
  ) {
    return this.portalService.updateClientStatus(user.id, user.role, clientId, dto);
  }

  @Get(':id/detail')
  @UseGuards(CoachClientGuard)
  async getClientDetail(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.getClientDetail(user.id, user.role, clientId, user.organizationId);
  }

  @Post(':id/offboard')
  @UseGuards(CoachClientGuard)
  async offboardClient(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.updateClientStatus(user.id, user.role, clientId, {
      status: ClientStatus.ARCHIVED,
    });
  }

  // -------------------------------------------------------------
  // GATE C: PROGRESS, WORKOUT, NUTRITION, ACTIVITY & GOAL ANALYTICS
  // -------------------------------------------------------------

  @Get(':id/progress-analytics')
  @UseGuards(CoachClientGuard)
  async getClientProgressAnalytics(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.getClientProgressAnalytics(user.id, user.role, clientId, user.organizationId);
  }

  @Get(':id/progress-photos')
  @UseGuards(CoachClientGuard)
  async getClientProgressPhotos(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.getClientProgressPhotos(user.id, user.role, clientId, user.organizationId);
  }

  @Get(':id/workout-analytics')
  @UseGuards(CoachClientGuard)
  async getClientWorkoutAnalytics(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.getClientWorkoutAnalytics(user.id, user.role, clientId, user.organizationId);
  }

  @Get(':id/nutrition-analytics')
  @UseGuards(CoachClientGuard)
  async getClientNutritionAnalytics(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.getClientNutritionAnalytics(user.id, user.role, clientId, user.organizationId);
  }

  @Get(':id/activity-analytics')
  @UseGuards(CoachClientGuard)
  async getClientActivityAnalytics(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.getClientActivityAnalytics(user.id, user.role, clientId, user.organizationId);
  }

  @Get(':id/goals')
  @UseGuards(CoachClientGuard)
  async getClientGoals(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
  ) {
    return this.portalService.getClientGoals(user.id, user.role, clientId, user.organizationId);
  }

  @Patch(':id/goals')
  @UseGuards(CoachClientGuard)
  async updateClientGoal(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
    @Body() dto: any,
  ) {
    return this.portalService.updateClientGoal(user.id, user.role, clientId, dto, user.organizationId);
  }
}
