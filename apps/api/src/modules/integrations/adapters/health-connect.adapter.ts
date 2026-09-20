import { Injectable } from '@nestjs/common';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationAuthType,
} from '@alpha/types';
import { BaseIntegrationAdapter } from './base.adapter';

@Injectable()
export class HealthConnectAdapter extends BaseIntegrationAdapter {
  readonly platform = HealthPlatform.ANDROID_HEALTH_CONNECT;
  readonly displayName = 'Health Connect';
  readonly description = 'Android Health Connect integration for Android devices and Wear OS';
  readonly authType = IntegrationAuthType.MOBILE_SDK;
  readonly requiresCredentials = false;

  readonly capabilities = new Set<IntegrationCapability>([
    IntegrationCapability.STEPS,
    IntegrationCapability.HEART_RATE,
    IntegrationCapability.WORKOUTS,
    IntegrationCapability.ACTIVE_CALORIES,
    IntegrationCapability.TOTAL_CALORIES,
    IntegrationCapability.DISTANCE,
    IntegrationCapability.WEIGHT,
    IntegrationCapability.SLEEP,
    IntegrationCapability.RESPIRATION,
  ]);

  isAvailable(): boolean {
    return true; // Available via Mobile SDK
  }
}
