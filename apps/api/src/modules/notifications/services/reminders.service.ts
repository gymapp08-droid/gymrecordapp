import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReminderDto, UpdateReminderDto } from '@alpha/validation';
import { IReminder } from '@alpha/types';
import * as crypto from 'crypto';

@Injectable()
export class RemindersService {
  private readonly memoryReminders = new Map<string, any>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all reminders for a user
   */
  async getUserReminders(userId: string): Promise<IReminder[]> {
    try {
      const reminders = await this.prisma.reminder.findMany({
        where: { userId },
        orderBy: [{ timeOfDay: 'asc' }, { createdAt: 'desc' }],
      });
      return reminders.map((r) => this.formatReminder(r));
    } catch (err) {
      return Array.from(this.memoryReminders.values())
        .filter((r) => r.userId === userId)
        .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
    }
  }

  /**
   * Get reminder by ID with strict ownership isolation
   */
  async getReminderById(userId: string, reminderId: string): Promise<IReminder> {
    try {
      const reminder = await this.prisma.reminder.findUnique({
        where: { id: reminderId },
      });

      if (!reminder) {
        throw new NotFoundException({
          code: 'REMINDER_NOT_FOUND',
          message: `Reminder with ID ${reminderId} not found`,
        });
      }

      if (reminder.userId !== userId) {
        throw new ForbiddenException({
          code: 'CROSS_USER_REMINDER_FORBIDDEN',
          message: 'Cannot access reminder belonging to another user',
        });
      }

      return this.formatReminder(reminder);
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      return this.getReminderByIdInMemory(userId, reminderId);
    }
  }

  /**
   * Create a new reminder
   */
  async createReminder(userId: string, dto: CreateReminderDto): Promise<IReminder> {
    try {
      const reminder = await this.prisma.reminder.create({
        data: {
          userId,
          title: dto.title,
          timeOfDay: dto.timeOfDay,
          daysOfWeek: dto.daysOfWeek || [1, 2, 3, 4, 5, 6, 7],
          category: dto.category || 'WORKOUT',
          isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
          metadata: dto.metadata ? (dto.metadata as any) : undefined,
        },
      });

      const formatted = this.formatReminder(reminder);
      this.memoryReminders.set(reminder.id, formatted);
      return formatted;
    } catch (err) {
      return this.createReminderInMemory(userId, dto);
    }
  }

