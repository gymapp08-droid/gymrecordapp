import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IAuthUser, UserRole, IWeeklyCheckIn, IWeeklyCheckInSubmission } from '@alpha/types';

@Injectable()
export class CheckInsService {
  private readonly logger = new Logger(CheckInsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit weekly progress check-in
   */
  async submitWeeklyCheckIn(userId: string, dto: IWeeklyCheckInSubmission): Promise<IWeeklyCheckIn> {
    if (!dto.weightKg || dto.weightKg <= 20 || dto.weightKg >= 350) {
      throw new BadRequestException({ code: 'INVALID_WEIGHT', message: 'Valid body weight is required' });
    }

    // 1. Determine start of current week (Monday 00:00:00 UTC)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sun, 1 = Mon ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStartDate = new Date(now);
    weekStartDate.setUTCDate(now.getUTCDate() + diffToMonday);
    weekStartDate.setUTCHours(0, 0, 0, 0);

    // 2. Fetch previous check-in or latest recorded metric for comparison
    const previousCheckIn = await this.prisma.weeklyCheckIn.findFirst({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
    });

    const previousWeightKg = previousCheckIn?.weightKg ?? null;
    const weightChangeKg = previousWeightKg !== null ? parseFloat((dto.weightKg - previousWeightKg).toFixed(1)) : null;

    // 3. Determine height and BMI
    const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const heightCm = dto.heightCm || userProfile?.heightCm || null;

    let bmi: number | null = null;
    let previousBmi: number | null = null;
    let bmiChange: number | null = null;

    if (heightCm && heightCm > 0) {
      const hM = heightCm / 100;
      bmi = parseFloat((dto.weightKg / (hM * hM)).toFixed(1));
      if (previousWeightKg) {
        previousBmi = parseFloat((previousWeightKg / (hM * hM)).toFixed(1));
        bmiChange = parseFloat((bmi - previousBmi).toFixed(1));
      }
    }

    // 4. Summarize real workout training performance for the week
    const weekWorkouts = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: { gte: weekStartDate },
      },
    });

    const workoutsCompleted = weekWorkouts.length;
    const workoutsPlanned = 5; // Standard weekly scheduled protocol
    const adherencePercent = Math.min(Math.round((workoutsCompleted / workoutsPlanned) * 100), 100);
    const totalVolumeKg = weekWorkouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);

    // 5. Summarize real nutrition adherence for the week
    const weekMealLogs = await this.prisma.dailyMealLog.findMany({
      where: {
        userId,
        logDate: { gte: weekStartDate },
      },
    });

    const mealsLogged = weekMealLogs.length;
    const mealsPlanned = 5 * Math.min(dayOfWeek === 0 ? 7 : dayOfWeek, 7);
    const nutritionAdherencePct = mealsPlanned > 0
      ? Math.min(Math.round((mealsLogged / mealsPlanned) * 100), 100)
      : 100;

    // 6. Save check-in record
    const checkIn = await this.prisma.weeklyCheckIn.create({
      data: {
        userId,
        weekStartDate,
        weightKg: dto.weightKg,
        previousWeightKg,
        weightChangeKg,
        heightCm,
        bmi,
        previousBmi,
        bmiChange,
        workoutsPlanned,
        workoutsCompleted,
        adherencePercent,
        totalVolumeKg,
        mealsPlanned,
        mealsLogged,
        nutritionAdherencePct,
        energyRecoveryScore: dto.energyRecoveryScore || null,
        notes: dto.notes || null,
        frontPhotoUrl: dto.frontPhotoUrl || null,
        sidePhotoUrl: dto.sidePhotoUrl || null,
        backPhotoUrl: dto.backPhotoUrl || null,
        status: 'SUBMITTED',
      },
    });

    // 7. Update latest weight in body metrics
    await this.prisma.bodyMetric.create({
      data: {
        userId,
        recordedAt: now,
        weightKg: dto.weightKg,
        source: 'WEEKLY_CHECKIN',
      },
    });

    // 8. If progress photos submitted, save to progress photos table
    if (dto.frontPhotoUrl) {
      await this.prisma.progressPhoto.create({
        data: {
          userId,
          takenAt: now,
          photoUrl: dto.frontPhotoUrl,
          s3Key: `checkins/${checkIn.id}/front.jpg`,
          viewAngle: 'FRONT',
          notes: 'Weekly Check-in Front View',
          isPrivate: true,
        },
      });
    }

    // 9. Record security audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMIT_WEEKLY_CHECKIN',
        resource: 'weekly_check_in',
        resourceId: checkIn.id,
        metadata: {
          weekStartDate: weekStartDate.toISOString(),
          weightKg: dto.weightKg,
          weightChangeKg,
          workoutsCompleted,
        },
      },
    });

    return this.formatCheckIn(checkIn);
  }

  /**
   * Get latest check-in for user
   */
  async getLatestCheckIn(userId: string) {
    const latest = await this.prisma.weeklyCheckIn.findFirst({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
      include: { reviewedBy: { include: { profile: true } } },
    });

    if (!latest) return null;
    return this.formatCheckIn(latest);
  }

  /**
   * Get check-in history for user
   */
  async getCheckInHistory(userId: string): Promise<IWeeklyCheckIn[]> {
    const list = await this.prisma.weeklyCheckIn.findMany({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
      include: { reviewedBy: { include: { profile: true } } },
    });

    return list.map((item) => this.formatCheckIn(item));
  }

  /**
   * Get check-in by ID with strict ownership & trainer-client authorization
   */
  async getCheckInById(requestingUser: IAuthUser, checkInId: string): Promise<IWeeklyCheckIn> {
    const ci = await this.prisma.weeklyCheckIn.findUnique({
      where: { id: checkInId },
      include: {
        user: { include: { profile: true } },
        reviewedBy: { include: { profile: true } },
      },
    });

    if (!ci) {
      throw new NotFoundException({ code: 'CHECKIN_NOT_FOUND', message: 'Weekly check-in not found' });
    }

    // Authorization: Owner, Admin, or assigned Trainer
    const isOwner = ci.userId === requestingUser.id;
    const isAdmin = requestingUser.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      if (requestingUser.role === UserRole.TRAINER || requestingUser.role === UserRole.COACH) {
        const relation = await this.prisma.coachClientRelationship.findFirst({
          where: {
            coachId: requestingUser.id,
            clientId: ci.userId,
            isActive: true,
          },
        });
        if (!relation) {
          throw new ForbiddenException({
            code: 'TRAINER_UNAUTHORIZED',
            message: 'You are not the authorized assigned trainer for this client',
          });
        }
      } else {
        throw new ForbiddenException({
          code: 'UNAUTHORIZED_CHECKIN_ACCESS',
          message: 'Access denied to this check-in',
        });
      }
    }

    return this.formatCheckIn(ci);
  }

  /**
   * Trainer or Admin reviews a weekly check-in
   */
  async reviewCheckIn(reviewer: IAuthUser, checkInId: string, reviewNotes: string): Promise<IWeeklyCheckIn> {
    await this.getCheckInById(reviewer, checkInId);

    const updated = await this.prisma.weeklyCheckIn.update({
      where: { id: checkInId },
      data: {
        status: 'REVIEWED',
        reviewedById: reviewer.id,
        reviewNotes,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: { include: { profile: true } },
        reviewedBy: { include: { profile: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: reviewer.id,
        action: 'REVIEW_WEEKLY_CHECKIN',
        resource: 'weekly_check_in',
        resourceId: checkInId,
        metadata: {
          clientId: updated.userId,
          reviewerRole: reviewer.role,
        },
      },
    });

    this.logger.log(`User [${reviewer.id}] (${reviewer.role}) reviewed check-in [${checkInId}] for client [${updated.userId}]`);
    return this.formatCheckIn(updated);
  }

  private formatCheckIn(record: any): IWeeklyCheckIn {
    return {
      id: record.id,
      userId: record.userId,
      userFullName: record.user?.profile?.fullName || record.user?.email || undefined,
      userEmail: record.user?.email || undefined,
      weekStartDate: record.weekStartDate.toISOString(),
      weightKg: record.weightKg,
      previousWeightKg: record.previousWeightKg,
      weightChangeKg: record.weightChangeKg,
      heightCm: record.heightCm,
      bmi: record.bmi,
      previousBmi: record.previousBmi,
      bmiChange: record.bmiChange,
      workoutsPlanned: record.workoutsPlanned,
      workoutsCompleted: record.workoutsCompleted,
      adherencePercent: record.adherencePercent,
      totalVolumeKg: record.totalVolumeKg,
      mealsPlanned: record.mealsPlanned,
      mealsLogged: record.mealsLogged,
      nutritionAdherencePct: record.nutritionAdherencePct,
      energyRecoveryScore: record.energyRecoveryScore,
      notes: record.notes,
      frontPhotoUrl: record.frontPhotoUrl,
      sidePhotoUrl: record.sidePhotoUrl,
      backPhotoUrl: record.backPhotoUrl,
      status: record.status,
      reviewedById: record.reviewedById,
      reviewerName: record.reviewedBy?.profile?.fullName || record.reviewedBy?.email || null,
      reviewNotes: record.reviewNotes,
      reviewedAt: record.reviewedAt ? record.reviewedAt.toISOString() : null,
      submittedAt: record.submittedAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
    };
  }
}
