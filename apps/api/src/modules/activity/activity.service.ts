import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HashUtil } from '@alpha/utils';
import {
  CardioType,
  ActivitySource,
  HeartRateZone,
  ICardioSession,
  IActivityRecord,
  IDailyActivitySummary,
  HealthPlatform,
  HealthConnectionStatus,
} from '@alpha/types';
import {
  CreateCardioSessionDto,
  UpdateCardioSessionDto,
  LogManualActivityDto,
  SyncHealthDataDto,
} from '@alpha/validation';

export interface StoredHealthConnection {
  id: string;
  userId: string;
  platform: HealthPlatform;
  status: HealthConnectionStatus;
  permissions: string[];
  lastSyncAt: Date | null;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  // In-memory stores with strict multi-tenant isolation
  private readonly activityRecords = new Map<string, IActivityRecord>();
  private readonly cardioSessions = new Map<string, ICardioSession>();
  private readonly healthConnections = new Map<string, StoredHealthConnection>();

  // -------------------------------------------------------------
  // 1. DETERMINISTIC CALCULATIONS & PACE ENGINE
  // -------------------------------------------------------------

  public calculatePaceAndSpeed(
    distanceMeters: number,
    durationSeconds: number
  ): {
    distanceKm: number;
    avgPaceSecondsPerKm: number;
    formattedPace: string;
    avgSpeedKmh: number;
  } {
    if (distanceMeters <= 0 || durationSeconds <= 0) {
      return {
        distanceKm: 0,
        avgPaceSecondsPerKm: 0,
        formattedPace: '0:00 / km',
        avgSpeedKmh: 0,
      };
    }

    const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;
    const avgPaceSecondsPerKm = Math.round(durationSeconds / distanceKm);

    // Format pace as MM:SS / km
    const paceMinutes = Math.floor(avgPaceSecondsPerKm / 60);
    const paceSecs = avgPaceSecondsPerKm % 60;
    const formattedPace = `${paceMinutes}:${paceSecs.toString().padStart(2, '0')} / km`;

    // Speed in km/h
    const hours = durationSeconds / 3600;
    const avgSpeedKmh = Math.round((distanceKm / hours) * 10) / 10;

    return {
      distanceKm,
      avgPaceSecondsPerKm,
      formattedPace,
      avgSpeedKmh,
    };
  }

  public calculateHeartRateZones(
    maxHeartRate: number
  ): Record<HeartRateZone, { minBpm: number; maxBpm: number }> {
    if (maxHeartRate < 100 || maxHeartRate > 240) {
      throw new BadRequestException({
        code: 'INVALID_MAX_HR',
        message: 'Max heart rate must be between 100 and 240 bpm',
      });
    }

    return {
      [HeartRateZone.ZONE_1_RECOVERY]: {
        minBpm: Math.round(maxHeartRate * 0.5),
        maxBpm: Math.round(maxHeartRate * 0.6) - 1,
      },
      [HeartRateZone.ZONE_2_AEROBIC]: {
        minBpm: Math.round(maxHeartRate * 0.6),
        maxBpm: Math.round(maxHeartRate * 0.7) - 1,
      },
      [HeartRateZone.ZONE_3_TEMPO]: {
        minBpm: Math.round(maxHeartRate * 0.7),
        maxBpm: Math.round(maxHeartRate * 0.8) - 1,
      },
      [HeartRateZone.ZONE_4_THRESHOLD]: {
        minBpm: Math.round(maxHeartRate * 0.8),
        maxBpm: Math.round(maxHeartRate * 0.9) - 1,
      },
      [HeartRateZone.ZONE_5_ANAEROBIC]: {
        minBpm: Math.round(maxHeartRate * 0.9),
        maxBpm: maxHeartRate,
      },
    };
  }

  // -------------------------------------------------------------
  // 2. DAILY ACTIVITY & MANUAL ENTRY
  // -------------------------------------------------------------

