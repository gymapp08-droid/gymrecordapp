import { Logger } from '@nestjs/common';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationAuthType,
} from '@alpha/types';
import { WebhookSecurityUtil } from '@alpha/utils';
import { IIntegrationAdapter } from '../interfaces/integration-adapter.interface';

export abstract class BaseIntegrationAdapter implements IIntegrationAdapter {
  protected readonly logger: Logger;

  abstract readonly platform: HealthPlatform;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly authType: IntegrationAuthType;
  abstract readonly capabilities: Set<IntegrationCapability>;
  abstract readonly requiresCredentials: boolean;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  isAvailable(): boolean {
    return true;
  }

  hasCapability(capability: IntegrationCapability): boolean {
    return this.capabilities.has(capability);
  }

  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret?: string,
  ): boolean {
    if (!secret) return false;
    return WebhookSecurityUtil.verifySignature(payload, signature, secret);
  }
}
