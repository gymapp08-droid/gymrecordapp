import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';
import { DevicesService } from '../src/modules/notifications/services/devices.service';
import { RemindersService } from '../src/modules/notifications/services/reminders.service';
import { MockPushNotificationProvider } from '../src/modules/notifications/providers/mock-push.provider';
import { PrismaService } from '../src/modules/database/prisma.service';
import { INotificationPreference } from '@alpha/types';

describe('Phase 09 Gate A — Notification Foundation, Devices, Preferences & Reminders', () => {
  let notificationsService: NotificationsService;
  let devicesService: DevicesService;
  let remindersService: RemindersService;
  let mockPushProvider: MockPushNotificationProvider;

  const userA = 'usr_athlete_alpha_01';
  const userB = 'usr_athlete_beta_02';

  // In-memory data store for mock Prisma
  let devices: any[] = [];
  let notifications: any[] = [];
  let notificationDeliveries: any[] = [];
  let notificationPreferences: any[] = [];
  let reminders: any[] = [];

  const mockPrisma = {
    device: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        devices.push(item);
        return Promise.resolve(item);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const item = devices.find((d) => {
          if (where.userId && d.userId !== where.userId) return false;
          if (where.pushToken && d.pushToken !== where.pushToken) return false;
          return true;
        });
        return Promise.resolve(item || null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = devices.find((d) => d.id === where.id);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = devices;
        if (where?.userId) list = list.filter((d) => d.userId === where.userId);
        if (where?.isActive !== undefined) list = list.filter((d) => d.isActive === where.isActive);
        return Promise.resolve(list);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = devices.findIndex((d) => d.id === where.id);
        if (idx >= 0) {
          devices[idx] = { ...devices[idx], ...data, updatedAt: new Date() };
          return Promise.resolve(devices[idx]);
        }
        return Promise.resolve(null);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        devices = devices.map((d) => {
          let match = true;
          if (where.pushToken && d.pushToken !== where.pushToken) match = false;
          if (where.userId?.not && d.userId === where.userId.not) match = false;
          if (match) {
            count++;
            return { ...d, ...data, updatedAt: new Date() };
          }
          return d;
        });
        return Promise.resolve({ count });
      }),
    },
    notification: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, ...data, isRead: false, readAt: null, createdAt: new Date(), deliveries: [] };
        notifications.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = notifications.find((n) => n.id === where.id);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where, skip = 0, take = 50, include }) => {
        let list = notifications;
        if (where?.userId) list = list.filter((n) => n.userId === where.userId);
        if (where?.isRead !== undefined) list = list.filter((n) => n.isRead === where.isRead);
        if (where?.category) list = list.filter((n) => n.category === where.category);
        list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const paginated = list.slice(skip, skip + take);
        if (include?.deliveries) {
          return Promise.resolve(
            paginated.map((n) => ({
              ...n,
              deliveries: notificationDeliveries.filter((del) => del.notificationId === n.id),
            })),
          );
        }
        return Promise.resolve(paginated);
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        let list = notifications;
        if (where?.userId) list = list.filter((n) => n.userId === where.userId);
        if (where?.isRead !== undefined) list = list.filter((n) => n.isRead === where.isRead);
        if (where?.category) list = list.filter((n) => n.category === where.category);
        return Promise.resolve(list.length);
      }),
      update: jest.fn().mockImplementation(({ where, data, include }) => {
        const idx = notifications.findIndex((n) => n.id === where.id);
        if (idx >= 0) {
          notifications[idx] = { ...notifications[idx], ...data };
          const res = notifications[idx];
          if (include?.deliveries) {
            res.deliveries = notificationDeliveries.filter((del) => del.notificationId === res.id);
          }
          return Promise.resolve(res);
        }
        return Promise.resolve(null);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        notifications = notifications.map((n) => {
          let match = true;
          if (where.userId && n.userId !== where.userId) match = false;
          if (where.isRead !== undefined && n.isRead !== where.isRead) match = false;
          if (match) {
            count++;
            return { ...n, ...data };
          }
          return n;
        });
        return Promise.resolve({ count });
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        const idx = notifications.findIndex((n) => n.id === where.id);
        if (idx >= 0) {
          const deleted = notifications.splice(idx, 1)[0];
          return Promise.resolve(deleted);
        }
        return Promise.resolve(null);
      }),
    },
    notificationDelivery: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        notificationDeliveries.push(item);
        return Promise.resolve(item);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = notificationDeliveries;
        if (where?.notificationId) list = list.filter((d) => d.notificationId === where.notificationId);
        return Promise.resolve(list);
      }),
    },
    notificationPreference: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `pref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        notificationPreferences.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = notificationPreferences.find((p) => p.userId === where.userId);
        return Promise.resolve(item || null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = notificationPreferences.findIndex((p) => p.userId === where.userId);
        if (idx >= 0) {
          notificationPreferences[idx] = { ...notificationPreferences[idx], ...data, updatedAt: new Date() };
          return Promise.resolve(notificationPreferences[idx]);
        }
        return Promise.resolve(null);
      }),
    },
    reminder: {
      create: jest.fn().mockImplementation(({ data }) => {
        const item = { id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        reminders.push(item);
        return Promise.resolve(item);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = reminders.find((r) => r.id === where.id);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = reminders;
        if (where?.userId) list = list.filter((r) => r.userId === where.userId);
        return Promise.resolve(list);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = reminders.findIndex((r) => r.id === where.id);
        if (idx >= 0) {
          reminders[idx] = { ...reminders[idx], ...data, updatedAt: new Date() };
          return Promise.resolve(reminders[idx]);
        }
        return Promise.resolve(null);
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        const idx = reminders.findIndex((r) => r.id === where.id);
        if (idx >= 0) {
          const deleted = reminders.splice(idx, 1)[0];
          return Promise.resolve(deleted);
        }
        return Promise.resolve(null);
      }),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        MockPushNotificationProvider,
        DevicesService,
        RemindersService,
        NotificationsService,
      ],
    }).compile();

    notificationsService = module.get<NotificationsService>(NotificationsService);
    devicesService = module.get<DevicesService>(DevicesService);
    remindersService = module.get<RemindersService>(RemindersService);
    mockPushProvider = module.get<MockPushNotificationProvider>(MockPushNotificationProvider);
  });

  beforeEach(() => {
    mockPushProvider.clearLogs();
  });

  // =============================================================
  // 1. DEVICE REGISTRATION & PUSH TOKEN SECURITY
  // =============================================================
  describe('Device Registration & Token Isolation', () => {
    it('should register a new device for User A', async () => {
      const device = await devicesService.registerDevice(userA, {
        platform: 'IOS',
        pushToken: 'fcm_token_user_a_phone',
        model: 'iPhone 15 Pro',
        osVersion: 'iOS 17.4',
        appVersion: '1.0.0',
      });

      expect(device).toBeDefined();
      expect(device.userId).toBe(userA);
      expect(device.platform).toBe('IOS');
      expect(device.pushToken).toBe('fcm_token_user_a_phone');
      expect(device.isActive).toBe(true);

      const userADevices = await devicesService.getUserDevices(userA);
      expect(userADevices.some((d) => d.id === device.id)).toBe(true);
    });

    it('should update device metadata when re-registering with the same token', async () => {
      const updated = await devicesService.registerDevice(userA, {
        platform: 'IOS',
        pushToken: 'fcm_token_user_a_phone',
        model: 'iPhone 15 Pro Max',
        osVersion: 'iOS 17.5',
        appVersion: '1.0.1',
      });

      expect(updated.model).toBe('iPhone 15 Pro Max');
      expect(updated.osVersion).toBe('iOS 17.5');
      expect(updated.appVersion).toBe('1.0.1');
      expect(updated.isActive).toBe(true);
    });

    it('SECURITY: should reassign token and revoke previous user when same device token is registered by User B', async () => {
      const sharedToken = 'physical_device_hardware_token_999';

      // First User A registers the physical device
      const devA = await devicesService.registerDevice(userA, {
        platform: 'ANDROID',
        pushToken: sharedToken,
        model: 'Pixel 8',
      });
      expect(devA.userId).toBe(userA);
      expect(devA.isActive).toBe(true);

      // Verify User A has this active token
      let userADevices = await devicesService.getUserDevices(userA);
      expect(userADevices.some((d) => d.pushToken === sharedToken && d.isActive)).toBe(true);

      // Now User B logs into the same device and registers the same push token
      const devB = await devicesService.registerDevice(userB, {
        platform: 'ANDROID',
        pushToken: sharedToken,
        model: 'Pixel 8',
      });
      expect(devB.userId).toBe(userB);
      expect(devB.pushToken).toBe(sharedToken);
      expect(devB.isActive).toBe(true);

      // User A MUST have had their token revoked / cleared to prevent cross-user push leakage
      userADevices = await devicesService.getUserDevices(userA);
      const userAOldDev = userADevices.find((d) => d.id === devA.id);
      expect(userAOldDev?.pushToken).toBeFalsy();
    });

    it('should unregister a device on logout', async () => {
      const dev = await devicesService.registerDevice(userA, {
        platform: 'IOS',
        pushToken: 'token_to_unregister',
        model: 'iPad Air',
      });

      const res = await devicesService.unregisterDevice(userA, dev.id);
      expect(res.success).toBe(true);

      const activeDevices = await devicesService.getUserDevices(userA);
      expect(activeDevices.some((d) => d.id === dev.id)).toBe(false);
    });

    it('SECURITY: User B cannot unregister User A device', async () => {
      const devA = await devicesService.registerDevice(userA, {
        platform: 'IOS',
        pushToken: 'token_user_a_secure',
      });

      await expect(devicesService.unregisterDevice(userB, devA.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // =============================================================
  // 2. USER NOTIFICATION PREFERENCES
  // =============================================================
  describe('User Preferences & Category Management', () => {
    it('should initialize default preferences for a new user', async () => {
      const prefs = await notificationsService.getUserPreferences(userA);

      expect(prefs).toBeDefined();
      expect(prefs.userId).toBe(userA);
      expect(prefs.workoutPush).toBe(true);
      expect(prefs.nutritionPush).toBe(true);
      expect(prefs.hydrationPush).toBe(true);
      expect(prefs.activityPush).toBe(true);
      expect(prefs.messagesPush).toBe(true);
      expect(prefs.coachPush).toBe(true);
      expect(prefs.systemPush).toBe(true);
      expect(prefs.quietHoursEnabled).toBe(false);
      expect(prefs.quietHoursStart).toBe('22:00');
      expect(prefs.quietHoursEnd).toBe('07:00');
      expect(prefs.timezone).toBe('UTC');
    });

    it('should update category preferences and quiet hours settings', async () => {
      const updated = await notificationsService.updateUserPreferences(userA, {
        nutritionPush: false,
        hydrationPush: false,
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '06:30',
        timezone: 'America/New_York',
      });

      expect(updated.nutritionPush).toBe(false);
      expect(updated.hydrationPush).toBe(false);
      expect(updated.workoutPush).toBe(true); // Kept default
      expect(updated.quietHoursEnabled).toBe(true);
      expect(updated.quietHoursStart).toBe('23:00');
      expect(updated.quietHoursEnd).toBe('06:30');
      expect(updated.timezone).toBe('America/New_York');
    });
  });

  // =============================================================
  // 3. TIMEZONE-AWARE QUIET HOURS ENGINE
  // =============================================================
  describe('Timezone-Aware Quiet Hours Evaluation', () => {
    it('should return false if quietHoursEnabled is false', () => {
      const prefs: INotificationPreference = {
        id: 'pref_test',
        userId: 'u1',
        workoutPush: true,
        nutritionPush: true,
        hydrationPush: true,
        activityPush: true,
        progressPush: true,
        goalsPush: true,
        messagesPush: true,
        coachPush: true,
        systemPush: true,
        workoutEmail: false,
        nutritionEmail: false,
        messagesEmail: true,
        weeklyDigestEmail: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        timezone: 'America/New_York',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Even in the middle of the night, if disabled, quiet hours is false
      const midnightUtc = new Date('2026-09-18T04:00:00Z');
      expect(notificationsService.isInQuietHours(prefs, midnightUtc)).toBe(false);
    });

    it('should correctly evaluate overnight quiet hours in America/New_York timezone', () => {
      const prefs: INotificationPreference = {
        id: 'pref_test',
        userId: 'u1',
        workoutPush: true,
        nutritionPush: true,
        hydrationPush: true,
        activityPush: true,
        progressPush: true,
        goalsPush: true,
        messagesPush: true,
        coachPush: true,
        systemPush: true,
        workoutEmail: false,
        nutritionEmail: false,
        messagesEmail: true,
        weeklyDigestEmail: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        timezone: 'America/New_York', // UTC-4 in daylight saving / EDT
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // EDT is UTC-4:
      // 23:30 EDT is 03:30 UTC next day.
      const nightTimeEdtInUtc = new Date('2026-09-19T03:30:00Z');
      expect(notificationsService.isInQuietHours(prefs, nightTimeEdtInUtc)).toBe(true);

      // 05:00 EDT is 09:00 UTC.
      const earlyMorningEdtInUtc = new Date('2026-09-19T09:00:00Z');
      expect(notificationsService.isInQuietHours(prefs, earlyMorningEdtInUtc)).toBe(true);

      // 14:00 EDT is 18:00 UTC (daytime, outside quiet hours)
      const afternoonEdtInUtc = new Date('2026-09-19T18:00:00Z');
      expect(notificationsService.isInQuietHours(prefs, afternoonEdtInUtc)).toBe(false);
    });

    it('should correctly evaluate same-day quiet hours window (e.g. 13:00 to 15:00)', () => {
      const prefs: INotificationPreference = {
        id: 'pref_test',
        userId: 'u1',
        workoutPush: true,
        nutritionPush: true,
        hydrationPush: true,
        activityPush: true,
        progressPush: true,
        goalsPush: true,
        messagesPush: true,
        coachPush: true,
        systemPush: true,
        workoutEmail: false,
        nutritionEmail: false,
        messagesEmail: true,
        weeklyDigestEmail: true,
        quietHoursEnabled: true,
        quietHoursStart: '13:00',
        quietHoursEnd: '15:00',
        timezone: 'UTC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const inWindow = new Date('2026-09-19T14:00:00Z');
      const outWindowBefore = new Date('2026-09-19T12:30:00Z');
      const outWindowAfter = new Date('2026-09-19T15:30:00Z');

      expect(notificationsService.isInQuietHours(prefs, inWindow)).toBe(true);
      expect(notificationsService.isInQuietHours(prefs, outWindowBefore)).toBe(false);
      expect(notificationsService.isInQuietHours(prefs, outWindowAfter)).toBe(false);
    });
  });

  // =============================================================
  // 4. DISPATCH ENGINE & MULTI-CHANNEL DELIVERY
  // =============================================================
  describe('Notification Dispatch & Delivery Recording', () => {
    it('should create in-app notification and send push to active devices', async () => {
      // Ensure User A has an active device
      await devicesService.registerDevice(userA, {
        platform: 'IOS',
        pushToken: 'active_token_user_a',
      });

      // Ensure user A has push enabled for WORKOUT
      await notificationsService.updateUserPreferences(userA, {
        workoutPush: true,
        quietHoursEnabled: false,
      });

      const notif = await notificationsService.sendNotification({
        userId: userA,
        title: 'Workout Scheduled',
        body: 'Push Day starts in 15 minutes',
        category: 'WORKOUT',
        type: 'WORKOUT_REMINDER',
        deepLinkUrl: 'alpha://workouts/session/123',
      });

      expect(notif).toBeDefined();
      expect(notif.userId).toBe(userA);
      expect(notif.title).toBe('Workout Scheduled');
      expect(notif.category).toBe('WORKOUT');
      expect(notif.isRead).toBe(false);

      // Deliveries should include both IN_APP and PUSH
      expect(notif.deliveries).toBeDefined();
      expect(notif.deliveries?.some((d) => d.channel === 'IN_APP' && d.status === 'DELIVERED')).toBe(true);
      expect(notif.deliveries?.some((d) => d.channel === 'PUSH' && d.status === 'SENT')).toBe(true);

      // Verify mock provider actually received the push
      const sentLogs = mockPushProvider.getSentLogs();
      expect(sentLogs.some((l) => l.token === 'active_token_user_a' && l.payload.title === 'Workout Scheduled')).toBe(true);
    });

    it('should suppress push delivery when category is disabled in user preferences', async () => {
      // User A disabled nutritionPush earlier
      await notificationsService.updateUserPreferences(userA, {
        nutritionPush: false,
        quietHoursEnabled: false,
      });

      mockPushProvider.clearLogs();

      const notif = await notificationsService.sendNotification({
        userId: userA,
        title: 'Log Lunch',
        body: 'Remember to hit your 45g protein target',
        category: 'NUTRITION',
        type: 'MEAL_REMINDER',
      });

      // In-app is still created
      expect(notif).toBeDefined();
      expect(notif.deliveries?.some((d) => d.channel === 'IN_APP')).toBe(true);

      // Push was NOT sent
      expect(notif.deliveries?.some((d) => d.channel === 'PUSH')).toBe(false);
      expect(mockPushProvider.getSentLogs().length).toBe(0);
    });

    it('should deactivate device token if push provider reports invalid token', async () => {
      const invalidToken = 'invalid-token-expired';
      await devicesService.registerDevice(userA, {
        platform: 'ANDROID',
        pushToken: invalidToken,
      });

      // User A sends a notification that reaches the invalid token
      await notificationsService.sendNotification({
        userId: userA,
        title: 'Streak Alert',
        body: 'Keep your 7-day streak alive!',
        category: 'ACTIVITY',
        forcePush: true,
      });

      // The device with the invalid token should now be deactivated
      const activeDevices = await devicesService.getUserDevices(userA);
      expect(activeDevices.some((d) => d.pushToken === invalidToken)).toBe(false);
    });
  });

  // =============================================================
  // 5. IN-APP NOTIFICATION CENTER
  // =============================================================
  describe('In-App Notification Center (Listing, Unread Count, Mark Read)', () => {
    it('should list notifications with pagination and unread filtering', async () => {
      // Ensure at least one unread notification exists
      await notificationsService.sendNotification({
        userId: userA,
        title: 'Welcome to Alpha',
        body: 'Your journey starts today',
        category: 'SYSTEM',
      });

      const list = await notificationsService.getNotifications(userA, {
        page: 1,
        limit: 10,
        unreadOnly: true,
      });

      expect(list.data.length).toBeGreaterThan(0);
      expect(list.total).toBeGreaterThan(0);
      expect(list.data.every((n) => !n.isRead)).toBe(true);
    });

    it('should accurately calculate unread count', async () => {
      const { unreadCount } = await notificationsService.getUnreadCount(userA);
      expect(unreadCount).toBeGreaterThan(0);
    });

    it('should mark a single notification as read and update readAt', async () => {
      const listBefore = await notificationsService.getNotifications(userA, { limit: 1 });
      const targetNotif = listBefore.data[0]!;
      expect(targetNotif).toBeDefined();

      const readResult = await notificationsService.markAsRead(userA, targetNotif.id);
      expect(readResult.id).toBe(targetNotif.id);
      expect(readResult.isRead).toBe(true);
      expect(readResult.readAt).toBeDefined();
    });

    it('should mark all notifications as read', async () => {
      const result = await notificationsService.markAllAsRead(userA);
      expect(result.count).toBeGreaterThanOrEqual(0);

      const { unreadCount } = await notificationsService.getUnreadCount(userA);
      expect(unreadCount).toBe(0);
    });

    it('SECURITY: User B cannot mark User A notification as read', async () => {
      // Create fresh notification for User A
      const notifA = await notificationsService.sendNotification({
        userId: userA,
        title: 'Private message',
        body: 'Coach left a review',
        category: 'COACH',
      });

      await expect(notificationsService.markAsRead(userB, notifA.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('SECURITY: User B cannot delete User A notification', async () => {
      const notifA = await notificationsService.sendNotification({
        userId: userA,
        title: 'Confidential Alert',
        body: 'Bloodwork reminder',
        category: 'SYSTEM',
      });

      await expect(notificationsService.deleteNotification(userB, notifA.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // =============================================================
  // 6. REMINDERS ENGINE & USER ISOLATION
  // =============================================================
  describe('Reminders Engine (CRUD & Multi-Tenant Isolation)', () => {
    let createdReminderId: string;

    it('should create a reminder for User A', async () => {
      const reminder = await remindersService.createReminder(userA, {
        title: 'Morning Upper Body Session',
        timeOfDay: '08:00',
        daysOfWeek: [1, 3, 5],
        category: 'WORKOUT',
        isEnabled: true,
        metadata: { routineName: 'Hypertrophy Block 1' },
      });

      expect(reminder).toBeDefined();
      expect(reminder.userId).toBe(userA);
      expect(reminder.title).toBe('Morning Upper Body Session');
      expect(reminder.timeOfDay).toBe('08:00');
      expect(reminder.daysOfWeek).toEqual([1, 3, 5]);
      expect(reminder.isEnabled).toBe(true);

      createdReminderId = reminder.id;
    });

    it('should list reminders for User A', async () => {
      const list = await remindersService.getUserReminders(userA);
      expect(list.some((r) => r.id === createdReminderId)).toBe(true);
    });

    it('should update reminder schedule and toggle isEnabled', async () => {
      const updated = await remindersService.updateReminder(userA, createdReminderId, {
        timeOfDay: '09:30',
        isEnabled: false,
      });

      expect(updated.id).toBe(createdReminderId);
      expect(updated.timeOfDay).toBe('09:30');
      expect(updated.isEnabled).toBe(false);
    });

    it('SECURITY: User B cannot access User A reminder', async () => {
      await expect(remindersService.getReminderById(userB, createdReminderId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('SECURITY: User B cannot update User A reminder', async () => {
      await expect(
        remindersService.updateReminder(userB, createdReminderId, {
          title: 'Hacked Title',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SECURITY: User B cannot delete User A reminder', async () => {
      await expect(
        remindersService.deleteReminder(userB, createdReminderId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow User A to delete their own reminder', async () => {
      const res = await remindersService.deleteReminder(userA, createdReminderId);
      expect(res.success).toBe(true);

      await expect(remindersService.getReminderById(userA, createdReminderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
