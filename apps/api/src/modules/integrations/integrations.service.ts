import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  HealthPlatform,
  IntegrationCapability,
  IntegrationConnectionState,
  HealthPermissionState,
  IIntegrationProviderInfo,
  IIntegrationConnection,
} from '@alpha/types';

import {
  ConnectIntegrationDto,
  DisconnectIntegrationDto,
  UpdateIntegrationPermissionsDto,
  TriggerIntegrationSyncDto,
} from '@alpha/validation';
import { HashUtil } from '@alpha/utils';
import { TokenVaultService } from './services/token-vault.service';
import { ProvenanceDeduplicationService } from './services/provenance-deduplication.service';
import { QueueService } from '../queue/services/queue.service';
import { IIntegrationAdapter } from './interfaces/integration-adapter.interface';
import { AppleHealthKitAdapter } from './adapters/apple-health.adapter';
import { HealthConnectAdapter } from './adapters/health-connect.adapter';
import { OuraAdapter } from './adapters/oura.adapter';
import { WhoopAdapter } from './adapters/whoop.adapter';
import { GarminAdapter } from './adapters/garmin.adapter';
import { FitbitAdapter } from './adapters/fitbit.adapter';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  // Registry of provider adapters keyed by HealthPlatform
  private readonly adapters = new Map<HealthPlatform, IIntegrationAdapter>();

  // In-memory persistent connection storage keyed by `userId:platform`
  private readonly connections = new Map<string, IIntegrationConnection>();

  constructor(
    private readonly tokenVaultService: TokenVaultService,
    private readonly provenanceDedupService: ProvenanceDeduplicationService,
    private readonly queueService: QueueService,
    appleHealthAdapter: AppleHealthKitAdapter,
    healthConnectAdapter: HealthConnectAdapter,
    ouraAdapter: OuraAdapter,
    whoopAdapter: WhoopAdapter,
    garminAdapter: GarminAdapter,
    fitbitAdapter: FitbitAdapter,
  ) {
    // Register all supported adapters
    this.registerAdapter(appleHealthAdapter);
    this.registerAdapter(healthConnectAdapter);
    this.registerAdapter(ouraAdapter);
    this.registerAdapter(whoopAdapter);
    this.registerAdapter(garminAdapter);
    this.registerAdapter(fitbitAdapter);
  }

  private registerAdapter(adapter: IIntegrationAdapter): void {
    this.adapters.set(adapter.platform, adapter);
  }

  getProvenanceDeduplicationService(): ProvenanceDeduplicationService {
    return this.provenanceDedupService;
  }

  getTokenVaultService(): TokenVaultService {
    return this.tokenVaultService;
  }

  updateConnectionStatusAndCursor(
    userId: string,
    platform: HealthPlatform,
    updates: {
      status?: IntegrationConnectionState;
      syncCursor?: string;
      lastSyncAt?: string;
      lastSuccessfulSyncAt?: string;
      lastErrorAt?: string;
      lastErrorMessage?: string;
    },
  ): IIntegrationConnection | null {
    const key = this.getConnectionKey(userId, platform);
    const connection = this.connections.get(key);
    if (!connection) return null;

    if (updates.status !== undefined) connection.status = updates.status;
    if (updates.syncCursor !== undefined) connection.syncCursor = updates.syncCursor;
    if (updates.lastSyncAt !== undefined) connection.lastSyncAt = updates.lastSyncAt;
    if (updates.lastSuccessfulSyncAt !== undefined)
      connection.lastSuccessfulSyncAt = updates.lastSuccessfulSyncAt;
    if (updates.lastErrorAt !== undefined) connection.lastErrorAt = updates.lastErrorAt;
    if (updates.lastErrorMessage !== undefined)
      connection.lastErrorMessage = updates.lastErrorMessage;

    connection.updatedAt = new Date().toISOString();
    this.connections.set(key, connection);
    return connection;
  }

  private getConnectionKey(userId: string, platform: HealthPlatform): string {

    return `${userId}:${platform}`;
  }

  /**
   * Get all registered provider adapters with availability and current user connection status
   */
  async getProviders(userId: string): Promise<IIntegrationProviderInfo[]> {
    const result: IIntegrationProviderInfo[] = [];

    for (const [platform, adapter] of this.adapters.entries()) {
      const key = this.getConnectionKey(userId, platform);
      const existing = this.connections.get(key);

      const status = existing
        ? existing.status
        : adapter.isAvailable()
          ? IntegrationConnectionState.AVAILABLE
          : IntegrationConnectionState.DISCONNECTED;

      result.push({
        platform,
        displayName: adapter.displayName,
        description: adapter.description,
        authType: adapter.authType,
        capabilities: Array.from(adapter.capabilities),
        status,
        requiresCredentials: adapter.requiresCredentials,
      });
    }

    return result;
  }

  /**
   * Get capabilities declared by a specific platform provider
   */
  getProviderCapabilities(platform: HealthPlatform): {
    platform: HealthPlatform;
    capabilities: IntegrationCapability[];
    authType: string;
    requiresCredentials: boolean;
    isAvailable: boolean;
  } {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new NotFoundException(`Integration provider [${platform}] not found`);
    }

    return {
      platform,
      capabilities: Array.from(adapter.capabilities),
      authType: adapter.authType,
      requiresCredentials: adapter.requiresCredentials,
      isAvailable: adapter.isAvailable(),
    };
  }

  /**
   * List all connections configured for the requesting user (tenant-isolated)
   */
  async getUserConnections(userId: string): Promise<IIntegrationConnection[]> {
    const userConnections: IIntegrationConnection[] = [];

    for (const [key, connection] of this.connections.entries()) {
      if (key.startsWith(`${userId}:`)) {
        userConnections.push(connection);
      }
    }

    return userConnections;
  }

  /**
   * Get details for a single platform connection (strictly tenant-isolated)
   */
  async getConnection(
    userId: string,
    platform: HealthPlatform,
  ): Promise<IIntegrationConnection> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new NotFoundException(`Provider [${platform}] is not recognized`);
    }

    const key = this.getConnectionKey(userId, platform);
    const connection = this.connections.get(key);

    if (!connection) {
      // Return default unlinked state
      return {
        id: HashUtil.generateUuid(),
        userId,
        platform,
        status: IntegrationConnectionState.AVAILABLE,
        permissionState: HealthPermissionState.NOT_REQUESTED,
        grantedPermissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return connection;
  }

  /**
   * Connect a provider for a user, securely store encrypted tokens, and enqueue initial sync
   */
  async connect(
    userId: string,
    dto: ConnectIntegrationDto,
  ): Promise<IIntegrationConnection> {
    const adapter = this.adapters.get(dto.platform);
    if (!adapter) {
      throw new NotFoundException(`Provider [${dto.platform}] is not supported`);
    }

    const key = this.getConnectionKey(userId, dto.platform);
    const now = new Date().toISOString();

    // 1. Secure token storage (if tokens or authCode supplied)
    if (dto.accessToken) {
      await this.tokenVaultService.storeTokens(userId, dto.platform, {
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        expiresIn: dto.expiresIn,
        scopes: dto.scopes,
      });
    }

    const existing = this.connections.get(key);
    const grantedScopes = dto.scopes || (existing ? existing.grantedPermissions : []);

    const updatedConnection: IIntegrationConnection = {
      id: existing ? existing.id : HashUtil.generateUuid(),
      userId,
      platform: dto.platform,
      status: IntegrationConnectionState.CONNECTED,
      permissionState:
        grantedScopes.length > 0
          ? HealthPermissionState.GRANTED
          : HealthPermissionState.REQUESTED,
      grantedPermissions: grantedScopes,
      lastSyncAt: existing?.lastSyncAt,
      lastSuccessfulSyncAt: existing?.lastSuccessfulSyncAt,
      syncCursor: existing?.syncCursor,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.connections.set(key, updatedConnection);

    // 2. Dispatch background initial sync job to Redis queue
    const idempotencyKey = `init_sync:${userId}:${dto.platform}`;
    try {
      await this.queueService.addJob(
        'HEALTH_INITIAL_SYNC',
        `initial_sync_${dto.platform.toLowerCase()}`,
        {
          userId,
          platform: dto.platform,
          windowDays: 30,
        },
        { idempotencyKey },
      );
    } catch (err) {
      this.logger.warn(`Could not enqueue initial sync job: ${(err as Error).message}`);
    }

    this.logger.log(
      `User [${userId}] connected integration provider [${dto.platform}]`,
    );

    return updatedConnection;
  }

  /**
   * Update granular permissions for an active integration
   */
  async updatePermissions(
    userId: string,
    dto: UpdateIntegrationPermissionsDto,
  ): Promise<IIntegrationConnection> {
    const key = this.getConnectionKey(userId, dto.platform);
    let connection = this.connections.get(key);

    const now = new Date().toISOString();
    if (!connection) {
      connection = {
        id: HashUtil.generateUuid(),
        userId,
        platform: dto.platform,
        status: IntegrationConnectionState.CONNECTED,
        permissionState: dto.permissionState,
        grantedPermissions: dto.grantedPermissions,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      connection.permissionState = dto.permissionState;
      connection.grantedPermissions = dto.grantedPermissions;
      connection.updatedAt = now;
    }

    this.connections.set(key, connection);
    this.logger.log(
      `User [${userId}] updated permissions for [${dto.platform}]: state = [${dto.permissionState}], count = [${dto.grantedPermissions.length}]`,
    );

    return connection;
  }

  /**
   * Trigger an on-demand incremental or backfill synchronization job
   */
  async triggerSync(
    userId: string,
    dto: TriggerIntegrationSyncDto,
  ): Promise<{
    jobId: string;
    platform: HealthPlatform;
    status: IntegrationConnectionState;
    syncType: string;
  }> {
    const key = this.getConnectionKey(userId, dto.platform);
    const connection = this.connections.get(key);

    if (!connection || connection.status === IntegrationConnectionState.DISCONNECTED) {
      throw new BadRequestException(
        `Cannot trigger sync: provider [${dto.platform}] is not connected`,
      );
    }

    if (connection.permissionState === HealthPermissionState.DENIED) {
      throw new BadRequestException(
        `Cannot trigger sync: permissions for [${dto.platform}] were denied`,
      );
    }

    const syncType = dto.syncType || 'INCREMENTAL';
    const queueName =
      syncType === 'HISTORICAL_BACKFILL'
        ? 'HEALTH_INITIAL_SYNC'
        : 'HEALTH_INCREMENTAL_SYNC';

    const idempotencyKey = `sync:${userId}:${dto.platform}:${Math.floor(Date.now() / 60000)}`;

    const job = await this.queueService.addJob(
      queueName,
      `sync_${dto.platform.toLowerCase()}`,
      {
        userId,
        platform: dto.platform,
        syncType,
        windowDays: dto.syncWindowDays || 7,
      },
      { idempotencyKey },
    );

    // Update connection status to SYNCING
    connection.status = IntegrationConnectionState.SYNCING;
    connection.updatedAt = new Date().toISOString();
    this.connections.set(key, connection);

    return {
      jobId: job.id,
      platform: dto.platform,
      status: connection.status,
      syncType,
    };
  }

  /**
   * Disconnect an integration, revoke encrypted tokens, and transition status to DISCONNECTED
   */
  async disconnect(
    userId: string,
    dto: DisconnectIntegrationDto,
  ): Promise<IIntegrationConnection> {
    const key = this.getConnectionKey(userId, dto.platform);
    const connection = this.connections.get(key);

    if (!connection) {
      throw new NotFoundException(`No connection found for [${dto.platform}]`);
    }

    // Revoke and purge tokens
    await this.tokenVaultService.revokeTokens(userId, dto.platform);

    const now = new Date().toISOString();
    connection.status = IntegrationConnectionState.DISCONNECTED;
    connection.permissionState = HealthPermissionState.REVOKED;
    connection.updatedAt = now;

    this.connections.set(key, connection);
    this.logger.log(`User [${userId}] disconnected from [${dto.platform}]`);

    return connection;
  }

  /**
   * Process incoming provider webhook event with HMAC signature verification
   */
  async processWebhook(
    platform: HealthPlatform,
    rawPayload: string | Buffer,
    signatureHeader: string,
    secret?: string,
  ): Promise<{ success: boolean; eventId: string; enqueuedJobId?: string }> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new NotFoundException(`Provider [${platform}] adapter not found`);
    }

    // Verify HMAC signature
    const isValid = adapter.verifyWebhookSignature
      ? adapter.verifyWebhookSignature(rawPayload, signatureHeader, secret)
      : false;

    if (!isValid) {
      this.logger.warn(`Invalid webhook signature for platform [${platform}]`);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payloadString =
      typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf8');
    const parsed = JSON.parse(payloadString);

    const eventId = parsed.eventId || parsed.id || HashUtil.generateUuid();

    // Enqueue webhook sync job
    const job = await this.queueService.addJob(
      'WEARABLE_SYNC',
      `webhook_${platform.toLowerCase()}`,
      {
        platform,
        eventId,
        payload: parsed,
      },
      { idempotencyKey: `webhook:${platform}:${eventId}` },
    );

    return {
      success: true,
      eventId,
      enqueuedJobId: job.id,
    };
  }
}
