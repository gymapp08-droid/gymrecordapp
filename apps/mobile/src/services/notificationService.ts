import { Alert } from 'react-native';
import { SecureStorage } from './secureStorage';
import { ApiClient } from './api';

export interface IReminderConfig {
  workoutReminderEnabled: boolean;
  workoutReminderTime: string; // "06:00"
  mealRemindersEnabled: boolean;
  mealReminderTimes: {
    breakfast: string; // "08:00"
    midMorning: string; // "11:00"
    lunch: string; // "14:00"
    snack: string; // "17:00"
    dinner: string; // "20:00"
  };
  hydrationReminderEnabled: boolean;
  hydrationIntervalHours: number; // 2
  weeklyCheckInEnabled: boolean;
  weeklyCheckInDay: number; // 7 = Sunday
  weeklyCheckInTime: string; // "09:00"
  snoozeMinutes: number; // 10, 30, 60
  timezone: string; // "Asia/Kolkata"
}

export const DEFAULT_REMINDER_CONFIG: IReminderConfig = {
  workoutReminderEnabled: true,
  workoutReminderTime: '06:00',
  mealRemindersEnabled: true,
  mealReminderTimes: {
    breakfast: '08:00',
    midMorning: '11:00',
    lunch: '14:00',
    snack: '17:00',
    dinner: '20:00',
  },
  hydrationReminderEnabled: true,
  hydrationIntervalHours: 2,
  weeklyCheckInEnabled: true,
  weeklyCheckInDay: 7, // Sunday
  weeklyCheckInTime: '09:00',
  snoozeMinutes: 10,
  timezone: 'Asia/Kolkata',
};

class SmartNotificationService {
  private config: IReminderConfig = { ...DEFAULT_REMINDER_CONFIG };
  private permissionsGranted = false;
  private hasPromptedPermissions = false;

  constructor() {
    this.loadConfig();
  }

  /**
   * Load saved reminder configuration from local secure storage
   */
  async loadConfig(): Promise<IReminderConfig> {
    try {
      const stored = await SecureStorage.getItem('alpha_reminder_config');
      if (stored) {
        this.config = { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(stored) };
      }
      const perm = await SecureStorage.getItem('alpha_notif_permission');
      this.permissionsGranted = perm === 'granted';
      const prompted = await SecureStorage.getItem('alpha_notif_prompted');
      this.hasPromptedPermissions = prompted === 'true';
    } catch (e) {
      console.warn('Failed to load reminder config:', e);
    }
    return this.config;
  }

  /**
   * Save reminder configuration
   */
  async saveConfig(newConfig: Partial<IReminderConfig>): Promise<IReminderConfig> {
    this.config = { ...this.config, ...newConfig };
    await SecureStorage.setItem('alpha_reminder_config', JSON.stringify(this.config));
    return this.config;
  }

  /**
   * Check current permission status
   */
  isPermissionGranted(): boolean {
    return this.permissionsGranted;
  }

  hasPrompted(): boolean {
    return this.hasPromptedPermissions;
  }

  /**
   * Permission flow: explains purpose upfront without repeated nagging
   */
  async requestNotificationPermissions(): Promise<boolean> {
    if (this.permissionsGranted) return true;

    return new Promise((resolve) => {
      Alert.alert(
        'ALPHA Smart Reminders & Alarms',
        'Enable timely notifications for your morning workouts (06:00 AM), 5 meal check-ins, hydration, and Sunday progress reviews. ALPHA automatically suppresses alarms on Rest Days or when tasks are already logged.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: async () => {
              await SecureStorage.setItem('alpha_notif_prompted', 'true');
              await SecureStorage.setItem('alpha_notif_permission', 'denied');
              this.permissionsGranted = false;
              this.hasPromptedPermissions = true;
              resolve(false);
            },
          },
          {
            text: 'Enable Alarms',
            onPress: async () => {
              await SecureStorage.setItem('alpha_notif_prompted', 'true');
              await SecureStorage.setItem('alpha_notif_permission', 'granted');
              this.permissionsGranted = true;
              this.hasPromptedPermissions = true;
              resolve(true);
            },
          },
        ],
      );
    });
  }

  /**
   * Smart Suppression Engine:
   * Returns true if notification should be suppressed
   */
  async shouldSuppress(category: 'WORKOUT' | 'MEAL' | 'CHECKIN', context?: { isRestDay?: boolean; isCompleted?: boolean }): Promise<{ suppress: boolean; reason?: string }> {
    // 1. Check if category is enabled in config
    if (category === 'WORKOUT' && !this.config.workoutReminderEnabled) {
      return { suppress: true, reason: 'Workout reminders disabled in settings' };
    }
    if (category === 'MEAL' && !this.config.mealRemindersEnabled) {
      return { suppress: true, reason: 'Meal reminders disabled in settings' };
    }
    if (category === 'CHECKIN' && !this.config.weeklyCheckInEnabled) {
      return { suppress: true, reason: 'Weekly check-in reminders disabled in settings' };
    }

    // 2. Workout Smart Suppression:
    // If today is a rest day, suppress workout alarm
    if (category === 'WORKOUT') {
      if (context?.isRestDay) {
        return { suppress: true, reason: 'Rest Day active: Workout reminder suppressed' };
      }
      if (context?.isCompleted) {
        return { suppress: true, reason: 'Workout already completed today' };
      }
    }

    // 3. Meal Smart Suppression:
    if (category === 'MEAL' && context?.isCompleted) {
      return { suppress: true, reason: 'Meal already logged for this time slot' };
    }

    return { suppress: false };
  }

  /**
   * Snooze a reminder for 10m, 30m, or 1h
   */
  async snoozeReminder(reminderId: string, minutes: number = 10): Promise<{ snoozedUntil: string; minutes: number }> {
    const validMinutes = [10, 30, 60].includes(minutes) ? minutes : this.config.snoozeMinutes;
    const snoozedUntil = new Date(Date.now() + validMinutes * 60 * 1000).toISOString();

    try {
      // Sync snooze with backend API
      await ApiClient.post(`/reminders/${reminderId}/snooze`, { minutes: validMinutes });
    } catch (e) {
      // Local snooze ok
    }

    return { snoozedUntil, minutes: validMinutes };
  }

  /**
   * Get active config
   */
  getConfig(): IReminderConfig {
    return { ...this.config };
  }
}

export const NotificationService = new SmartNotificationService();
