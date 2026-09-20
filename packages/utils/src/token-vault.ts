import * as crypto from 'crypto';
import {
  IEncryptedTokenPayload,
  ISanitizedIntegrationTokens,
  ConflictResolutionStrategy,
  HealthPlatform,
} from '@alpha/types';

// Default 32-byte encryption key fallback for development / testing environments
const DEFAULT_VAULT_SECRET =
  process.env.INTEGRATION_VAULT_SECRET || 'alpha-vault-master-key-32-byte-secret-prod-1234';

export const TokenVaultUtil = {
  /**
   * Derive a 32-byte AES-256 key from a master secret using SHA-256
   */
  deriveKey(secret = DEFAULT_VAULT_SECRET): Buffer {
    return crypto.createHash('sha256').update(secret, 'utf8').digest();
  },

  /**
   * Encrypt sensitive token payload using AES-256-GCM authenticated encryption
   */
  encrypt(plaintext: string, secret = DEFAULT_VAULT_SECRET, keyVersion = 1): IEncryptedTokenPayload {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty for encryption');
    }

    const key = this.deriveKey(secret);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag,
      keyVersion,
    };
  },

  /**
   * Decrypt AES-256-GCM encrypted payload and verify integrity tag
   */
  decrypt(payload: IEncryptedTokenPayload, secret = DEFAULT_VAULT_SECRET): string {
    if (!payload || !payload.encryptedData || !payload.iv || !payload.authTag) {
      throw new Error('Invalid encrypted payload structure');
    }

    const key = this.deriveKey(secret);
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  },

  /**
   * Mask a token safely for logs and client responses (never leaking full secret)
   */
  maskToken(token?: string | null): string {
    if (!token) return '';
    if (token.length <= 8) return '********';
    const start = token.slice(0, 4);
    const end = token.slice(-4);
    return `${start}...${end}`;
  },

  /**
   * Sanitize an OAuth token payload into a safe response DTO
   */
  sanitizeTokens(tokens?: {
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: string | null;
  }): ISanitizedIntegrationTokens {
    return {
      hasAccessToken: !!tokens?.accessToken,
      hasRefreshToken: !!tokens?.refreshToken,
      maskedAccessToken: tokens?.accessToken ? this.maskToken(tokens.accessToken) : undefined,
      expiresAt: tokens?.expiresAt || undefined,
    };
  },
};

/**
 * Priority ranking for multi-source conflict resolution
 * Higher number = higher precedence
 */
export const SOURCE_PRIORITY_MAP: Record<string, number> = {
  MANUAL: 100, // Manual user input has highest priority for strength & body metrics
  GARMIN: 80, // Dedicated sports/biometric watch
  WHOOP: 80, // Dedicated continuous recovery tracker
  OURA: 80, // Dedicated continuous sleep/readiness ring
  APPLE_HEALTHKIT: 60, // Aggregate phone/watch ecosystem
  ANDROID_HEALTH_CONNECT: 60, // Aggregate Android ecosystem
  FITBIT: 60, // Wearable ecosystem
  SYSTEM: 10, // Default automated system fallback
};

export interface MetricConflictCandidate {
  source: HealthPlatform | 'MANUAL' | 'SYSTEM';
  value: number;
  recordedAt: string;
  isManualInput?: boolean;
  confidenceScore?: number;
}

export const DeduplicationUtil = {
  /**
   * Generate deterministic SHA-256 deduplication key
   */
  generateDedupKey(
    userId: string,
    metricType: string,
    recordedAt: string,
    sourceRecordId?: string,
  ): string {
    const raw = `${userId}|${metricType}|${recordedAt}|${sourceRecordId || 'NONE'}`;
    return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  },

  /**
   * Resolve conflict between existing record and incoming record according to policy
   */
  resolveConflict(
    existing: MetricConflictCandidate,
    incoming: MetricConflictCandidate,
    strategy: ConflictResolutionStrategy = 'MANUAL_OVERRIDE',
  ): {
    winner: MetricConflictCandidate;
    reason: string;
  } {
    // 1. If strategy is MANUAL_OVERRIDE: manual entries always win over automated imports
    if (strategy === 'MANUAL_OVERRIDE') {
      if (existing.isManualInput && !incoming.isManualInput) {
        return {
          winner: existing,
          reason: 'Existing manual entry preserved over incoming automated sync',
        };
      }
      if (!existing.isManualInput && incoming.isManualInput) {
        return {
          winner: incoming,
          reason: 'Incoming manual entry overrides existing automated sync',
        };
      }
    }

    // 2. HIGHER_CONFIDENCE or default priority matrix
    const existingPriority = SOURCE_PRIORITY_MAP[existing.source] ?? 50;
    const incomingPriority = SOURCE_PRIORITY_MAP[incoming.source] ?? 50;

    if (strategy === 'HIGHER_CONFIDENCE') {
      const existingConf = existing.confidenceScore ?? (existingPriority / 100);
      const incomingConf = incoming.confidenceScore ?? (incomingPriority / 100);
      if (incomingConf > existingConf) {
        return {
          winner: incoming,
          reason: `Incoming source [${incoming.source}] has higher confidence (${incomingConf} > ${existingConf})`,
        };
      }
      return {
        winner: existing,
        reason: `Existing source [${existing.source}] preserved with higher/equal confidence (${existingConf} >= ${incomingConf})`,
      };
    }

    // 3. MAX_VALUE (e.g. step counts across same-day phone vs watch where highest observed count is true)
    if (strategy === 'MAX_VALUE') {
      if (incoming.value > existing.value) {
        return {
          winner: incoming,
          reason: `Incoming value (${incoming.value}) is greater than existing (${existing.value})`,
        };
      }
      return {
        winner: existing,
        reason: `Existing value (${existing.value}) is greater than or equal to incoming (${incoming.value})`,
      };
    }

    // 4. LATEST_TIMESTAMP
    const existingTime = new Date(existing.recordedAt).getTime();
    const incomingTime = new Date(incoming.recordedAt).getTime();

    if (incomingTime > existingTime) {
      return {
        winner: incoming,
        reason: 'Incoming record has more recent timestamp',
      };
    }

    // Fallback to priority matrix
    if (incomingPriority > existingPriority) {
      return {
        winner: incoming,
        reason: `Incoming provider [${incoming.source}] has higher priority than [${existing.source}]`,
      };
    }

    return {
      winner: existing,
      reason: `Existing provider [${existing.source}] preserved over [${incoming.source}]`,
    };
  },
};
