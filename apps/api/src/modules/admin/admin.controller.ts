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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, AccountStatus, IAuthUser } from '@alpha/types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Users Administration ---
  @Get('users')
  async listUsers(
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers({ role, search });
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @CurrentUser() adminUser: IAuthUser,
    @Param('id') userId: string,
    @Body('role') newRole: UserRole,
  ) {
    return this.adminService.updateUserRole(adminUser.id, userId, newRole);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @CurrentUser() adminUser: IAuthUser,
    @Param('id') userId: string,
    @Body('status') status: AccountStatus,
  ) {
    return this.adminService.updateUserStatus(adminUser.id, userId, status);
  }

  // --- Trainer & Assignment Management ---
  @Get('trainers')
  async listTrainers() {
    return this.adminService.listTrainers();
  }

  @Post('assignments')
  async assignClientToTrainer(
    @CurrentUser() adminUser: IAuthUser,
    @Body('clientId') clientId: string,
    @Body('trainerId') trainerId: string,
  ) {
    return this.adminService.assignClientToTrainer(adminUser.id, clientId, trainerId);
  }

  // --- Weekly Progress Check-Ins Audit ---
  @Get('check-ins')
  async listAllWeeklyCheckIns(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listAllWeeklyCheckIns({ status, search });
  }

  // --- Security Audit Logs ---
  @Get('audit-logs')
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
  async updateSystemConfig(
    @CurrentUser() adminUser: IAuthUser,
    @Body() updates: any,
  ) {
    return this.adminService.updateSystemConfig(adminUser.id, updates);
  }
}
