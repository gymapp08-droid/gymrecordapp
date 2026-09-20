import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationAuthType,
} from '@alpha/types';
import { BaseIntegrationAdapter } from './base.adapter';

@Injectable()
export class OuraAdapter extends BaseIntegrationAdapter {
  readonly platform = HealthPlatform.OURA;
  readonly displayName = 'Oura Ring';
  readonly description = 'Oura Ring sleep, readiness, and continuous biometric tracking';
  readonly authType = IntegrationAuthType.OAUTH2;
  readonly requiresCredentials = true;

  readonly capabilities = new Set<IntegrationCapability>([
    IntegrationCapability.SLEEP,
    IntegrationCapability.READINESS_SCORE,
    IntegrationCapability.RECOVERY_SCORE,
    IntegrationCapability.HRV,
    IntegrationCapability.RESTING_HEART_RATE,
    IntegrationCapability.HEART_RATE,
    IntegrationCapability.STEPS,
    IntegrationCapability.ACTIVE_CALORIES,
    IntegrationCapability.SPO2,
    IntegrationCapability.RESPIRATION,
  ]);

  constructor(private readonly configService?: ConfigService) {
    super();
  }

  isAvailable(): boolean {
    const clientId = this.configService?.get<string>('OURA_CLIENT_ID') || process.env.OURA_CLIENT_ID;
    return !!clientId;
  }

  async getAuthUrl(state: string, redirectUri: string): Promise<string> {
    const clientId =
      this.configService?.get<string>('OURA_CLIENT_ID') || process.env.OURA_CLIENT_ID || 'dummy_oura_client';
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'daily personal heartrate workout session',
      state,
      redirect_uri: redirectUri,
    });
    return `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`;
  }
}
