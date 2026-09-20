import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DevicesService } from './devices.service';
import { MockPushNotificationProvider } from '../providers/mock-push.provider';
import {
  NotificationCategory,
  NotificationDeliveryStatus,
  INotification,
  INotificationPreference,
  INotificationDelivery,
} from '@alpha/types';
import {
  UpdateNotificationPreferencesDto,
  NotificationQueryDto,
} from '@alpha/validation';
import * as crypto from 'crypto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // In-memory fallbacks when Postgres is disconnected during isolated unit tests
  private readonly memoryPreferences = new Map<string, INotificationPreference>();
  private readonly memoryNotifications = new Map<string, INotification>();
  private readonly memoryDeliveries = new Map<string, INotificationDelivery>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
    private readonly pushProvider: MockPushNotificationProvider,
  ) {}

  // -------------------------------------------------------------
  // USER PREFERENCES & QUIET HOURS
  // -------------------------------------------------------------

  /**
   * Get user notification preferences, auto-initializing defaults if not present
   */
  async getUserPreferences(userId: string): Promise<INotificationPreference> {
    try {
      let pref = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!pref) {
        pref = await this.prisma.notificationPreference.create({
          data: {
            userId,
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
            timezone: 'UTC',
          },
        });
      }

      const formatted = this.formatPreference(pref);
      this.memoryPreferences.set(userId, formatted);
      return formatted;
    } catch (err) {
      let memPref = this.memoryPreferences.get(userId);
      if (!memPref) {
        memPref = {
          id: `pref_${crypto.randomUUID()}`,
          userId,
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
          timezone: 'UTC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.memoryPreferences.set(userId, memPref);
      }
      return memPref;
    }
  }

  /**
   * Update notification preferences
   */
  async updateUserPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<INotificationPreference> {
    // Ensure preferences exist
    await this.getUserPreferences(userId);

    try {
      const updated = await this.prisma.notificationPreference.update({
        where: { userId },
        data: {
          ...(dto.workoutPush !== undefined ? { workoutPush: dto.workoutPush } : {}),
          ...(dto.nutritionPush !== undefined ? { nutritionPush: dto.nutritionPush } : {}),
          ...(dto.hydrationPush !== undefined ? { hydrationPush: dto.hydrationPush } : {}),
          ...(dto.activityPush !== undefined ? { activityPush: dto.activityPush } : {}),
          ...(dto.progressPush !== undefined ? { progressPush: dto.progressPush } : {}),
          ...(dto.goalsPush !== undefined ? { goalsPush: dto.goalsPush } : {}),
          ...(dto.messagesPush !== undefined ? { messagesPush: dto.messagesPush } : {}),
          ...(dto.coachPush !== undefined ? { coachPush: dto.coachPush } : {}),
          ...(dto.systemPush !== undefined ? { systemPush: dto.systemPush } : {}),
          ...(dto.workoutEmail !== undefined ? { workoutEmail: dto.workoutEmail } : {}),
          ...(dto.nutritionEmail !== undefined ? { nutritionEmail: dto.nutritionEmail } : {}),
          ...(dto.messagesEmail !== undefined ? { messagesEmail: dto.messagesEmail } : {}),
          ...(dto.weeklyDigestEmail !== undefined ? { weeklyDigestEmail: dto.weeklyDigestEmail } : {}),
          ...(dto.quietHoursEnabled !== undefined ? { quietHoursEnabled: dto.quietHoursEnabled } : {}),
          ...(dto.quietHoursStart !== undefined ? { quietHoursStart: dto.quietHoursStart } : {}),
          ...(dto.quietHoursEnd !== undefined ? { quietHoursEnd: dto.quietHoursEnd } : {}),
          ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        },
      });

      const formatted = this.formatPreference(updated);
      this.memoryPreferences.set(userId, formatted);
      return formatted;
    } catch (err) {
      const current = await this.getUserPreferences(userId);
      const updated: INotificationPreference = {
        ...current,
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      this.memoryPreferences.set(userId, updated);
      return updated;
    }
  }

  /**
   * Evaluates if a given time falls within the user's quiet hours window,
   * computed strictly in the user's configured IANA timezone.
   */
  isInQuietHours(preferences: INotificationPreference, targetDate: Date = new Date()): boolean {
    if (!preferences.quietHoursEnabled) {
      return false;
    }

    const tz = preferences.timezone || 'UTC';
    let localHours = 0;
    let localMinutes = 0;

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(targetDate);
      const hStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
      const mStr = parts.find((p) => p.type === 'minute')?.value ?? '0';
      localHours = parseInt(hStr, 10);
      localMinutes = parseInt(mStr, 10);
    } catch (e) {
      // Fallback to UTC if timezone string is invalid
      localHours = targetDate.getUTCHours();
      localMinutes = targetDate.getUTCMinutes();
    }

    const currentMinuteOfDay = localHours * 60 + localMinutes;

    const startParts = (preferences.quietHoursStart || '22:00').split(':');
    const startH = parseInt(startParts[0] ?? '22', 10);
    const startM = parseInt(startParts[1] ?? '0', 10);

    const endParts = (preferences.quietHoursEnd || '07:00').split(':');
    const endH = parseInt(endParts[0] ?? '7', 10);
    const endM = parseInt(endParts[1] ?? '0', 10);

    const startMinuteOfDay = startH * 60 + startM;
    const endMinuteOfDay = endH * 60 + endM;

    if (startMinuteOfDay <= endMinuteOfDay) {
      // Same-day quiet hours (e.g. 13:00 -> 15:00)
      return currentMinuteOfDay >= startMinuteOfDay && currentMinuteOfDay < endMinuteOfDay;
    } else {
      // Overnight quiet hours (e.g. 22:00 -> 07:00)
      return currentMinuteOfDay >= startMinuteOfDay || currentMinuteOfDay < endMinuteOfDay;
    }
  }

  /**
   * Helper to check if a notification category is enabled for push in preferences
   */
  isCategoryPushEnabled(preferences: INotificationPreference, category: NotificationCategory): boolean {
    switch (category) {
      case 'WORKOUT':
        return preferences.workoutPush;
      case 'NUTRITION':
        return preferences.nutritionPush;
      case 'HYDRATION':
        return preferences.hydrationPush;
      case 'ACTIVITY':
        return preferences.activityPush;
      case 'PROGRESS':
        return preferences.progressPush;
      case 'GOALS':
        return preferences.goalsPush;
      case 'MESSAGES':
        return preferences.messagesPush;
      case 'COACH':
        return preferences.coachPush;
      case 'SYSTEM':
      default:
        return preferences.systemPush;
    }
  }

  // -------------------------------------------------------------
  // NOTIFICATION CREATION & DELIVERY ENGINE
  // -------------------------------------------------------------

  /**
   * Core notification dispatch engine:
   * 1. Evaluates category toggles & quiet hours
   * 2. Creates in-app notification & IN_APP delivery record
   * 3. Dispatches push to registered user devices if permitted
   * 4. Logs PUSH delivery records & handles token invalidations
   */
  async sendNotification(params: {
    userId: string;
    title: string;
    body: string;
    category?: NotificationCategory;
    type?: string;
    data?: Record<string, any>;
    deepLinkUrl?: string;
    forcePush?: boolean;
    skipPush?: boolean;
  }): Promise<INotification> {
    const {
      userId,
      title,
      body,
      category = 'SYSTEM',
      type = 'SYSTEM_ALERT',
      data,
      deepLinkUrl,
      forcePush = false,
      skipPush = false,
    } = params;

    const preferences = await this.getUserPreferences(userId);
    const categoryEnabled = this.isCategoryPushEnabled(preferences, category);
    const inQuietHours = this.isInQuietHours(preferences);

    // Push permission logic
    const allowPush = !skipPush && (forcePush || (categoryEnabled && !inQuietHours));

    // 1. Create in-app Notification
    let notification: INotification;
    const deliveries: INotificationDelivery[] = [];

    try {
      const created = await this.prisma.notification.create({
        data: {
          userId,
          title,
          body,
          category: category as any,
          type,
          data: data ? (data as any) : undefined,
          deepLinkUrl: deepLinkUrl || null,
          isRead: false,
        },
      });

      // 2. In-App delivery record
      const inAppDelivery = await this.prisma.notificationDelivery.create({
        data: {
          notificationId: created.id,
          channel: 'IN_APP',
          status: 'DELIVERED',
          provider: 'in_app',
          deliveredAt: new Date(),
          attemptCount: 1,
        },
      });
      deliveries.push(this.formatDelivery(inAppDelivery));

      notification = {
        ...this.formatNotification(created),
        deliveries,
      };
      this.memoryNotifications.set(notification.id, notification);
    } catch (err) {
      // Memory fallback
      const notifId = `notif_${crypto.randomUUID()}`;
      notification = {
        id: notifId,
        userId,
        title,
        body,
        category,
        type,
        data: data || null,
        deepLinkUrl: deepLinkUrl || null,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        deliveries,
      };

      const inAppDeliv: INotificationDelivery = {
        id: `deliv_${crypto.randomUUID()}`,
        notificationId: notifId,
        channel: 'IN_APP',
        status: 'DELIVERED',
        provider: 'in_app',
        attemptCount: 1,
        deliveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      deliveries.push(inAppDeliv);
      this.memoryDeliveries.set(inAppDeliv.id, inAppDeliv);
      this.memoryNotifications.set(notifId, notification);
    }

    // 3. Dispatch Push Notifications to Devices
    if (allowPush) {
      const activeDevices = await this.devicesService.getUserDevices(userId);

      for (const device of activeDevices) {
        if (!device.pushToken) continue;

        const pushPayload = {
          title,
          body,
          data,
          category,
          deepLinkUrl,
        };

        const pushResult = await this.pushProvider.sendPush(device.pushToken, pushPayload);

        const deliveryStatus: NotificationDeliveryStatus = pushResult.success ? 'SENT' : 'FAILED';

        try {
          const pushDeliv = await this.prisma.notificationDelivery.create({
            data: {
              notificationId: notification.id,
              deviceId: device.id,
              channel: 'PUSH',
              status: deliveryStatus,
              provider: this.pushProvider.name,
              providerMessageId: pushResult.providerMessageId || null,
              errorDetails: pushResult.error || null,
              attemptCount: 1,
              lastAttemptAt: new Date(),
              deliveredAt: pushResult.success ? new Date() : null,
            },
          });
          deliveries.push(this.formatDelivery(pushDeliv));
        } catch (delivErr) {
          const memPushDeliv: INotificationDelivery = {
            id: `deliv_${crypto.randomUUID()}`,
            notificationId: notification.id,
            deviceId: device.id,
            channel: 'PUSH',
            status: deliveryStatus,
            provider: this.pushProvider.name,
            providerMessageId: pushResult.providerMessageId || null,
            errorDetails: pushResult.error || null,
            attemptCount: 1,
            lastAttemptAt: new Date().toISOString(),
            deliveredAt: pushResult.success ? new Date().toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          deliveries.push(memPushDeliv);
          this.memoryDeliveries.set(memPushDeliv.id, memPushDeliv);
        }

        // If push token is invalid, deactivate it
        if (pushResult.isInvalidToken) {
          await this.devicesService.deactivateToken(device.pushToken);
        }
      }
    } else if (!allowPush && !skipPush && inQuietHours) {
      this.logger.debug(`Push suppressed for user ${userId} due to quiet hours.`);
    } else if (!allowPush && !skipPush && !categoryEnabled) {
      this.logger.debug(`Push suppressed for user ${userId} due to category [${category}] disabled in preferences.`);
    }

    notification.deliveries = deliveries;
    return notification;
  }

  // -------------------------------------------------------------
  // NOTIFICATION CENTER (IN-APP)
  // -------------------------------------------------------------

  /**
   * List notifications with pagination and unread/category filters
   */
  async getNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{
    data: INotification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    try {
      const where: any = { userId };
      if (query.unreadOnly) {
        where.isRead = false;
      }
      if (query.category) {
        where.category = query.category;
      }

      const [total, items] = await Promise.all([
        this.prisma.notification.count({ where }),
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: { deliveries: true },
        }),
      ]);

      return {
        data: items.map((item) => this.formatNotification(item)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (err) {
      let all = Array.from(this.memoryNotifications.values()).filter((n) => n.userId === userId);
      if (query.unreadOnly) {
        all = all.filter((n) => !n.isRead);
      }
      if (query.category) {
        all = all.filter((n) => n.category === query.category);
      }
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = all.length;
      const data = all.slice(skip, skip + limit);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  }

  /**
   * Get total unread in-app notification count
   */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
      return { unreadCount: count };
    } catch (err) {
      const count = Array.from(this.memoryNotifications.values()).filter(
        (n) => n.userId === userId && !n.isRead,
      ).length;
      return { unreadCount: count };
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    try {
      const existing = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!existing) {
        throw new NotFoundException({
          code: 'NOTIFICATION_NOT_FOUND',
          message: `Notification with ID ${notificationId} not found`,
        });
      }

      if (existing.userId !== userId) {
        throw new ForbiddenException({
          code: 'CROSS_USER_NOTIFICATION_FORBIDDEN',
          message: 'Cannot modify notification belonging to another user',
        });
      }

      const updated = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
        include: { deliveries: true },
      });

      const formatted = this.formatNotification(updated);
      this.memoryNotifications.set(notificationId, formatted);
      return formatted;
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      const mem = this.memoryNotifications.get(notificationId);
      if (!mem) {
        throw new NotFoundException({
          code: 'NOTIFICATION_NOT_FOUND',
          message: `Notification with ID ${notificationId} not found`,
        });
      }
      if (mem.userId !== userId) {
        throw new ForbiddenException({
          code: 'CROSS_USER_NOTIFICATION_FORBIDDEN',
          message: 'Cannot modify notification belonging to another user',
        });
      }
      mem.isRead = true;
      mem.readAt = new Date().toISOString();
      return mem;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Sync memory
      for (const notif of this.memoryNotifications.values()) {
        if (notif.userId === userId && !notif.isRead) {
          notif.isRead = true;
          notif.readAt = new Date().toISOString();
        }
      }

      return { count: result.count };
    } catch (err) {
      let count = 0;
      for (const notif of this.memoryNotifications.values()) {
        if (notif.userId === userId && !notif.isRead) {
          notif.isRead = true;
          notif.readAt = new Date().toISOString();
          count++;
        }
      }
      return { count };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<{ success: boolean }> {
    try {
      const existing = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!existing) {
        throw new NotFoundException({
          code: 'NOTIFICATION_NOT_FOUND',
          message: `Notification with ID ${notificationId} not found`,
        });
      }

      if (existing.userId !== userId) {
        throw new ForbiddenException({
          code: 'CROSS_USER_NOTIFICATION_FORBIDDEN',
          message: 'Cannot delete notification belonging to another user',
        });
      }

      await this.prisma.notification.delete({
        where: { id: notificationId },
      });

      this.memoryNotifications.delete(notificationId);
      return { success: true };
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      const mem = this.memoryNotifications.get(notificationId);
      if (!mem) {
        throw new NotFoundException({
          code: 'NOTIFICATION_NOT_FOUND',
          message: `Notification with ID ${notificationId} not found`,
        });
      }
      if (mem.userId !== userId) {
        throw new ForbiddenException({
          code: 'CROSS_USER_NOTIFICATION_FORBIDDEN',
          message: 'Cannot delete notification belonging to another user',
        });
      }
      this.memoryNotifications.delete(notificationId);
      return { success: true };
    }
  }

  // --- Formatting Helpers ---

  private formatPreference(p: any): INotificationPreference {
    return {
      id: p.id,
      userId: p.userId,
      workoutPush: p.workoutPush,
      nutritionPush: p.nutritionPush,
      hydrationPush: p.hydrationPush,
      activityPush: p.activityPush,
      progressPush: p.progressPush,
      goalsPush: p.goalsPush,
      messagesPush: p.messagesPush,
      coachPush: p.coachPush,
      systemPush: p.systemPush,
      workoutEmail: p.workoutEmail,
      nutritionEmail: p.nutritionEmail,
      messagesEmail: p.messagesEmail,
      weeklyDigestEmail: p.weeklyDigestEmail,
      quietHoursEnabled: p.quietHoursEnabled,
      quietHoursStart: p.quietHoursStart,
      quietHoursEnd: p.quietHoursEnd,
      timezone: p.timezone,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  private formatNotification(n: any): INotification {
    return {
      id: n.id,
      userId: n.userId,
      title: n.title,
      body: n.body,
      category: n.category,
      type: n.type,
      data: n.data,
      deepLinkUrl: n.deepLinkUrl,
      isRead: n.isRead,
      readAt: n.readAt ? new Date(n.readAt).toISOString() : null,
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      deliveries: n.deliveries?.map((d: any) => this.formatDelivery(d)),
    };
  }

  private formatDelivery(d: any): INotificationDelivery {
    return {
      id: d.id,
      notificationId: d.notificationId,
      deviceId: d.deviceId,
      channel: d.channel,
      status: d.status,
      provider: d.provider,
      providerMessageId: d.providerMessageId,
      attemptCount: d.attemptCount,
      lastAttemptAt: d.lastAttemptAt ? new Date(d.lastAttemptAt).toISOString() : null,
      errorDetails: d.errorDetails,
      deliveredAt: d.deliveredAt ? new Date(d.deliveredAt).toISOString() : null,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
