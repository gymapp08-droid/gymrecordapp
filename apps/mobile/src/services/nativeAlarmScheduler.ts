import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ApiClient } from './api';
import { SecureStorage } from './secureStorage';
import { IReminder } from '@alpha/types';

// Configure foreground notification behavior:
// Show alert, play sound, and set badge even when app is active in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const ALARM_NOTIFICATION_CHANNEL_ID = 'gravity_smart_alarms';

export interface IScheduledAlarmDetails {
  id: string;
  notificationId: string;
  title: string;
  body: string;
  category: string;
  timeOfDay: string;
  daysOfWeek: number[];
  deepLinkRoute: string;
}

class NativeAlarmSchedulerService {
  private isConfigured = false;

  /**
   * Initialize Android high-importance notification channel with sound & vibration
   */
  async initialize(): Promise<void> {
    if (this.isConfigured) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ALARM_NOTIFICATION_CHANNEL_ID, {
        name: 'GRAVITY Smart Alarms',
        description: 'Critical high-priority smart alarms for workouts and scheduled nutrition protocols',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: '#00F0FF',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        bypassDnd: true,
      });
    }

    // Register categories for interactive notification buttons (Snooze / Dismiss / Start)
    await Notifications.setNotificationCategoryAsync('GRAVITY_WORKOUT_ALARM', [
      {
        identifier: 'START_WORKOUT',
        buttonTitle: '⚡ Start Workout',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'SNOOZE_10',
        buttonTitle: '💤 Snooze 10m',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'DISMISS',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('GRAVITY_NUTRITION_ALARM', [
      {
        identifier: 'LOG_MEAL',
        buttonTitle: '🍳 Log Meal',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'SNOOZE_10',
        buttonTitle: '💤 Snooze 10m',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'DISMISS',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]);

    this.isConfigured = true;
  }

  /**
   * Request native notification and exact alarm permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      await SecureStorage.setItem('gravity_alarm_permission', finalStatus === 'granted' ? 'granted' : 'denied');
      return finalStatus === 'granted';
    } catch (err) {
      console.warn('[NativeAlarmScheduler] Permission error:', err);
      return false;
    }
  }

  /**
   * Sync active alarm schedule from backend API and program into native AlarmManager triggers
   */
  async synchronizeAndScheduleAlarms(): Promise<{ scheduledCount: number }> {
    await this.initialize();

    try {
      // 1. Fetch remote schedules from backend
      const res = await ApiClient.get<IReminder[]>('/reminders');
      let reminders: IReminder[] = [];

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        reminders = res.data;
        await SecureStorage.setItem('gravity_cached_reminders', JSON.stringify(reminders));
      } else {
        // Fallback to locally cached reminders if offline
        const cached = await SecureStorage.getItem('gravity_cached_reminders');
        if (cached) {
          reminders = JSON.parse(cached);
        } else {
          // Default system alarms if nothing has been set
          reminders = [
            {
              id: 'default_workout_alarm',
              userId: 'self',
              title: 'Morning Workout Protocol',
              timeOfDay: '06:00',
              daysOfWeek: [1, 2, 3, 4, 5, 6],
              category: 'WORKOUT',
              isEnabled: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }
      }

      // 2. Clear all previously scheduled local notifications to prevent duplicate stacking
      await Notifications.cancelAllScheduledNotificationsAsync();

      let scheduledCount = 0;

      // 3. Program native exact repeating triggers for each active alarm
      for (const reminder of reminders) {
        if (!reminder.isEnabled) continue;

        if (!reminder.timeOfDay || !reminder.timeOfDay.includes(':')) continue;
        const [hourStr, minuteStr] = reminder.timeOfDay.split(':');
        const hour = parseInt(hourStr || '0', 10);
        const minute = parseInt(minuteStr || '0', 10);

        if (isNaN(hour) || isNaN(minute)) continue;

        const isWorkout = (reminder.category || '').toUpperCase() === 'WORKOUT';
        const categoryId = isWorkout ? 'GRAVITY_WORKOUT_ALARM' : 'GRAVITY_NUTRITION_ALARM';
        const deepLink = isWorkout ? 'alpha://workouts/start' : 'alpha://nutrition/log';

        const days = reminder.daysOfWeek && reminder.daysOfWeek.length > 0
          ? reminder.daysOfWeek
          : [1, 2, 3, 4, 5, 6, 7];

        // Expo Notifications Weekly Trigger:
        // weekday: 1 = Sunday, 2 = Monday, 3 = Tuesday, ..., 7 = Saturday
        // DB convention: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
        for (const dbDay of days) {
          // Convert DB day (1=Mon..7=Sun) to Expo weekday (1=Sun, 2=Mon..7=Sat)
          const expoWeekday = dbDay === 7 ? 1 : dbDay + 1;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: reminder.title || (isWorkout ? '⚡ TIME FOR GYM!' : '🍳 NUTRITION PROTOCOL TIME'),
              body: isWorkout
                ? 'Your scheduled resistance training session is starting now. Execute with focus.'
                : 'Your metabolic nutrition window is active. Log your meal now.',
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              categoryIdentifier: categoryId,
              data: {
                reminderId: reminder.id,
                category: reminder.category,
                timeOfDay: reminder.timeOfDay,
                deepLinkUrl: deepLink,
                isAlarm: true,
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: expoWeekday,
              hour,
              minute,
              channelId: ALARM_NOTIFICATION_CHANNEL_ID,
            },
          });

          scheduledCount++;
        }
      }

      console.log(`[NativeAlarmScheduler] Successfully scheduled ${scheduledCount} native alarm triggers.`);
      return { scheduledCount };
    } catch (err) {
      console.warn('[NativeAlarmScheduler] Failed to sync and schedule alarms:', err);
      return { scheduledCount: 0 };
    }
  }

  /**
   * Schedule an instant snooze notification (e.g. 5m, 10m, 15m)
   */
  async scheduleSnoozeAlarm(reminderId: string, minutes: number = 10, title: string = 'Snoozed Alarm'): Promise<string> {
    await this.initialize();

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💤 Snooze Expired · ${title}`,
        body: 'Resume your scheduled GRAVITY protocol now.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: 'GRAVITY_WORKOUT_ALARM',
        data: {
          reminderId,
          isAlarm: true,
          isSnooze: true,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
        channelId: ALARM_NOTIFICATION_CHANNEL_ID,
      },
    });

    try {
      await ApiClient.post(`/reminders/${reminderId}/snooze`, { minutes });
    } catch {}

    return notifId;
  }
}

export const NativeAlarmScheduler = new NativeAlarmSchedulerService();
