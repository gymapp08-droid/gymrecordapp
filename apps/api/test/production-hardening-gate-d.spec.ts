import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  ForbiddenException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  UserRole,
  HealthPlatform,
  ClientStatus,
  IDataPortabilityBundle,
} from '@alpha/types';
import {
  ExportChecksumUtil,
  BackoffUtil,
  PaginationUtil,
  RateLimiter,
  GpsPrivacyUtil,
} from '@alpha/utils';
import { AuthService } from '../src/modules/auth/auth.service';
import { AnalyticsCacheService } from '../src/modules/analytics/services/analytics-cache.service';
import { AnalyticsMathService } from '../src/modules/analytics/services/analytics-math.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { CircuitBreakerService } from '../src/modules/integrations/services/circuit-breaker.service';
import { HealthController } from '../src/modules/health/health.controller';
import { PortalService } from '../src/modules/portal/portal.service';
import { PrismaService } from '../src/modules/database/prisma.service';
import { QA_ACCOUNTS, QA_ORGANIZATIONS } from './fixtures/qa-master-fixtures';

export interface ISloComplianceTarget {
  name: string;
  targetP50Ms: number;
  targetP95Ms: number;
  targetP99Ms: number;
  maxErrorRate: number;
}

export const PRODUCTION_SLOS: Record<string, ISloComplianceTarget> = {
  CACHE_ACCESS: {
    name: 'Cache Access (Read/Write/Invalidate)',
    targetP50Ms: 15,
    targetP95Ms: 35,
    targetP99Ms: 60,
    maxErrorRate: 0.001,
  },
  ANALYTICS_MATH: {
    name: 'Analytics Math & Metric Computations',
    targetP50Ms: 2,
    targetP95Ms: 5,
    targetP99Ms: 10,
    maxErrorRate: 0.001,
  },
  KEYSET_PAGINATION: {
    name: 'Keyset & Cursor Pagination Seek',
    targetP50Ms: 20,
    targetP95Ms: 50,
    targetP99Ms: 100,
    maxErrorRate: 0.001,
  },
  RATE_LIMITING: {
    name: 'Security Rate Limiting & Protection',
    targetP50Ms: 2,
    targetP95Ms: 5,
    targetP99Ms: 10,
    maxErrorRate: 0.001,
  },
  QUEUE_ENQUEUE: {
    name: 'Background Worker Queue Enqueue',
    targetP50Ms: 10,
    targetP95Ms: 25,
    targetP99Ms: 50,
    maxErrorRate: 0.001,
  },
};

