import { Injectable, Logger } from '@nestjs/common';
import {
  HealthPlatform,
  DataSourceProvenance,
  ConflictResolutionStrategy,
  IConflictResolutionPolicy,
} from '@alpha/types';
import {
  DeduplicationUtil,
  MetricConflictCandidate,
  SOURCE_PRIORITY_MAP,
} from '@alpha/utils';

@Injectable()
export class ProvenanceDeduplicationService {
  private readonly logger = new Logger(ProvenanceDeduplicationService.name);

  // In-memory dedup index: map dedupKey -> canonical record id
  private readonly dedupIndex = new Map<string, string>();

  // Defined conflict policies per metric domain
  private readonly conflictPolicies: Record<string, IConflictResolutionPolicy> = {
    STRENGTH_WORKOUT: {
      metricType: 'STRENGTH_WORKOUT',
      strategy: 'MANUAL_OVERRIDE',
      description: 'Alpha strength workouts and manual logs always override imported external sessions',
    },
    BODY_WEIGHT: {
      metricType: 'BODY_WEIGHT',
      strategy: 'MANUAL_OVERRIDE',
      description: 'Manual weigh-ins take precedence over passive smart scale imports unless explicitly chosen',
    },
    STEPS: {
      metricType: 'STEPS',
      strategy: 'MAX_VALUE',
      description: 'Highest verified step count across phone and wearable sensors is retained to prevent undercounting',
    },
    HEART_RATE: {
      metricType: 'HEART_RATE',
      strategy: 'HIGHER_CONFIDENCE',
      description: 'Continuous optical/ECG wearable sensors take precedence over intermittent phone samples',
    },
    HRV: {
      metricType: 'HRV',
      strategy: 'HIGHER_CONFIDENCE',
      description: 'Dedicated recovery trackers (Whoop, Oura, Garmin) take precedence over general sources',
    },
    SLEEP: {
      metricType: 'SLEEP',
      strategy: 'HIGHER_CONFIDENCE',
      description: 'Polysomnography-tuned sleep trackers (Oura, Whoop) take precedence over phone motion sensors',
    },
    RECOVERY_SCORE: {
      metricType: 'RECOVERY_SCORE',
      strategy: 'HIGHER_CONFIDENCE',
      description: 'Dedicated readiness/recovery engines take priority over generic estimations',
    },
  };

  /**
   * Create immutable source provenance object for an imported data point
   */
  createProvenance(params: {
    sourceProvider: HealthPlatform | 'MANUAL' | 'SYSTEM';
    sourceRecordId: string;
    userId: string;
    metricType: string;
    recordedAt: string;
    sourceTimezone?: string;
    syncJobId?: string;
    deviceModel?: string;
    deviceManufacturer?: string;
    isManualInput?: boolean;
    confidenceScore?: number;
  }): DataSourceProvenance {
    const isManual = params.isManualInput ?? params.sourceProvider === 'MANUAL';
    const defaultConfidence = (SOURCE_PRIORITY_MAP[params.sourceProvider] ?? 50) / 100;

    return {
      sourceProvider: params.sourceProvider,
      sourceRecordId: params.sourceRecordId,
      userId: params.userId,
      metricType: params.metricType,
      recordedAt: params.recordedAt,
      sourceTimezone: params.sourceTimezone,
      importedAt: new Date().toISOString(),
      syncJobId: params.syncJobId,
      deviceModel: params.deviceModel,
      deviceManufacturer: params.deviceManufacturer,
      isManualInput: isManual,
      confidenceScore: params.confidenceScore ?? defaultConfidence,
    };
  }

  /**
   * Compute deterministic deduplication key for a record
   */
  getDedupKey(
    userId: string,
    metricType: string,
    recordedAt: string,
    sourceRecordId?: string,
  ): string {
    return DeduplicationUtil.generateDedupKey(
      userId,
      metricType,
      recordedAt,
      sourceRecordId,
    );
  }

  /**
   * Check whether a record has already been ingested
   */
  isDuplicate(
    userId: string,
    metricType: string,
    recordedAt: string,
    sourceRecordId?: string,
  ): boolean {
    const key = this.getDedupKey(userId, metricType, recordedAt, sourceRecordId);
    return this.dedupIndex.has(key);
  }

  /**
   * Register a newly ingested record in the deduplication index
   */
  registerRecord(
    userId: string,
    metricType: string,
    recordedAt: string,
    recordId: string,
    sourceRecordId?: string,
  ): void {
    const key = this.getDedupKey(userId, metricType, recordedAt, sourceRecordId);
    this.dedupIndex.set(key, recordId);
  }

  /**
   * Resolve conflict between two records based on domain policy
   */
  resolveConflict(
    metricType: string,
    existing: MetricConflictCandidate,
    incoming: MetricConflictCandidate,
  ): {
    winner: MetricConflictCandidate;
    reason: string;
    strategy: ConflictResolutionStrategy;
  } {
    const policy = this.conflictPolicies[metricType] || {
      metricType,
      strategy: 'HIGHER_CONFIDENCE' as ConflictResolutionStrategy,
      description: 'Default priority/confidence strategy',
    };

    const result = DeduplicationUtil.resolveConflict(
      existing,
      incoming,
      policy.strategy,
    );

    this.logger.debug(
      `Conflict resolved for [${metricType}]: winner is [${result.winner.source}] (${result.reason})`,
    );

    return {
      winner: result.winner,
      reason: result.reason,
      strategy: policy.strategy,
    };
  }

  /**
   * Get conflict resolution policy for a metric
   */
  getPolicy(metricType: string): IConflictResolutionPolicy | undefined {
    return this.conflictPolicies[metricType];
  }
}
