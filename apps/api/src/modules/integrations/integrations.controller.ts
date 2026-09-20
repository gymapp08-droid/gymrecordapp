import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser, HealthPlatform, QueueName, IGpsCoordinate } from '@alpha/types';
import { IntegrationsService } from './integrations.service';
import { HealthPlatformSyncService } from './services/health-platform-sync.service';
import { WearableSyncService } from './services/wearable-sync.service';
import { HealthDataPrivacyService } from './services/health-data-privacy.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { IntegrationSyncPipelineService } from './services/integration-sync-pipeline.service';
import {
  ConnectIntegrationDto,
  DisconnectIntegrationDto,
  UpdateIntegrationPermissionsDto,
  TriggerIntegrationSyncDto,
  HealthPlatformIngestDto,
  UpdateHealthPrivacyPreferencesDto,
  CreatePrivacyZoneDto,
  EnforceRetentionDto,
} from '@alpha/validation';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly healthPlatformSyncService: HealthPlatformSyncService,
    private readonly wearableSyncService: WearableSyncService,
    private readonly healthDataPrivacyService: HealthDataPrivacyService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly syncPipelineService: IntegrationSyncPipelineService,
  ) {}

  /**
   * GET /api/v1/integrations/providers
   * Returns list of supported providers, capabilities, availability, and connection status
   */
  @Get('providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getProviders(@CurrentUser() user: IAuthUser) {
    return this.integrationsService.getProviders(user.id);
  }

  /**
   * GET /api/v1/integrations/status
   * Returns current user's integration connections and permission states
   */
  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUserConnections(@CurrentUser() user: IAuthUser) {
    return this.integrationsService.getUserConnections(user.id);
  }

  /**
   * GET /api/v1/integrations/wearables/status
   * Returns wearable providers with live availability status
   */
  @Get('wearables/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getWearablesStatus(@CurrentUser() user: IAuthUser) {
    return this.wearableSyncService.getWearableProvidersStatus(user.id);
  }

  // -------------------------------------------------------------
  // PRIVACY & GPS PROTECTION ENDPOINTS
  // -------------------------------------------------------------

  /**
   * GET /api/v1/integrations/privacy/preferences
   * Returns user's health telemetry privacy preferences
   */
  @Get('privacy/preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getPrivacyPreferences(@CurrentUser() user: IAuthUser) {
    return this.healthDataPrivacyService.getPreferences(user.id);
  }

  /**
   * PUT /api/v1/integrations/privacy/preferences
   * Updates health telemetry privacy preferences
   */
  @Put('privacy/preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePrivacyPreferences(
    @CurrentUser() user: IAuthUser,
    @Body() dto: UpdateHealthPrivacyPreferencesDto,
  ) {
    return this.healthDataPrivacyService.updatePreferences(user.id, dto);
  }

  /**
   * GET /api/v1/integrations/privacy/zones
   * Returns user's registered GPS privacy zones
   */
  @Get('privacy/zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getPrivacyZones(@CurrentUser() user: IAuthUser) {
    return this.healthDataPrivacyService.getPrivacyZones(user.id);
  }

  /**
   * POST /api/v1/integrations/privacy/zones
   * Creates a new GPS privacy zone (e.g. Home, Work)
   */
  @Post('privacy/zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPrivacyZone(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreatePrivacyZoneDto,
  ) {
    return this.healthDataPrivacyService.createPrivacyZone(user.id, dto);
  }

  /**
   * DELETE /api/v1/integrations/privacy/zones/:zoneId
   * Deletes a GPS privacy zone
   */
  @Delete('privacy/zones/:zoneId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async deletePrivacyZone(
    @CurrentUser() user: IAuthUser,
    @Param('zoneId') zoneId: string,
  ) {
    return { success: await this.healthDataPrivacyService.deletePrivacyZone(user.id, zoneId) };
  }

  /**
   * POST /api/v1/integrations/privacy/filter-route
   * Applies privacy zones, endpoint trimming, and coach redaction to route coordinates
   */
  @Post('privacy/filter-route')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async filterRoute(
    @CurrentUser() user: IAuthUser,
    @Body() payload: { coordinates: IGpsCoordinate[]; isCoachView?: boolean },
  ) {
    return this.healthDataPrivacyService.filterAndObfuscateRoute(
      user.id,
      payload.coordinates,
      payload.isCoachView,
    );
  }

  // -------------------------------------------------------------
  // CIRCUIT BREAKER MANAGEMENT ENDPOINTS
  // -------------------------------------------------------------

  /**
   * GET /api/v1/integrations/circuit-breakers
   * Returns current status of all provider circuit breakers
   */
  @Get('circuit-breakers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAllCircuitBreakers() {
    return this.circuitBreakerService.getAllStatuses();
  }

  /**
   * GET /api/v1/integrations/circuit-breakers/:platform
   * Returns circuit breaker status for a single provider
   */
  @Get('circuit-breakers/:platform')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getCircuitBreaker(
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
  ) {
    return this.circuitBreakerService.getStatus(platform);
  }

  /**
   * POST /api/v1/integrations/circuit-breakers/:platform/reset
   * Manually resets a circuit breaker to CLOSED
   */
  @Post('circuit-breakers/:platform/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  resetCircuitBreaker(
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
  ) {
    this.circuitBreakerService.reset(platform);
    return this.circuitBreakerService.getStatus(platform);
  }

  /**
   * POST /api/v1/integrations/circuit-breakers/:platform/trip
   * Forcefully trips a circuit breaker to OPEN (for incident simulation/mitigation)
   */
  @Post('circuit-breakers/:platform/trip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  tripCircuitBreaker(
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
  ) {
    this.circuitBreakerService.trip(platform);
    return this.circuitBreakerService.getStatus(platform);
  }

  // -------------------------------------------------------------
  // SYNC PIPELINE & RETENTION MAINTENANCE ENDPOINTS
  // -------------------------------------------------------------

  /**
   * POST /api/v1/integrations/sync/process-next
   * Claims and processes the next job in the background sync pipeline
   */
  @Post('sync/process-next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async processNextSyncJob(
    @Query('queue') queue?: QueueName,
  ) {
    return this.syncPipelineService.processNextQueuedJob(queue);
  }

  /**
   * POST /api/v1/integrations/tokens/proactive-refresh
   * Proactively scans active integrations and rotates tokens expiring in < 30 minutes
   */
  @Post('tokens/proactive-refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async runProactiveTokenRefresh(@CurrentUser() user: IAuthUser) {
    const userConnections = await this.integrationsService.getUserConnections(user.id);
    const active = userConnections.map((c) => ({
      userId: c.userId,
      platform: c.platform,
    }));
    return this.syncPipelineService.runProactiveTokenRefreshCheck(active);
  }

  /**
   * POST /api/v1/integrations/retention/enforce
   * Trims raw high-frequency intraday telemetry past retention window
   */
  @Post('retention/enforce')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async enforceRetention(@Body() dto: EnforceRetentionDto) {
    return this.healthDataPrivacyService.enforceRetention(dto);
  }

  // -------------------------------------------------------------
  // PLATFORM-SPECIFIC OPERATIONS
  // -------------------------------------------------------------

  /**
   * GET /api/v1/integrations/:platform/capabilities
   * Returns capabilities declared by a specific platform
   */
  @Get(':platform/capabilities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getProviderCapabilities(
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
  ) {
    return this.integrationsService.getProviderCapabilities(platform);
  }

  /**
   * GET /api/v1/integrations/:platform
   * Returns details for a single provider connection
   */
  @Get(':platform')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getConnection(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
  ) {
    return this.integrationsService.getConnection(user.id, platform);
  }

  /**
   * POST /api/v1/integrations/:platform/connect
   * Connects provider, securely stores encrypted credentials, and enqueues initial sync
   */
  @Post(':platform/connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async connect(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
    @Body() dto: ConnectIntegrationDto,
  ) {
    dto.platform = platform;
    return this.integrationsService.connect(user.id, dto);
  }

  /**
   * POST /api/v1/integrations/:platform/permissions
   * Updates health permissions (granted/denied scopes)
   */
  @Post(':platform/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async updatePermissions(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
    @Body() dto: UpdateIntegrationPermissionsDto,
  ) {
    dto.platform = platform;
    return this.integrationsService.updatePermissions(user.id, dto);
  }

  /**
   * POST /api/v1/integrations/:platform/sync
   * Triggers an on-demand incremental or backfill synchronization job
   */
  @Post(':platform/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerSync(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
    @Body() dto: TriggerIntegrationSyncDto,
  ) {
    dto.platform = platform;
    return this.integrationsService.triggerSync(user.id, dto);
  }

  /**
   * POST /api/v1/integrations/:platform/disconnect
   * Disconnects integration, revokes encrypted tokens, and sets status to DISCONNECTED
   */
  @Post(':platform/disconnect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async disconnect(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
    @Body() dto: DisconnectIntegrationDto,
  ) {
    dto.platform = platform;
    return this.integrationsService.disconnect(user.id, dto);
  }

  /**
   * POST /api/v1/integrations/:platform/webhook
   * Ingests provider webhook events after HMAC signature verification
   */
  @Post(':platform/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-webhook-secret') secret: string,
    @Body() payload: any,
  ) {
    const rawPayload = JSON.stringify(payload);
    return this.integrationsService.processWebhook(
      platform,
      rawPayload,
      signature,
      secret,
    );
  }

  /**
   * POST /api/v1/integrations/:platform/ingest
   * Ingests health platform data (Apple Health / Health Connect) from mobile SDK
   */
  @Post(':platform/ingest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async ingestHealthData(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
    @Body() dto: HealthPlatformIngestDto,
  ) {
    dto.platform = platform;
    return this.healthPlatformSyncService.ingestHealthData(user.id, dto);
  }

  /**
   * GET /api/v1/integrations/:platform/records
   * Returns normalized health records for requesting user
   */
  @Get(':platform/records')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getNormalizedRecords(
    @CurrentUser() user: IAuthUser,
    @Query('metricType') metricType?: string,
  ) {
    return this.healthPlatformSyncService.getNormalizedRecords(user.id, metricType);
  }

  /**
   * POST /api/v1/integrations/:platform/oauth/refresh
   * Rotates and refreshes OAuth tokens for cloud wearable providers
   */
  @Post(':platform/oauth/refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async refreshProviderToken(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
  ) {
    return this.wearableSyncService.refreshProviderToken(user.id, platform);
  }

  /**
   * POST /api/v1/integrations/:platform/wearable-sync
   * Ingests wearable telemetry preserving proprietary provider scores
   */
  @Post(':platform/wearable-sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async ingestWearableData(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
    @Body() payload: { records: any[] },
  ) {
    return this.wearableSyncService.ingestWearableData(user.id, {
      platform,
      records: payload.records,
    });
  }

  /**
   * GET /api/v1/integrations/:platform/freshness
   * Evaluates synchronization freshness and flags data staleness
   */
  @Get(':platform/freshness')
  @UseGuards(JwtAuthGuard, RolesGuard)
  checkFreshness(
    @CurrentUser() user: IAuthUser,
    @Param('platform', new ParseEnumPipe(HealthPlatform)) platform: HealthPlatform,
  ) {
    return this.wearableSyncService.checkFreshness(user.id, platform);
  }
}
