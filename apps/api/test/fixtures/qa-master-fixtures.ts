import {
  IAuthUser,
  UserRole,
  AccountStatus,
  UnitSystem,
} from '@alpha/types';

/**
 * PHASE 15 — MASTER QA TEST FIXTURES & DETERMINISTIC ACCOUNTS MATRIX
 */

export interface IQaTestAccount extends IAuthUser {
  organizationId?: string;
  fullName: string;
  unitSystem: UnitSystem;
  timezone: string;
  locale: string;
  accountLifecycleState:
    | 'ACTIVE'
    | 'INACTIVE'
    | 'NEW'
    | 'ARCHIVED'
    | 'INVITED'
    | 'UNVERIFIED'
    | 'PERMISSION_LIMITED';
  assignedClientIds?: string[];
  assignedCoachId?: string;
}

export interface IQaOrganization {
  id: string;
  name: string;
  slug: string;
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  allowedDomains: string[];
}

export const QA_ORGANIZATIONS: Record<'ORG_A' | 'ORG_B', IQaOrganization> = {
  ORG_A: {
    id: 'org_qa_alpha_001',
    name: 'TEST ORGANIZATION A (Apex Performance)',
    slug: 'apex-performance',
    tier: 'ENTERPRISE',
    allowedDomains: ['apex.test', 'alpha.os'],
  },
  ORG_B: {
    id: 'org_qa_bravo_002',
    name: 'TEST ORGANIZATION B (Titan Athletics)',
    slug: 'titan-athletics',
    tier: 'PROFESSIONAL',
    allowedDomains: ['titan.test'],
  },
};

export const QA_ACCOUNTS: Record<string, IQaTestAccount> = {
  // 1. ATHLETES / CLIENTS
  CLIENT_A_ACTIVE: {
    id: 'qa_user_client_a_active',
    email: 'client.a.active@apex.test',
    fullName: 'Alex Vance (Athlete A)',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
    assignedCoachId: 'qa_user_coach_a_active',
  },
  CLIENT_A_NEW: {
    id: 'qa_user_client_a_new',
    email: 'client.a.new@apex.test',
    fullName: 'Jordan New (Unverified Athlete)',
    role: UserRole.ATHLETE,
    status: AccountStatus.PENDING_VERIFICATION,
    isEmailVerified: false,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'NEW',
  },
  CLIENT_A_INACTIVE: {
    id: 'qa_user_client_a_inactive',
    email: 'client.a.inactive@apex.test',
    fullName: 'Taylor Inactive (Deactivated Athlete)',
    role: UserRole.ATHLETE,
    status: AccountStatus.SUSPENDED,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'INACTIVE',
  },
  CLIENT_A_ARCHIVED: {
    id: 'qa_user_client_a_archived',
    email: 'client.a.archived@apex.test',
    fullName: 'Morgan Archived (Past Athlete)',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'ARCHIVED',
  },
  CLIENT_A_INVITED: {
    id: 'qa_user_client_a_invited',
    email: 'client.a.invited@apex.test',
    fullName: 'Casey Invited (Pending Athlete)',
    role: UserRole.ATHLETE,
    status: AccountStatus.PENDING_VERIFICATION,
    isEmailVerified: false,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'INVITED',
  },
  CLIENT_B_ACTIVE: {
    id: 'qa_user_client_b_active',
    email: 'client.b.active@titan.test',
    fullName: 'Blake Cross-Tenant (Athlete B)',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_B.id,
    unitSystem: UnitSystem.IMPERIAL,
    timezone: 'America/Chicago',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
    assignedCoachId: 'qa_user_coach_b_active',
  },

  // 2. COACHES
  COACH_A_ACTIVE: {
    id: 'qa_user_coach_a_active',
    email: 'coach.a.active@apex.test',
    fullName: 'Coach Marcus (Apex Head Coach)',
    role: UserRole.COACH,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
    assignedClientIds: [
      'qa_user_client_a_active',
      'qa_user_client_a_archived',
    ],
  },
  COACH_B_ACTIVE: {
    id: 'qa_user_coach_b_active',
    email: 'coach.b.active@titan.test',
    fullName: 'Coach Elena (Titan Coach)',
    role: UserRole.COACH,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_B.id,
    unitSystem: UnitSystem.IMPERIAL,
    timezone: 'America/Chicago',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
    assignedClientIds: ['qa_user_client_b_active'],
  },
  COACH_A_LIMITED: {
    id: 'qa_user_coach_a_limited',
    email: 'coach.a.limited@apex.test',
    fullName: 'Coach Limited (Restricted Permissions)',
    role: UserRole.COACH,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'PERMISSION_LIMITED',
    assignedClientIds: [],
  },

  // 3. TRAINERS & NUTRITIONISTS
  TRAINER_A_ACTIVE: {
    id: 'qa_user_trainer_a_active',
    email: 'trainer.a.active@apex.test',
    fullName: 'Trainer Dave (Apex Strength Trainer)',
    role: UserRole.TRAINER,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
    assignedClientIds: ['qa_user_client_a_active'],
  },
  NUTRITIONIST_A_ACTIVE: {
    id: 'qa_user_nutritionist_a_active',
    email: 'nutritionist.a.active@apex.test',
    fullName: 'Nutritionist Sarah (Apex Diet Specialist)',
    role: UserRole.NUTRITIONIST,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
    assignedClientIds: ['qa_user_client_a_active'],
  },

  // 4. ORGANIZATION ADMINISTRATORS
  ORG_ADMIN_A: {
    id: 'qa_user_org_admin_a',
    email: 'admin.a@apex.test',
    fullName: 'Admin Arthur (Org A Director)',
    role: UserRole.ORG_ADMIN,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_A.id,
    unitSystem: UnitSystem.METRIC,
    timezone: 'America/New_York',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
  },
  ORG_ADMIN_B: {
    id: 'qa_user_org_admin_b',
    email: 'admin.b@titan.test',
    fullName: 'Admin Beatrice (Org B Director)',
    role: UserRole.ORG_ADMIN,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: QA_ORGANIZATIONS.ORG_B.id,
    unitSystem: UnitSystem.IMPERIAL,
    timezone: 'America/Chicago',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
  },

  // 5. SUPER ADMINISTRATOR
  SUPER_ADMIN: {
    id: 'qa_user_super_admin',
    email: 'superadmin@alpha.os',
    fullName: 'System Administrator',
    role: UserRole.ADMIN,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    unitSystem: UnitSystem.METRIC,
    timezone: 'UTC',
    locale: 'en',
    accountLifecycleState: 'ACTIVE',
  },
};

