import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { TokenVaultService } from './services/token-vault.service';
import { ProvenanceDeduplicationService } from './services/provenance-deduplication.service';
import { HealthPlatformSyncService } from './services/health-platform-sync.service';
import { WearableSyncService } from './services/wearable-sync.service';
import { HealthDataPrivacyService } from './services/health-data-privacy.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { IntegrationSyncPipelineService } from './services/integration-sync-pipeline.service';
import { AppleHealthKitAdapter } from './adapters/apple-health.adapter';
import { HealthConnectAdapter } from './adapters/health-connect.adapter';
import { OuraAdapter } from './adapters/oura.adapter';
import { WhoopAdapter } from './adapters/whoop.adapter';
import { GarminAdapter } from './adapters/garmin.adapter';
import { FitbitAdapter } from './adapters/fitbit.adapter';

@Module({
  imports: [QueueModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    TokenVaultService,
    ProvenanceDeduplicationService,
    HealthPlatformSyncService,
    WearableSyncService,
    HealthDataPrivacyService,
    CircuitBreakerService,
    IntegrationSyncPipelineService,
    AppleHealthKitAdapter,
    HealthConnectAdapter,
    OuraAdapter,
    WhoopAdapter,
    GarminAdapter,
    FitbitAdapter,
  ],
  exports: [
    IntegrationsService,
    TokenVaultService,
    ProvenanceDeduplicationService,
    HealthPlatformSyncService,
    WearableSyncService,
    HealthDataPrivacyService,
    CircuitBreakerService,
    IntegrationSyncPipelineService,
    AppleHealthKitAdapter,
    HealthConnectAdapter,
    OuraAdapter,
    WhoopAdapter,
    GarminAdapter,
    FitbitAdapter,
  ],
})
export class IntegrationsModule {}
