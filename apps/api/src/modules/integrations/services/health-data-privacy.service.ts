import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  IHealthPrivacyPreferences,
  IPrivacyZone,
  IGpsCoordinate,
} from '@alpha/types';
import {
  UpdateHealthPrivacyPreferencesDto,
  CreatePrivacyZoneDto,
  EnforceRetentionDto,
} from '@alpha/validation';
import { GpsPrivacyUtil, HashUtil } from '@alpha/utils';

@Injectable()
export class HealthDataPrivacyService {
  private readonly logger = new Logger(HealthDataPrivacyService.name);

  // In-memory persistent privacy preferences keyed by userId
  private readonly preferences = new Map<string, IHealthPrivacyPreferences>();

  // In-memory persistent privacy zones keyed by zoneId
  private readonly zones = new Map<string, IPrivacyZone>();

  // In-memory simulated raw telemetry and aggregate stores for retention testing
  private readonly rawTelemetrySamples: Array<{
    id: string;
    userId: string;
    recordedAt: string;
    isRawHighFrequency: boolean;
  }> = [];

  /**
   * Get user health privacy preferences or return secure defaults
   */
  async getPreferences(userId: string): Promise<IHealthPrivacyPreferences> {
    const existing = this.preferences.get(userId);
    if (existing) {
      return existing;
    }

    const defaultPrefs: IHealthPrivacyPreferences = {
      userId,
      shareSteps: true,
      shareHeartRate: true,
      shareSleep: true,
      shareWeight: true,
      shareWorkouts: true,
      shareGpsRoute: false, // Default: false to protect user location privacy from coaches/orgs
      shareProprietaryScores: true,
      trimRouteEndpoints: true, // Default: true to trim starting/ending points
      routeEndpointTrimMeters: 200, // 200m buffer
      updatedAt: new Date().toISOString(),
    };

    this.preferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Update user health privacy preferences
   */
  async updatePreferences(
    userId: string,
    dto: UpdateHealthPrivacyPreferencesDto,
  ): Promise<IHealthPrivacyPreferences> {
    const current = await this.getPreferences(userId);

    const updated: IHealthPrivacyPreferences = {
      ...current,
      ...(dto.shareSteps !== undefined && { shareSteps: dto.shareSteps }),
      ...(dto.shareHeartRate !== undefined && { shareHeartRate: dto.shareHeartRate }),
      ...(dto.shareSleep !== undefined && { shareSleep: dto.shareSleep }),
      ...(dto.shareWeight !== undefined && { shareWeight: dto.shareWeight }),
      ...(dto.shareWorkouts !== undefined && { shareWorkouts: dto.shareWorkouts }),
      ...(dto.shareGpsRoute !== undefined && { shareGpsRoute: dto.shareGpsRoute }),
      ...(dto.shareProprietaryScores !== undefined && {
        shareProprietaryScores: dto.shareProprietaryScores,
      }),
      ...(dto.trimRouteEndpoints !== undefined && {
        trimRouteEndpoints: dto.trimRouteEndpoints,
      }),
      ...(dto.routeEndpointTrimMeters !== undefined && {
        routeEndpointTrimMeters: dto.routeEndpointTrimMeters,
      }),
      updatedAt: new Date().toISOString(),
    };

    this.preferences.set(userId, updated);
    this.logger.log(`Updated privacy preferences for user [${userId}]`);
    return updated;
  }

  /**
   * Get all registered privacy zones for a user (tenant-isolated)
   */
  async getPrivacyZones(userId: string): Promise<IPrivacyZone[]> {
    const result: IPrivacyZone[] = [];
    for (const zone of this.zones.values()) {
      if (zone.userId === userId) {
        result.push(zone);
      }
    }
    return result;
  }

  /**
   * Create a new privacy zone (e.g. Home, Work) with coordinate and radius
   */
  async createPrivacyZone(
    userId: string,
    dto: CreatePrivacyZoneDto,
  ): Promise<IPrivacyZone> {
    const id = HashUtil.generateUuid();
    const zone: IPrivacyZone = {
      id,
      userId,
      name: dto.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
      radiusMeters: dto.radiusMeters ?? 500, // Default 500m radius
      createdAt: new Date().toISOString(),
    };

    this.zones.set(id, zone);
    this.logger.log(
      `Created privacy zone "${dto.name}" [${id}] for user [${userId}] (radius: ${zone.radiusMeters}m)`,
    );
    return zone;
  }

  /**
   * Delete a privacy zone
   */
  async deletePrivacyZone(userId: string, zoneId: string): Promise<boolean> {
    const zone = this.zones.get(zoneId);
    if (!zone || zone.userId !== userId) {
      throw new NotFoundException(`Privacy zone [${zoneId}] not found`);
    }

    this.zones.delete(zoneId);
    this.logger.log(`Deleted privacy zone [${zoneId}] for user [${userId}]`);
    return true;
  }

  /**
   * Filter and obfuscate GPS route coordinates:
   * 1. If accessed by a coach/organization and athlete has not enabled shareGpsRoute, return empty array.
   * 2. If endpoint trimming is enabled, trim coordinates within trim radius of start and end.
   * 3. Filter out any points inside user's privacy zones (Home, Work, etc.).
   */
  async filterAndObfuscateRoute(
    userId: string,
    coordinates: IGpsCoordinate[],
    isCoachView = false,
  ): Promise<IGpsCoordinate[]> {
    if (!coordinates || coordinates.length === 0) {
      return [];
    }

    const prefs = await this.getPreferences(userId);

    // 1. Role-based redaction: Coaches cannot view GPS coordinates if athlete opted out
    if (isCoachView && !prefs.shareGpsRoute) {
      this.logger.debug(
        `Coach view: GPS route coordinates completely redacted for user [${userId}]`,
      );
      return [];
    }

    let processed = [...coordinates];

    // 2. Trim route start & end points if enabled
    if (prefs.trimRouteEndpoints && prefs.routeEndpointTrimMeters > 0) {
      processed = GpsPrivacyUtil.trimEndpoints(
        processed,
        prefs.routeEndpointTrimMeters,
      );
    }

    // 3. Filter out any points falling within user's registered privacy zones
    const userZones = await this.getPrivacyZones(userId);
    if (userZones.length > 0) {
      processed = GpsPrivacyUtil.filterPrivacyZones(processed, userZones);
    }

    return processed;
  }

  /**
   * Filter health metrics for Coach / Organization viewing according to athlete privacy preferences
   */
  async filterMetricsForCoach<T extends { metricType: string }>(
    userId: string,
    records: T[],
  ): Promise<T[]> {
    const prefs = await this.getPreferences(userId);

    return records.filter((rec) => {
      const type = rec.metricType.toUpperCase();
      if (type.includes('STEP') && !prefs.shareSteps) return false;
      if ((type.includes('HEART') || type.includes('HR')) && !prefs.shareHeartRate) return false;
      if (type.includes('SLEEP') && !prefs.shareSleep) return false;
      if (type.includes('WEIGHT') && !prefs.shareWeight) return false;
      if ((type.includes('WORKOUT') || type.includes('ACTIVITY')) && !prefs.shareWorkouts) return false;
      if (
        (type.includes('READINESS') || type.includes('RECOVERY') || type.includes('STRAIN')) &&
        !prefs.shareProprietaryScores
      ) {
        return false;
      }
      return true;
    });
  }

  /**
   * Seed simulated raw high-frequency telemetry records (for testing retention pruning)
   */
  seedRawTelemetry(
    records: Array<{ id: string; userId: string; recordedAt: string; isRawHighFrequency: boolean }>,
  ): void {
    this.rawTelemetrySamples.push(...records);
  }

  /**
   * Get count of raw telemetry samples in store
   */
  getRawTelemetryCount(): number {
    return this.rawTelemetrySamples.length;
  }

  /**
   * Enforce retention policies: purges raw high-frequency intraday telemetry older than cutoff days
   * while preserving aggregated rollups and permanent workout records.
   */
  async enforceRetention(
    dto?: EnforceRetentionDto,
  ): Promise<{
    purgedRawCount: number;
    preservedRollupCount: number;
    cutoffDate: string;
  }> {
    const cutoffDays = dto?.rawIntradayCutoffDays ?? 90; // Default 90 days retention for raw telemetry
    const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);
    const cutoffIso = cutoffDate.toISOString();

    let purgedRawCount = 0;
    let preservedRollupCount = 0;

    const surviving: typeof this.rawTelemetrySamples = [];

    for (const sample of this.rawTelemetrySamples) {
      const sampleDate = new Date(sample.recordedAt);
      if (sample.isRawHighFrequency && sampleDate < cutoffDate) {
        purgedRawCount++;
      } else {
        surviving.push(sample);
        preservedRollupCount++;
      }
    }

    this.rawTelemetrySamples.length = 0;
    this.rawTelemetrySamples.push(...surviving);

    this.logger.log(
      `Enforced data retention: purged ${purgedRawCount} raw high-frequency samples older than ${cutoffDays} days (cutoff: ${cutoffIso}); preserved ${preservedRollupCount} records.`,
    );

    return {
      purgedRawCount,
      preservedRollupCount,
      cutoffDate: cutoffIso,
    };
  }
}
