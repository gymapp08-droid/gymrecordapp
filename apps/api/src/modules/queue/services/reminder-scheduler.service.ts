import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from './queue.service';
import { RemindersService } from '../../notifications/services/reminders.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { IScheduleReminderJobPayload } from '@alpha/types';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly remindersService: RemindersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Evaluates reminders for a specific user at a given target instant.
   * Calculates the user's current local day-of-week and time in their configured IANA timezone,
   * then enqueues an idempotent reminder job if due.
   */
  async evaluateRemindersForUser(userId: string, targetDate: Date = new Date()): Promise<number> {
    const preferences = await this.notificationsService.getUserPreferences(userId);
    const timezone = preferences.timezone || 'UTC';

    const { localTime, dayOfWeek, localDateStr } = this.getLocalTimeParts(targetDate, timezone);

    const reminders = await this.remindersService.getUserReminders(userId);
    let scheduledCount = 0;

    for (const reminder of reminders) {
      if (!reminder.isEnabled) continue;

      // Check day of week match (reminder daysOfWeek e.g. [1,2,3,4,5,6,7] or [0..6])
      const isDayMatch =
        reminder.daysOfWeek.includes(dayOfWeek) ||
        (dayOfWeek === 7 && reminder.daysOfWeek.includes(0));

      // Check timeOfDay match ("08:00")
      const isTimeMatch = reminder.timeOfDay === localTime;

      if (isDayMatch && isTimeMatch) {
        const idempotencyKey = `rem_${reminder.id}_${localDateStr}_${reminder.timeOfDay}`;

        if (this.queueService.hasIdempotentJob(idempotencyKey)) {
          this.logger.debug(
            `[ReminderScheduler] Reminder ${reminder.id} already scheduled for ${localDateStr} ${reminder.timeOfDay}, skipping.`,
          );
          continue;
        }

        const payload: IScheduleReminderJobPayload = {
          reminderId: reminder.id,
          userId,
          title: reminder.title,
          scheduledTime: reminder.timeOfDay,
          dayOfWeek,
          category: reminder.category,
        };

        await this.queueService.addJob(
          'REMINDERS_SCHEDULE',
          `Reminder: ${reminder.title}`,
          payload,
          {
            idempotencyKey,
            maxAttempts: 3,
            backoffMs: 2000,
          },
        );

        this.logger.debug(
          `[ReminderScheduler] Enqueued reminder ${reminder.id} for user ${userId} with key ${idempotencyKey}`,
        );
        scheduledCount++;
      }
    }

    return scheduledCount;
  }

  /**
   * Extracts local time (HH:mm), day of week (1=Monday..7=Sunday), and date string (YYYY-MM-DD)
   * in the specified IANA timezone.
   */
  getLocalTimeParts(date: Date, timezone: string) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const parts = formatter.formatToParts(date);
      const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
      const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
      const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
      const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
      const month = parts.find((p) => p.type === 'month')?.value ?? '01';
      const day = parts.find((p) => p.type === 'day')?.value ?? '01';

      const dayMap: Record<string, number> = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
      };

      return {
        localTime: `${hour}:${minute}`,
        dayOfWeek: dayMap[weekday] ?? 1,
        localDateStr: `${year}-${month}-${day}`,
      };
    } catch (e) {
      const h = String(date.getUTCHours()).padStart(2, '0');
      const m = String(date.getUTCMinutes()).padStart(2, '0');
      const day = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
      const dateStr = date.toISOString().split('T')[0];
      return {
        localTime: `${h}:${m}`,
        dayOfWeek: day,
        localDateStr: dateStr,
      };
    }
  }
}
