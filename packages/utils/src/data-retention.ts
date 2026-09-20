import { IDataRetentionRule, RetentionCategory } from '@alpha/types';

export const DEFAULT_RETENTION_RULES: Record<RetentionCategory, IDataRetentionRule> = {
  RAW_TELEMETRY: {
    category: 'RAW_TELEMETRY',
    retentionDays: 90,
    action: 'PURGE',
    description: 'High-frequency raw sensor data purged after 90 days following daily aggregation',
  },
  ANALYTICS_AGGREGATES: {
    category: 'ANALYTICS_AGGREGATES',
    retentionDays: 730, // 2 years
    action: 'ARCHIVE',
    description: 'Daily and weekly performance aggregates moved to cold archive after 2 years',
  },
  SENSITIVE_PHOTOS: {
    category: 'SENSITIVE_PHOTOS',
    retentionDays: 30,
    action: 'PURGE',
    description: 'Progress and physique photos for deleted accounts permanently purged after 30-day grace period',
  },
  AUDIT_LOGS: {
    category: 'AUDIT_LOGS',
    retentionDays: 730, // 2 years
    action: 'ARCHIVE',
    description: 'Security and access audit logs preserved in immutable archive for 2 years',
  },
  INACTIVE_ACCOUNTS: {
    category: 'INACTIVE_ACCOUNTS',
    retentionDays: 365,
    action: 'ANONYMIZE',
    description: 'Accounts inactive for 12 months with no active subscription flagged for PII anonymization',
  },
};

export interface RetentionEvaluationResult {
  isExpired: boolean;
  daysRemaining: number;
  elapsedDays: number;
  actionRecommended: 'KEEP' | 'ANONYMIZE' | 'ARCHIVE' | 'PURGE';
}

export const DataRetentionUtil = {
  /**
   * Evaluate whether a data record has reached or exceeded its statutory retention window
   */
  evaluateRetentionStatus(
    createdAt: Date | string,
    rule: IDataRetentionRule,
    now: Date = new Date(),
  ): RetentionEvaluationResult {
    const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    const diffMs = now.getTime() - createdDate.getTime();
    const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, rule.retentionDays - elapsedDays);
    const isExpired = elapsedDays >= rule.retentionDays;

    return {
      isExpired,
      daysRemaining,
      elapsedDays,
      actionRecommended: isExpired ? rule.action : 'KEEP',
    };
  },
};
