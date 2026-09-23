import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole, AccountStatus, IAdminUserSummary, IAdminSystemConfig } from '@alpha/types';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  // In-memory system configuration defaults
  private systemConfig: IAdminSystemConfig = {
    defaultWorkoutReminderTime: '06:00',
    defaultMealReminderTimes: ['08:00', '11:00', '14:00', '17:00', '20:00'],
    defaultWeeklyCheckInDay: 7, // Sunday
    defaultWeeklyCheckInTime: '09:00',
    primaryTimezone: 'Asia/Kolkata',
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all users with roles, statuses, and trainer assignments
   */
  async listUsers(filter?: { role?: UserRole; search?: string }): Promise<IAdminUserSummary[]> {
    try {
      const where: any = {};
      if (filter?.role) where.role = filter.role;
      if (filter?.search) {
        where.OR = [
          { email: { contains: filter.search, mode: 'insensitive' } },
          { profile: { fullName: { contains: filter.search, mode: 'insensitive' } } },
        ];
      }

      const users = await this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          coachesAsClient: {
            where: { isActive: true },
            include: { coach: { include: { profile: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return users.map((u) => {
        const activeRelationship = u.coachesAsClient[0];
        return {
          id: u.id,
          email: u.email,
          fullName: u.profile?.fullName || u.email.split('@')[0] || 'User',
          role: u.role as unknown as UserRole,
          status: u.status as unknown as AccountStatus,
          isActive: u.isActive,
          isEmailVerified: u.isEmailVerified,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
          createdAt: u.createdAt.toISOString(),
          assignedTrainerId: activeRelationship?.coachId || null,
          assignedTrainerName: activeRelationship?.coach?.profile?.fullName || null,
        };
      });
    } catch (err) {
      this.logger.warn(`Failed to list users from database: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Update user role (e.g. promote ATHLETE to TRAINER or ADMIN)
   */
  async updateUserRole(adminUserId: string, targetUserId: string, newRole: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: `User [${targetUserId}] not found` });
    }

    const previousRole = user.role;
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole, updatedAt: new Date() },
    });

    // Record audit log
    await this.recordAuditLog(adminUserId, 'UPDATE_USER_ROLE', 'user', targetUserId, {
      previousRole,
      newRole,
    });

    this.logger.log(`Admin [${adminUserId}] changed user [${targetUserId}] role from ${previousRole} to ${newRole}`);
    return { success: true, user: { id: updated.id, email: updated.email, role: updated.role } };
  }

  /**
   * Update user account status (e.g. ACTIVE or SUSPENDED)
   */
  async updateUserStatus(adminUserId: string, targetUserId: string, status: AccountStatus) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: `User [${targetUserId}] not found` });
    }

    const previousStatus = user.status;
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status, isActive: status === AccountStatus.ACTIVE, updatedAt: new Date() },
    });

    await this.recordAuditLog(adminUserId, 'UPDATE_USER_STATUS', 'user', targetUserId, {
      previousStatus,
      newStatus: status,
    });

    return { success: true, user: { id: updated.id, email: updated.email, status: updated.status } };
  }

  /**
   * List all trainers and their assigned client counts
   */
  async listTrainers() {
    try {
      const trainers = await this.prisma.user.findMany({
        where: { role: { in: [UserRole.TRAINER, UserRole.COACH] } },
        include: {
          profile: true,
          clientsAsCoach: {
            where: { isActive: true },
            include: { client: { include: { profile: true } } },
          },
        },
      });

      return trainers.map((t) => ({
        id: t.id,
        email: t.email,
        fullName: t.profile?.fullName || t.email.split('@')[0] || 'Trainer',
        role: t.role,
        status: t.status,
        activeClientsCount: t.clientsAsCoach.length,
        clients: t.clientsAsCoach.map((rel) => ({
          relationshipId: rel.id,
          clientId: rel.clientId,
          clientName: rel.client?.profile?.fullName || rel.client?.email || 'Client',
          assignedAt: rel.createdAt.toISOString(),
        })),
      }));
    } catch (err) {
      this.logger.warn(`Failed to list trainers: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Assign or reassign an athlete to a trainer
   */
  async assignClientToTrainer(adminUserId: string, clientId: string, trainerId: string) {
    const [client, trainer] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: clientId } }),
      this.prisma.user.findUnique({ where: { id: trainerId } }),
    ]);

    if (!client) throw new NotFoundException({ code: 'CLIENT_NOT_FOUND', message: 'Target client user not found' });
    if (!trainer) throw new NotFoundException({ code: 'TRAINER_NOT_FOUND', message: 'Target trainer user not found' });

    // Deactivate previous active coach relationships
    await this.prisma.coachClientRelationship.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    });

    // Create or activate relationship with new trainer
    const relationship = await this.prisma.coachClientRelationship.upsert({
      where: { coachId_clientId: { coachId: trainerId, clientId } },
      create: {
        coachId: trainerId,
        clientId,
        organizationId: trainer.organizationId,
        isActive: true,
      },
      update: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    await this.recordAuditLog(adminUserId, 'ASSIGN_CLIENT_TRAINER', 'coach_client_relationship', relationship.id, {
      clientId,
      trainerId,
    });

    return { success: true, relationship };
  }

  /**
   * System-wide weekly check-ins audit
   */
  async listAllWeeklyCheckIns(filter?: { status?: string; search?: string }) {
    try {
      const where: any = {};
      if (filter?.status) where.status = filter.status;
      if (filter?.search) {
        where.user = {
          OR: [
            { email: { contains: filter.search, mode: 'insensitive' } },
            { profile: { fullName: { contains: filter.search, mode: 'insensitive' } } },
          ],
        };
      }

      const checkIns = await this.prisma.weeklyCheckIn.findMany({
        where,
        include: {
          user: { include: { profile: true } },
          reviewedBy: { include: { profile: true } },
        },
        orderBy: { weekStartDate: 'desc' },
      });

      return checkIns.map((ci) => ({
        id: ci.id,
        userId: ci.userId,
        userFullName: ci.user?.profile?.fullName || ci.user?.email || 'Athlete',
        userEmail: ci.user?.email,
        weekStartDate: ci.weekStartDate.toISOString(),
        weightKg: ci.weightKg,
        previousWeightKg: ci.previousWeightKg,
        weightChangeKg: ci.weightChangeKg,
        heightCm: ci.heightCm,
        bmi: ci.bmi,
        previousBmi: ci.previousBmi,
        bmiChange: ci.bmiChange,
        workoutsPlanned: ci.workoutsPlanned,
        workoutsCompleted: ci.workoutsCompleted,
        adherencePercent: ci.adherencePercent,
        totalVolumeKg: ci.totalVolumeKg,
        mealsPlanned: ci.mealsPlanned,
        mealsLogged: ci.mealsLogged,
        nutritionAdherencePct: ci.nutritionAdherencePct,
        energyRecoveryScore: ci.energyRecoveryScore,
        notes: ci.notes,
        frontPhotoUrl: ci.frontPhotoUrl,
        sidePhotoUrl: ci.sidePhotoUrl,
        backPhotoUrl: ci.backPhotoUrl,
        status: ci.status,
        reviewedById: ci.reviewedById,
        reviewerName: ci.reviewedBy?.profile?.fullName || ci.reviewedBy?.email,
        reviewNotes: ci.reviewNotes,
        reviewedAt: ci.reviewedAt?.toISOString(),
        submittedAt: ci.submittedAt.toISOString(),
        createdAt: ci.createdAt.toISOString(),
      }));
    } catch (err) {
      this.logger.warn(`Failed to query check-ins: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * System Audit Logs
   */
  async listAuditLogs(limit = 100) {
    try {
      const logs = await this.prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      });

      return logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        actorName: l.user?.profile?.fullName || l.user?.email || 'System',
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        metadata: l.metadata,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  /**
   * System Global Configuration
   */
  getSystemConfig(): IAdminSystemConfig {
    return this.systemConfig;
  }

  updateSystemConfig(adminUserId: string, updates: Partial<IAdminSystemConfig>): IAdminSystemConfig {
    this.systemConfig = { ...this.systemConfig, ...updates };
    this.recordAuditLog(adminUserId, 'UPDATE_SYSTEM_CONFIG', 'system_config', 'global', updates);
    return this.systemConfig;
  }

  /**
   * Security audit log recorder
   */
  async recordAuditLog(
    actorId: string | null,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: actorId || undefined,
          action,
          resource,
          resourceId,
          metadata: metadata ? (metadata as any) : undefined,
          ipAddress,
          userAgent,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to record audit log: ${(err as Error).message}`);
    }
  }
}
