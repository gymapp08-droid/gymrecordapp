import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthPlatform,
  IEncryptedTokenPayload,
  ISanitizedIntegrationTokens,
} from '@alpha/types';
import { TokenVaultUtil } from '@alpha/utils';

export interface StoredIntegrationCredentials {
  userId: string;
  platform: HealthPlatform;
  encryptedAccessToken: IEncryptedTokenPayload;
  encryptedRefreshToken?: IEncryptedTokenPayload;
  expiresAt?: string;
  scopes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TokenVaultService {
  private readonly logger = new Logger(TokenVaultService.name);
  private readonly vaultSecret: string;
  // Encrypted credential store scoped by `userId:platform`
  private readonly credentialStore = new Map<string, StoredIntegrationCredentials>();

  constructor(private readonly configService?: ConfigService) {
    this.vaultSecret =
      this.configService?.get<string>('INTEGRATION_VAULT_SECRET') ||
      process.env.INTEGRATION_VAULT_SECRET ||
      'alpha-vault-master-key-32-byte-secret-prod-1234';
  }

  private getKey(userId: string, platform: HealthPlatform): string {
    return `${userId}:${platform}`;
  }

  /**
   * Encrypt and safely persist integration OAuth tokens at rest
   */
  async storeTokens(
    userId: string,
    platform: HealthPlatform,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
      scopes?: string[];
    },
  ): Promise<ISanitizedIntegrationTokens> {
    const key = this.getKey(userId, platform);
    const now = new Date();
    const expiresAt = tokens.expiresIn
      ? new Date(now.getTime() + tokens.expiresIn * 1000).toISOString()
      : undefined;

    const encryptedAccessToken = TokenVaultUtil.encrypt(
      tokens.accessToken,
      this.vaultSecret,
    );

    const encryptedRefreshToken = tokens.refreshToken
      ? TokenVaultUtil.encrypt(tokens.refreshToken, this.vaultSecret)
      : undefined;

    this.credentialStore.set(key, {
      userId,
      platform,
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt,
      scopes: tokens.scopes,
      createdAt: now,
      updatedAt: now,
    });

    this.logger.log(
      `Securely stored encrypted credentials for user [${userId}], platform [${platform}]`,
    );

    return {
      hasAccessToken: true,
      hasRefreshToken: !!tokens.refreshToken,
      maskedAccessToken: TokenVaultUtil.maskToken(tokens.accessToken),
      expiresAt,
    };
  }

  /**
   * Retrieve and decrypt tokens for internal worker/sync usage ONLY.
   * Never expose decrypted tokens to client endpoints!
   */
  async getDecryptedTokens(
    userId: string,
    platform: HealthPlatform,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    scopes?: string[];
  } | null> {
    const key = this.getKey(userId, platform);
    const stored = this.credentialStore.get(key);
    if (!stored) return null;

    const accessToken = TokenVaultUtil.decrypt(
      stored.encryptedAccessToken,
      this.vaultSecret,
    );

    const refreshToken = stored.encryptedRefreshToken
      ? TokenVaultUtil.decrypt(
          stored.encryptedRefreshToken,
          this.vaultSecret,
        )
      : undefined;

    return {
      accessToken,
      refreshToken,
      expiresAt: stored.expiresAt,
      scopes: stored.scopes,
    };
  }

  /**
   * Check token presence and get masked info without decrypting
   */
  getSanitizedTokenInfo(
    userId: string,
    platform: HealthPlatform,
  ): ISanitizedIntegrationTokens {
    const key = this.getKey(userId, platform);
    const stored = this.credentialStore.get(key);
    if (!stored) {
      return {
        hasAccessToken: false,
        hasRefreshToken: false,
      };
    }

    return {
      hasAccessToken: true,
      hasRefreshToken: !!stored.encryptedRefreshToken,
      maskedAccessToken: '********',
      expiresAt: stored.expiresAt,
    };
  }

  /**
   * Revoke and purge stored encrypted tokens
   */
  async revokeTokens(userId: string, platform: HealthPlatform): Promise<boolean> {
    const key = this.getKey(userId, platform);
    const existed = this.credentialStore.delete(key);
    if (existed) {
      this.logger.log(
        `Purged credentials for user [${userId}], platform [${platform}]`,
      );
    }
    return existed;
  }
}
