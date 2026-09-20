import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationAuthType,
} from '@alpha/types';



export interface IIntegrationAdapter {
  readonly platform: HealthPlatform;
  readonly displayName: string;
  readonly description: string;
  readonly authType: IntegrationAuthType;
  readonly capabilities: Set<IntegrationCapability>;
  readonly requiresCredentials: boolean;

  /**
   * Check whether this provider is currently available (e.g. credentials configured or mobile environment)
   */
  isAvailable(): boolean;

  /**
   * Has specific capability
   */
  hasCapability(capability: IntegrationCapability): boolean;

  /**
   * Get OAuth authorization URL if applicable
   */
  getAuthUrl?(state: string, redirectUri: string): Promise<string>;

  /**
   * Exchange authorization code for access tokens
   */
  handleCallback?(
    code: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scopes?: string[];
  }>;

  /**
   * Disconnect and optionally revoke remote tokens
   */
  disconnect?(
    userId: string,
    tokens?: { accessToken?: string; refreshToken?: string },
  ): Promise<void>;

  /**
   * Verify HMAC webhook signature
   */
  verifyWebhookSignature?(
    payload: string | Buffer,
    signature: string,
    secret?: string,
  ): boolean;
}
