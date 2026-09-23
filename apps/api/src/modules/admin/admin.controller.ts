import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, AccountStatus, IAuthUser } from '@alpha/types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.COACH, UserRole.ORG_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Executive Dashboard Overview ---
  @Get('overview')
  async getOverview() {
    return this.adminService.getExecutiveOverview();
  }

  // --- Users Administration ---
  @Get('users')
  async listUsers(
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers({ role, search });
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async updateUserRole(
    @CurrentUser() adminUser: IAuthUser,
    @Param('id') userId: string,
    @Body('role') newRole: UserRole,
  ) {
    return this.adminService.updateUserRole(adminUser.id, userId, newRole);
  }

  @Patch('users/:id/status')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async updateUserStatus(
    @CurrentUser() adminUser: IAuthUser,
    @Param('id') userId: string,
    @Body('status') status: AccountStatus,
  ) {
    return this.adminService.updateUserStatus(adminUser.id, userId, status);
  }

  // --- Client 360° Comprehensive Dossier ---
  @Get('users/:id/360')
  async getClient360(@Param('id') clientId: string) {
    return this.adminService.getClient360(clientId);
  }

  @Post('users/:id/notes')
  async addClientNote(
    @CurrentUser() user: IAuthUser,
    @Param('id') clientId: string,
    @Body() body: { content: string; category?: string; isPrivate?: boolean },
  ) {
    return this.adminService.addClientNote(user.id, clientId, body);
  }

  @Delete('users/notes/:noteId')
  async deleteClientNote(
    @CurrentUser() user: IAuthUser,
    @Param('noteId') noteId: string,
  ) {
    return this.adminService.deleteClientNote(user.id, noteId);
  }

  // --- Trainer & Assignment Management ---
  @Get('trainers')
  async listTrainers() {
    return this.adminService.listTrainers();
  }

  @Post('trainers')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async createTrainer(
    @CurrentUser() adminUser: IAuthUser,
    @Body() body: { email: string; fullName: string; bio?: string; role?: UserRole },
  ) {
    return this.adminService.createTrainer(adminUser.id, body);
  }

  @Patch('trainers/:id')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async updateTrainer(
    @CurrentUser() adminUser: IAuthUser,
    @Param('id') trainerId: string,
    @Body() body: { fullName?: string; isActive?: boolean; bio?: string },
  ) {
    return this.adminService.updateTrainer(adminUser.id, trainerId, body);
  }

  @Post('assignments')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async assignClientToTrainer(
    @CurrentUser() adminUser: IAuthUser,
    @Body('clientId') clientId: string,
    @Body('trainerId') trainerId: string,
  ) {
    return this.adminService.assignClientToTrainer(adminUser.id, clientId, trainerId);
  }

  @Delete('trainers/:id/clients/:clientId')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async unassignClient(
    @CurrentUser() adminUser: IAuthUser,
    @Param('id') trainerId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.adminService.unassignClientFromTrainer(adminUser.id, trainerId, clientId);
  }

  // --- Weekly Progress Check-Ins Audit & Review ---
  @Get('check-ins')
  async listAllWeeklyCheckIns(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listAllWeeklyCheckIns({ status, search });
  }

  @Patch('check-ins/:id/review')
  async reviewCheckIn(
    @CurrentUser() user: IAuthUser,
    @Param('id') checkInId: string,
    @Body() body: { status: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEWED'; reviewNotes?: string },
  ) {
    return this.adminService.reviewWeeklyCheckIn(user.id, checkInId, body.status, body.reviewNotes);
  }

  // --- Security Audit Logs ---
  @Get('audit-logs')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async listAuditLogs(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 100;
    return this.adminService.listAuditLogs(lim);
  }

  // --- System Configuration Defaults ---
  @Get('config')
  async getSystemConfig() {
    return this.adminService.getSystemConfig();
  }

  @Patch('config')
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN)
  async updateSystemConfig(
    @CurrentUser() adminUser: IAuthUser,
    @Body() updates: any,
  ) {
    return this.adminService.updateSystemConfig(adminUser.id, updates);
  }
}