  /**
   * Update a reminder
   */
  async updateReminder(userId: string, reminderId: string, dto: UpdateReminderDto): Promise<IReminder> {
    // Check ownership first
    await this.getReminderById(userId, reminderId);

    try {
      const updated = await this.prisma.reminder.update({
        where: { id: reminderId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.timeOfDay !== undefined ? { timeOfDay: dto.timeOfDay } : {}),
          ...(dto.daysOfWeek !== undefined ? { daysOfWeek: dto.daysOfWeek } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
          ...(dto.metadata !== undefined ? { metadata: dto.metadata as any } : {}),
        },
      });

      const formatted = this.formatReminder(updated);
      this.memoryReminders.set(reminderId, formatted);
      return formatted;
    } catch (err) {
      return this.updateReminderInMemory(userId, reminderId, dto);
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(userId: string, reminderId: string): Promise<{ success: boolean }> {
    // Check ownership first
    await this.getReminderById(userId, reminderId);

    try {
      await this.prisma.reminder.delete({
        where: { id: reminderId },
      });
      this.memoryReminders.delete(reminderId);
      return { success: true };
    } catch (err) {
      this.memoryReminders.delete(reminderId);
      return { success: true };
    }
  }

  /**
   * Snooze a reminder by specified minutes (10, 30, 60 min)
   */
  async snoozeReminder(
    userId: string,
    reminderId: string,
    minutes: number = 10,
  ): Promise<{ reminder: IReminder; snoozedUntil: string; snoozeMinutes: number }> {
    const reminder = await this.getReminderById(userId, reminderId);
    const validMinutes = [10, 30, 60].includes(minutes) ? minutes : 10;
    const snoozedUntil = new Date(Date.now() + validMinutes * 60 * 1000).toISOString();

    const existingMeta = (reminder.metadata as Record<string, any>) || {};
    const updatedMeta = {
      ...existingMeta,
      snoozedUntil,
      lastSnoozedAt: new Date().toISOString(),
      snoozeCount: (existingMeta.snoozeCount || 0) + 1,
    };

    const updated = await this.updateReminder(userId, reminderId, {
      metadata: updatedMeta,
    });

    return {
      reminder: updated,
      snoozedUntil,
      snoozeMinutes: validMinutes,
    };
  }

  /**
   * Smart Suppression Engine:
   * 1. No workout reminder on Rest Days.
   * 2. No workout reminder if workout was already completed today.
   * 3. No meal reminder if meal was already logged today.
   * 4. Suppress if currently snoozed in future.
   */
  async shouldSuppressReminder(
    userId: string,
    reminderId: string,
  ): Promise<{ shouldSuppress: boolean; reason?: string; details?: any }> {
    const reminder = await this.getReminderById(userId, reminderId);

    if (!reminder.isEnabled) {
      return { shouldSuppress: true, reason: 'REMINDER_DISABLED' };
    }

    // Check if snooze is active
    const meta = (reminder.metadata as Record<string, any>) || {};
    if (meta.snoozedUntil) {
      const snoozedUntilTime = new Date(meta.snoozedUntil).getTime();
      if (Date.now() < snoozedUntilTime) {
        return {
          shouldSuppress: true,
          reason: 'REMINDER_CURRENTLY_SNOOZED',
          details: { snoozedUntil: meta.snoozedUntil },
        };
      }
    }

    // Determine start of today in Asia/Kolkata (UTC+5:30) or system time
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const category = (reminder.category || '').toUpperCase();

    if (category === 'WORKOUT') {
      try {
        // 1. Check if workout session already completed today
        const completedSession = await this.prisma.workoutSession.findFirst({
          where: {
            userId,
            status: 'COMPLETED',
            startedAt: { gte: startOfToday },
          },
        });

        if (completedSession) {
          return {
            shouldSuppress: true,
            reason: 'WORKOUT_ALREADY_COMPLETED_TODAY',
            details: { sessionId: completedSession.id, completedAt: completedSession.completedAt },
          };
        }

        // 2. Check if today is a scheduled Rest Day in active program
        const activeAssignment = await this.prisma.programAssignment.findFirst({
          where: { athleteId: userId, isActive: true },
          include: {
            program: {
              include: {
                days: true,
              },
            },
          },
        });

        if (activeAssignment && activeAssignment.program) {
          // JavaScript getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
          // DB dayOfWeek: 1 is Monday ... 7 is Sunday
          const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
          const scheduledDay = activeAssignment.program.days.find(
            (d) => d.dayOfWeek === currentDayOfWeek,
          );

          if (!scheduledDay || scheduledDay.title?.toLowerCase().includes('rest')) {
            return {
              shouldSuppress: true,
              reason: 'TODAY_IS_REST_DAY',
              details: {
                dayOfWeek: currentDayOfWeek,
                programName: activeAssignment.program.name,
              },
            };
          }
        }
      } catch (err) {
        // In fallback or error, do not fail suppression check; let reminder through
      }
    }

    if (category === 'NUTRITION' || category === 'MEAL') {
      try {
        // Check if meal logged today
        const todayMeal = await this.prisma.dailyMealLog.findFirst({
          where: {
            userId,
            logDate: { gte: startOfToday },
          },
        });

        if (todayMeal) {
          // If already logged a meal today
          return {
            shouldSuppress: true,
            reason: 'MEAL_ALREADY_LOGGED_TODAY',
            details: { mealType: todayMeal.mealType, logDate: todayMeal.logDate },
          };
        }
      } catch (err) {
        // In fallback, allow
      }
    }

    return { shouldSuppress: false };
  }

  // --- In-memory fallback methods ---

  private getReminderByIdInMemory(userId: string, reminderId: string): IReminder {
    const reminder = this.memoryReminders.get(reminderId);
    if (!reminder) {
      throw new NotFoundException({
        code: 'REMINDER_NOT_FOUND',
        message: `Reminder with ID ${reminderId} not found`,
      });
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_REMINDER_FORBIDDEN',
        message: 'Cannot access reminder belonging to another user',
      });
    }
    return reminder;
  }

  private createReminderInMemory(userId: string, dto: CreateReminderDto): IReminder {
    const id = `rem_${crypto.randomUUID()}`;
    const newReminder: IReminder = {
      id,
      userId,
      title: dto.title,
      timeOfDay: dto.timeOfDay,
      daysOfWeek: dto.daysOfWeek || [1, 2, 3, 4, 5, 6, 7],
      category: dto.category || 'WORKOUT',
      isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
      metadata: dto.metadata || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryReminders.set(id, newReminder);
    return newReminder;
  }

  private updateReminderInMemory(userId: string, reminderId: string, dto: UpdateReminderDto): IReminder {
    const existing = this.getReminderByIdInMemory(userId, reminderId);
    const updated: IReminder = {
      ...existing,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.timeOfDay !== undefined ? { timeOfDay: dto.timeOfDay } : {}),
      ...(dto.daysOfWeek !== undefined ? { daysOfWeek: dto.daysOfWeek } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      ...(dto.metadata !== undefined ? { metadata: dto.metadata } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.memoryReminders.set(reminderId, updated);
    return updated;
  }

  private formatReminder(r: any): IReminder {
    return {
      id: r.id,
      userId: r.userId,
      title: r.title,
      timeOfDay: r.timeOfDay,
      daysOfWeek: r.daysOfWeek || [],
      category: r.category,
      isEnabled: r.isEnabled,
      metadata: r.metadata,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
