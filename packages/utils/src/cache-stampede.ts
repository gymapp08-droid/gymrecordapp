/**
 * Cache Stampede / Dogpiling Defense (Single-Flight Promise Coalescer)
 * 
 * When 100 concurrent requests request an expensive cached value (e.g. Org Executive Summary)
 * during a cache miss or expiration, this coalesces all concurrent calls into a single
 * shared execution promise.
 */

export class SingleFlightCoalescer {
  private readonly inFlight = new Map<string, Promise<any>>();

  /**
   * Execute a factory function with single-flight deduplication.
   * If a call with the same key is already in flight, returns the existing promise.
   */
  public async execute<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await factory();
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Returns current count of in-flight coalesced executions
   */
  public inFlightCount(): number {
    return this.inFlight.size;
  }

  /**
   * Check if a specific key is currently in-flight
   */
  public isInFlight(key: string): boolean {
    return this.inFlight.has(key);
  }

  /**
   * Clear all in-flight tracking (useful for test resets)
   */
  public clear(): void {
    this.inFlight.clear();
  }
}

export const globalCoalescer = new SingleFlightCoalescer();
