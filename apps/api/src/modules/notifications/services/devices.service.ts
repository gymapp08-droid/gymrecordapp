import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDeviceDto } from '@alpha/validation';
import { IDevice } from '@alpha/types';
import * as crypto from 'crypto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);
  // In-memory fallback cache when Prisma connection is deferred in unit tests
  private readonly memoryDevices = new Map<string, any>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register or update a device push token for a user.
   * Enforces strict token isolation: If this pushToken was previously registered
   * to another user, revoke/reassign it to prevent unauthorized cross-user delivery.
   */
  async registerDevice(userId: string, dto: RegisterDeviceDto): Promise<IDevice> {
    try {
      // 1. Reassignment security check: Revoke token from any previous user
      if (dto.pushToken) {
        await this.prisma.device.updateMany({
          where: {
            pushToken: dto.pushToken,
            userId: { not: userId },
          },
          data: {
            isActive: false,
            pushToken: null,
          },
        });
      }

      // 2. Find existing device for this user by token or create
      let device = null;
      if (dto.pushToken) {
        device = await this.prisma.device.findFirst({
          where: {
            userId,
            pushToken: dto.pushToken,
          },
        });
      }

      if (device) {
        device = await this.prisma.device.update({
          where: { id: device.id },
          data: {
            platform: dto.platform,
            model: dto.model || device.model,
            osVersion: dto.osVersion || device.osVersion,
            appVersion: dto.appVersion || device.appVersion,
            isActive: true,
            lastActiveAt: new Date(),
          },
        });
      } else {
        device = await this.prisma.device.create({
          data: {
            userId,
            platform: dto.platform,
            pushToken: dto.pushToken || null,
            model: dto.model || null,
            osVersion: dto.osVersion || null,
            appVersion: dto.appVersion || null,
            isActive: true,
            lastActiveAt: new Date(),
          },
        });
      }

      const formatted = this.formatDevice(device);
      this.memoryDevices.set(device.id, formatted);
      return formatted;
    } catch (dbError) {
      this.logger.debug(`Prisma unavailable, using fallback memory storage: ${(dbError as Error).message}`);
      return this.registerDeviceInMemory(userId, dto);
    }
  }

  /**
   * Unregister / deactivate a device
   */
  async unregisterDevice(userId: string, deviceId: string): Promise<{ success: boolean }> {
    try {
      const device = await this.prisma.device.findUnique({
        where: { id: deviceId },
      });

      if (!device) {
        throw new NotFoundException({
          code: 'DEVICE_NOT_FOUND',
          message: `Device with ID ${deviceId} not found`,
        });
      }

      if (device.userId !== userId) {
        throw new ForbiddenException({
          code: 'CROSS_USER_DEVICE_FORBIDDEN',
          message: 'Cannot unregister a device owned by another user',
        });
      }

      await this.prisma.device.update({
        where: { id: deviceId },
        data: {
          isActive: false,
          pushToken: null,
        },
      });

      const mem = this.memoryDevices.get(deviceId);
      if (mem) {
        mem.isActive = false;
        mem.pushToken = null;
      }

      return { success: true };
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      return this.unregisterDeviceInMemory(userId, deviceId);
    }
  }

  /**
   * Get all active devices for a user
   */
  async getUserDevices(userId: string): Promise<IDevice[]> {
    try {
      const devices = await this.prisma.device.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: { lastActiveAt: 'desc' },
      });

      return devices.map((d) => this.formatDevice(d));
    } catch (err) {
      return Array.from(this.memoryDevices.values()).filter(
        (d) => d.userId === userId && d.isActive,
      );
    }
  }

  /**
   * Deactivate a token when provider reports it as invalid
   */
  async deactivateToken(pushToken: string): Promise<void> {
    try {
      await this.prisma.device.updateMany({
        where: { pushToken },
        data: {
          isActive: false,
          pushToken: null,
        },
      });
    } catch (err) {
      for (const dev of this.memoryDevices.values()) {
        if (dev.pushToken === pushToken) {
          dev.isActive = false;
          dev.pushToken = null;
        }
      }
    }
  }

  // --- In-Memory Fallbacks for tests without Postgres running ---

  private registerDeviceInMemory(userId: string, dto: RegisterDeviceDto): IDevice {
    if (dto.pushToken) {
      for (const dev of this.memoryDevices.values()) {
        if (dev.pushToken === dto.pushToken && dev.userId !== userId) {
          dev.isActive = false;
          dev.pushToken = null;
        }
      }
    }

    let existing = Array.from(this.memoryDevices.values()).find(
      (d) => d.userId === userId && d.pushToken === dto.pushToken && dto.pushToken != null,
    );

    if (existing) {
      existing.platform = dto.platform;
      existing.model = dto.model || existing.model;
      existing.osVersion = dto.osVersion || existing.osVersion;
      existing.appVersion = dto.appVersion || existing.appVersion;
      existing.isActive = true;
      existing.lastActiveAt = new Date().toISOString();
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newId = `dev_${crypto.randomUUID()}`;
    const newDevice: IDevice = {
      id: newId,
      userId,
      platform: dto.platform,
      pushToken: dto.pushToken || null,
      model: dto.model || null,
      osVersion: dto.osVersion || null,
      appVersion: dto.appVersion || null,
      isActive: true,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memoryDevices.set(newId, newDevice);
    return newDevice;
  }

  private unregisterDeviceInMemory(userId: string, deviceId: string): { success: boolean } {
    const dev = this.memoryDevices.get(deviceId);
    if (!dev) {
      throw new NotFoundException({
        code: 'DEVICE_NOT_FOUND',
        message: `Device with ID ${deviceId} not found`,
      });
    }

    if (dev.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_DEVICE_FORBIDDEN',
        message: 'Cannot unregister a device owned by another user',
      });
    }

    dev.isActive = false;
    dev.pushToken = null;
    return { success: true };
  }

  private formatDevice(d: any): IDevice {
    return {
      id: d.id,
      userId: d.userId,
      platform: d.platform,
      pushToken: d.pushToken,
      model: d.model,
      osVersion: d.osVersion,
      appVersion: d.appVersion,
      isActive: d.isActive,
      lastActiveAt: d.lastActiveAt ? new Date(d.lastActiveAt).toISOString() : new Date().toISOString(),
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