  async getDailySummary(
    userId: string,
    dateStr?: string
  ): Promise<IDailyActivitySummary> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0]!;

    // Find activity record for this date
    const records = Array.from(this.activityRecords.values()).filter(
      (r) => r.userId === userId && r.date === targetDate
    );

    // Merge or pick highest priority source (APPLE_HEALTH/HEALTH_CONNECT over MANUAL)
    let stepCount = 0;
    let activeMinutes = 0;
    let distanceKm = 0;
    let activeCalories = 0;
    let source = ActivitySource.MANUAL;

    if (records.length > 0) {
      // Pick health platform record if present, else manual
      const primaryRecord =
        records.find(
          (r) =>
            r.source === ActivitySource.APPLE_HEALTH ||
            r.source === ActivitySource.HEALTH_CONNECT
        ) || records[0]!;

      stepCount = primaryRecord.stepCount;
      activeMinutes = primaryRecord.activeMinutes;
      distanceKm = primaryRecord.distanceKm;
      activeCalories = primaryRecord.activeCalories;
      source = primaryRecord.source;
    }

    // Cardio sessions on this date
    const cardioList = await this.getCardioSessions(userId, targetDate);
    const cardioDistanceMeters = cardioList.reduce(
      (acc, curr) => acc + (curr.distanceMeters || 0),
      0
    );
    const cardioDurationSeconds = cardioList.reduce(
      (acc, curr) => acc + curr.durationSeconds,
      0
    );

    const stepTarget = 10000;
    const activeMinutesTarget = 45;
    const stepProgressPercent = Math.min(
      100,
      Math.round((stepCount / stepTarget) * 100)
    );

    return {
      date: targetDate,
      stepCount,
      stepTarget,
      stepProgressPercent,
      distanceKm,
      activeMinutes,
      activeMinutesTarget,
      activeCalories,
      cardioSessionsCount: cardioList.length,
      cardioDurationSeconds,
      cardioDistanceMeters,
      cardioSessions: cardioList,
      source,
    };
  }

  async logManualActivity(
    userId: string,
    dto: LogManualActivityDto
  ): Promise<IActivityRecord> {
    const recordKey = `${userId}_${dto.date}_MANUAL`;
    const now = new Date();

    const distanceKm =
      dto.distanceKm !== undefined
        ? dto.distanceKm
        : Math.round(((dto.stepCount * 0.75) / 1000) * 100) / 100;

    const activeMinutes =
      dto.activeMinutes !== undefined
        ? dto.activeMinutes
        : Math.round(dto.stepCount / 100);

    const record: IActivityRecord = {
      id: HashUtil.generateUuid(),
      userId,
      date: dto.date,
      stepCount: dto.stepCount,
      distanceKm,
      activeMinutes,
      activeCalories: dto.activeCalories || 0,
      source: ActivitySource.MANUAL,
      createdAt: now,
      updatedAt: now,
    };

    this.activityRecords.set(recordKey, record);
    this.logger.log(`Logged manual activity for user [${userId}] date [${dto.date}]`);
    return record;
  }

  // -------------------------------------------------------------
  // 3. CARDIO SESSIONS ENGINE
  // -------------------------------------------------------------

  async getCardioSessions(
    userId: string,
    dateStr?: string
  ): Promise<ICardioSession[]> {
    let list = Array.from(this.cardioSessions.values()).filter(
      (s) => s.userId === userId
    );

    if (dateStr) {
      list = list.filter(
        (s) => s.startedAt.toISOString().split('T')[0] === dateStr
      );
    }

    return list.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async getCardioSessionById(
    userId: string,
    sessionId: string
  ): Promise<ICardioSession> {
    const session = this.cardioSessions.get(sessionId);
    if (!session) {
      throw new NotFoundException({
        code: 'CARDIO_SESSION_NOT_FOUND',
        message: 'Cardio session not found',
      });
    }

    // Strict User Isolation
    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied: You are not authorized to view this cardio session',
      });
    }

    return session;
  }

  async createCardioSession(
    userId: string,
    dto: CreateCardioSessionDto
  ): Promise<ICardioSession> {
    // Idempotent deduplication check
    if (dto.sourceRecordId) {
      const existing = Array.from(this.cardioSessions.values()).find(
        (s) =>
          s.userId === userId &&
          s.source === (dto.source || ActivitySource.MANUAL) &&
          s.sourceRecordId === dto.sourceRecordId
      );
      if (existing) {
        this.logger.log(`Idempotent deduplication matched existing cardio session [${existing.id}]`);
        return existing;
      }
    }

    const id = 'cardio_' + HashUtil.generateUuid();
    const now = new Date();
    const startedAt = new Date(dto.startedAt);
    const completedAt = new Date(startedAt.getTime() + dto.durationSeconds * 1000);

    let avgPaceSecondsPerKm: number | null = null;
    let avgSpeedKmh: number | null = null;

    if (dto.distanceMeters && dto.distanceMeters > 0) {
      const calculated = this.calculatePaceAndSpeed(
        dto.distanceMeters,
        dto.durationSeconds
      );
      avgPaceSecondsPerKm = calculated.avgPaceSecondsPerKm;
      avgSpeedKmh = calculated.avgSpeedKmh;
    }

    const session: ICardioSession = {
      id,
      userId,
      activityType: dto.activityType,
      startedAt,
      completedAt,
      durationSeconds: dto.durationSeconds,
      distanceMeters: dto.distanceMeters || null,
      avgPaceSecondsPerKm,
      avgSpeedKmh,
      avgHeartRate: dto.avgHeartRate || null,
      maxHeartRate: dto.maxHeartRate || null,
      activeCalories: dto.activeCalories || null,
      isManual: dto.source === ActivitySource.MANUAL || !dto.source,
      source: dto.source || ActivitySource.MANUAL,
      sourceRecordId: dto.sourceRecordId || null,
      notes: dto.notes || null,
      createdAt: now,
      updatedAt: now,
    };

    this.cardioSessions.set(id, session);
    this.logger.log(`Created cardio session [${id}] for user [${userId}]`);
    return session;
  }

  async updateCardioSession(
    userId: string,
    id: string,
    dto: UpdateCardioSessionDto
  ): Promise<ICardioSession> {
    const session = await this.getCardioSessionById(userId, id);

    if (dto.notes !== undefined) session.notes = dto.notes;
    if (dto.distanceMeters !== undefined) {
      session.distanceMeters = dto.distanceMeters;
      const calculated = this.calculatePaceAndSpeed(
        dto.distanceMeters,
        session.durationSeconds
      );
      session.avgPaceSecondsPerKm = calculated.avgPaceSecondsPerKm;
      session.avgSpeedKmh = calculated.avgSpeedKmh;
    }
    if (dto.durationSeconds !== undefined) {
      session.durationSeconds = dto.durationSeconds;
      if (session.distanceMeters && session.distanceMeters > 0) {
        const calculated = this.calculatePaceAndSpeed(
          session.distanceMeters,
          dto.durationSeconds
        );
        session.avgPaceSecondsPerKm = calculated.avgPaceSecondsPerKm;
        session.avgSpeedKmh = calculated.avgSpeedKmh;
      }
    }

    session.updatedAt = new Date();
    return session;
  }

  async deleteCardioSession(userId: string, id: string): Promise<void> {
    await this.getCardioSessionById(userId, id);
    this.cardioSessions.delete(id);
    this.logger.log(`Deleted cardio session [${id}] for user [${userId}]`);
  }

  // -------------------------------------------------------------
  // 4. IDEMPOTENT HEALTH SYNC & DEDUPLICATION ENGINE
  // -------------------------------------------------------------

  async syncHealthData(
    userId: string,
    dto: SyncHealthDataDto
  ): Promise<{
    syncedCount: number;
    duplicatesIgnored: number;
  }> {
    let syncedCount = 0;
    let duplicatesIgnored = 0;
    const now = new Date();

    const activitySource =
      dto.platform === HealthPlatform.APPLE_HEALTHKIT
        ? ActivitySource.APPLE_HEALTH
        : ActivitySource.HEALTH_CONNECT;

    for (const rec of dto.records) {
      if (rec.type === 'STEPS') {
        const key = `${userId}_${rec.date}_${activitySource}`;
        const existing = this.activityRecords.get(key);

        if (existing) {
          // Idempotent update without double-counting
          existing.stepCount = Math.max(existing.stepCount, rec.stepCount || 0);
          if (rec.distanceMeters) {
            existing.distanceKm = Math.round((rec.distanceMeters / 1000) * 100) / 100;
          }
          if (rec.calories) existing.activeCalories = rec.calories;
          existing.updatedAt = now;
          duplicatesIgnored++;
        } else {
          const distanceKm = rec.distanceMeters
            ? Math.round((rec.distanceMeters / 1000) * 100) / 100
            : 0;

          this.activityRecords.set(key, {
            id: HashUtil.generateUuid(),
            userId,
            date: rec.date,
            stepCount: rec.stepCount || 0,
            distanceKm,
            activeMinutes: Math.round((rec.stepCount || 0) / 100),
            activeCalories: rec.calories || 0,
            source: activitySource,
            createdAt: now,
            updatedAt: now,
          });
          syncedCount++;
        }
      } else if (rec.type === 'CARDIO') {
        // Deduplicate cardio by sourceRecordId
        const existing = Array.from(this.cardioSessions.values()).find(
          (s) =>
            s.userId === userId &&
            s.source === activitySource &&
            s.sourceRecordId === rec.sourceRecordId
        );

        if (existing) {
          duplicatesIgnored++;
        } else {
          await this.createCardioSession(userId, {
            activityType: rec.cardioType || CardioType.RUNNING,
            startedAt: rec.date,
            durationSeconds: rec.durationSeconds || 1800,
            distanceMeters: rec.distanceMeters,
            avgHeartRate: rec.avgHeartRate,
            maxHeartRate: rec.maxHeartRate,
            activeCalories: rec.calories,
            source: activitySource,
            sourceRecordId: rec.sourceRecordId,
          });
          syncedCount++;
        }
      }
    }

    // Update connection lastSyncAt
    const connKey = `${userId}_${dto.platform}`;
    const conn = this.healthConnections.get(connKey);
    if (conn) {
      conn.status = HealthConnectionStatus.CONNECTED;
      conn.lastSyncAt = now;
    } else {
      this.healthConnections.set(connKey, {
        id: HashUtil.generateUuid(),
        userId,
        platform: dto.platform,
        status: HealthConnectionStatus.CONNECTED,
        permissions: ['READ_STEPS', 'READ_DISTANCE', 'READ_WORKOUTS'],
        lastSyncAt: now,
      });
    }

    this.logger.log(
      `Health sync completed for user [${userId}]: ${syncedCount} ingested, ${duplicatesIgnored} duplicates ignored`
    );

    return { syncedCount, duplicatesIgnored };
  }

  async getHealthConnections(userId: string): Promise<StoredHealthConnection[]> {
    return Array.from(this.healthConnections.values()).filter((c) => c.userId === userId);
  }
}
