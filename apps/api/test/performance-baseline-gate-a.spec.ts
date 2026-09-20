import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrivacyService } from '../src/modules/privacy/privacy.service';
import { AnalyticsCacheService } from '../src/modules/analytics/services/analytics-cache.service';
import { AnalyticsMathService } from '../src/modules/analytics/services/analytics-math.service';
import { KpiCatalogService } from '../src/modules/analytics/services/kpi-catalog.service';
import { ReportsService } from '../src/modules/analytics/services/reports.service';
import { AnalyticsAggregationService } from '../src/modules/analytics/services/analytics-aggregation.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { AiRateLimiterService } from '../src/modules/ai/ai-rate-limiter.service';
import { PrismaService } from '../src/modules/database/prisma.service';
import {
  RateLimiter,
  FileSecurityUtil,
  WebhookSecurityUtil,
  ExportChecksumUtil,
  RbacUtil,
  globalRateLimiter,
} from '@alpha/utils';
import {
  UserRole,
  EnterprisePermission,
  SecurityAuditEventType,
} from '@alpha/types';

interface LatencySample {
  name: string;
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  opsPerSec: number;
  errorRate: number;
}

function calculatePercentiles(samples: number[]): { p50: number; p95: number; p99: number; min: number; max: number } {
  if (samples.length === 0) return { p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)]!;
  const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
  const p99 = sorted[Math.floor(sorted.length * 0.99)]!;
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  return { p50, p95, p99, min, max };
}

