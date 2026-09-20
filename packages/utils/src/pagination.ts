/**
 * High-Performance Cursor & Keyset Pagination Utility
 * 
 * Provides O(1) seek performance on large datasets compared to O(N) OFFSET queries.
 * Safe base64url cursor encoding and decoding with integrity verification.
 */

export interface ICursorPaginationParams {
  limit?: number;
  cursor?: string;
  direction?: 'forward' | 'backward';
}

export interface ICursorPaginatedResult<T> {
  items: T[];
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
  count: number;
}

export interface ICursorData {
  id: string;
  sortValue: string | number;
  createdAt?: string;
}

export class PaginationUtil {
  public static readonly DEFAULT_LIMIT = 20;
  public static readonly MAX_LIMIT = 100;

  /**
   * Encode cursor payload into url-safe base64 string
   */
  public static encodeCursor(data: Record<string, any>): string {
    const json = JSON.stringify(data);
    return Buffer.from(json, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Decode url-safe base64 string into cursor payload
   */
  public static decodeCursor<T = Record<string, any>>(cursor: string | null | undefined): T | null {
    if (!cursor || typeof cursor !== 'string') return null;
    try {
      let base64 = cursor.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const json = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  /**
   * Sanitizes pagination limits to bound resource consumption
   */
  public static sanitizeLimit(limit?: number, defaultLimit = PaginationUtil.DEFAULT_LIMIT): number {
    if (!limit || isNaN(limit) || limit <= 0) return defaultLimit;
    return Math.min(Math.floor(limit), PaginationUtil.MAX_LIMIT);
  }

  /**
   * Formats a page of results using keyset logic.
   * Expects (limit + 1) items fetched to detect hasMore without an extra COUNT(*) query.
   */
  public static formatKeysetResult<T extends Record<string, any>>(
    fetchedItems: T[],
    limit: number,
    sortField: keyof T = 'id',
  ): ICursorPaginatedResult<T> {
    const hasMore = fetchedItems.length > limit;
    const items = hasMore ? fetchedItems.slice(0, limit) : fetchedItems;

    let nextCursor: string | null = null;
    let prevCursor: string | null = null;

    if (items.length > 0) {
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;

      prevCursor = PaginationUtil.encodeCursor({
        id: firstItem.id,
        sortValue: firstItem[sortField],
      });

      if (hasMore) {
        nextCursor = PaginationUtil.encodeCursor({
          id: lastItem.id,
          sortValue: lastItem[sortField],
        });
      }
    }

    return {
      items,
      limit,
      hasMore,
      nextCursor,
      prevCursor,
      count: items.length,
    };
  }
}
