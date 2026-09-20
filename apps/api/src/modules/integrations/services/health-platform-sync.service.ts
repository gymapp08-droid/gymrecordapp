import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  HealthPlatform,
  IntegrationConnectionState,
  INormalizedHealthRecord,
  IHealthPlatformSyncSummary,
} from '@alpha/types';
import { HealthPlatformIngestDto, HealthPlatformRecordDto } from '@alpha/validation';
import { HashUtil } from '@alpha/utils';
import { ProvenanceDeduplicationService } from './provenance-deduplication.service';

@Injectable()
export class HealthPlatformSyncService {
  private readonly logger = new Logger(HealthPlatformSyncService.name);

  // In-memory normalized health store: userId -> record[]
  private readonly normalizedRecords = new Map<string, INormalizedHealthRecord[]>();

  constructor(private readonly dedupService: ProvenanceDeduplicationService) {}

  /**
   * Range and sanity validation for incoming biometric and health metrics
   */
  private validateMetricRanges(rec: HealthPlatformRecordDto): void {
    const type = rec.metricType.toUpperCase();
    if (type === 'STEPS' && (rec.value < 0 || rec.value > 150000)) {
      throw new BadRequestException(`Unrealistic step count value: ${rec.value}`);
    }
    if (type === 'HEART_RATE' && (rec.value < 30 || rec.value > 250)) {
      throw new BadRequestException(`Unrealistic heart rate bpm: ${rec.value}`);
    }
    if (type === 'WEIGHT' && (rec.value < 20 || rec.value > 500)) {
      throw new BadRequestException(`Unrealistic body weight kg: ${rec.value}`);
    }
    if (type === 'SLEEP' && (rec.value < 0 || rec.value > 86400)) {
      throw new BadRequestException(`Unrealistic sleep duration seconds: ${rec.value}`);
    }
  }

  /**
   * Ingest, normalize, deduplicate, and persist health platform telemetry
   */
  async ingestHealthData(
    userId: string,
    dto: HealthPlatformIngestDto,
  ): Promise<IHealthPlatformSyncSummary> {
    if (
      dto.platform !== HealthPlatform.APPLE_HEALTHKIT &&
      dto.platform !== HealthPlatform.ANDROID_HEALTH_CONNECT
    ) {
      throw new BadRequestException(
        `HealthPlatformSyncService only processes mobile SDK platforms (Apple Health / Health Connect)`,
      );
    }

    let persistedCount = 0;
    let duplicatesCount = 0;
    let conflictsResolvedCount = 0;
    let latestTimestampMs = 0;

    const userStore = this.normalizedRecords.get(userId) || [];

    for (const raw of dto.records) {
      // 1. Sanity range validation
      this.validateMetricRanges(raw);

      const metricType = raw.metricType.toUpperCase();
      const recordedAtTime = new Date(raw.recordedAt).getTime();
      if (recordedAtTime > latestTimestampMs) {
        latestTimestampMs = recordedAtTime;
      }

      // 2. Deterministic deduplication check
      if (
        this.dedupService.isDuplicate(
          userId,
          metricType,
          raw.recordedAt,
          raw.sourceRecordId,
        )
      ) {
        duplicatesCount++;
        continue;
      }

      // 3. Check for conflict with existing same-metric records
      const existingSameSlot = userStore.find(
        (r) =>
          r.metricType === metricType &&
          r.recordedAt.slice(0, 10) === raw.recordedAt.slice(0, 10), // Same calendar day
      );

      let winningValue = raw.value;

      if (existingSameSlot) {
        const conflictResult = this.dedupService.resolveConflict(
          metricType,
          {
            source: existingSameSlot.provenance.sourceProvider,
            value: existingSameSlot.value,
            recordedAt: existingSameSlot.recordedAt,
            isManualInput: existingSameSlot.provenance.isManualInput,
            confidenceScore: existingSameSlot.provenance.confidenceScore,
          },
          {
            source: dto.platform,
            value: raw.value,
            recordedAt: raw.recordedAt,
            isManualInput: false,
            confidenceScore: dto.platform === HealthPlatform.APPLE_HEALTHKIT ? 0.7 : 0.65,
          },
        );

        conflictsResolvedCount++;

        if (conflictResult.winner.isManualInput && existingSameSlot.provenance.isManualInput) {
          // Manual input won; skip replacing with incoming wearable value
          continue;
        }

        winningValue = conflictResult.winner.value;
      }

      // 4. Create provenance and normalized record
      const provenance = this.dedupService.createProvenance({
        sourceProvider: dto.platform,
        sourceRecordId: raw.sourceRecordId,
        userId,
        metricType,
        recordedAt: raw.recordedAt,
        sourceTimezone: raw.sourceTimezone,
        deviceModel: dto.deviceModel,
        deviceManufacturer: dto.deviceManufacturer,
        isManualInput: false,
        confidenceScore: dto.platform === HealthPlatform.APPLE_HEALTHKIT ? 0.7 : 0.65,
      });

      const recordId = HashUtil.generateUuid();

      const normalized: INormalizedHealthRecord = {
        id: recordId,
        userId,
        platform: dto.platform,
        metricType,
        value: winningValue,
        unit: raw.unit,
        recordedAt: raw.recordedAt,
        provenance,
        metadata: {
          ...raw.metadata,
          isAlphaProgramWorkout: false, // Preserves section 31-32 rule: external != alpha program
        },
      };

      userStore.push(normalized);
      this.dedupService.registerRecord(
        userId,
        metricType,
        raw.recordedAt,
        recordId,
        raw.sourceRecordId,
      );
      persistedCount++;
    }

    this.normalizedRecords.set(userId, userStore);

    const now = new Date().toISOString();
    const newCursor = latestTimestampMs > 0 ? new Date(latestTimestampMs).toISOString() : now;

    this.logger.log(
      `Ingested ${persistedCount} records for user [${userId}] from [${dto.platform}] (${duplicatesCount} dupes, ${conflictsResolvedCount} conflicts)`,
    );

    return {
      platform: dto.platform,
      syncType: dto.syncType,
      recordsReceived: dto.records.length,
      recordsPersisted: persistedCount,
      duplicatesIgnored: duplicatesCount,
      conflictsResolved: conflictsResolvedCount,
      syncCursor: newCursor,
      syncedAt: now,
      status: IntegrationConnectionState.CONNECTED,
    };
  }

  /**
   * Get normalized health records for a user
   */
  async getNormalizedRecords(
    userId: string,
    metricType?: string,
  ): Promise<INormalizedHealthRecord[]> {
    const records = this.normalizedRecords.get(userId) || [];
    if (!metricType) return records;
    return records.filter((r) => r.metricType === metricType.toUpperCase());
  }
}
