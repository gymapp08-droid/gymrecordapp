import {
  UserRole,
  EnterprisePermission,
  AccountStatus,
  IAuthUser,
} from '@alpha/types';
import { RbacUtil } from '@alpha/utils';
import { EnterpriseService } from '../src/modules/enterprise/enterprise.service';
import { EnterpriseController } from '../src/modules/enterprise/enterprise.controller';
import { PrivacyService, ERASURE_CONFIRM_PHRASE } from '../src/modules/privacy/privacy.service';
import { PrivacyController } from '../src/modules/privacy/privacy.controller';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('PHASE 11 — GATE C: ENTERPRISE TENANT, ROLES & DATA SOVEREIGNTY', () => {
  describe('1. Enterprise RBAC & Role Hierarchy', () => {
    it('grants Super Admin all enterprise permissions', () => {
      const allPermissions = Object.values(EnterprisePermission);
      for (const perm of allPermissions) {
        expect(RbacUtil.hasPermission(UserRole.ADMIN, perm)).toBe(true);
      }
      expect(RbacUtil.hasAllPermissions(UserRole.ADMIN, allPermissions)).toBe(true);
    });

    it('grants Org Admin tenant-level administrative capabilities', () => {
      expect(RbacUtil.hasPermission(UserRole.ORG_ADMIN, EnterprisePermission.MANAGE_ORG_MEMBERS)).toBe(true);
      expect(RbacUtil.hasPermission(UserRole.ORG_ADMIN, EnterprisePermission.MANAGE_ORG_SETTINGS)).toBe(true);
      expect(RbacUtil.hasPermission(UserRole.ORG_ADMIN, EnterprisePermission.EXPORT_ORG_DATA)).toBe(true);
      expect(RbacUtil.hasPermission(UserRole.ORG_ADMIN, EnterprisePermission.AUDIT_LOG_READ)).toBe(true);
    });

    it('enforces specialized scopes between Coach and Nutritionist', () => {
      // Coach has workout program permission, not nutrition permission
      expect(RbacUtil.hasPermission(UserRole.COACH, EnterprisePermission.MANAGE_CLIENT_PROGRAM)).toBe(true);
      expect(RbacUtil.hasPermission(UserRole.COACH, EnterprisePermission.MANAGE_CLIENT_NUTRITION)).toBe(false);

      // Nutritionist has nutrition permission, not workout program permission
      expect(RbacUtil.hasPermission(UserRole.NUTRITIONIST, EnterprisePermission.MANAGE_CLIENT_NUTRITION)).toBe(true);
      expect(RbacUtil.hasPermission(UserRole.NUTRITIONIST, EnterprisePermission.MANAGE_CLIENT_PROGRAM)).toBe(false);
    });

    it('restricts Athletes to personal data export and erasure only', () => {
      expect(RbacUtil.hasPermission(UserRole.ATHLETE, EnterprisePermission.EXPORT_PERSONAL_DATA)).toBe(true);
      expect(RbacUtil.hasPermission(UserRole.ATHLETE, EnterprisePermission.ERASE_PERSONAL_DATA)).toBe(true);
      expect(RbacUtil.hasPermission(UserRole.ATHLETE, EnterprisePermission.VIEW_CLIENT_TELEMETRY)).toBe(false);
      expect(RbacUtil.hasPermission(UserRole.ATHLETE, EnterprisePermission.MANAGE_ORG_SETTINGS)).toBe(false);
    });
  });

  describe('2. Multi-Tenant Boundary & Domain Whitelisting', () => {
    it('allows users within the same tenant to access organization resources', () => {
      expect(RbacUtil.canAccessTenant('org_acme_123', 'org_acme_123', UserRole.ATHLETE)).toBe(true);
      expect(RbacUtil.canAccessTenant('org_acme_123', 'org_acme_123', UserRole.COACH)).toBe(true);
      expect(RbacUtil.canAccessTenant('org_acme_123', 'org_acme_123', UserRole.ORG_ADMIN)).toBe(true);
    });

    it('strictly denies cross-tenant access between different organizations', () => {
      expect(RbacUtil.canAccessTenant('org_acme_123', 'org_competitor_999', UserRole.ATHLETE)).toBe(false);
      expect(RbacUtil.canAccessTenant('org_acme_123', 'org_competitor_999', UserRole.COACH)).toBe(false);
      expect(RbacUtil.canAccessTenant('org_acme_123', 'org_competitor_999', UserRole.ORG_ADMIN)).toBe(false);
    });

    it('allows Super Admin cross-tenant audit access', () => {
      expect(RbacUtil.canAccessTenant('org_acme_123', 'org_competitor_999', UserRole.ADMIN)).toBe(true);
      expect(RbacUtil.canAccessTenant(null, 'org_competitor_999', UserRole.ADMIN)).toBe(true);
    });

    it('validates domain whitelisting for enterprise membership', () => {
      const allowed = ['alpha.os', 'hypertrophy.io'];

      expect(RbacUtil.isDomainAllowed('coach.alex@alpha.os', allowed)).toBe(true);
      expect(RbacUtil.isDomainAllowed('coach.sam@HYPERTROPHY.IO', allowed)).toBe(true);
      expect(RbacUtil.isDomainAllowed('intruder@gmail.com', allowed)).toBe(false);
      expect(RbacUtil.isDomainAllowed('user@unauthorized.org', allowed)).toBe(false);

      // Open when no domains specified
      expect(RbacUtil.isDomainAllowed('anyone@anywhere.com', [])).toBe(true);
    });
  });

  describe('3. Enterprise Organization Management & Seat Capacities', () => {
    let enterpriseService: EnterpriseService;
    let enterpriseController: EnterpriseController;

    const orgId = 'org_performance_labs';
    const orgAdmin: IAuthUser = {
      id: 'admin_usr_001',
      email: 'admin@performancelabs.com',
      role: UserRole.ORG_ADMIN,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: orgId,
    };

    const athleteUser: IAuthUser = {
      id: 'athlete_usr_002',
      email: 'athlete@performancelabs.com',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: orgId,
    };

    beforeEach(() => {
      enterpriseService = new EnterpriseService();
      enterpriseController = new EnterpriseController(enterpriseService);
    });

    it('retrieves default enterprise settings with Professional tier and 50 seats', async () => {
      const settings = await enterpriseController.getSettings(orgId, orgAdmin);
      expect(settings.organizationId).toBe(orgId);
      expect(settings.tier).toBe('PROFESSIONAL');
      expect(settings.maxSeats).toBe(50);
      expect(settings.dataRetentionDays).toBe(365);
    });

    it('updates enterprise tier and seat capacity when requested by Org Admin', async () => {
      const updated = await enterpriseController.updateSettings(
        orgId,
        {
          tier: 'ENTERPRISE',
          allowedDomains: ['performancelabs.com'],
          enforceSso: true,
        },
        orgAdmin,
      );

      expect(updated.tier).toBe('ENTERPRISE');
      expect(updated.maxSeats).toBe(1000);
      expect(updated.allowedDomains).toEqual(['performancelabs.com']);
      expect(updated.enforceSso).toBe(true);
    });

    it('denies settings modifications when attempted by non-admin roles', async () => {
      await expect(
        enterpriseController.updateSettings(
          orgId,
          { tier: 'STARTER' },
          athleteUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('enforces enterprise seat capacity and domain constraints', async () => {
      // Configure organization with 2 seats max and domain restriction
      await enterpriseService.updateOrgSettings(
        orgId,
        {
          maxSeats: 2,
          allowedDomains: ['performancelabs.com'],
        },
        UserRole.ORG_ADMIN,
      );

      // 1. Rejects email outside allowed domain
      await expect(
        enterpriseService.assignMember(orgId, 'u1', 'user@gmail.com'),
      ).rejects.toThrow(BadRequestException);

      // 2. Accepts valid members up to limit
      await enterpriseService.assignMember(orgId, 'u1', 'coach1@performancelabs.com');
      await enterpriseService.assignMember(orgId, 'u2', 'coach2@performancelabs.com');

      const seatStatus = await enterpriseService.checkSeatAvailability(orgId);
      expect(seatStatus.seatsUsed).toBe(2);
      expect(seatStatus.available).toBe(false);
      expect(seatStatus.remaining).toBe(0);

      // 3. Rejects 3rd member due to seat limit
      await expect(
        enterpriseService.assignMember(orgId, 'u3', 'coach3@performancelabs.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces tenant boundary on enterprise endpoints', async () => {
      const foreignUser: IAuthUser = {
        id: 'foreign_usr_999',
        email: 'spy@other.com',
        role: UserRole.ORG_ADMIN,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
        organizationId: 'org_other_999',
      };

      await expect(
        enterpriseController.getSettings(orgId, foreignUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. GDPR Article 20 Data Portability Export', () => {
    let privacyService: PrivacyService;
    let privacyController: PrivacyController;

    const testUser: IAuthUser = {
      id: 'athlete_privacy_001',
      email: 'athlete.privacy@alpha.os',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    };

    beforeEach(() => {
      privacyService = new PrivacyService();
      privacyController = new PrivacyController(privacyService);
    });

    it('generates comprehensive machine-readable GDPR Article 20 portability bundle', async () => {
      const bundle = await privacyController.exportData(testUser);

      expect(bundle).toBeDefined();
      expect(bundle.exportId).toContain('export_');
      expect(bundle.exportedAt).toBeDefined();

      // Identity & Profile
      expect(bundle.user.id).toBe(testUser.id);
      expect(bundle.user.email).toBe(testUser.email);
      expect(bundle.profile).toBeDefined();
      expect(bundle.preferences).toBeDefined();

      // Core Performance Domains
      expect(bundle.workouts).toHaveLength(1);
      expect(bundle.nutrition).toHaveLength(1);
      expect(bundle.activity).toHaveLength(1);
      expect(bundle.biometrics).toHaveLength(1);

      // Compliance Header
      expect(bundle.compliance.format).toBe('JSON_SCHEMA_V1');
      expect(bundle.compliance.gdprArticle).toBe('ARTICLE_20');
      expect(bundle.compliance.dataSovereignty).toBe('CANONICAL_UTC_METRIC');
    });

    it('records an audit trail entry upon data export', async () => {
      await privacyController.exportData(testUser);

      const logs = privacyService.getAuditTrail(testUser.id);
      expect(logs).toHaveLength(1);
      expect(logs[0]?.action).toBe('DATA_PORTABILITY_EXPORTED');
    });
  });

  describe('5. GDPR Article 17 Right to Erasure / Permanent Anonymization', () => {
    let privacyService: PrivacyService;
    let privacyController: PrivacyController;

    const testUser: IAuthUser = {
      id: 'athlete_privacy_001',
      email: 'athlete.privacy@alpha.os',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    };

    beforeEach(() => {
      privacyService = new PrivacyService();
      privacyController = new PrivacyController(privacyService);
    });

    it('rejects erasure request if confirmation phrase does not match exactly', async () => {
      await expect(
        privacyController.anonymizeAccount(testUser, {
          confirmPhrase: 'please delete me',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('permanently scrubs PII, pseudonymizes user identity, and updates account status to DELETED', async () => {
      const result = await privacyController.anonymizeAccount(testUser, {
        confirmPhrase: ERASURE_CONFIRM_PHRASE,
        reason: 'User closing account',
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBe(testUser.id);
      expect(result.pseudonym).toContain('anonymized_');

      // Verify scrubbed user record
      const scrubbedUser = privacyService.getUser(testUser.id);
      expect(scrubbedUser?.fullName).toBe('Anonymized Athlete');
      expect(scrubbedUser?.email).toContain('@deleted.alpha.os');
      expect(scrubbedUser?.status).toBe(AccountStatus.DELETED);
      expect(scrubbedUser?.isActive).toBe(false);

      // Verify audit trail logged
      const logs = privacyService.getAuditTrail(testUser.id);
      const anonymizeLog = logs.find((l) => l.action === 'USER_DATA_ANONYMIZED');
      expect(anonymizeLog).toBeDefined();
    });
  });

  describe('6. Privacy & Telemetry Consent Management', () => {
    let privacyService: PrivacyService;
    let privacyController: PrivacyController;

    const testUser: IAuthUser = {
      id: 'athlete_privacy_001',
      email: 'athlete.privacy@alpha.os',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    };

    beforeEach(() => {
      privacyService = new PrivacyService();
      privacyController = new PrivacyController(privacyService);
    });

    it('retrieves default privacy consent settings', async () => {
      const consent = await privacyController.getConsent(testUser);
      expect(consent.userId).toBe(testUser.id);
      expect(consent.analyticsTracking).toBe(true);
      expect(consent.telemetrySharing).toBe(true);
      expect(consent.marketingCommunications).toBe(false);
    });

    it('updates consent preferences and creates an audit log', async () => {
      const updated = await privacyController.updateConsent(testUser, {
        telemetrySharing: false,
        marketingCommunications: true,
      });

      expect(updated.telemetrySharing).toBe(false);
      expect(updated.marketingCommunications).toBe(true);

      const logs = privacyService.getAuditTrail(testUser.id);
      const consentLog = logs.find((l) => l.action === 'PRIVACY_CONSENT_UPDATED');
      expect(consentLog).toBeDefined();
    });
  });
});
