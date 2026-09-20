/**
 * Exponential Backoff with Jitter Utility
 * 
 * Prevents Thundering Herd problems during retry storms on external
 * push notification gateways, webhooks, and background worker failures.
 * Reference: AWS Architecture Blog "Exponential Backoff And Jitter"
 */

export type JitterStrategy = 'FULL_JITTER' | 'EQUAL_JITTER' | 'DECORRELATED_JITTER' | 'NO_JITTER';

export interface IBackoffConfig {
  baseMs?: number;
  maxMs?: number;
  factor?: number;
  strategy?: JitterStrategy;
}

export class BackoffUtil {
  public static readonly DEFAULT_BASE_MS = 1000;
  public static readonly DEFAULT_MAX_MS = 30000;
  public static readonly DEFAULT_FACTOR = 2;

  /**
   * Calculates backoff delay with jitter
   * @param attempt 1-indexed attempt number (1, 2, 3...)
   * @param config configuration options
   */
  public static computeBackoff(attempt: number, config?: IBackoffConfig): number {
    const base = config?.baseMs ?? BackoffUtil.DEFAULT_BASE_MS;
    const max = config?.maxMs ?? BackoffUtil.DEFAULT_MAX_MS;
    const factor = config?.factor ?? BackoffUtil.DEFAULT_FACTOR;
    const strategy = config?.strategy ?? 'FULL_JITTER';

    if (attempt <= 0) return 0;

    // Standard capped exponential: min(max, base * factor^(attempt - 1))
    const exponentialCap = Math.min(max, base * Math.pow(factor, attempt - 1));

    switch (strategy) {
      case 'FULL_JITTER':
        // Sleep = rand(0, min(max, base * 2^attempt))
        return Math.floor(Math.random() * exponentialCap);

      case 'EQUAL_JITTER':
        // Half deterministic, half random: Sleep = (exponential / 2) + rand(0, exponential / 2)
        const half = exponentialCap / 2;
        return Math.floor(half + Math.random() * half);

      case 'DECORRELATED_JITTER':
        // Sleep = min(max, rand(base, previousSleep * 3))
        const decorrelated = base + Math.random() * (exponentialCap * 1.5 - base);
        return Math.floor(Math.min(max, decorrelated));

      case 'NO_JITTER':
      default:
        return Math.floor(exponentialCap);
    }
  }

  /**
   * Sleeps asynchronously for the calculated jittered backoff delay
   */
  public static async sleepWithBackoff(attempt: number, config?: IBackoffConfig): Promise<number> {
    const delayMs = BackoffUtil.computeBackoff(attempt, config);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return delayMs;
  }
}
