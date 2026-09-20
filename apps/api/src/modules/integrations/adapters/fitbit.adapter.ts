import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationAuthType,
} from '@alpha/types';
import { BaseIntegrationAdapter } from './base.adapter';

@Injectable()
export class FitbitAdapter extends BaseIntegrationAdapter {
  readonly platform = HealthPlatform.FITBIT;
  readonly displayName = 'Fitbit';
  readonly description = 'Fitbit activity, heart rate, sleep stages, and weight tracking';
  readonly authType = IntegrationAuthType.OAUTH2;
  readonly requiresCredentials = true;

  readonly capabilities = new Set<IntegrationCapability>([
    IntegrationCapability.STEPS,
    IntegrationCapability.HEART_RATE,
    IntegrationCapability.RESTING_HEART_RATE,
    IntegrationCapability.SLEEP,
    IntegrationCapability.WORKOUTS,
    IntegrationCapability.ACTIVE_CALORIES,
    IntegrationCapability.DISTANCE,
    IntegrationCapability.WEIGHT,
    IntegrationCapability.SPO2,
  ]);

  constructor(private readonly configService?: ConfigService) {
    super();
  }

  isAvailable(): boolean {
    const clientId = this.configService?.get<string>('FITBIT_CLIENT_ID') || process.env.FITBIT_CLIENT_ID;
    return !!clientId;
  }
}
