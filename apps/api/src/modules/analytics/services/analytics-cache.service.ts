import { Injectable, Logger } from '@nestjs/common';
import { globalCoalescer, CompressionUtil } from '@alpha/utils';

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number; // timestamp ms
  tags: string[];
  isCompressed?: boolean;
}

export interface ICacheMetrics {
  size: number;
  hits: number;
  misses: number;
  hitRatePercentage: number;
  tagsTracked: number;
}

@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);

  // In-memory Redis-compatible primary store
  private readonly store = new Map<string, CacheEntry>();

  // Inverted Tag Index: tag -> Set of keys (O(1) lookup vs O(N) sweep)
  private readonly tagIndex = new Map<string, Set<string>>();

  // Reverse Key-to-Tags map for clean tag dissociation on key delete/overwrite
  private readonly keyTags = new Map<string, Set<string>>();

  // Performance & Observability Telemetry
  private hits = 0;
  private misses = 0;

  // Threshold above which payload is compressed (bytes)
  private readonly COMPRESSION_THRESHOLD_BYTES = 2048;

  /**
   * Generates a deterministic multi-tenant namespaced cache key
   */
  generateKey(scope: 'client' | 'coach' | 'organization', id: string, period: string, timezone = 'UTC'): string {
    return `analytics:${scope}:${id}:period:${period}:tz:${timezone}`;
  }

  /**
   * Retrieves a cached value if not expired
   */
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.misses++;
      await this.delete(key);
      return null;
    }

    this.hits++;
    if (entry.isCompressed && typeof entry.value === 'string') {
      try {
        const decompressedJson = CompressionUtil.decompressSync(Buffer.from(entry.value, 'base64'));
        return JSON.parse(decompressedJson) as T;
      } catch {
        return entry.value as T;
      }
    }

    return entry.value as T;
  }

  /**
   * Sets a cache entry with TTL (in seconds) and inverted tag indexing
   */
  async set<T = any>(key: string, value: T, ttlSeconds = 300, tags: string[] = []): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    // Clean up existing tag associations if key is being updated
    this.removeKeyFromTagIndex(key);

    let storeValue: any = value;
    let isCompressed = false;

    // Compress large payloads to conserve heap memory
    try {
      const jsonStr = JSON.stringify(value);
      if (Buffer.byteLength(jsonStr, 'utf8') > this.COMPRESSION_THRESHOLD_BYTES) {
        const compressedBuf = CompressionUtil.compressSync(jsonStr);
        storeValue = compressedBuf.toString('base64');
        isCompressed = true;
      }
    } catch {
      storeValue = value;
    }

    this.store.set(key, { value: storeValue, expiresAt, tags, isCompressed });

    // Register into inverted tag index (O(1) per tag)
    if (tags.length > 0) {
      const tagSet = new Set<string>(tags);
      this.keyTags.set(key, tagSet);

      for (const tag of tags) {
        let keysForTag = this.tagIndex.get(tag);
        if (!keysForTag) {
          keysForTag = new Set<string>();
          this.tagIndex.set(tag, keysForTag);
        }
        keysForTag.add(key);
      }
    }
  }

  /**
   * Get-Or-Set with Cache Stampede / Dogpiling Defense (Single-Flight Coalescing)
   * Collapses concurrent cache misses for the same key into a single execution.
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 300,
    tags: string[] = [],
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Coalesce identical in-flight factory calls
    return globalCoalescer.execute(key, async () => {
      // Double-check cache inside coalescer lock
      const doubleCheck = await this.get<T>(key);
      if (doubleCheck !== null) {
        return doubleCheck;
      }

      const freshData = await factory();
      await this.set<T>(key, freshData, ttlSeconds, tags);
      return freshData;
    });
  }

  /**
   * Invalidates a specific cache key and cleans inverted tag associations
   */
  async delete(key: string): Promise<boolean> {
    this.removeKeyFromTagIndex(key);
    return this.store.delete(key);
  }

  /**
   * High-Performance O(K) Inverted Tag Invalidation.
   * Invalidates only keys associated with the tag without scanning the whole cache.
   */
  async invalidateTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys || keys.size === 0) {
      return 0;
    }

    const keyList = Array.from(keys);
    for (const key of keyList) {
      await this.delete(key);
    }

    this.tagIndex.delete(tag);
    this.logger.debug(`Invalidated ${keyList.length} cache entries for tag [${tag}] via inverted index`);
    return keyList.length;
  }

  /**
   * Invalidates all entries matching a key prefix
   */
  async invalidatePrefix(prefix: string): Promise<number> {
    let invalidated = 0;
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        await this.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  /**
   * Remove key associations from tag index
   */
  private removeKeyFromTagIndex(key: string): void {
    const existingTags = this.keyTags.get(key);
    if (existingTags) {
      for (const tag of existingTags) {
        const keysForTag = this.tagIndex.get(tag);
        if (keysForTag) {
          keysForTag.delete(key);
          if (keysForTag.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      }
      this.keyTags.delete(key);
    }
  }

  /**
   * Clears the entire cache and all indexes
   */
  async clear(): Promise<void> {
    this.store.clear();
    this.tagIndex.clear();
    this.keyTags.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Current number of entries in the cache
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Observability metrics
   */
  getMetrics(): ICacheMetrics {
    const total = this.hits + this.misses;
    const hitRatePercentage = total > 0 ? Math.round((this.hits / total) * 1000) / 10 : 0;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatePercentage,
      tagsTracked: this.tagIndex.size,
    };
  }
}
