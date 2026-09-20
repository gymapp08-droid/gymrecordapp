import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationAuthType,
} from '@alpha/types';
import { BaseIntegrationAdapter } from './base.adapter';

@Injectable()
export class WhoopAdapter extends BaseIntegrationAdapter {
  readonly platform = HealthPlatform.WHOOP;
  readonly displayName = 'WHOOP';
  readonly description = 'WHOOP 4.0 recovery, strain, sleep, and continuous HRV monitoring';
  readonly authType = IntegrationAuthType.OAUTH2;
  readonly requiresCredentials = true;

  readonly capabilities = new Set<IntegrationCapability>([
    IntegrationCapability.RECOVERY_SCORE,
    IntegrationCapability.HRV,
    IntegrationCapability.RESTING_HEART_RATE,
    IntegrationCapability.HEART_RATE,
    IntegrationCapability.SLEEP,
    IntegrationCapability.WORKOUTS,
    IntegrationCapability.ACTIVE_CALORIES,
    IntegrationCapability.RESPIRATION,
    IntegrationCapability.SPO2,
  ]);

  constructor(private readonly configService?: ConfigService) {
    super();
  }

  isAvailable(): boolean {
    const clientId = this.configService?.get<string>('WHOOP_CLIENT_ID') || process.env.WHOOP_CLIENT_ID;
    return !!clientId;
  }

  async getAuthUrl(state: string, redirectUri: string): Promise<string> {
    const clientId =
      this.configService?.get<string>('WHOOP_CLIENT_ID') || process.env.WHOOP_CLIENT_ID || 'dummy_whoop_client';
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'read:recovery read:cycles read:workout read:sleep read:profile',
      state,
      redirect_uri: redirectUri,
    });
    return `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;
  }
}
