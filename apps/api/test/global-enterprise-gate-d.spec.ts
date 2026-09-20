import {
  Units,
  DateTimeUtil,
  UnicodeUtil,
  i18n,
  I18nEngine,
  AccessibilityUtil,
  RbacUtil,
} from '@alpha/utils';
import {
  UserRole,
  AccountStatus,
  UnitSystem,
  EnterprisePermission,
  IAuthUser,
} from '@alpha/types';
import { UsersService } from '../src/modules/users/users.service';
import { UsersController } from '../src/modules/users/users.controller';
import { EnterpriseService } from '../src/modules/enterprise/enterprise.service';
import { EnterpriseController } from '../src/modules/enterprise/enterprise.controller';
import { PrivacyService, ERASURE_CONFIRM_PHRASE } from '../src/modules/privacy/privacy.service';
import { PrivacyController } from '../src/modules/privacy/privacy.controller';

describe('PHASE 11 — GATE D: VERIFICATION, QUALITY ASSURANCE & GLOBAL READINESS', () => {
  let usersService: UsersService;
  let usersController: UsersController;
  let enterpriseService: EnterpriseService;
  let enterpriseController: EnterpriseController;
  let privacyService: PrivacyService;
  let privacyController: PrivacyController;

  const orgId = 'org_global_performance_corp';

  const orgAdmin: IAuthUser = {
    id: 'admin_global_100',
    email: 'admin@globalperformance.corp',
    role: UserRole.ORG_ADMIN,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: orgId,
  };

  const globalAthlete: IAuthUser = {
    id: 'athlete_global_200',
    email: 'athlete.tariq@globalperformance.corp',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: orgId,
  };

  const coachUser: IAuthUser = {
    id: 'coach_global_300',
    email: 'coach.elena@globalperformance.corp',
    role: UserRole.COACH,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
    organizationId: orgId,
  };

  beforeEach(() => {
    usersService = new UsersService();
    usersController = new UsersController(usersService);
    enterpriseService = new EnterpriseService();
    enterpriseController = new EnterpriseController(enterpriseService);
    privacyService = new PrivacyService();
    privacyController = new PrivacyController(privacyService);

    // Seed athlete in privacy store
    privacyService.seedUser({
      id: globalAthlete.id,
      email: globalAthlete.email,
      fullName: 'Tariq Al-Mansoor',
      role: 'ATHLETE',
      status: AccountStatus.ACTIVE,
      isActive: true,
      createdAt: '2026-02-01T10:00:00.000Z',
    });
  });

  describe('1. Global Athlete Onboarding & Localized Presentation Flow', () => {
    it('sets up athlete preferences with Arabic (ar), Asia/Dubai timezone, and Imperial units', async () => {
      const updatedPrefs = await usersController.updateMePreferences(globalAthlete, {
        language: 'ar',
        timezone: 'Asia/Dubai',
        unitSystem: UnitSystem.IMPERIAL,
      });

      expect(updatedPrefs.language).toBe('ar');
      expect(updatedPrefs.timezone).toBe('Asia/Dubai');
      expect(updatedPrefs.unitSystem).toBe(UnitSystem.IMPERIAL);

      // Verify layout direction is RTL for Arabic
      expect(I18nEngine.isRTL(updatedPrefs.language)).toBe(true);
      expect(I18nEngine.getTextDirection(updatedPrefs.language)).toBe('rtl');
    });

    it('translates HUD readouts accurately into Arabic without token leakage', () => {
      const greeting = i18n.t('ai.coachGreeting', { name: 'طارق' }, 'ar');
      expect(greeting).toContain('طارق');
      expect(greeting).not.toContain('{name}');

      const streak = i18n.t('progress.streak', { count: 7 }, 'ar');
      expect(streak).toContain('7');
      expect(streak).toContain('أيام');

      const recommendation = i18n.t('ai.adaptiveRecommendation', { score: 92 }, 'ar');
      expect(recommendation).toContain('92%');
    });

    it('converts canonical metric telemetry to user presentation units deterministically', () => {
      // Canonical database storage: 84.5 kg, 12.4 km, 185 cm, 22 C
      const rawWeightKg = 84.5;
      const rawDistanceKm = 12.4;
      const rawHeightCm = 185;
      const rawTempC = 22;

      // Presentation formatting in Imperial
      const formattedWeight = Units.formatWeightWithUnit(rawWeightKg, 'IMPERIAL', 'ar');
      expect(formattedWeight).toContain('lbs');
      expect(Units.kgToLb(rawWeightKg)).toBe(186.3);

      const formattedDistance = Units.formatDistanceWithUnit(rawDistanceKm, 'IMPERIAL', 'ar');
      expect(formattedDistance).toContain('mi');
      expect(Units.kmToMiles(rawDistanceKm)).toBe(7.71);

      const { feet, inches } = Units.cmToFeetInches(rawHeightCm);
      expect(feet).toBe(6);
      expect(inches).toBe(1);

      const tempF = Units.celsiusToFahrenheit(rawTempC);
      expect(tempF).toBe(71.6);
    });

    it('projects canonical UTC timestamps accurately into athlete timezone (Asia/Dubai, UTC+4)', () => {
      const canonicalUtc = new Date('2026-06-15T22:30:00.000Z');

      // 22:30 UTC on June 15 is 02:30 on June 16 in Dubai (UTC+4)
      const dubaiDate = DateTimeUtil.formatDate(canonicalUtc, 'en-US', 'Asia/Dubai');
      expect(dubaiDate).toContain('Jun 16, 2026');

      const dubaiTime = DateTimeUtil.formatTime(canonicalUtc, 'en-US', 'Asia/Dubai');
      expect(dubaiTime).toBe('02:30 AM');
    });
  });

  describe('2. Accessibility & Assistive Quality Audit', () => {
    it('verifies that high-contrast Stitch tokens satisfy WCAG 2.1 AAA for dark glass themes', () => {
      // Primary text on base canvas
      const primaryEval = AccessibilityUtil.evaluateContrast('#E2E2E8', '#05070B');
      expect(primaryEval.ratio).toBeGreaterThanOrEqual(15.0);
      expect(primaryEval.passesNormalTextAAA).toBe(true);

      // Light blue accent on base canvas
      const blueEval = AccessibilityUtil.evaluateContrast('#93C5FD', '#05070B');
      expect(blueEval.ratio).toBeGreaterThanOrEqual(11.0);
      expect(blueEval.passesNormalTextAAA).toBe(true);
    });

    it('verifies interactive controls comply with minimum 44x44 pt touch targets', () => {
      expect(AccessibilityUtil.isAccessibleTouchTarget(52, 52)).toBe(true);
      expect(AccessibilityUtil.isAccessibleTouchTarget(44, 44)).toBe(true);

      // Compact elements are expanded using hitSlop
      const slop = AccessibilityUtil.calculateHitSlop(32, 32);
      expect(slop.top + 32 + slop.bottom).toBeGreaterThanOrEqual(44);
      expect(slop.left + 32 + slop.right).toBeGreaterThanOrEqual(44);
    });

    it('provides accessible screen reader telemetry announcements', () => {
      const readout = AccessibilityUtil.formatMetricForScreenReader(
        'Cardio Pace',
        '4:45',
        'per kilometer',
        'Aerobic zone 3',
      );
      expect(readout).toBe('Cardio Pace: 4:45 per kilometer. Aerobic zone 3');
    });
  });

  describe('3. Enterprise Multi-Tenancy & RBAC Lifecycle', () => {
    it('configures enterprise license tier and validates seat capacity', async () => {
      const settings = await enterpriseController.updateSettings(
        orgId,
        {
          tier: 'ENTERPRISE',
          maxSeats: 500,
          allowedDomains: ['globalperformance.corp'],
          enforceSso: true,
        },
        orgAdmin,
      );

      expect(settings.tier).toBe('ENTERPRISE');
      expect(settings.maxSeats).toBe(500);

      // Assign coach and athlete to seats
      await enterpriseService.assignMember(orgId, coachUser.id, coachUser.email);
      await enterpriseService.assignMember(orgId, globalAthlete.id, globalAthlete.email);

      const seatStatus = await enterpriseController.getSeatStatus(orgId, orgAdmin);
      expect(seatStatus.seatsUsed).toBe(2);
      expect(seatStatus.remaining).toBe(498);
      expect(seatStatus.available).toBe(true);
    });

    it('enforces RBAC permissions across roles in the enterprise flow', () => {
      // Coach can view client telemetry and manage programs, but cannot manage org settings
      expect(RbacUtil.hasPermission(coachUser.role, EnterprisePermission.VIEW_CLIENT_TELEMETRY)).toBe(true);
      expect(RbacUtil.hasPermission(coachUser.role, EnterprisePermission.MANAGE_CLIENT_PROGRAM)).toBe(true);
      expect(RbacUtil.hasPermission(coachUser.role, EnterprisePermission.MANAGE_ORG_SETTINGS)).toBe(false);

      // Org Admin can manage org settings and export org data
      expect(RbacUtil.hasPermission(orgAdmin.role, EnterprisePermission.MANAGE_ORG_SETTINGS)).toBe(true);
      expect(RbacUtil.hasPermission(orgAdmin.role, EnterprisePermission.EXPORT_ORG_DATA)).toBe(true);
    });
  });

  describe('4. GDPR Article 20 & Article 17 Data Sovereignty Lifecycle', () => {
    it('executes full Article 20 Data Portability Export for the athlete', async () => {
      const bundle = await privacyController.exportData(globalAthlete);

      expect(bundle.exportId).toBeDefined();
      expect(bundle.user.id).toBe(globalAthlete.id);
      expect(bundle.user.email).toBe(globalAthlete.email);
      expect(bundle.workouts).toBeInstanceOf(Array);
      expect(bundle.nutrition).toBeInstanceOf(Array);
      expect(bundle.activity).toBeInstanceOf(Array);
      expect(bundle.compliance.gdprArticle).toBe('ARTICLE_20');
      expect(bundle.compliance.dataSovereignty).toBe('CANONICAL_UTC_METRIC');
    });

    it('manages privacy and telemetry consent with immutable audit tracking', async () => {
      const initialConsent = await privacyController.getConsent(globalAthlete);
      expect(initialConsent.analyticsTracking).toBe(true);

      const updated = await privacyController.updateConsent(globalAthlete, {
        analyticsTracking: false,
        telemetrySharing: false,
      });
      expect(updated.analyticsTracking).toBe(false);
      expect(updated.telemetrySharing).toBe(false);

      const audit = privacyService.getAuditTrail(globalAthlete.id);
      const consentAudit = audit.find((a) => a.action === 'PRIVACY_CONSENT_UPDATED');
      expect(consentAudit).toBeDefined();
    });

    it('executes full Article 17 Right to Erasure, scrubbing PII and pseudonymizing user identity', async () => {
      const erasureResult = await privacyController.anonymizeAccount(globalAthlete, {
        confirmPhrase: ERASURE_CONFIRM_PHRASE,
        reason: 'Athlete GDPR Article 17 Request',
      });

      expect(erasureResult.success).toBe(true);
      expect(erasureResult.pseudonym).toMatch(/^anonymized_[a-f0-9]+$/);

      // Verify scrubbed identity
      const scrubbed = privacyService.getUser(globalAthlete.id);
      expect(scrubbed?.fullName).toBe('Anonymized Athlete');
      expect(scrubbed?.email).toContain('@deleted.alpha.os');
      expect(scrubbed?.status).toBe(AccountStatus.DELETED);
      expect(scrubbed?.isActive).toBe(false);

      // Verify audit log
      const audit = privacyService.getAuditTrail(globalAthlete.id);
      const erasureAudit = audit.find((a) => a.action === 'USER_DATA_ANONYMIZED');
      expect(erasureAudit).toBeDefined();
      expect(erasureAudit?.metadata?.pseudonym).toBe(erasureResult.pseudonym);
    });
  });

  describe('5. Unicode-Safe Multilingual Athlete Directory Search & Sorting', () => {
    it('finds athlete names across accents, diacritics, and Arabic tashkeel', () => {
      const athletes = [
        { name: 'طارِق المَنصُور', id: 'a1' },
        { name: 'José García', id: 'a2' },
        { name: 'Sören Müller', id: 'a3' },
        { name: 'Hélène Dubois', id: 'a4' },
      ];

      // Arabic search without tashkeel matches text with tashkeel
      const matchAr = athletes.filter((a) =>
        UnicodeUtil.containsSearchQuery(a.name, 'طارق'),
      );
      expect(matchAr).toHaveLength(1);
      expect(matchAr[0]?.id).toBe('a1');

      // Spanish accent search
      const matchEs = athletes.filter((a) =>
        UnicodeUtil.containsSearchQuery(a.name, 'garcia'),
      );
      expect(matchEs).toHaveLength(1);
      expect(matchEs[0]?.id).toBe('a2');

      // German umlaut search
      const matchDe = athletes.filter((a) =>
        UnicodeUtil.containsSearchQuery(a.name, 'soren'),
      );
      expect(matchDe).toHaveLength(1);
      expect(matchDe[0]?.id).toBe('a3');

      // French accent search
      const matchFr = athletes.filter((a) =>
        UnicodeUtil.containsSearchQuery(a.name, 'helene'),
      );
      expect(matchFr).toHaveLength(1);
      expect(matchFr[0]?.id).toBe('a4');
    });

    it('performs deterministic locale-aware sorting of multilingual athlete rosters', () => {
      const names = ['Ömer', 'Alex', 'Élise', 'Carlos', 'Zack'];
      const sorted = UnicodeUtil.localeSort(names, (n) => n, 'en');
      expect(sorted).toEqual(['Alex', 'Carlos', 'Élise', 'Ömer', 'Zack']);
    });
  });
});
