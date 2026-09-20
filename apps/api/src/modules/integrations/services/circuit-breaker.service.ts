import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  HealthPlatform,
  CircuitBreakerState,
  ICircuitBreakerStatus,
} from '@alpha/types';

interface ICircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  consecutiveSuccessesToClose: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  private readonly defaultConfig: ICircuitBreakerConfig = {
    failureThreshold: 3, // 3 consecutive or accumulated failures trip breaker
    resetTimeoutMs: 30000, // 30 seconds before testing recovery
    consecutiveSuccessesToClose: 2, // 2 consecutive successful probes to close
  };

  private readonly breakers = new Map<
    HealthPlatform,
    {
      state: CircuitBreakerState;
      failureCount: number;
      consecutiveSuccesses: number;
      lastFailureTime: string | null;
      lastStateChange: string;
      config: ICircuitBreakerConfig;
    }
  >();

  constructor() {
    // Initialize breakers for all platforms
    for (const platform of Object.values(HealthPlatform)) {
      this.initBreaker(platform);
    }
  }

  private initBreaker(platform: HealthPlatform, config?: Partial<ICircuitBreakerConfig>) {
    this.breakers.set(platform, {
      state: 'CLOSED',
      failureCount: 0,
      consecutiveSuccesses: 0,
      lastFailureTime: null,
      lastStateChange: new Date().toISOString(),
      config: { ...this.defaultConfig, ...config },
    });
  }

  private getBreaker(platform: HealthPlatform) {
    let breaker = this.breakers.get(platform);
    if (!breaker) {
      this.initBreaker(platform);
      breaker = this.breakers.get(platform)!;
    }
    return breaker;
  }

  /**
   * Check if breaker allows execution, handling OPEN -> HALF_OPEN timeout transition
   */
  canExecute(platform: HealthPlatform): boolean {
    const breaker = this.getBreaker(platform);

    if (breaker.state === 'CLOSED') {
      return true;
    }

    if (breaker.state === 'OPEN') {
      const lastChange = new Date(breaker.lastStateChange).getTime();
      const elapsed = Date.now() - lastChange;

      if (elapsed >= breaker.config.resetTimeoutMs) {
        // Transition to HALF_OPEN to probe provider
        breaker.state = 'HALF_OPEN';
        breaker.lastStateChange = new Date().toISOString();
        this.logger.warn(
          `[CircuitBreaker:${platform}] Reset timeout elapsed (${elapsed}ms). Transitioning from OPEN to HALF_OPEN for probe.`,
        );
        return true;
      }

      return false; // Still OPEN, fast-fail
    }

    if (breaker.state === 'HALF_OPEN') {
      return true; // Allow probe execution
    }

    return true;
  }

  /**
   * Execute an external provider operation protected by Circuit Breaker pattern
   */
  async execute<T>(
    platform: HealthPlatform,
    operation: () => Promise<T>,
  ): Promise<T> {
    if (!this.canExecute(platform)) {
      this.logger.warn(
        `[CircuitBreaker:${platform}] Call blocked: circuit is OPEN. Fast-failing external request to prevent cascading timeout.`,
      );
      throw new ServiceUnavailableException(
        `External integration provider [${platform}] is temporarily unavailable (circuit breaker OPEN). Please retry later.`,
      );
    }

    try {
      const result = await operation();
      this.recordSuccess(platform);
      return result;
    } catch (err) {
      this.recordFailure(platform, (err as Error).message);
      throw err;
    }
  }

  /**
   * Record a successful call to the external provider
   */
  recordSuccess(platform: HealthPlatform): void {
    const breaker = this.getBreaker(platform);

    if (breaker.state === 'HALF_OPEN') {
      breaker.consecutiveSuccesses += 1;
      this.logger.debug(
        `[CircuitBreaker:${platform}] Probe succeeded (${breaker.consecutiveSuccesses}/${breaker.config.consecutiveSuccessesToClose})`,
      );

      if (breaker.consecutiveSuccesses >= breaker.config.consecutiveSuccessesToClose) {
        breaker.state = 'CLOSED';
        breaker.failureCount = 0;
        breaker.consecutiveSuccesses = 0;
        breaker.lastStateChange = new Date().toISOString();
        this.logger.log(
          `[CircuitBreaker:${platform}] Consecutive probe threshold reached. Transitioned from HALF_OPEN to CLOSED (HEALTHY).`,
        );
      }
    } else if (breaker.state === 'CLOSED') {
      // Reset any partial failures
      breaker.failureCount = 0;
    }
  }

  /**
   * Record a failed call to the external provider
   */
  recordFailure(platform: HealthPlatform, errorMessage?: string): void {
    const breaker = this.getBreaker(platform);
    const now = new Date().toISOString();
    breaker.lastFailureTime = now;

    if (breaker.state === 'HALF_OPEN') {
      // Probe failed -> trip immediately back to OPEN
      breaker.state = 'OPEN';
      breaker.consecutiveSuccesses = 0;
      breaker.lastStateChange = now;
      this.logger.warn(
        `[CircuitBreaker:${platform}] Probe failed in HALF_OPEN state. Tripping back to OPEN. Error: ${errorMessage}`,
      );
    } else if (breaker.state === 'CLOSED') {
      breaker.failureCount += 1;
      this.logger.warn(
        `[CircuitBreaker:${platform}] Provider error recorded (${breaker.failureCount}/${breaker.config.failureThreshold}). Error: ${errorMessage}`,
      );

      if (breaker.failureCount >= breaker.config.failureThreshold) {
        breaker.state = 'OPEN';
        breaker.lastStateChange = now;
        this.logger.error(
          `[CircuitBreaker:${platform}] Failure threshold reached (${breaker.failureCount}). Tripping circuit breaker to OPEN!`,
        );
      }
    }
  }

  /**
   * Forcefully trip a breaker to OPEN (for testing or manual incident mitigation)
   */
  trip(platform: HealthPlatform): void {
    const breaker = this.getBreaker(platform);
    breaker.state = 'OPEN';
    breaker.failureCount = breaker.config.failureThreshold;
    breaker.consecutiveSuccesses = 0;
    breaker.lastStateChange = new Date().toISOString();
    this.logger.warn(`[CircuitBreaker:${platform}] Manually tripped to OPEN`);
  }

  /**
   * Forcefully reset a breaker to CLOSED
   */
  reset(platform: HealthPlatform): void {
    const breaker = this.getBreaker(platform);
    breaker.state = 'CLOSED';
    breaker.failureCount = 0;
    breaker.consecutiveSuccesses = 0;
    breaker.lastStateChange = new Date().toISOString();
    this.logger.log(`[CircuitBreaker:${platform}] Manually reset to CLOSED`);
  }

  /**
   * Get current status for a specific provider breaker
   */
  getStatus(platform: HealthPlatform): ICircuitBreakerStatus {
    const breaker = this.getBreaker(platform);
    return {
      platform,
      state: breaker.state,
      failureCount: breaker.failureCount,
      consecutiveSuccesses: breaker.consecutiveSuccesses,
      lastFailureTime: breaker.lastFailureTime,
      lastStateChange: breaker.lastStateChange,
    };
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllStatuses(): ICircuitBreakerStatus[] {
    const result: ICircuitBreakerStatus[] = [];
    for (const platform of Object.values(HealthPlatform)) {
      result.push(this.getStatus(platform));
    }
    return result;
  }
}