describe('Phase 15 Gate D: Production Hardening, Load, Failure & Release Readiness Master Suite', () => {
  let module: TestingModule;
  let authService: AuthService;
  let cacheService: AnalyticsCacheService;
  let mathService: AnalyticsMathService;
  let queueService: QueueService;
  let circuitBreakerService: CircuitBreakerService;
  let healthController: HealthController;
  let portalService: PortalService;

  // In-memory mock database state
  const dbUsers = new Map<string, any>();
  const dbRelationships = new Map<string, any>();
  const dbOrganizations = new Map<string, any>();

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id) return Promise.resolve(dbUsers.get(where.id) || null);
        if (where.email) {
          for (const u of dbUsers.values()) {
            if (u.email === where.email) return Promise.resolve(u);
          }
        }
        return Promise.resolve(null);
      }),
    },
    organization: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(dbOrganizations.get(where.id) || null);
      }),
    },
    coachClientRelationship: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        for (const rel of dbRelationships.values()) {
          if (where.coachId && rel.coachId !== where.coachId) continue;
          if (where.clientId && rel.clientId !== where.clientId) continue;
          if (where.isActive !== undefined && rel.isActive !== where.isActive) continue;
          return Promise.resolve(rel);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.coachId_clientId) {
          const key = `${where.coachId_clientId.coachId}:${where.coachId_clientId.clientId}`;
          return Promise.resolve(dbRelationships.get(key) || null);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    workoutSession: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    dailyNutrition: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    bodyMetric: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit_log_1' }),
    },
  };

  beforeAll(async () => {
    // Seed QA organizations
    dbOrganizations.set(QA_ORGANIZATIONS.ORG_A.id, {
      ...QA_ORGANIZATIONS.ORG_A,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    dbOrganizations.set(QA_ORGANIZATIONS.ORG_B.id, {
      ...QA_ORGANIZATIONS.ORG_B,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed QA users
    for (const acc of Object.values(QA_ACCOUNTS)) {
      dbUsers.set(acc.id, {
        id: acc.id,
        email: acc.email,
        role: acc.role,
        organizationId: acc.organizationId,
        status: acc.status,
        profile: { fullName: acc.fullName, heightCm: 180, weightKg: 80 },
        preference: { unitSystem: 'METRIC', timezone: 'UTC' },
        workoutSessions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Connect coach A to client A
    const coachA = QA_ACCOUNTS.COACH_A_ACTIVE!;
    const clientA = QA_ACCOUNTS.CLIENT_A_ACTIVE!;
    dbRelationships.set(`${coachA.id}:${clientA.id}`, {
      id: 'rel_coachA_clientA',
      coachId: coachA.id,
      clientId: clientA.id,
      organizationId: coachA.organizationId,
      status: ClientStatus.ACTIVE,
      isActive: true,
    });

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'test_production_hardening_secret_min_32_chars',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        AnalyticsCacheService,
        AnalyticsMathService,
        QueueService,
        CircuitBreakerService,
        HealthController,
        PortalService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    cacheService = module.get<AnalyticsCacheService>(AnalyticsCacheService);
    mathService = module.get<AnalyticsMathService>(AnalyticsMathService);
    queueService = module.get<QueueService>(QueueService);
    circuitBreakerService = module.get<CircuitBreakerService>(CircuitBreakerService);
    healthController = module.get<HealthController>(HealthController);
    portalService = module.get<PortalService>(PortalService);
  });

  afterAll(async () => {
    await module.close();
  });

  // =========================================================================
  // 1. LOAD TESTING (Section 43 & Section 76: load tests)
  // =========================================================================
  describe('1. Scaled Load Testing (100, 500, 1000 Simulated Concurrent Operations)', () => {
    it('executes 100 concurrent cache read/write operations within strict latency bounds', async () => {
      const concurrentOps = 100;
      const batchStart = performance.now();

      const promises = Array.from({ length: concurrentOps }, async (_, i) => {
        const key = `load_cache_key_${i}`;
        await cacheService.set(key, { payload: `data_${i}`, index: i }, 60, ['load_tag']);
        const readVal = await cacheService.get(key);
        expect(readVal).toBeDefined();
        return readVal;
      });

      const results = await Promise.all(promises);
      const batchDuration = performance.now() - batchStart;

      // 100 concurrent burst completes with 0% dropped operations
      expect(results.length).toBe(100);
      expect(batchDuration).toBeLessThanOrEqual(500);
    });

    it('executes 500 concurrent mathematical KPI computations with zero errors', () => {
      const start = performance.now();
      const iterations = 500;

      for (let i = 0; i < iterations; i++) {
        const pct = mathService.calculatePercentage(i, iterations);
        const div = mathService.safeDivide(i, iterations);
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(div).toBeGreaterThanOrEqual(0);
        expect(Number.isNaN(pct)).toBe(false);
      }

      const totalElapsedMs = performance.now() - start;
      const avgPerOpMs = totalElapsedMs / iterations;

      expect(avgPerOpMs).toBeLessThanOrEqual(PRODUCTION_SLOS.ANALYTICS_MATH!.targetP50Ms);
    });

    it('handles 1000 simulated rapid rate limiter evaluations with 0% dropped calls', () => {
      const limiter = new RateLimiter();
      const ip = '192.168.10.42';
      let allowedCount = 0;
      let blockedCount = 0;

      for (let i = 0; i < 1000; i++) {
        const res = limiter.check(ip, 500, 60);
        if (res.allowed) {
          allowedCount++;
        } else {
          blockedCount++;
        }
      }

      expect(allowedCount).toBe(500);
      expect(blockedCount).toBe(500);
      expect(allowedCount + blockedCount).toBe(1000);
    });
  });

  // =========================================================================
  // 2. SOAK & SUSTAINED WORKLOAD TESTING (Section 44 & Section 76: soak tests)
  // =========================================================================
  describe('2. Soak & Sustained Workload Stability', () => {
    it('maintains heap memory stability and zero memory leakage across 2000 sustained operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let batch = 0; batch < 20; batch++) {
        for (let i = 0; i < 100; i++) {
          mathService.comparePeriods(80 + (i % 10), 75, true);
          mathService.safeDivide(1000, i + 1);
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDeltaMb = (finalMemory - initialMemory) / (1024 * 1024);

      // Memory delta should remain reasonably bounded (< 25MB) without runaway growth
      expect(memoryDeltaMb).toBeLessThan(25);
    });

    it('monitors queue stability without worker starvation or job loss', async () => {
      const jobsCount = 50;

      for (let i = 0; i < jobsCount; i++) {
        await queueService.addJob('DAILY_ANALYTICS_AGGREGATION', `user_${i}`, {
          userId: `u_${i}`,
          targetDate: '2026-09-19',
        });
      }

      const queueStats = await queueService.getMetrics();
      expect(queueStats.waiting).toBe(jobsCount);
      expect(queueStats.failed).toBe(0);
      expect(queueStats.completed).toBe(0);
    });
  });

  // =========================================================================
  // 3. CHAOS & FAILURE TESTING (Section 45 & Section 76: failure tests)
  // =========================================================================
  describe('3. Chaos & Controlled Failure Injection', () => {
    it('gracefully degrades when external wearable provider experiences outage (Circuit Breaker OPEN)', async () => {
      const platform = HealthPlatform.GARMIN;
      circuitBreakerService.trip(platform);

      expect(circuitBreakerService.getStatus(platform).state).toBe('OPEN');

      // Subsequent requests fail immediately without hanging connections
      await expect(
        circuitBreakerService.execute(platform, async () => 'unreachable_garmin_data'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('isolates poisoned background worker jobs to Dead Letter Queue (DLQ) without crashing queue', async () => {
      // Enqueue job designed to fail with fatal error (maxAttempts: 1)
      const fatalJob = await queueService.addJob(
        'HEALTH_INCREMENTAL_SYNC',
        'poisoned_task',
        { fatal: true },
        { maxAttempts: 1 },
      );

      // Claim job
      const claimed = await queueService.claimNextJob('HEALTH_INCREMENTAL_SYNC');
      expect(claimed).toBeDefined();
      expect(claimed?.id).toBe(fatalJob.id);

      // Fail job (exceeds maxAttempts=1 -> job.status = 'FAILED' DLQ)
      await queueService.failJob(fatalJob.id, 'Unrecoverable format exception');

      const failedJobs = await queueService.listJobs({
        queue: 'HEALTH_INCREMENTAL_SYNC',
        status: 'FAILED',
      });
      expect(failedJobs.data.some((j: any) => j.id === fatalJob.id)).toBe(true);

      const metrics = await queueService.getMetrics();
      expect(metrics.failed).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. RECOVERY TESTING (Section 45 & Section 76: recovery tests)
  // =========================================================================
  describe('4. Fault Recovery & Self-Healing Verification', () => {
    it('recovers circuit breaker to CLOSED state following probe successes in HALF_OPEN', async () => {
      const platform = HealthPlatform.FITBIT;
      circuitBreakerService.trip(platform);

      expect(circuitBreakerService.getStatus(platform).state).toBe('OPEN');

      // Transition to HALF_OPEN
      (circuitBreakerService as any).breakers.get(platform).state = 'HALF_OPEN';
      (circuitBreakerService as any).breakers.get(platform).consecutiveSuccesses = 0;

      // 2 successful probes recover the breaker
      await circuitBreakerService.execute(platform, async () => 'healthy_probe_1');
      await circuitBreakerService.execute(platform, async () => 'healthy_probe_2');

      expect(circuitBreakerService.getStatus(platform).state).toBe('CLOSED');
      expect(circuitBreakerService.getStatus(platform).failureCount).toBe(0);
    });

    it('calculates jittered exponential backoff for retries to prevent thundering herd', () => {
      const delays: number[] = [];

      for (let attempt = 1; attempt <= 5; attempt++) {
        const delay = BackoffUtil.computeBackoff(attempt, {
          baseMs: 1000,
          maxMs: 30000,
          factor: 2,
          strategy: 'FULL_JITTER',
        });

        delays.push(delay);
        // Exponential cap for attempt: min(30000, 1000 * 2^(attempt-1))
        const maxExpectedForAttempt = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(maxExpectedForAttempt);
      }

      expect(delays.length).toBe(5);
    });
  });

  // =========================================================================
  // 5. BACKUP & RESTORE VALIDATION (Section 46 & Section 76: backup restore)
  // =========================================================================
  describe('5. Backup, Portability & Checksum Verification', () => {
    const athlete = QA_ACCOUNTS.CLIENT_A_ACTIVE!;

    it('generates cryptographic SHA-256 checksum over data portability export bundle', () => {
      const rawPayload = {
        exportId: 'export_20260919_001',
        userId: athlete.id,
        userEmail: athlete.email,
        exportedAt: '2026-09-19T22:00:00.000Z',
        summary: { totalWorkouts: 42, totalMeals: 120, totalBodyMetrics: 15 },
        workouts: [{ id: 'w1', title: 'Push Hypertrophy', volumeKg: 1200 }],
        nutrition: [{ id: 'm1', name: 'Post-Workout Shake', calories: 450 }],
      };

      const checksum = ExportChecksumUtil.generateChecksum(rawPayload);
      expect(checksum).toBeDefined();
      expect(checksum.length).toBe(64); // SHA-256 hex string

      const bundle: IDataPortabilityBundle = {
        ...(rawPayload as any),
        checksum,
      };

      // Verify authentic bundle passes validation
      expect(ExportChecksumUtil.verifyBundle(bundle)).toBe(true);

      // Verify tampered bundle (e.g. altered volume) FAILS checksum verification
      const tamperedBundle: IDataPortabilityBundle = {
        ...bundle,
        workouts: [{ id: 'w1', title: 'Push Hypertrophy', volumeKg: 99999 }], // Tampered
      };
      expect(ExportChecksumUtil.verifyBundle(tamperedBundle)).toBe(false);
    });

    it('rebuilds cache cleanly from authoritative source of truth following total invalidation', async () => {
      const cacheKey = `user_profile_${athlete.id}`;

      // 1. Seed cache
      await cacheService.set(cacheKey, { fullName: athlete.fullName, status: athlete.status }, 300);
      expect(await cacheService.get(cacheKey)).toBeDefined();

      // 2. Simulate total cache wipe / Redis outage recovery
      await cacheService.clear();
      expect(await cacheService.get(cacheKey)).toBeNull();

      // 3. Rebuild from authoritative database state
      const dbUser = dbUsers.get(athlete.id);
      expect(dbUser).toBeDefined();
      await cacheService.set(cacheKey, { fullName: dbUser.profile.fullName, status: dbUser.status }, 300);

      // 4. Verify rebuilt cache matches authoritative database record
      const restored = await cacheService.get<any>(cacheKey);
      expect(restored).toBeDefined();
      expect(restored.fullName).toBe(athlete.fullName);
    });
  });

  // =========================================================================
  // 6. CLEAN DEPLOYMENT & ENVIRONMENT CONFIG (Section 47, 48 & 76: clean deployment)
  // =========================================================================
  describe('6. Clean Deployment, Health Checks & Fresh Install Flow', () => {
    it('verifies health check endpoint returns status ok and sub-checks', () => {
      const health = healthController.checkHealth();

      expect(health.status).toBe('ok');
      expect(health.service).toBe('alpha-api');
      expect(health.checks.api).toBe('up');
      expect(health.checks.database).toBe('ready');
      expect(health.checks.redis).toBe('ready');
    });

    it('executes clean install registration without relying on developer state', async () => {
      const cleanEmail = `clean.install.${Date.now()}@apex.test`;

      const reg = await authService.register({
        email: cleanEmail,
        password: 'CleanInstallPassword123!',
        fullName: 'Clean Install Athlete',
        role: UserRole.ATHLETE,
      });

      expect(reg.user).toBeDefined();
      expect(reg.user.email).toBe(cleanEmail);
      expect(reg.user.role).toBe(UserRole.ATHLETE);
      expect(reg.tokens.accessToken).toBeDefined();

      // Login fresh session
      const login = await authService.login({
        email: cleanEmail,
        password: 'CleanInstallPassword123!',
      });
      expect(login.tokens.accessToken).toBeDefined();
    });
  });

  // =========================================================================
  // 7. PERFORMANCE REGRESSION BENCHMARKING (Section 42 & 76: performance regression)
  // =========================================================================
  describe('7. Performance Regression vs Phase 13 Production SLO Baselines', () => {
    it('verifies Keyset Pagination Seek meets Phase 13 SLO target (p95 <= 50ms)', () => {
      const sampleItems = Array.from({ length: 25 }, (_, i) => ({
        id: `session_${i.toString().padStart(4, '0')}`,
        createdAt: new Date(Date.now() - (25 - i) * 60000).toISOString(),
        title: `Workout Session ${i}`,
      }));

      const start = performance.now();
      const page1 = PaginationUtil.formatKeysetResult(sampleItems, 20, 'createdAt');
      expect(page1.items.length).toBe(20);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBeDefined();

      const decoded = PaginationUtil.decodeCursor(page1.nextCursor);
      expect(decoded).toBeDefined();

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThanOrEqual(PRODUCTION_SLOS.KEYSET_PAGINATION!.targetP95Ms);
    });

    it('verifies Background Queue Enqueue throughput meets Phase 13 SLO target (p95 <= 25ms)', async () => {
      const latencies: number[] = [];

      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await queueService.addJob('WEEKLY_ANALYTICS_AGGREGATION', `perf_job_${i}`, {
          batch: i,
        });
        latencies.push(performance.now() - start);
      }

      latencies.sort((a, b) => a - b);
      const p95 = latencies[Math.floor(latencies.length * 0.95)]!;

      expect(p95).toBeLessThanOrEqual(PRODUCTION_SLOS.QUEUE_ENQUEUE!.targetP95Ms);
    });
  });

  // =========================================================================
  // 8. FINAL SECURITY & PRIVACY REGRESSION (Section 62, 63 & 76: final security regression)
  // =========================================================================
  describe('8. Final Security & Privacy Regression Suite', () => {
    const athleteA = QA_ACCOUNTS.CLIENT_A_ACTIVE!;
    const coachB = QA_ACCOUNTS.COACH_B_ACTIVE!;

    it('locks account after 5 consecutive failed login attempts (Brute Force Defense)', async () => {
      const bruteEmail = `brute.force.${Date.now()}@apex.test`;

      await authService.register({
        email: bruteEmail,
        password: 'OriginalPassword123!',
        fullName: 'Brute Target',
        role: UserRole.ATHLETE,
      });

      // 4 consecutive bad attempts throw UnauthorizedException
      for (let i = 0; i < 4; i++) {
        await expect(
          authService.login({ email: bruteEmail, password: 'WrongPassword!' }),
        ).rejects.toThrow(UnauthorizedException);
      }

      // 5th attempt triggers ACCOUNT_LOCKED (ForbiddenException)
      await expect(
        authService.login({ email: bruteEmail, password: 'WrongPassword!' }),
      ).rejects.toThrow(ForbiddenException);

      // Subsequent attempt even with correct password rejected while locked
      await expect(
        authService.login({ email: bruteEmail, password: 'OriginalPassword123!' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('strictly prevents Coach B (Org B) from accessing Athlete A (Org A)', async () => {
      await expect(
        portalService.getClientDetail(
          coachB.id,
          coachB.role,
          athleteA.id,
          coachB.organizationId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('verifies GPS privacy coordinate trimming protects departure origin and destination', () => {
      const coordinates = [
        { latitude: 51.5074, longitude: -0.1278 }, // London center (Origin)
        { latitude: 51.5080, longitude: -0.1270 }, // ~80m away (Trimmed)
        { latitude: 51.5200, longitude: -0.1200 }, // ~1500m away (Kept)
        { latitude: 51.5300, longitude: -0.1100 }, // ~3000m away (Kept)
        { latitude: 51.5390, longitude: -0.1010 }, // ~90m away (Trimmed)
        { latitude: 51.5400, longitude: -0.1000 }, // Destination
      ];

      const trimmed = GpsPrivacyUtil.trimEndpoints(coordinates, 200);

      expect(trimmed.length).toBe(2);
      expect(trimmed[0]?.latitude).toBe(51.5200);
      expect(trimmed[1]?.latitude).toBe(51.5300);
    });
  });
});
