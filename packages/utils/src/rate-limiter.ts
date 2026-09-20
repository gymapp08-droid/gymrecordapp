export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetTimeMs: number;
}

export const RATE_LIMIT_PROFILES = {
  AUTH_LOGIN: { limit: 5, windowSeconds: 60 },
  AUTH_PASSWORD_RESET: { limit: 3, windowSeconds: 300 },
  AI_CHAT: { limit: 20, windowSeconds: 60 },
  REPORTS_GENERATE: { limit: 5, windowSeconds: 60 },
  DATA_PORTABILITY_EXPORT: { limit: 3, windowSeconds: 3600 },
  GENERAL_API: { limit: 120, windowSeconds: 60 },
} as const;

interface RequestRecord {
  timestamps: number[];
}

export class RateLimiter {
  private readonly store = new Map<string, RequestRecord>();

  /**
   * Check if a request key (e.g. IP + endpoint) complies with sliding-window rate limit
   */
  check(
    key: string,
    limit: number,
    windowSeconds: number,
    nowMs = Date.now(),
  ): RateLimitStatus {
    const windowMs = windowSeconds * 1000;
    const thresholdMs = nowMs - windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Purge expired timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > thresholdMs);

    const count = record.timestamps.length;

    if (count >= limit) {
      const oldestInWindow = record.timestamps[0] ?? nowMs;
      const resetTimeMs = oldestInWindow + windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - nowMs) / 1000));

      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterSeconds,
        resetTimeMs,
      };
    }

    // Record this valid request
    record.timestamps.push(nowMs);

    return {
      allowed: true,
      limit,
      remaining: limit - record.timestamps.length,
      retryAfterSeconds: 0,
      resetTimeMs: nowMs + windowMs,
    };
  }

  /**
   * Reset limits for a specific key (e.g. after successful authentication or admin override)
   */
  reset(key: string): void {
    this.store.delete(key);
  }
}

export const globalRateLimiter = new RateLimiter();
