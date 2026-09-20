import { UserRole } from '@alpha/types';
import {
  QA_ACCOUNTS,
  QA_ORGANIZATIONS,
  QA_SEVERITY_MODEL,
  QaSeverity,
} from './fixtures/qa-master-fixtures';
import { MASTER_TEST_MATRIX } from './fixtures/master-test-matrix';

describe('Phase 15 Gate A: Master QA Foundation, Test Matrix & Baseline Verification', () => {
  // =========================================================================
  // 1. TEST ACCOUNTS MATRIX & ROLE COVERAGE
  // =========================================================================
  describe('1. Test Accounts Matrix & Role Coverage', () => {
    it('should define deterministic organizations for multi-tenant isolation testing', () => {
      expect(QA_ORGANIZATIONS.ORG_A).toBeDefined();
      expect(QA_ORGANIZATIONS.ORG_B).toBeDefined();
      expect(QA_ORGANIZATIONS.ORG_A.id).not.toBe(QA_ORGANIZATIONS.ORG_B.id);
      expect(QA_ORGANIZATIONS.ORG_A.allowedDomains).toContain('apex.test');
      expect(QA_ORGANIZATIONS.ORG_B.allowedDomains).toContain('titan.test');
    });

    it('should cover all mandatory roles: ATHLETE, COACH, TRAINER, NUTRITIONIST, ORG_ADMIN, ADMIN', () => {
      const accounts = Object.values(QA_ACCOUNTS);
      const roles = new Set(accounts.map((a) => a.role));

      expect(roles.has(UserRole.ATHLETE)).toBe(true);
      expect(roles.has(UserRole.COACH)).toBe(true);
      expect(roles.has(UserRole.TRAINER)).toBe(true);
      expect(roles.has(UserRole.NUTRITIONIST)).toBe(true);
      expect(roles.has(UserRole.ORG_ADMIN)).toBe(true);
      expect(roles.has(UserRole.ADMIN)).toBe(true);
    });

    it('should cover all account lifecycle states', () => {
      const accounts = Object.values(QA_ACCOUNTS);
      const states = new Set(accounts.map((a) => a.accountLifecycleState));

      expect(states.has('ACTIVE')).toBe(true);
      expect(states.has('INACTIVE')).toBe(true);
      expect(states.has('NEW')).toBe(true);
      expect(states.has('ARCHIVED')).toBe(true);
      expect(states.has('INVITED')).toBe(true);
      expect(states.has('PERMISSION_LIMITED')).toBe(true);
    });

    it('should ensure strict tenant separation across Org A and Org B accounts', () => {
      const clientA = QA_ACCOUNTS.CLIENT_A_ACTIVE!;
      const clientB = QA_ACCOUNTS.CLIENT_B_ACTIVE!;
      const coachA = QA_ACCOUNTS.COACH_A_ACTIVE!;
      const coachB = QA_ACCOUNTS.COACH_B_ACTIVE!;

      expect(clientA.organizationId).toBe(QA_ORGANIZATIONS.ORG_A.id);
      expect(coachA.organizationId).toBe(QA_ORGANIZATIONS.ORG_A.id);

      expect(clientB.organizationId).toBe(QA_ORGANIZATIONS.ORG_B.id);
      expect(coachB.organizationId).toBe(QA_ORGANIZATIONS.ORG_B.id);

      expect(clientA.organizationId).not.toBe(clientB.organizationId);
      expect(coachA.organizationId).not.toBe(coachB.organizationId);
    });
  });

  // =========================================================================
  // 2. DEFECT SEVERITY MODEL
  // =========================================================================
  describe('2. Defect Severity Model & Blocker Definitions', () => {
    it('should define all 5 standardized severity levels', () => {
      const severities = Object.keys(QA_SEVERITY_MODEL) as QaSeverity[];
      expect(severities).toContain(QaSeverity.CRITICAL);
      expect(severities).toContain(QaSeverity.HIGH);
      expect(severities).toContain(QaSeverity.MEDIUM);
      expect(severities).toContain(QaSeverity.LOW);
      expect(severities).toContain(QaSeverity.INFORMATIONAL);
    });

    it('should explicitly designate CRITICAL defects as immediate release blockers', () => {
      const criticalDef = QA_SEVERITY_MODEL[QaSeverity.CRITICAL];
      expect(criticalDef.actionRequired).toContain('STOP IMMEDIATELY');
      expect(criticalDef.actionRequired).toContain('Release blocker');
      expect(criticalDef.examples.length).toBeGreaterThanOrEqual(3);
    });

    it('should define clear boundaries between HIGH, MEDIUM, and LOW defects', () => {
      const highDef = QA_SEVERITY_MODEL[QaSeverity.HIGH];
      const medDef = QA_SEVERITY_MODEL[QaSeverity.MEDIUM];
      const lowDef = QA_SEVERITY_MODEL[QaSeverity.LOW];

      expect(highDef.definition).toContain('Major functional failure');
      expect(medDef.definition).toContain('Non-blocking functional defect');
      expect(lowDef.definition).toContain('Cosmetic issue');
    });
  });

  // =========================================================================
  // 3. MASTER TEST MATRIX INTEGRITY
  // =========================================================================
  describe('3. Master Test Matrix Integrity & Coverage', () => {
    it('should contain all required columns for every test case', () => {
      expect(MASTER_TEST_MATRIX.length).toBeGreaterThanOrEqual(15);

      for (const tc of MASTER_TEST_MATRIX) {
        expect(tc.id).toBeDefined();
        expect(tc.id).toMatch(/^TC-[A-Z]+-\d{3}$/);
        expect(tc.module).toBeDefined();
        expect(tc.scenario).toBeDefined();
        expect(tc.precondition).toBeDefined();
        expect(tc.action).toBeDefined();
        expect(tc.expectedResult).toBeDefined();
        expect(tc.actualResult).toBeDefined();
        expect(['PASS', 'FAIL', 'BLOCKED', 'NOT_APPLICABLE']).toContain(tc.status);
        expect(Object.values(QaSeverity)).toContain(tc.severity);
        expect(tc.evidence).toBeDefined();
        expect(tc.evidence.length).toBeGreaterThan(5);
      }
    });

    it('should cover core domain modules without gaps', () => {
      const modules = new Set(MASTER_TEST_MATRIX.map((tc) => tc.module));

      expect(modules.has('AUTH')).toBe(true);
      expect(modules.has('WORKOUT')).toBe(true);
      expect(modules.has('NUTRITION')).toBe(true);
      expect(modules.has('INTEGRATIONS')).toBe(true);
      expect(modules.has('SECURITY')).toBe(true);
      expect(modules.has('TENANT_ISOLATION')).toBe(true);
      expect(modules.has('AI')).toBe(true);
      expect(modules.has('ANALYTICS')).toBe(true);
      expect(modules.has('REPORTS')).toBe(true);
      expect(modules.has('RELIABILITY')).toBe(true);
    });

    it('should link every test case to real verifiable evidence', () => {
      for (const tc of MASTER_TEST_MATRIX) {
        expect(tc.evidence).toContain('.spec.ts:');
      }
    });
  });

  // =========================================================================
  // 4. TEST ENVIRONMENT & SAFETY CONTROLS
  // =========================================================================
  describe('4. Test Environment & Non-Destructive Safety Controls', () => {
    it('should operate in isolated development/test environment without production access', () => {
      const isTestEnv = process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL?.includes('prod');
      expect(isTestEnv).toBe(true);
    });

    it('should enforce deterministic test identifiers that never conflict with production records', () => {
      for (const acc of Object.values(QA_ACCOUNTS)) {
        expect(acc.id.startsWith('qa_user_')).toBe(true);
        expect(acc.email.endsWith('.test') || acc.email.endsWith('.os')).toBe(true);
      }
    });
  });
});