/**
 * MASTER DEFECT SEVERITY MODEL
 */
export enum QaSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL',
}

export interface IQaSeverityDefinition {
  severity: QaSeverity;
  definition: string;
  actionRequired: string;
  examples: string[];
}

export const QA_SEVERITY_MODEL: Record<QaSeverity, IQaSeverityDefinition> = {
  [QaSeverity.CRITICAL]: {
    severity: QaSeverity.CRITICAL,
    definition:
      'Defect causing security compromise, cross-tenant data leakage, unauthorized health/biometric exposure, data corruption, irreversible data loss, or complete core failure rendering platform unusable.',
    actionRequired:
      'STOP IMMEDIATELY → REPORT → REMEDIATE OR REQUIRE EXPLICIT APPROVAL. Release blocker.',
    examples: [
      'Authentication bypass or token replay',
      'Cross-tenant data access (Org A reads Org B)',
      'Unauthorized access to athlete health/GPS data',
      'Database corruption or irreversible deletion',
      'Worker crash loop causing unrecoverable job loss',
    ],
  },
  [QaSeverity.HIGH]: {
    severity: QaSeverity.HIGH,
    definition:
      'Major functional failure in primary user journeys without immediate security breach, but preventing core operation (e.g. workout cannot be logged, meal calculation wrong, notifications fail silently).',
    actionRequired:
      'Prioritize fix before production signoff. Must be resolved or explicitly accepted as release blocker.',
    examples: [
      'Workout session cannot complete or save sets',
      'Daily macro calculations mathematically corrupted',
      'OAuth token refresh fails silently on active wearable',
      'Offline sync drops workout sets upon reconnect',
    ],
  },
  [QaSeverity.MEDIUM]: {
    severity: QaSeverity.MEDIUM,
    definition:
      'Non-blocking functional defect, minor calculation discrepancy, edge case failure with acceptable workaround, or non-critical UI degradation.',
    actionRequired: 'Fix during stabilization cycle. Not an immediate release blocker.',
    examples: [
      'Date formatting edge case at midnight crossing',
      'Secondary filter in report export does not sort properly',
      'Non-critical rate limit threshold misaligned by 5%',
    ],
  },
  [QaSeverity.LOW]: {
    severity: QaSeverity.LOW,
    definition:
      'Cosmetic issue, typographical defect, minor visual alignment discrepancy, or subtle UI Polish defect adhering to Stitch tokens.',
    actionRequired: 'Track and resolve in routine maintenance.',
    examples: [
      'Label text truncated on small screen size',
      'Minor color contrast edge case on disabled button',
      'Missing tool-tip or secondary translation string fallback to English',
    ],
  },
  [QaSeverity.INFORMATIONAL]: {
    severity: QaSeverity.INFORMATIONAL,
    definition:
      'Observation, performance benchmark note, architectural enhancement suggestion, or verification evidence record.',
    actionRequired: 'Document for engineering baseline.',
    examples: [
      'Benchmark observed latency under load',
      'Database query plan optimization recommendation',
      'Storage capacity projection log',
    ],
  },
};

/**
 * MASTER TEST CASE ITEM CONTRACT
 */
export interface IMasterTestCase {
  id: string; // e.g. TC-AUTH-001
  module:
    | 'AUTH'
    | 'ONBOARDING'
    | 'PROFILE'
    | 'WORKOUT'
    | 'NUTRITION'
    | 'ACTIVITY'
    | 'PROGRESS'
    | 'AI'
    | 'COACH_PORTAL'
    | 'NOTIFICATIONS'
    | 'ANALYTICS'
    | 'REPORTS'
    | 'INTEGRATIONS'
    | 'SECURITY'
    | 'TENANT_ISOLATION'
    | 'PERFORMANCE'
    | 'RELIABILITY';
  scenario: string;
  precondition: string;
  action: string;
  expectedResult: string;
  actualResult: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_APPLICABLE';
  severity: QaSeverity;
  evidence: string;
}