describe('Phase 13 — Gate A: Performance Baseline & Resource Profiling Harness', () => {
  let authService: AuthService;
  let privacyService: PrivacyService;
  let cacheService: AnalyticsCacheService;
  let mathService: AnalyticsMathService;
  let kpiCatalog: KpiCatalogService;
  let reportsService: ReportsService;
  let queueService: QueueService;
  let aiRateLimiter: AiRateLimiterService;

  const baselineResults: Record<string, LatencySample> = {};

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user_1', email: 'test@alpha.os', profile: { fullName: 'Test User' } }),
    },
    report: {
      create: jest.fn().mockResolvedValue({ id: 'rep_1', status: 'COMPLETED' }),
    },
    kPIDefinition: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    coachClientRelationship: {
      findFirst: jest.fn().mockResolvedValue({ id: 'rel_1', isActive: true, status: 'ACTIVE' }),
    },
    program: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockAggregation = {
    getClientAnalyticsSummary: jest.fn().mockResolvedValue({
      workout: { totalPlanned: 10, totalCompleted: 9, adherencePercentage: 90 },
      nutrition: { daysLogged: 7, adherencePercentage: 85 },
      activity: { averageDailySteps: 10000, activeDays: 7 },
      progress: { weightTrend: -0.5, bodyFatTrend: -0.2 },
    }),
    getCoachAnalyticsSummary: jest.fn().mockResolvedValue({
      workload: { totalActiveClients: 15 },
      overallWorkoutAdherence: 88,
      overallNutritionAdherence: 82,
      clientAdherenceList: [],
    }),
    getOrganizationOverview: jest.fn().mockResolvedValue({
      totalClients: { value: 100 },
      activeClients: { value: 95 },
      workoutAdherence: { value: 89 },
      nutritionAdherence: { value: 83 },
      averageWeeklyActivityDays: { value: 5 },
      newClients: { value: 12 },
      totalCoaches: 8,
    }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'perf_baseline_test_jwt_secret_min_32_chars_long',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        AuthService,
        PrivacyService,
        AnalyticsCacheService,
        AnalyticsMathService,
        KpiCatalogService,
        ReportsService,
        QueueService,
        AiRateLimiterService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AnalyticsAggregationService, useValue: mockAggregation },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    privacyService = module.get<PrivacyService>(PrivacyService);
    cacheService = module.get<AnalyticsCacheService>(AnalyticsCacheService);
    mathService = module.get<AnalyticsMathService>(AnalyticsMathService);
    kpiCatalog = module.get<KpiCatalogService>(KpiCatalogService);
    reportsService = module.get<ReportsService>(ReportsService);
    queueService = module.get<QueueService>(QueueService);
    aiRateLimiter = module.get<AiRateLimiterService>(AiRateLimiterService);
  });

  async function benchmarkAsync(
    name: string,
    iterations: number,
    fn: (i: number) => Promise<void>,
  ): Promise<LatencySample> {
    const samples: number[] = [];
    let errors = 0;
    const startAll = performance.now();

    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      try {
        await fn(i);
      } catch {
        errors++;
      }
      const t1 = performance.now();
      samples.push(t1 - t0);
    }

    const durationAllMs = performance.now() - startAll;
    const { p50, p95, p99, min, max } = calculatePercentiles(samples);
    const opsPerSec = Math.round((iterations / (durationAllMs / 1000)) * 10) / 10;

    const result: LatencySample = {
      name,
      count: iterations,
      totalMs: Math.round(durationAllMs * 100) / 100,
      minMs: Math.round(min * 100) / 100,
      maxMs: Math.round(max * 100) / 100,
      p50Ms: Math.round(p50 * 100) / 100,
      p95Ms: Math.round(p95 * 100) / 100,
      p99Ms: Math.round(p99 * 100) / 100,
      opsPerSec,
      errorRate: Math.round((errors / iterations) * 10000) / 100,
    };

    baselineResults[name] = result;
    return result;
  }

  function benchmarkSync(
    name: string,
    iterations: number,
    fn: (i: number) => void,
  ): LatencySample {
    const samples: number[] = [];
    let errors = 0;
    const startAll = performance.now();

    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      try {
        fn(i);
      } catch {
        errors++;
      }
      const t1 = performance.now();
      samples.push(t1 - t0);
    }

    const durationAllMs = performance.now() - startAll;
    const { p50, p95, p99, min, max } = calculatePercentiles(samples);
    const opsPerSec = Math.round((iterations / (durationAllMs / 1000)) * 10) / 10;

    const result: LatencySample = {
      name,
      count: iterations,
      totalMs: Math.round(durationAllMs * 100) / 100,
      minMs: Math.round(min * 100) / 100,
      maxMs: Math.round(max * 100) / 100,
      p50Ms: Math.round(p50 * 100) / 100,
      p95Ms: Math.round(p95 * 100) / 100,
      p99Ms: Math.round(p99 * 100) / 100,
      opsPerSec,
      errorRate: Math.round((errors / iterations) * 10000) / 100,
    };

    baselineResults[name] = result;
    return result;
  }

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & SESSION BASELINE
  // -------------------------------------------------------------
  describe('1. Auth & Session Subsystem Baseline', () => {
    it('measures registration throughput and password hashing (scrypt)', async () => {
      const sample = await benchmarkAsync('auth_register_scrypt', 30, async (i) => {
        await authService.register({
          email: `bench_user_${i}@alpha.os`,
          password: `P@ssword123!_${i}`,
          fullName: `Benchmark Athlete ${i}`,
        });
      });

      expect(sample.count).toBe(30);
      expect(sample.errorRate).toBe(0);
      expect(sample.p50Ms).toBeGreaterThan(0);
    });

    it('measures login verification, JWT generation & session creation', async () => {
      const sample = await benchmarkAsync('auth_login_jwt', 30, async (i) => {
        await authService.login({
          email: `bench_user_${i}@alpha.os`,
          password: `P@ssword123!_${i}`,
        });
      });

      expect(sample.errorRate).toBe(0);
      expect(sample.p50Ms).toBeGreaterThan(0);
    });

    it('measures active session retrieval latency', async () => {
      const sample = await benchmarkAsync('auth_get_sessions', 100, async () => {
        await authService.getActiveSessions('bench_user_0');
      });

      expect(sample.errorRate).toBe(0);
      expect(sample.p50Ms).toBeLessThan(5); // In-memory session lookup is ultra-fast
    });
  });

  // -------------------------------------------------------------
  // 2. ANALYTICS, MATHEMATICS & AGGREGATION BASELINE
  // -------------------------------------------------------------
  describe('2. Analytics & Reporting Subsystem Baseline', () => {
    it('measures safe division, bounded percentage, and period comparison math', () => {
      const sample = benchmarkSync('analytics_math_computations', 5000, (i) => {
        mathService.safeDivide(i * 100, (i % 7) * 5 + 1);
        mathService.calculatePercentage(120 + (i % 50), 200);
        mathService.comparePeriods(85.5 + (i % 5), 80.0, true);
        mathService.validateQuality('WORKOUT_VOLUME', 1500 + i, false);
      });

      expect(sample.count).toBe(5000);
      expect(sample.p99Ms).toBeLessThan(1);
    });

    it('measures KPI catalog resolution across categories', () => {
      const sample = benchmarkSync('analytics_kpi_catalog_resolve', 1000, () => {
        kpiCatalog.getAllDefinitions();
        kpiCatalog.getAllDefinitions('WORKOUT');
        kpiCatalog.getAllDefinitions('NUTRITION');
        kpiCatalog.getDefinition('WORKOUT_ADHERENCE');
      });

      expect(sample.errorRate).toBe(0);
      expect(sample.p99Ms).toBeLessThan(2);
    });

    it('measures reports CSV and JSON serialization throughput', () => {
      const sampleData = {
        title: 'Quarterly Executive Summary',
        period: '2026-01-01 to 2026-03-31',
        generatedAt: new Date().toISOString(),
        scope: 'CLIENT',
        workout: {
          totalPlanned: 40,
          totalCompleted: 38,
          adherencePercentage: 95.0,
          totalVolumeKg: 45000,
          totalDurationMinutes: 2400,
          prsAchieved: 5,
        },
        nutrition: {
          daysLogged: 85,
          adherencePercentage: 92.5,
          averageCalories: 2650,
          averageProteinGrams: 185,
        },
        activity: {
          activeDaysCount: 80,
          averageSteps: 11200,
          totalCardioMinutes: 1400,
        },
        progress: {
          currentWeightKg: 82.5,
          weightDeltaKg: -2.1,
          weightTrend: 'PROGRESSING_TOWARDS_GOAL',
        },
      };

      const sample = benchmarkSync('reports_serialization_csv_json', 1000, () => {
        reportsService.formatAsCsv(sampleData, 'CLIENT_PROGRESS');
        JSON.stringify(sampleData);
      });

      expect(sample.errorRate).toBe(0);
      expect(sample.opsPerSec).toBeGreaterThan(1000);
    });
  });

  // -------------------------------------------------------------
  // 3. CACHING, REDIS & WORKER QUEUE BASELINE
  // -------------------------------------------------------------
  describe('3. Cache & Queue Processing Subsystem Baseline', () => {
    it('measures cache key read/write latency and tag invalidation', async () => {
      const sample = await benchmarkAsync('cache_read_write_invalidation', 500, async (i) => {
        const key = `user_telemetry_${i % 20}`;
        await cacheService.set(key, { speed: 12.5, hr: 142, power: 250 }, 60, ['telemetry', 'athlete']);
        await cacheService.get(key);
        if (i % 50 === 0) {
          await cacheService.invalidateTag('telemetry');
        }
      });

      expect(sample.errorRate).toBe(0);
    });

    it('measures Redis-backed QueueService enqueue throughput', async () => {
      const sample = await benchmarkAsync('queue_enqueue_throughput', 100, async (i) => {
        await queueService.addJob('DAILY_ANALYTICS_AGGREGATION', 'Daily Aggregation', {
          userId: `user_queue_${i}`,
          date: '2026-06-15',
        });
      });

      expect(sample.errorRate).toBe(0);
      expect(sample.opsPerSec).toBeGreaterThan(500);
    });
  });

  // -------------------------------------------------------------
  // 4. SECURITY, CRYPTOGRAPHY & PRIVACY BASELINE
  // -------------------------------------------------------------
  describe('4. Security & Cryptographic Subsystem Baseline', () => {
    it('measures sliding-window RateLimiter check throughput', () => {
      const limiter = new RateLimiter();
      const sample = benchmarkSync('security_rate_limiter_check', 5000, (i) => {
        limiter.check(`client_ip_${i % 100}`, 120, 60);
      });

      expect(sample.opsPerSec).toBeGreaterThan(10000);
    });

    it('measures AI rate limiter sliding window checks', () => {
      const sample = benchmarkSync('security_ai_rate_limiter_check', 2000, (i) => {
        aiRateLimiter.checkRateLimit(`bench_user_${i % 100}`);
      });

      expect(sample.opsPerSec).toBeGreaterThan(10000);
    });

    it('measures RBAC permission evaluation throughput', () => {
      const sample = benchmarkSync('security_rbac_permission_eval', 5000, () => {
        RbacUtil.hasPermission(UserRole.COACH, EnterprisePermission.MANAGE_CLIENT_PROGRAM);
        RbacUtil.hasPermission(UserRole.ATHLETE, EnterprisePermission.MANAGE_ORG_SETTINGS);
        RbacUtil.hasPermission(UserRole.ORG_ADMIN, EnterprisePermission.AUDIT_LOG_READ);
      });

      expect(sample.opsPerSec).toBeGreaterThan(10000);
    });

    it('measures binary magic byte verification throughput (JPEG, PNG, WebP, PDF)', () => {
      const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const pdfBuf = Buffer.from('%PDF-1.4\n%test');

      const sample = benchmarkSync('security_magic_bytes_verify', 5000, () => {
        FileSecurityUtil.validateMagicBytes(jpegBuf, 'image/jpeg');
        FileSecurityUtil.validateMagicBytes(pngBuf, 'image/png');
        FileSecurityUtil.validateMagicBytes(pdfBuf, 'application/pdf');
      });

      expect(sample.opsPerSec).toBeGreaterThan(10000);
    });

    it('measures HMAC-SHA256 webhook signature computation and timing-safe verification', () => {
      const payload = JSON.stringify({ event: 'telemetry.sync', timestamp: 1789798000 });
      const secret = 'bench_webhook_secret_key_123';

      const sample = benchmarkSync('security_webhook_hmac_verify', 2000, () => {
        const sig = WebhookSecurityUtil.generateSignature(payload, secret);
        WebhookSecurityUtil.verifySignature(payload, sig, secret);
      });

      expect(sample.opsPerSec).toBeGreaterThan(5000);
    });

    it('measures cryptographic audit log SHA-256 hash chaining and chain verification', () => {
      const sample = benchmarkSync('security_audit_hash_chaining', 1000, (i) => {
        privacyService.logAuditEvent({
          eventType: SecurityAuditEventType.USER_LOGIN,
          actorId: `athlete_${i}`,
          actorRole: 'ATHLETE',
          details: { sampleIndex: i },
        });
      });

      expect(sample.opsPerSec).toBeGreaterThan(2000);

      // Verify the entire 1000-event cryptographic chain
      const verifyRes = privacyService.verifyAuditLogIntegrity();
      expect(verifyRes.isValid).toBe(true);
      expect(verifyRes.totalEvents).toBe(1000);
    });

    it('measures deterministic deep canonical checksum generation & verification for portability exports', async () => {
      const sample = await benchmarkAsync('security_data_portability_checksum', 50, async () => {
        globalRateLimiter.reset('export:athlete_privacy_001');
        const bundle = await privacyService.generateDataPortabilityBundle('athlete_privacy_001');
        ExportChecksumUtil.verifyBundle(bundle);
      });

      expect(sample.errorRate).toBe(0);
      expect(sample.p50Ms).toBeLessThan(10);
    });
  });

  // -------------------------------------------------------------
  // 5. PRINT CONSOLIDATED BENCHMARK REPORT
  // -------------------------------------------------------------
  afterAll(() => {
    console.log('\n========================================================================================');
    console.log('                 PHASE 13 GATE A — MEASURED PERFORMANCE BASELINE PROFILE                 ');
    console.log('========================================================================================');
    console.log(
      'Operation'.padEnd(38) +
        'Count'.padStart(7) +
        'p50(ms)'.padStart(10) +
        'p95(ms)'.padStart(10) +
        'p99(ms)'.padStart(10) +
        'Ops/sec'.padStart(11) +
        'Errors'.padStart(8),
    );
    console.log('-'.repeat(94));

    for (const [name, s] of Object.entries(baselineResults)) {
      console.log(
        name.padEnd(38) +
          String(s.count).padStart(7) +
          String(s.p50Ms.toFixed(2)).padStart(10) +
          String(s.p95Ms.toFixed(2)).padStart(10) +
          String(s.p99Ms.toFixed(2)).padStart(10) +
          String(s.opsPerSec.toFixed(1)).padStart(11) +
          (s.errorRate > 0 ? `${s.errorRate}%` : '0%').padStart(8),
      );
    }
    console.log('========================================================================================\n');
  });
});
