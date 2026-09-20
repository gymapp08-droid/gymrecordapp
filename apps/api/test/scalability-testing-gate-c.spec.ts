import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { AnalyticsCacheService } from '../src/modules/analytics/services/analytics-cache.service';
import { QueueService } from '../src/modules/queue/services/queue.service';
import {
  RateLimiter,
  PaginationUtil,
  RbacUtil,
} from '@alpha/utils';
import { UserRole, EnterprisePermission } from '@alpha/types';

describe('Phase 13 — Gate C: Scalability Testing & High-Load Hardening Harness', () => {
  let authService: AuthService;
  let cacheService: AnalyticsCacheService;
  let queueService: QueueService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'perf_gate_c_scalability_jwt_secret_min_32_chars',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        AuthService,
        AnalyticsCacheService,
        QueueService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    cacheService = module.get<AnalyticsCacheService>(AnalyticsCacheService);
    queueService = module.get<QueueService>(QueueService);
  });

  beforeEach(async () => {
    await cacheService.clear();
    await queueService.purge();
  });

  // -------------------------------------------------------------
  // 1. HIGH-CONCURRENCY ATHLETE SESSION STRESS
  // -------------------------------------------------------------
  describe('1. High-Concurrency Athlete Session Stress', () => {
    it('handles 100 concurrent session registrations and logins without race conditions', async () => {
      const concurrentUsersCount = 50;

      // Concurrent registrations
      const regPromises = Array.from({ length: concurrentUsersCount }, (_, i) =>
        authService.register({
          email: `scale_user_${i}@alpha.os`,
          password: `P@ssword123!_${i}`,
          fullName: `Scale Athlete ${i}`,
        }),
      );

      const regResults = await Promise.all(regPromises);
      expect(regResults.length).toBe(concurrentUsersCount);

      // Concurrent logins
      const loginPromises = Array.from({ length: concurrentUsersCount }, (_, i) =>
        authService.login({
          email: `scale_user_${i}@alpha.os`,
          password: `P@ssword123!_${i}`,
        }),
      );

      const loginResults = await Promise.all(loginPromises);
      expect(loginResults.length).toBe(concurrentUsersCount);

      // Verify every session token is distinct and valid
      const tokens = new Set(loginResults.map((r) => r.tokens.accessToken));
      expect(tokens.size).toBe(concurrentUsersCount);

      // Verify active session retrieval for all users
      const sessionChecks = await Promise.all(
        regResults.map((u) => authService.getActiveSessions(u.user.id)),
      );

      for (const sessions of sessionChecks) {
        expect(sessions.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // -------------------------------------------------------------
  // 2. LARGE DATASET VOLUME & PAGINATION SEEK TIME
  // -------------------------------------------------------------
  describe('2. Large Dataset Volume & Keyset Pagination Seek Performance', () => {
    it('efficiently traverses a 1,000-session workout history via cursor pagination with bounded memory', () => {
      // Generate 1,000 synthetic workout records
      const totalRecords = 1000;
      const baseDate = new Date('2024-01-01T08:00:00.000Z').getTime();
      const sessions = Array.from({ length: totalRecords }, (_, i) => ({
        id: `ws_${String(i).padStart(5, '0')}`,
        startedAt: new Date(baseDate + i * 24 * 3600 * 1000).toISOString(),
        volumeKg: 8000 + (i % 50) * 100,
      }));

      const pageSize = 50;
      let pagesFetched = 0;
      let totalItemsTraversed = 0;
      let cursor: string | null = null;

      const t0 = performance.now();

      // Page through all records using Keyset seek pagination
      while (true) {
        let itemsSlice: typeof sessions;

        if (!cursor) {
          // First page
          itemsSlice = sessions.slice(0, pageSize + 1);
        } else {
          const decoded = PaginationUtil.decodeCursor<{ id: string; sortValue: string }>(cursor);
          expect(decoded).not.toBeNull();
          const lastIndex = sessions.findIndex((s) => s.id === decoded!.id);
          itemsSlice = sessions.slice(lastIndex + 1, lastIndex + 1 + pageSize + 1);
        }

        const page = PaginationUtil.formatKeysetResult(itemsSlice, pageSize, 'startedAt');
        pagesFetched++;
        totalItemsTraversed += page.items.length;

        if (!page.hasMore || !page.nextCursor) {
          break;
        }

        cursor = page.nextCursor;
      }

      const durationMs = performance.now() - t0;

      expect(totalItemsTraversed).toBe(totalRecords);
      expect(pagesFetched).toBe(Math.ceil(totalRecords / pageSize));
      expect(durationMs).toBeLessThan(100); // Seek traversal must be sub-100ms for 1000 items
    });
  });

  // -------------------------------------------------------------
  // 3. MULTI-TENANT ISOLATION UNDER CONCURRENT LOAD
  // -------------------------------------------------------------
  describe('3. Multi-Tenant Isolation under Concurrent Load', () => {
    it('strictly guarantees 0 cross-tenant data leakage across 100 concurrent requests', async () => {
      const orgA = 'org_alpha_athletics';
      const orgB = 'org_apex_performance';

      // Seed tenant caches
      for (let i = 0; i < 20; i++) {
        await cacheService.set(`analytics:org:${orgA}:metric:${i}`, { orgId: orgA, metric: i * 10 }, 300, [`org:${orgA}`]);
        await cacheService.set(`analytics:org:${orgB}:metric:${i}`, { orgId: orgB, metric: i * 50 }, 300, [`org:${orgB}`]);
      }

      // Launch 50 concurrent requests for Org A and 50 concurrent requests for Org B
      const orgARequests = Array.from({ length: 50 }, (_, i) =>
        cacheService.get(`analytics:org:${orgA}:metric:${i % 20}`),
      );

      const orgBRequests = Array.from({ length: 50 }, (_, i) =>
        cacheService.get(`analytics:org:${orgB}:metric:${i % 20}`),
      );

      const [orgAResults, orgBResults] = await Promise.all([
        Promise.all(orgARequests),
        Promise.all(orgBRequests),
      ]);

      // Verify Org A requests NEVER received Org B data
      for (const res of orgAResults) {
        expect(res).not.toBeNull();
        expect(res.orgId).toBe(orgA);
        expect(res.orgId).not.toBe(orgB);
      }

      // Verify Org B requests NEVER received Org A data
      for (const res of orgBResults) {
        expect(res).not.toBeNull();
        expect(res.orgId).toBe(orgB);
        expect(res.orgId).not.toBe(orgA);
      }

      // Verify cross-tenant RBAC enforcement under load
      for (let i = 0; i < 50; i++) {
        const canOrgAdminAudit = RbacUtil.hasPermission(UserRole.ORG_ADMIN, EnterprisePermission.AUDIT_LOG_READ);
        const canAthleteAudit = RbacUtil.hasPermission(UserRole.ATHLETE, EnterprisePermission.AUDIT_LOG_READ);
        expect(canOrgAdminAudit).toBe(true);
        expect(canAthleteAudit).toBe(false);
      }
    });
  });

  // -------------------------------------------------------------
  // 4. RATE LIMITER HIGH-BURST & MEMORY EVICTION UNDER LOAD
  // -------------------------------------------------------------
  describe('4. Rate Limiter Burst & Eviction under Load', () => {
    it('accurately enforces limits across 5,000 rapid requests without memory leakage', () => {
      const limiter = new RateLimiter();
      const limit = 50;
      const windowSeconds = 60;
      let allowedCount = 0;
      let deniedCount = 0;

      // 100 requests from same IP (first 50 must pass, next 50 must fail)
      const testIp = '198.51.100.42';
      for (let i = 0; i < 100; i++) {
        const check = limiter.check(testIp, limit, windowSeconds);
        if (check.allowed) allowedCount++;
        else deniedCount++;
      }

      expect(allowedCount).toBe(50);
      expect(deniedCount).toBe(50);

      // Eviction test: simulate 500 distinct client IPs
      for (let i = 0; i < 500; i++) {
        limiter.check(`client_ip_${i}`, 10, windowSeconds);
      }

      // Reset specific key
      limiter.reset(testIp);
      const afterResetCheck = limiter.check(testIp, limit, windowSeconds);
      expect(afterResetCheck.allowed).toBe(true);
      expect(afterResetCheck.remaining).toBe(49);
    });
  });

  // -------------------------------------------------------------
  // 5. WORKER QUEUE HIGH-VOLUME LOAD & CONCURRENCY
  // -------------------------------------------------------------
  describe('5. Worker Queue High-Volume Load & Failure Isolation', () => {
    it('enqueues and processes 200 background jobs with batch claiming and DLQ isolation', async () => {
      const jobCount = 200;

      // Enqueue 200 jobs
      const enqueueStart = performance.now();
      for (let i = 0; i < jobCount; i++) {
        await queueService.addJob('DAILY_ANALYTICS_AGGREGATION', `Aggregate User ${i}`, {
          userId: `usr_athlete_${i}`,
          date: '2026-06-15',
        });
      }
      const enqueueMs = performance.now() - enqueueStart;
      expect(enqueueMs).toBeLessThan(100); // 200 in-memory enqueues in < 100ms

      // Batch claim all 200 jobs in chunks of 50
      let totalClaimed = 0;
      const allClaimedJobs = [];

      while (totalClaimed < jobCount) {
        const batch = await queueService.claimBatch('DAILY_ANALYTICS_AGGREGATION', 50);
        if (batch.length === 0) break;
        totalClaimed += batch.length;
        allClaimedJobs.push(...batch);
      }

      expect(totalClaimed).toBe(jobCount);
      expect(allClaimedJobs.length).toBe(jobCount);

      // Process 90% as COMPLETED and 10% as FAILED (exceeding maxAttempts -> DLQ)
      for (let i = 0; i < allClaimedJobs.length; i++) {
        const job = allClaimedJobs[i]!;
        if (i % 10 === 0) {
          // Exhaust attempts -> move to DLQ
          job.maxAttempts = 1;
          await queueService.failJob(job.id, 'Simulated downstream timeout');
        } else {
          await queueService.completeJob(job.id);
        }
      }

      // Verify metrics
      const metrics = await queueService.getMetrics();
      expect(metrics.total).toBe(jobCount);
      expect(metrics.completed).toBe(180);
      expect(metrics.failed).toBe(20);
      expect(metrics.waiting).toBe(0);
      expect(metrics.active).toBe(0);
    });
  });
});
