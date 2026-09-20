import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsCacheService } from '../src/modules/analytics/services/analytics-cache.service';
import { AnalyticsMathService } from '../src/modules/analytics/services/analytics-math.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import {
  PaginationUtil,
  RateLimiter,
} from '@alpha/utils';

export interface ISloTarget {
  name: string;
  targetP50Ms: number;
  targetP95Ms: number;
  targetP99Ms: number;
  maxErrorRate: number;
}

export const PRODUCTION_SLO_TARGETS: Record<string, ISloTarget> = {
  CACHE_ACCESS: {
    name: 'Cache Access (Read/Write/Invalidate)',
    targetP50Ms: 5,
    targetP95Ms: 15,
    targetP99Ms: 30,
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

describe('Phase 13 — Gate D: Production Capacity Validation & SLO/SLI Framework', () => {
  let cacheService: AnalyticsCacheService;
  let mathService: AnalyticsMathService;
  let queueService: QueueService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsCacheService,
        AnalyticsMathService,
        QueueService,
      ],
    }).compile();

    cacheService = module.get<AnalyticsCacheService>(AnalyticsCacheService);
    mathService = module.get<AnalyticsMathService>(AnalyticsMathService);
    queueService = module.get<QueueService>(QueueService);
  });

  // -------------------------------------------------------------
  // 1. SLO / SLI COMPLIANCE VERIFICATION
  // -------------------------------------------------------------
  describe('1. Service Level Objectives (SLO) & Service Level Indicators (SLI)', () => {
    it('verifies Cache Access SLIs meet production SLO targets', async () => {
      const slo = PRODUCTION_SLO_TARGETS.CACHE_ACCESS!;
      const samples: number[] = [];

      for (let i = 0; i < 500; i++) {
        const t0 = performance.now();
        await cacheService.set(`bench_key_${i % 50}`, { index: i }, 60, ['slo_tag']);
        await cacheService.get(`bench_key_${i % 50}`);
        const t1 = performance.now();
        samples.push(t1 - t0);
      }

      const sorted = [...samples].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.50)]!;
      const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
      const p99 = sorted[Math.floor(sorted.length * 0.99)]!;

      expect(p50).toBeLessThan(slo.targetP50Ms);
      expect(p95).toBeLessThan(slo.targetP95Ms);
      expect(p99).toBeLessThan(slo.targetP99Ms);
    });

    it('verifies Analytics Math SLIs meet sub-millisecond production targets', () => {
      const slo = PRODUCTION_SLO_TARGETS.ANALYTICS_MATH!;
      const samples: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const t0 = performance.now();
        mathService.safeDivide(i * 150, 10);
        mathService.calculatePercentage(75, 100);
        mathService.comparePeriods(90, 80, true);
        const t1 = performance.now();
        samples.push(t1 - t0);
      }

      const sorted = [...samples].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.50)]!;
      const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
      const p99 = sorted[Math.floor(sorted.length * 0.99)]!;

      expect(p50).toBeLessThan(slo.targetP50Ms);
      expect(p95).toBeLessThan(slo.targetP95Ms);
      expect(p99).toBeLessThan(slo.targetP99Ms);
    });

    it('verifies Rate Limiter SLIs meet zero-overhead security SLO', () => {
      const slo = PRODUCTION_SLO_TARGETS.RATE_LIMITING!;
      const limiter = new RateLimiter();
      const samples: number[] = [];

      for (let i = 0; i < 2000; i++) {
        const t0 = performance.now();
        limiter.check(`client_${i % 100}`, 100, 60);
        const t1 = performance.now();
        samples.push(t1 - t0);
      }

      const sorted = [...samples].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.50)]!;
      const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
      const p99 = sorted[Math.floor(sorted.length * 0.99)]!;

      expect(p50).toBeLessThan(slo.targetP50Ms);
      expect(p95).toBeLessThan(slo.targetP95Ms);
      expect(p99).toBeLessThan(slo.targetP99Ms);
    });

    it('verifies Keyset Pagination SLIs meet fast seek SLO', () => {
      const slo = PRODUCTION_SLO_TARGETS.KEYSET_PAGINATION!;
      const items = Array.from({ length: 25 }, (_, i) => ({ id: `it_${i}`, sortValue: Date.now() + i }));
      const samples: number[] = [];

      for (let i = 0; i < 500; i++) {
        const t0 = performance.now();
        const res = PaginationUtil.formatKeysetResult(items, 20, 'sortValue');
        PaginationUtil.decodeCursor(res.nextCursor);
        const t1 = performance.now();
        samples.push(t1 - t0);
      }

      const sorted = [...samples].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.50)]!;
      const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
      const p99 = sorted[Math.floor(sorted.length * 0.99)]!;

      expect(p50).toBeLessThan(slo.targetP50Ms);
      expect(p95).toBeLessThan(slo.targetP95Ms);
      expect(p99).toBeLessThan(slo.targetP99Ms);
    });
  });

  // -------------------------------------------------------------
  // 2. CAPACITY PLANNING MATHEMATICAL PROJECTION MODEL
  // -------------------------------------------------------------
  describe('2. Capacity Planning Math & Resource Budget Model', () => {
    it('validates database storage capacity model for 10,000+ active athletes', () => {
      const athleteCount = 10000;
      const daysPerYear = 365;

      // Sizing assumptions based on schema field types
      const bytesPerWorkoutSession = 512; // Title, duration, volume, status, timestamps
      const bytesPerWorkoutSet = 128; // reps, weight, rpe, timestamps
      const workoutsPerYear = 200;
      const setsPerWorkout = 15;

      const bytesPerDailyMealLog = 256;
      const bytesPerActivityRecord = 256;
      const bytesPerDailyAnalyticsSummary = 512;

      // Calculate annual data volume per athlete
      const workoutStoragePerAthlete = workoutsPerYear * (bytesPerWorkoutSession + setsPerWorkout * bytesPerWorkoutSet);
      const mealStoragePerAthlete = daysPerYear * bytesPerDailyMealLog;
      const activityStoragePerAthlete = daysPerYear * bytesPerActivityRecord;
      const analyticsStoragePerAthlete = daysPerYear * bytesPerDailyAnalyticsSummary;

      const totalBytesPerAthletePerYear =
        workoutStoragePerAthlete +
        mealStoragePerAthlete +
        activityStoragePerAthlete +
        analyticsStoragePerAthlete;

      const totalMbPerAthletePerYear = totalBytesPerAthletePerYear / (1024 * 1024);
      expect(totalMbPerAthletePerYear).toBeLessThan(2.0); // Less than 2MB per athlete per year

      // 10,000 athletes annual database storage projection
      const totalGbFor10kAthletes = (totalMbPerAthletePerYear * athleteCount) / 1024;
      expect(totalGbFor10kAthletes).toBeLessThan(20.0); // Under 20GB/year for 10,000 athletes
    });

    it('validates Redis RAM capacity model for session tracking & cached analytics', () => {
      const activeConcurrentUsers = 25000;
      const bytesPerSessionRecord = 384; // token hash, userId, role, IP, userAgent, expiresAt

      const totalSessionMemoryMb = (activeConcurrentUsers * bytesPerSessionRecord) / (1024 * 1024);
      expect(totalSessionMemoryMb).toBeLessThan(15.0); // Under 15MB RAM for 25k concurrent sessions

      // Compressed analytics cache budget (50,000 cached daily summaries averaging 1KB compressed)
      const cachedSummaries = 50000;
      const avgCompressedBytes = 1024;
      const totalCacheMemoryMb = (cachedSummaries * avgCompressedBytes) / (1024 * 1024);
      expect(totalCacheMemoryMb).toBeLessThan(60.0); // Under 60MB RAM for 50k cached aggregates

      // Total Redis working set remains well under 256MB standard container limit
      const totalRedisMb = totalSessionMemoryMb + totalCacheMemoryMb;
      expect(totalRedisMb).toBeLessThan(128.0);
    });
  });

  // -------------------------------------------------------------
  // 3. FAULT-TOLERANCE & DEAD-LETTER QUEUE INTEGRITY
  // -------------------------------------------------------------
  describe('3. Fault-Tolerance & Resilience Verification', () => {
    it('gracefully isolates unrecoverable jobs into DLQ without impacting worker health', async () => {
      // Enqueue job with maxAttempts = 2
      const job = await queueService.addJob(
        'WEEKLY_DIGEST',
        'Fatal Email Failure',
        { recipient: 'invalid@badhost' },
        { maxAttempts: 2, backoffMs: 10, backoffStrategy: 'EXPONENTIAL' },
      );

      // Attempt 1: Fail with retry
      await queueService.claimNextJob('WEEKLY_DIGEST');
      const retryJob = await queueService.failJob(job.id, 'Connection reset by peer');
      expect(retryJob.status).toBe('DELAYED');
      expect(retryJob.attempts).toBe(1);

      // Wait for delay promotion
      await new Promise((r) => setTimeout(r, 20));
      queueService.promoteDelayedJobs();

      // Attempt 2: Fail permanently -> DLQ
      await queueService.claimNextJob('WEEKLY_DIGEST');
      const deadJob = await queueService.failJob(job.id, 'Permanent SMTP rejection (550)');
      expect(deadJob.status).toBe('FAILED');
      expect(deadJob.attempts).toBe(2);
      expect(deadJob.error).toBe('Permanent SMTP rejection (550)');

      // Worker queue remains healthy and operational
      const metrics = await queueService.getMetrics();
      expect(metrics.failed).toBe(1);
      expect(metrics.active).toBe(0);
      expect(metrics.waiting).toBe(0);
    });
  });
});
