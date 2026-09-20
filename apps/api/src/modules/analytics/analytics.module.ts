import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { QueueModule } from '../queue/queue.module';
import { KpiCatalogService } from './services/kpi-catalog.service';
import { AnalyticsMathService } from './services/analytics-math.service';
import { AnalyticsAggregationService } from './services/analytics-aggregation.service';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsCacheService } from './services/analytics-cache.service';
import { AnalyticsRebuildService } from './services/analytics-rebuild.service';
import { AnalyticsQualityService } from './services/analytics-quality.service';
import { AnalyticsWorkerHandlerService } from './services/analytics-worker-handler.service';
import { AnalyticsAuthorizationGuard } from './guards/analytics-authorization.guard';
import { AnalyticsController } from './controllers/analytics.controller';
import { KpisController } from './controllers/kpis.controller';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';
import { WorkerService } from '../queue/services/worker.service';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [AnalyticsController, KpisController, ReportsController],
  providers: [
    KpiCatalogService,
    AnalyticsMathService,
    AnalyticsAggregationService,
    AnalyticsCacheService,
    AnalyticsRebuildService,
    AnalyticsQualityService,
    AnalyticsWorkerHandlerService,
    AnalyticsService,
    ReportsService,
    AnalyticsAuthorizationGuard,
  ],
  exports: [
    KpiCatalogService,
    AnalyticsMathService,
    AnalyticsAggregationService,
    AnalyticsCacheService,
    AnalyticsRebuildService,
    AnalyticsQualityService,
    AnalyticsWorkerHandlerService,
    AnalyticsService,
    ReportsService,
    AnalyticsAuthorizationGuard,
  ],
})
export class AnalyticsModule implements OnModuleInit {
  constructor(
    private readonly workerService: WorkerService,
    private readonly workerHandler: AnalyticsWorkerHandlerService,
  ) {}

  onModuleInit() {
    // Wire analytics background job handlers into background worker engine
    this.workerService.registerHandler('DAILY_ANALYTICS_AGGREGATION', async (job) => {
      return this.workerHandler.handleDailyAggregation(job);
    });

    this.workerService.registerHandler('WEEKLY_ANALYTICS_AGGREGATION', async (job) => {
      return this.workerHandler.handleWeeklyAggregation(job);
    });

    this.workerService.registerHandler('CLIENT_SUMMARY_REFRESH', async (job) => {
      return this.workerHandler.handleClientSummaryRefresh(job);
    });

    this.workerService.registerHandler('ORGANIZATION_SUMMARY_REFRESH', async (job) => {
      return this.workerHandler.handleOrganizationSummaryRefresh(job);
    });
  }
}

