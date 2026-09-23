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
   * Unassign an athlete from a trainer
   */
  async unassignClientFromTrainer(adminUserId: string, trainerId: string, clientId: string) {
    const rel = await this.prisma.coachClientRelationship.findUnique({
      where: { coachId_clientId: { coachId: trainerId, clientId } },
    });
    if (!rel) {
      throw new NotFoundException({ code: 'RELATIONSHIP_NOT_FOUND', message: 'Trainer assignment not found' });
    }

    await this.prisma.coachClientRelationship.update({
      where: { id: rel.id },
      data: { isActive: false, updatedAt: new Date() },
    });

    await this.recordAuditLog(adminUserId, 'UNASSIGN_CLIENT_TRAINER', 'coach_client_relationship', rel.id, {
      clientId,
      trainerId,
    });

    return { success: true, message: 'Client successfully unassigned from trainer' };
  }

  /**
   * Create or promote a user to TRAINER
   */
  async createTrainer(
    adminUserId: string,
    data: { email: string; fullName: string; bio?: string; role?: UserRole },
  ) {
    const roleToSet = data.role || UserRole.TRAINER;
    let user = await this.prisma.user.findUnique({ where: { email: data.email } });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: roleToSet, status: AccountStatus.ACTIVE, isActive: true },
      });
      await this.prisma.userProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, fullName: data.fullName },
        update: { fullName: data.fullName },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash: 'ENTERPRISE_INVITE_PENDING',
          role: roleToSet,
          status: AccountStatus.ACTIVE,
          isActive: true,
          isEmailVerified: true,
          profile: {
            create: {
              fullName: data.fullName,
            },
          },
        },
      });
    }

    await this.recordAuditLog(adminUserId, 'CREATE_TRAINER', 'user', user.id, {
      email: data.email,
      fullName: data.fullName,
      role: roleToSet,
    });

    return { success: true, trainer: { id: user.id, email: user.email, role: user.role } };
  }

  /**
   * Update trainer details
   */
  async updateTrainer(
    adminUserId: string,
    trainerId: string,
    data: { fullName?: string; isActive?: boolean },
  ) {
    const trainer = await this.prisma.user.findUnique({ where: { id: trainerId } });
    if (!trainer) throw new NotFoundException({ code: 'TRAINER_NOT_FOUND', message: 'Trainer not found' });

    if (data.isActive !== undefined) {
      await this.prisma.user.update({
        where: { id: trainerId },
        data: { isActive: data.isActive, status: data.isActive ? AccountStatus.ACTIVE : AccountStatus.SUSPENDED },
      });
    }

    if (data.fullName !== undefined) {
      await this.prisma.userProfile.upsert({
        where: { userId: trainerId },
        create: { userId: trainerId, fullName: data.fullName || 'Trainer' },
        update: { fullName: data.fullName },
      });
    }

    await this.recordAuditLog(adminUserId, 'UPDATE_TRAINER', 'user', trainerId, data);
    return { success: true, message: 'Trainer updated successfully' };
  }

  /**
   * Executive Dashboard Overview
   * Real aggregate queries across platform
   */
  async getExecutiveOverview() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        totalAthletes,
        activeAthletes,
        totalTrainers,
        totalPrograms,
        totalExercises,
        todayWorkoutsCount,
        pendingCheckInsCount,
        recentAuditLogs,
      ] = await Promise.all([
        this.prisma.user.count({ where: { role: { in: [UserRole.ATHLETE, 'USER' as any] } } }).catch(() => 0),
        this.prisma.user.count({ where: { role: { in: [UserRole.ATHLETE, 'USER' as any] }, isActive: true } }).catch(() => 0),
        this.prisma.user.count({ where: { role: { in: [UserRole.TRAINER, UserRole.COACH] } } }).catch(() => 0),
        this.prisma.program.count().catch(() => 0),
        this.prisma.exercise.count().catch(() => 0),
        this.prisma.workoutSession.count({
          where: { createdAt: { gte: todayStart } },
        }).catch(() => 0),
        this.prisma.weeklyCheckIn.count({ where: { status: 'PENDING' } }).catch(() => 0),
        this.prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { user: { include: { profile: true } } },
        }).catch(() => []),
      ]);

      const recentActivity = recentAuditLogs.map((l) => {
        let type: 'workout' | 'checkin' | 'assignment' | 'user' = 'user';
        if (l.action.includes('WORKOUT')) type = 'workout';
        else if (l.action.includes('CHECKIN')) type = 'checkin';
        else if (l.action.includes('ASSIGN')) type = 'assignment';

        return {
          id: l.id,
          timestamp: l.createdAt.toISOString(),
          type,
          description: `${l.action.replace(/_/g, ' ')} (${l.resource})`,
          userName: l.user?.profile?.fullName || l.user?.email || 'System Action',
        };
      });

      return {
        totalAthletes,
        activeAthletes,
        totalTrainers,
        totalPrograms,
        totalExercises,
        todayWorkoutsCount,
        pendingCheckInsCount,
        recentActivity,
      };
    } catch (err) {
      this.logger.warn(`Failed to generate executive overview: ${(err as Error).message}`);
      return {
        totalAthletes: 0,
        activeAthletes: 0,
        totalTrainers: 0,
        totalPrograms: 0,
        totalExercises: 0,
        todayWorkoutsCount: 0,
        pendingCheckInsCount: 0,
        recentActivity: [],
      };
    }
  }

  /**
   * Client 360° Comprehensive Dossier
   * 15-section operational intelligence record
   */
  async getClient360(clientId: string) {
    const user: any = await this.prisma.user.findUnique({
      where: { id: clientId },
      include: {
        profile: true,
        coachesAsClient: {
          where: { isActive: true },
          include: { coach: { include: { profile: true } } },
        },
        assignedPrograms: {
          where: { isActive: true },
          include: {
            program: {
              include: {
                days: {
                  include: {
                    templates: {
                      include: {
                        exercises: {
                          include: { exercise: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        workoutSessions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            exercises: {
              include: {
                exercise: true,
                sets: true,
              },
            },
          },
        },
        weeklyCheckIns: {
          take: 10,
          orderBy: { weekStartDate: 'desc' },
          include: { reviewedBy: { include: { profile: true } } },
        },
        bodyMeasurements: {
          take: 10,
          orderBy: { recordedAt: 'desc' },
        },
        personalRecords: {
          take: 10,
          orderBy: { achievedAt: 'desc' },
        },
        notesReceived: {
          orderBy: { createdAt: 'desc' },
          include: { author: { include: { profile: true } } },
        },
        assignedMealPlans: {
          where: { isActive: true },
          include: {
            mealPlan: {
              include: {
                meals: {
                  include: { items: { include: { foodItem: true } } },
                },
              },
            },
          },
        },
        dailyMealLogs: {
          take: 7,
          orderBy: { logDate: 'desc' },
          include: { items: true },
        },
        hydrationLogs: {
          take: 7,
          orderBy: { logDate: 'desc' },
        },
        reminders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: `Client [${clientId}] not found` });
    }

    const assignedCoach = user.coachesAsClient[0];
    const activeProgram = user.assignedPrograms[0]?.program;
    const activeMealPlan = user.assignedMealPlans[0]?.mealPlan;

    // Aggregate stats
    const totalWorkouts = user.workoutSessions.length;
    const totalVolume = user.workoutSessions.reduce((sum: number, s: any) => {
      let sessionVol = 0;
      s.exercises.forEach((ex: any) => {
        ex.sets.forEach((set: any) => {
          if (set.isCompleted && set.repsCompleted && set.weightKg) {
            sessionVol += set.repsCompleted * Number(set.weightKg);
          }
        });
      });
      return sum + sessionVol;
    }, 0);

    const latestWeight = user.bodyMeasurements[0]?.weightKg ? Number(user.bodyMeasurements[0].weightKg) : null;
    const profileWeight = user.profile?.weightKg ? Number(user.profile.weightKg) : null;

    return {
      // 1. Basic Profile
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName || user.email.split('@')[0] || 'Athlete',
        avatarUrl: user.profile?.avatarUrl || null,
        bio: user.profile?.bio || null,
        gender: user.profile?.gender || 'NOT_SPECIFIED',
        dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.toISOString() : null,
        heightCm: user.profile?.heightCm ? Number(user.profile.heightCm) : null,
        currentWeightKg: latestWeight || profileWeight || null,
        targetWeightKg: user.profile?.targetWeightKg ? Number(user.profile.targetWeightKg) : null,
        primaryGoal: user.profile?.primaryGoal || 'HYPERTROPHY',
        experienceLevel: user.profile?.experienceLevel || 'INTERMEDIATE',
        timezone: user.profile?.timezone || 'Asia/Kolkata',
        createdAt: user.createdAt.toISOString(),
      },

      // 2. Coach & Trainer Assignment
      trainer: {
        isAssigned: !!assignedCoach,
        trainerId: assignedCoach?.coachId || null,
        trainerName: assignedCoach?.coach?.profile?.fullName || assignedCoach?.coach?.email || 'Unassigned',
        assignedAt: assignedCoach?.createdAt?.toISOString() || null,
      },

      // 3. Active Program & Split
      activeProgram: activeProgram ? {
        id: activeProgram.id,
        name: activeProgram.name,
        description: activeProgram.description,
        weeksCount: activeProgram.weeksCount,
        days: activeProgram.days.map((d: any) => ({
          id: d.id,
          dayOfWeek: d.dayOfWeek,
          title: d.title,
          templatesCount: d.templates.length,
          templates: d.templates.map((t: any) => ({
            id: t.id,
            name: t.name,
            exerciseCount: t.exercises.length,
          })),
        })),
      } : null,

      // 4. Active Nutrition Targets
      nutrition: {
        activeMealPlan: activeMealPlan ? {
          id: activeMealPlan.id,
          name: activeMealPlan.name,
          targetCalories: activeMealPlan.targetCalories,
          targetProteinGrams: activeMealPlan.targetProteinGrams ? Number(activeMealPlan.targetProteinGrams) : null,
          targetCarbsGrams: activeMealPlan.targetCarbsGrams ? Number(activeMealPlan.targetCarbsGrams) : null,
          targetFatGrams: activeMealPlan.targetFatGrams ? Number(activeMealPlan.targetFatGrams) : null,
          mealsCount: activeMealPlan.meals.length,
        } : null,
        recentDailyLogs: user.dailyMealLogs.map((log: any) => ({
          id: log.id,
          date: log.date.toISOString(),
          mealType: log.mealType,
          totalCalories: log.items.reduce((s: number, it: any) => s + (it.calories || 0), 0),
          totalProteinGrams: log.items.reduce((s: number, it: any) => s + Number(it.proteinGrams || 0), 0),
          isCompliant: log.isCompliant,
        })),
        hydrationLogs: user.hydrationLogs.map((h: any) => ({
          date: h.date.toISOString(),
          volumeMl: h.volumeMl,
        })),
      },

      // 5. Workout Performance History
      workouts: {
        totalLogged: totalWorkouts,
        totalVolumeKg: Math.round(totalVolume),
        recentSessions: user.workoutSessions.map((s: any) => ({
          id: s.id,
          startedAt: s.startedAt.toISOString(),
          completedAt: s.completedAt?.toISOString() || null,
          status: s.status,
          durationSeconds: s.durationSeconds,
          notes: s.notes,
          exercisesCount: s.exercises.length,
          exerciseNames: s.exercises.map((e: any) => e.exercise.name),
        })),
      },

      // 6. Weekly Progress Check-Ins
      checkIns: user.weeklyCheckIns.map((ci: any) => ({
        id: ci.id,
        weekStartDate: ci.weekStartDate.toISOString(),
        weightKg: ci.weightKg ? Number(ci.weightKg) : null,
        weightChangeKg: ci.weightChangeKg ? Number(ci.weightChangeKg) : null,
        adherencePercent: ci.adherencePercent,
        status: ci.status,
        frontPhotoUrl: ci.frontPhotoUrl,
        sidePhotoUrl: ci.sidePhotoUrl,
        backPhotoUrl: ci.backPhotoUrl,
        notes: ci.notes,
        reviewerName: ci.reviewedBy?.profile?.fullName || null,
        reviewNotes: ci.reviewNotes,
        reviewedAt: ci.reviewedAt?.toISOString() || null,
      })),

      // 7. Body Measurements
      measurements: user.bodyMeasurements.map((m: any) => ({
        id: m.id,
        recordedAt: m.recordedAt.toISOString(),
        weightKg: m.weightKg ? Number(m.weightKg) : null,
        bodyFatPercentage: m.bodyFatPercentage ? Number(m.bodyFatPercentage) : null,
        chestCm: m.chestCm ? Number(m.chestCm) : null,
        waistCm: m.waistCm ? Number(m.waistCm) : null,
        hipsCm: m.hipsCm ? Number(m.hipsCm) : null,
        bicepCm: m.bicepCm ? Number(m.bicepCm) : null,
        thighCm: m.thighCm ? Number(m.thighCm) : null,
      })),

      // 8. Personal Records (1RMs)
      personalRecords: user.personalRecords.map((pr: any) => ({
        id: pr.id,
        exerciseId: pr.exerciseId,
        exerciseName: pr.exerciseName,
        recordType: pr.prType,
        value: Number(pr.value),
        achievedAt: pr.achievedAt.toISOString(),
      })),

      // 9. Private Coach & Trainer Notes
      notes: user.notesReceived.map((n: any) => ({
        id: n.id,
        authorId: n.authorId,
        authorName: n.author?.profile?.fullName || n.author?.email || 'Coach',
        category: n.category,
        content: n.note,
        createdAt: n.createdAt.toISOString(),
      })),

      // 10. Reminder Preferences
      reminders: user.reminders.map((r: any) => ({
        id: r.id,
        type: r.type,
        scheduledTime: r.scheduledTime,
        daysOfWeek: r.daysOfWeek,
        isEnabled: r.isEnabled,
      })),

      // 11. Security & Account Status
      security: {
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
      },

      // 12. Audit History
      auditLogs: user.auditLogs.map((l: any) => ({
        id: l.id,
        action: l.action,
        resource: l.resource,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Add a coach/trainer client note
   */
  async addClientNote(
    authorId: string,
    clientId: string,
    data: { content: string; category?: string; isPrivate?: boolean },
  ) {
    const note = await this.prisma.trainerClientNote.create({
      data: {
        authorId,
        clientId,
        note: data.content.trim(),
        category: data.category || 'GENERAL',
      },
      include: {
        author: { include: { profile: true } },
      },
    });

    await this.recordAuditLog(authorId, 'ADD_CLIENT_NOTE', 'trainer_client_note', note.id, {
      clientId,
      category: note.category,
    });

    return {
      id: note.id,
      authorId: note.authorId,
      authorName: note.author?.profile?.fullName || note.author?.email || 'Coach',
      category: note.category,
      content: note.note,
      createdAt: note.createdAt.toISOString(),
    };
  }

  /**
   * Delete a coach/trainer client note
   */
  async deleteClientNote(actorId: string, noteId: string) {
    const note = await this.prisma.trainerClientNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException({ code: 'NOTE_NOT_FOUND', message: 'Note not found' });

    await this.prisma.trainerClientNote.delete({ where: { id: noteId } });
    await this.recordAuditLog(actorId, 'DELETE_CLIENT_NOTE', 'trainer_client_note', noteId);
    return { success: true, message: 'Note deleted' };
  }

  /**
   * Review a Weekly Progress Check-In
   */
  async reviewWeeklyCheckIn(
    reviewerId: string,
    checkInId: string,
    status: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEWED',
    reviewNotes?: string,
  ) {
    const checkIn = await this.prisma.weeklyCheckIn.findUnique({ where: { id: checkInId } });
    if (!checkIn) throw new NotFoundException({ code: 'CHECKIN_NOT_FOUND', message: 'Check-in not found' });

    const updated = await this.prisma.weeklyCheckIn.update({
      where: { id: checkInId },
      data: {
        status,
        reviewedById: reviewerId,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date(),
      },
    });

    await this.recordAuditLog(reviewerId, 'REVIEW_WEEKLY_CHECKIN', 'weekly_check_in', checkInId, {
      status,
      userId: checkIn.userId,
    });

    return { success: true, checkIn: updated };
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
