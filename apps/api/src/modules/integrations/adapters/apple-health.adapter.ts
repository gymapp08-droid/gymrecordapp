import { Injectable } from '@nestjs/common';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationAuthType,
} from '@alpha/types';
import { BaseIntegrationAdapter } from './base.adapter';

@Injectable()
export class AppleHealthKitAdapter extends BaseIntegrationAdapter {
  readonly platform = HealthPlatform.APPLE_HEALTHKIT;
  readonly displayName = 'Apple Health';
  readonly description = 'Apple HealthKit integration for iPhone and Apple Watch';
  readonly authType = IntegrationAuthType.MOBILE_SDK;
  readonly requiresCredentials = false;

  readonly capabilities = new Set<IntegrationCapability>([
    IntegrationCapability.STEPS,
    IntegrationCapability.HEART_RATE,
    IntegrationCapability.WORKOUTS,
    IntegrationCapability.ACTIVE_CALORIES,
    IntegrationCapability.TOTAL_CALORIES,
    IntegrationCapability.DISTANCE,
    IntegrationCapability.VO2_MAX,
    IntegrationCapability.RESPIRATION,
    IntegrationCapability.WEIGHT,
    IntegrationCapability.SLEEP,
  ]);

  isAvailable(): boolean {
    return true; // Available via Mobile SDK
  }
}
