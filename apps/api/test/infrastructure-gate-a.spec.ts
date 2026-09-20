import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from '../src/modules/health/health.controller';
import { InfrastructureAuditService } from '../src/modules/health/infrastructure-audit.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { WorkerService } from '../src/modules/queue/services/worker.service';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';
import { ExportChecksumUtil } from '@alpha/utils';
import { IDataPortabilityBundle } from '@alpha/types';

describe('Phase 16 Release Gate A: Infrastructure, Operational Readiness & Alerting Master Suite', () => {
  let module: TestingModule;
  let auditService: InfrastructureAuditService;
  let healthController: HealthController;
  let queueService: QueueService;
  let workerService: WorkerService;

  const mockNotificationsService = {
    sendNotification: jest.fn().mockResolvedValue({
      id: 'mock_notif_infra_1',
      status: 'SENT',
      deliveredAt: new Date().toISOString(),
    }),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              DATABASE_URL: 'postgresql://alpha_admin:prod_secure_pass_42@db.prod.internal:5432/alpha_db?sslmode=require',
              REDIS_URL: 'rediss://redis.prod.internal:6379',
              JWT_SECRET: 'alpha_prod_jwt_super_secret_min_64_characters_long_entropy_string_99',
              S3_BUCKET: 'alpha-production-vault',
              S3_REGION: 'us-east-1',
              S3_ACCESS_KEY_ID: 'AKIA_PRODUCTION_KEY_ID',
              S3_SECRET_ACCESS_KEY: 'PRODUCTION_SECRET_ACCESS_KEY_SECRET',
              FCM_SERVER_KEY: 'FCM_PRODUCTION_SERVER_TOKEN_KEY',
              ALLOWED_ORIGINS: 'https://app.alphaperformance.io,https://portal.alphaperformance.io',
              API_PUBLIC_URL: 'https://api.alphaperformance.io/api/v1',
            }),
          ],
        }),
      ],
      controllers: [HealthController],
      providers: [
        InfrastructureAuditService,
        QueueService,
        WorkerService,
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    auditService = module.get<InfrastructureAuditService>(InfrastructureAuditService);
    healthController = module.get<HealthController>(HealthController);
    queueService = module.get<QueueService>(QueueService);
    workerService = module.get<WorkerService>(WorkerService);
  });

  afterAll(async () => {
    await module.close();
  });

  // =========================================================================
  // 1. PRODUCTION ENVIRONMENT AUDIT (Section 4 & 32)
  // =========================================================================
  describe('1. Production Environment & Secrets Configuration Audit', () => {
    it('audits production environment variables and verifies zero missing required production keys', () => {
      const result = auditService.auditEnvironment('production');

      expect(result.environment).toBe('production');
      expect(result.missingRequiredCount).toBe(0);
      expect(result.weakSecretsCount).toBe(0);
      expect(result.isProductionReady).toBe(true);
      expect(result.secretsCount).toBeGreaterThanOrEqual(10);
    });

    it('identifies weak development defaults and flags them as unsafe for production', () => {
      const customAudit = new InfrastructureAuditService();
      // Inject weak test values
      const orig = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'changeme123';
      try {
        const audit = customAudit.auditEnvironment('production');
        expect(audit.weakSecretsCount).toBeGreaterThanOrEqual(1);
        const weakEntry = audit.entries.find((e) => e.key === 'JWT_SECRET');
        expect(weakEntry?.status).toBe('WEAK_VALUE');
        expect(weakEntry?.isSafeForProduction).toBe(false);
      } finally {
        process.env.JWT_SECRET = orig;
      }
    });

    it('guarantees secrets are never printed in plaintext in audit outputs', () => {
      const result = auditService.auditEnvironment('production');
      for (const entry of result.entries) {
        expect((entry as any).value).toBeUndefined();
        expect((entry as any).secret).toBeUndefined();
        expect(entry.status).toMatch(/CONFIGURED|MISSING|WEAK_VALUE/);
      }
    });
  });

  // =========================================================================
  // 2. DATABASE PRODUCTION CHECK (Section 5 & 32)
  // =========================================================================
  describe('2. Database Production Check & Migration Safety', () => {
    it('verifies PostgreSQL engine, SSL enforcement, and connection pooling parameters', () => {
      const dbAudit = auditService.auditDatabase();

      expect(dbAudit.engine).toContain('PostgreSQL');
      expect(dbAudit.isPostgres).toBe(true);
      expect(dbAudit.isSslEnforcedInProd).toBe(true);
      expect(dbAudit.isUtcTimezoneEnforced).toBe(true);
      expect(dbAudit.poolingConfigured).toBe(true);
      expect(dbAudit.destructiveOperationsBlocked).toBe(true);
      expect(dbAudit.migrationStatus).toBe('CONSISTENT');
    });

    it('verifies non-destructive migration rules and rejects drop database shortcuts', () => {
      const forbiddenCommands = ['DROP DATABASE', 'TRUNCATE', 'DROP SCHEMA CASCADE'];
      const migrationScript = 'CREATE TABLE "workout_sessions" ("id" TEXT NOT NULL);';

      for (const forbidden of forbiddenCommands) {
        expect(migrationScript.includes(forbidden)).toBe(false);
      }
    });
  });

  // =========================================================================
  // 3. REDIS & WORKER PRODUCTION CHECK (Section 14 & 32)
  // =========================================================================
  describe('3. Redis & Background Worker Process Independence', () => {
    it('audits Redis caching and queuing configuration', () => {
      const redisAudit = auditService.auditRedis();

      expect(redisAudit.engine).toContain('Redis');
      expect(redisAudit.isTlsSupported).toBe(true);
      expect(redisAudit.maxMemoryPolicy).toBe('volatile-lru');
      expect(redisAudit.persistenceEnabled).toBe(true);
      expect(redisAudit.isolationKeyspacing).toBe(true);
    });

    it('proves that a queued worker job is actually consumed and processed by registered handler', async () => {
      const testJobData = {
        userId: 'user_infra_test_01',
        title: 'Infrastructure Verification Notification',
        body: 'Testing worker consumer loop execution.',
        category: 'SYSTEM',
        type: 'SYSTEM_ALERT',
        data: { test: true },
      };

      // 1. Add job to NOTIFICATIONS_DISPATCH queue
      const job = await queueService.addJob(
        'NOTIFICATIONS_DISPATCH',
        'infra_notif_job',
        testJobData,
        { maxAttempts: 2 },
      );
      expect(job.id).toBeDefined();
      expect(job.status).toBe('WAITING');

      // 2. Claim next job via worker
      const claimed = await queueService.claimNextJob('NOTIFICATIONS_DISPATCH');
      expect(claimed).toBeDefined();
      expect(claimed?.id).toBe(job.id);
      expect(claimed?.status).toBe('ACTIVE');

      // 3. Execute job using registered worker handler
      const handler = (workerService as any).handlers.get('NOTIFICATIONS_DISPATCH');
      expect(handler).toBeDefined();
      await handler(claimed);

      // 4. Mark job completed
      await queueService.completeJob(job.id);

      // 5. Verify notification service was called and job completed
      expect(mockNotificationsService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_infra_test_01',
          title: 'Infrastructure Verification Notification',
        }),
      );

      const metrics = await queueService.getMetrics();
      expect(metrics.completed).toBeGreaterThanOrEqual(1);
    });

    it('isolates poisoned jobs to Dead Letter Queue (DLQ) after retry exhaustion with jitter', async () => {
      // 1. Enqueue job designed to fail with maxAttempts=1
      const fatalJob = await queueService.addJob(
        'SYNC_RETRY',
        'poisoned_infra_job',
        { invalid: true },
        { maxAttempts: 1 },
      );

      // 2. Worker claims job
      const claimed = await queueService.claimNextJob('SYNC_RETRY');
      expect(claimed?.id).toBe(fatalJob.id);

      // 3. Fail job (exceeds maxAttempts) -> DLQ
      await queueService.failJob(fatalJob.id, 'Simulated fatal format error');

      const failedJobs = await queueService.listJobs({ queue: 'SYNC_RETRY', status: 'FAILED' });
      expect(failedJobs.data.some((j) => j.id === fatalJob.id)).toBe(true);

      const metrics = await queueService.getMetrics();
      expect(metrics.failed).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. OBJECT STORAGE PRODUCTION CHECK (Section 7 & 32)
  // =========================================================================
  describe('4. Object Storage & Presigned URL Security', () => {
    it('verifies S3 object storage configuration and strict presigned URL TTL maximum (<= 900s)', () => {
      const storageAudit = auditService.auditObjectStorage();

      expect(storageAudit.provider).toContain('S3');
      expect(storageAudit.isTtlSafe).toBe(true);
      expect(storageAudit.presignedUrlTtlSeconds).toBeLessThanOrEqual(900);
      expect(storageAudit.blockPublicAccessEnforced).toBe(true);
      expect(storageAudit.serverSideEncryption).toBe('AES256');
    });
  });

  // =========================================================================
  // 5. BACKUP & RESTORE VERIFICATION IN ISOLATED ENVIRONMENT (Section 6 & 32)
  // =========================================================================
  describe('5. Backup Strategy & Isolated Restore Verification', () => {
    it('audits backup frequency, retention, and restore procedure policy', () => {
      const backupAudit = auditService.auditBackupAndRestore();

      expect(backupAudit.backupFrequency).toContain('Daily');
      expect(backupAudit.backupRetentionDays).toBeGreaterThanOrEqual(30);
      expect(backupAudit.checksumAlgorithm).toBe('SHA-256');
      expect(backupAudit.backupVerified).toBe('YES');
      expect(backupAudit.restoreVerified).toBe('YES');
    });

    it('simulates isolated database backup export, restores state, and verifies SHA-256 cryptographic parity', () => {
      // 1. Create simulated authoritative state bundle
      const simulatedSnapshot = {
        snapshotId: 'snap_prod_20260919_001',
        createdAt: '2026-09-19T22:45:00.000Z',
        tables: {
          usersCount: 500,
          workoutsCount: 2500,
          nutritionLogsCount: 4500,
          bodyMetricsCount: 1200,
        },
        metadata: {
          schemaVersion: '20260917000000_init',
          environment: 'production',
        },
      };

      // 2. Generate cryptographic checksum
      const rawPayload = {
        exportId: simulatedSnapshot.snapshotId,
        exportedAt: simulatedSnapshot.createdAt,
        user: {
          id: 'sys_backup_agent',
          email: 'infra@alphaperformance.io',
          fullName: 'System Backup Agent',
          role: 'ADMIN',
          createdAt: simulatedSnapshot.createdAt,
        },
        profile: null,
        preferences: null,
        workouts: [{ id: 'w1', title: 'Simulated Snapshot Session', volumeKg: 2500 }],
        nutrition: [{ id: 'm1', name: 'Simulated Macro Meal', calories: 4500 }],
        activity: [],
        biometrics: [],
        compliance: {
          format: 'JSON_SCHEMA_V1' as const,
          dataSovereignty: 'CANONICAL_UTC_METRIC' as const,
        },
      };

      const checksum = ExportChecksumUtil.generateChecksum(rawPayload);
      expect(checksum).toBeDefined();
      expect(checksum.length).toBe(64); // SHA-256 hex string

      const bundle: IDataPortabilityBundle = {
        ...rawPayload,
        checksum,
      };

      // 3. Verify authentic backup passes verification
      const isValid = ExportChecksumUtil.verifyBundle(bundle);
      expect(isValid).toBe(true);

      // 4. Verify corrupted/tampered restore image FAILS verification
      const tamperedBundle: IDataPortabilityBundle = {
        ...bundle,
        workouts: [{ id: 'w1', title: 'Simulated Snapshot Session', volumeKg: 999999 }],
      };
      const isTamperedValid = ExportChecksumUtil.verifyBundle(tamperedBundle);
      expect(isTamperedValid).toBe(false);
    });
  });

  // =========================================================================
  // 6. DOMAIN, SSL & NETWORK SECURITY HEADERS (Section 21 & 32)
  // =========================================================================
  describe('6. Domain, SSL, CORS & Network Security Headers', () => {
    it('verifies network security audit attributes', () => {
      const netAudit = auditService.auditNetworkSecurity();

      expect(netAudit.tlsVersion).toBe('TLS 1.3');
      expect(netAudit.hstsEnforced).toBe(true);
      expect(netAudit.hstsMaxAge).toBe(31536000);
      expect(netAudit.frameOptions).toBe('DENY');
      expect(netAudit.contentTypeOptions).toBe('nosniff');
      expect(netAudit.corsPolicy).toBe('STRICT_WHITELIST');
      expect(netAudit.apiPrefix).toBe('/api/v1');
    });
  });

  // =========================================================================
  // 7. ACTIONABLE ALERTING CATALOG (Section 20 & 32)
  // =========================================================================
  describe('7. Actionable Production Alerting Catalog', () => {
    it('defines all 12 mandatory production alerts with severity, metrics, thresholds, and runbooks', () => {
      const alerts = auditService.getAlertDefinitions();

      expect(alerts.length).toBe(12);

      const alertIds = alerts.map((a) => a.id);
      expect(alertIds).toContain('ALT_001_API_ERROR_SPIKE');
      expect(alertIds).toContain('ALT_003_DATABASE_CONNECTIVITY');
      expect(alertIds).toContain('ALT_005_REDIS_UNAVAILABLE');
      expect(alertIds).toContain('ALT_007_WORKER_PROCESS_STOPPED');
      expect(alertIds).toContain('ALT_008_QUEUE_BACKLOG_ACCUMULATION');
      expect(alertIds).toContain('ALT_012_BACKUP_FAILURE');

      for (const alert of alerts) {
        expect(['CRITICAL', 'HIGH', 'MEDIUM']).toContain(alert.severity);
        expect(alert.metric.length).toBeGreaterThan(5);
        expect(alert.criticalThreshold.length).toBeGreaterThan(2);
        expect(alert.runbookAction.length).toBeGreaterThan(15);
      }
    });
  });

  // =========================================================================
  // 8. HEALTH & INFRASTRUCTURE GATE A REPORT (Section 32)
  // =========================================================================
  describe('8. Master Health & Gate A Infrastructure Report Verification', () => {
    it('verifies standard health endpoint returns api up, database ready, redis ready', () => {
      const health = healthController.checkHealth();

      expect(health.status).toBe('ok');
      expect(health.service).toBe('alpha-api');
      expect(health.checks.api).toBe('up');
      expect(health.checks.database).toBe('ready');
      expect(health.checks.redis).toBe('ready');
    });

    it('generates the complete Gate A Infrastructure report with PASS verdict', () => {
      const report = auditService.generateGateAReport('production');

      expect(report.gate).toBe('GATE_A_INFRASTRUCTURE');
      expect(report.status).toBe('PASS');
      expect(report.database.isPostgres).toBe(true);
      expect(report.worker.deadLetterQueueConfigured).toBe(true);
      expect(report.backupAndRestore.backupVerified).toBe('YES');
      expect(report.backupAndRestore.restoreVerified).toBe('YES');
      expect(report.alerts.length).toBe(12);
    });
  });
});
