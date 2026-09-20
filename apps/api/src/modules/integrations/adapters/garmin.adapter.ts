import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationAuthType,
} from '@alpha/types';
import { BaseIntegrationAdapter } from './base.adapter';

@Injectable()
export class GarminAdapter extends BaseIntegrationAdapter {
  readonly platform = HealthPlatform.GARMIN;
  readonly displayName = 'Garmin Connect';
  readonly description = 'Garmin Connect activities, training status, HRV, and metrics';
  readonly authType = IntegrationAuthType.OAUTH2;
  readonly requiresCredentials = true;

  readonly capabilities = new Set<IntegrationCapability>([
    IntegrationCapability.STEPS,
    IntegrationCapability.HEART_RATE,
    IntegrationCapability.HRV,
    IntegrationCapability.VO2_MAX,
    IntegrationCapability.SLEEP,
    IntegrationCapability.WORKOUTS,
    IntegrationCapability.ACTIVE_CALORIES,
    IntegrationCapability.TOTAL_CALORIES,
    IntegrationCapability.DISTANCE,
    IntegrationCapability.ROUTE,
    IntegrationCapability.RESPIRATION,
    IntegrationCapability.SPO2,
  ]);

  constructor(private readonly configService?: ConfigService) {
    super();
  }

  isAvailable(): boolean {
    const consumerKey =
      this.configService?.get<string>('GARMIN_CONSUMER_KEY') || process.env.GARMIN_CONSUMER_KEY;
    return !!consumerKey;
  }
}
