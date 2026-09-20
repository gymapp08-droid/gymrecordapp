import * as crypto from 'crypto';

export * from './units';
export * from './i18n';
export * from './date-time';
export * from './unicode';
export * from './accessibility';
export * from './rbac';
export * from './file-security';
export * from './webhook-security';
export * from './notification-privacy';
export * from './rate-limiter';
export * from './audit-crypto';
export * from './data-retention';
export * from './export-checksum';
export * from './pagination';
export * from './compression';
export * from './backoff';
export * from './cache-stampede';
export * from './token-vault';
export * from './gps-privacy';

/**
 * Cryptographic helpers for passwords and tokens
 */
export const HashUtil = {
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  },

  async verifyPassword(password: string, combinedHash: string): Promise<boolean> {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        const keyBuffer = Buffer.from(key, 'hex');
        const match = crypto.timingSafeEqual(keyBuffer, derivedKey);
        resolve(match);
      });
    });
  },

  generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  },

  generateUuid(): string {
    return crypto.randomUUID();
  },
};

/**
 * Standard API Response Factory
 */
export const ApiResponse = {
  success<T>(data: T, meta?: { requestId?: string; [key: string]: unknown }) {
    return {
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  },

  error(code: string, message: string, details?: unknown, meta?: { requestId?: string }) {
    return {
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  },
};
