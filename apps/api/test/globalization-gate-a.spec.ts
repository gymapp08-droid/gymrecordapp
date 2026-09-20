import {
  Units,
  DateTimeUtil,
  UnicodeUtil,
  i18n,
  I18nEngine,
  SUPPORTED_LOCALES,
  LOCALE_METADATA,
} from '@alpha/utils';
import { UnitSystem, IAuthUser, UserRole, AccountStatus } from '@alpha/types';
import { UsersService } from '../src/modules/users/users.service';
import { UsersController } from '../src/modules/users/users.controller';
import { UpdatePreferencesDto } from '@alpha/validation';

describe('PHASE 11 — GATE A: GLOBALIZATION FOUNDATION', () => {
  describe('1. I18n Translation Dictionary & Universal Engine', () => {
    it('supports all mandatory locales: en, hi, es, fr, de, ar', () => {
      expect(SUPPORTED_LOCALES).toEqual(['en', 'hi', 'es', 'fr', 'de', 'ar']);
      for (const locale of SUPPORTED_LOCALES) {
        expect(LOCALE_METADATA[locale]).toBeDefined();
        expect(LOCALE_METADATA[locale].code).toBe(locale);
        expect(LOCALE_METADATA[locale].defaultCurrency).toBeDefined();
      }
    });

    it('covers all core namespaces across all 6 locales', () => {
      const namespaces = [
        'auth',
        'workout',
        'nutrition',
        'activity',
        'progress',
        'ai',
        'coach',
        'organization',
        'notifications',
        'settings',
        'errors',
      ];

      for (const loc of SUPPORTED_LOCALES) {
        for (const ns of namespaces) {
          const translated = i18n.t(`${ns}.title`, undefined, loc);
          // If title doesn't exist, check welcome or notFound
          const fallbackCheck =
            translated !== `${ns}.title` ||
            i18n.t(`${ns}.welcome`, undefined, loc) !== `${ns}.welcome` ||
            i18n.t(`${ns}.notFound`, undefined, loc) !== `${ns}.notFound`;
          expect(fallbackCheck).toBe(true);
        }
      }
    });

    it('correctly normalizes locales (e.g. en-US -> en, hi-IN -> hi, ar-EG -> ar, unknown -> en)', () => {
      expect(I18nEngine.normalizeLocale('en-US')).toBe('en');
      expect(I18nEngine.normalizeLocale('hi-IN')).toBe('hi');
      expect(I18nEngine.normalizeLocale('es-ES')).toBe('es');
      expect(I18nEngine.normalizeLocale('fr-FR')).toBe('fr');
      expect(I18nEngine.normalizeLocale('de-DE')).toBe('de');
      expect(I18nEngine.normalizeLocale('ar-SA')).toBe('ar');
      expect(I18nEngine.normalizeLocale('xx-UNKNOWN')).toBe('en');
      expect(I18nEngine.normalizeLocale(undefined)).toBe('en');
    });

    it('performs variable interpolation without leaking raw tokens', () => {
      const greetingEn = i18n.t('ai.coachGreeting', { name: 'Marcus' }, 'en');
      expect(greetingEn).toBe('Hello Marcus, ready for peak performance today?');

      const greetingHi = i18n.t('ai.coachGreeting', { name: 'अर्जुन' }, 'hi');
      expect(greetingHi).toContain('अर्जुन');

      const greetingEs = i18n.t('ai.coachGreeting', { name: 'Carlos' }, 'es');
      expect(greetingEs).toContain('Carlos');

      const greetingAr = i18n.t('ai.coachGreeting', { name: 'طارق' }, 'ar');
      expect(greetingAr).toContain('طارق');
    });

    it('handles pluralization rules accurately (singular vs plural)', () => {
      const streak1 = i18n.t('progress.streak', { count: 1 }, 'en');
      expect(streak1).toBe('1 Day Streak');

      const streak5 = i18n.t('progress.streak', { count: 5 }, 'en');
      expect(streak5).toBe('5 Day Streak');

      const reps1 = i18n.t('workout.reps', { count: 1 }, 'es');
      expect(reps1).toBe('1 repetición');

      const reps10 = i18n.t('workout.reps', { count: 10 }, 'es');
      expect(reps10).toBe('10 repeticiones');
    });

    it('falls back gracefully to English or raw key if a translation is missing', () => {
      const missingKey = i18n.t('auth.nonExistentKey', undefined, 'fr');
      expect(missingKey).toBe('auth.nonExistentKey');
    });
  });

  describe('2. RTL Detection & Bi-Directional Layout Metadata', () => {
    it('detects Arabic (ar, ar-SA, ar-AE) as RTL', () => {
      expect(I18nEngine.isRTL('ar')).toBe(true);
      expect(I18nEngine.isRTL('ar-SA')).toBe(true);
      expect(I18nEngine.isRTL('ar-AE')).toBe(true);
      expect(I18nEngine.getTextDirection('ar')).toBe('rtl');
    });

    it('detects LTR locales properly (en, hi, es, fr, de)', () => {
      expect(I18nEngine.isRTL('en')).toBe(false);
      expect(I18nEngine.isRTL('hi')).toBe(false);
      expect(I18nEngine.isRTL('es')).toBe(false);
      expect(I18nEngine.isRTL('fr')).toBe(false);
      expect(I18nEngine.isRTL('de')).toBe(false);
      expect(I18nEngine.getTextDirection('en')).toBe('ltr');
      expect(I18nEngine.getTextDirection('hi')).toBe('ltr');
    });
  });

  describe('3. Units Conversion & Presentation Formatting', () => {
    it('converts weight between kg and lb accurately', () => {
      expect(Units.kgToLb(70)).toBe(154.3);
      expect(Units.lbToKg(154.3)).toBe(70);
      expect(Units.convertWeight(80, 'kg', 'lb')).toBe(176.4);
      expect(Units.convertWeight(176.4, 'lb', 'kg')).toBe(80);
      expect(Units.convertWeight(100, 'kg', 'kg')).toBe(100);
    });

    it('converts distance between km and miles accurately', () => {
      expect(Units.kmToMiles(10)).toBe(6.21);
      expect(Units.milesToKm(6.21)).toBe(9.99);
      expect(Units.convertDistance(5, 'km', 'mi')).toBe(3.11);
      expect(Units.convertDistance(3.11, 'mi', 'km')).toBe(5.01);
    });

    it('converts height between cm and feet/inches accurately', () => {
      expect(Units.cmToInches(180)).toBe(70.9);
      expect(Units.inchesToCm(70.9)).toBe(180.1);

      const { feet, inches } = Units.cmToFeetInches(180);
      expect(feet).toBe(5);
      expect(inches).toBe(11);

      const convertedCm = Units.feetInchesToCm(5, 11);
      expect(convertedCm).toBe(180.3);
    });

    it('converts temperature between Celsius and Fahrenheit', () => {
      expect(Units.celsiusToFahrenheit(25)).toBe(77);
      expect(Units.fahrenheitToCelsius(77)).toBe(25);
      expect(Units.celsiusToFahrenheit(0)).toBe(32);
      expect(Units.fahrenheitToCelsius(32)).toBe(0);
    });

    it('converts speed between km/h and mph', () => {
      expect(Units.kmhToMph(100)).toBe(62.1);
      expect(Units.mphToKmh(62.1)).toBe(99.9);
    });

    it('formats currencies accurately according to locale', () => {
      const usd = Units.formatCurrency(150, 'USD', 'en-US');
      expect(usd).toContain('150');
      expect(usd).toContain('$');

      const inr = Units.formatCurrency(5000, 'INR', 'en-IN');
      expect(inr).toContain('5,000');

      const aed = Units.formatCurrency(250, 'AED', 'en-AE');
      expect(aed).toContain('250');
    });

    it('formats distance and weight presentation strings with unit awareness', () => {
      const metricDist = Units.formatDistanceWithUnit(10.5, 'METRIC', 'en-US');
      expect(metricDist).toBe('10.5 km');

      const imperialDist = Units.formatDistanceWithUnit(10.5, 'IMPERIAL', 'en-US');
      expect(imperialDist).toBe('6.52 mi');

      const metricWeight = Units.formatWeightWithUnit(82.5, 'METRIC', 'en-US');
      expect(metricWeight).toBe('82.5 kg');

      const imperialWeight = Units.formatWeightWithUnit(82.5, 'IMPERIAL', 'en-US');
      expect(imperialWeight).toBe('181.9 lbs');
    });
  });

  describe('4. Timezone & Localized Date/Time Utilities', () => {
    it('validates IANA timezones correctly', () => {
      expect(DateTimeUtil.isValidTimezone('UTC')).toBe(true);
      expect(DateTimeUtil.isValidTimezone('America/New_York')).toBe(true);
      expect(DateTimeUtil.isValidTimezone('Europe/London')).toBe(true);
      expect(DateTimeUtil.isValidTimezone('Asia/Kolkata')).toBe(true);
      expect(DateTimeUtil.isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(DateTimeUtil.isValidTimezone('Invalid/Timezone_Name')).toBe(false);
      expect(DateTimeUtil.isValidTimezone('')).toBe(false);
    });

    it('formats dates in target user timezone without altering canonical UTC input', () => {
      // 2026-06-15T00:00:00.000Z
      const dateUtc = new Date('2026-06-15T00:00:00.000Z');

      const nyDate = DateTimeUtil.formatDate(dateUtc, 'en-US', 'America/New_York');
      // In New York (EDT, UTC-4), June 15 00:00 UTC is June 14
      expect(nyDate).toContain('Jun 14, 2026');

      const tokyoDate = DateTimeUtil.formatDate(dateUtc, 'en-US', 'Asia/Tokyo');
      // In Tokyo (JST, UTC+9), June 15 00:00 UTC is June 15
      expect(tokyoDate).toContain('Jun 15, 2026');
    });

    it('formats relative time differences correctly', () => {
      const now = new Date('2026-06-15T12:00:00.000Z');
      const fiveMinsAgo = new Date('2026-06-15T11:55:00.000Z');
      const twoHoursAgo = new Date('2026-06-15T10:00:00.000Z');
      const threeDaysAgo = new Date('2026-06-12T12:00:00.000Z');

      expect(DateTimeUtil.formatRelativeTime(fiveMinsAgo, now, 'en')).toBe('5 minutes ago');
      expect(DateTimeUtil.formatRelativeTime(twoHoursAgo, now, 'en')).toBe('2 hours ago');
      expect(DateTimeUtil.formatRelativeTime(threeDaysAgo, now, 'en')).toBe('3 days ago');
    });
  });

  describe('5. Unicode-Safe Search, Normalization & Collation', () => {
    it('normalizes diacritics and accents for robust search', () => {
      expect(UnicodeUtil.normalizeForSearch('Café')).toBe('cafe');
      expect(UnicodeUtil.normalizeForSearch('Über')).toBe('uber');
      expect(UnicodeUtil.normalizeForSearch('Crème Brûlée')).toBe('creme brulee');
      expect(UnicodeUtil.normalizeForSearch('Día de Entrenamiento')).toBe('dia de entrenamiento');
    });

    it('strips Arabic tashkeel / harakat diacritical marks', () => {
      // "تَمْرِين" (tamreen with fathah and sukun) -> "تمرين"
      const withTashkeel = 'تَمْرِينٌ';
      const normalized = UnicodeUtil.normalizeForSearch(withTashkeel);
      expect(normalized).toBe('تمرين');
    });

    it('matches search queries accent-insensitively', () => {
      expect(UnicodeUtil.containsSearchQuery('Barbell Squat Séance', 'seance')).toBe(true);
      expect(UnicodeUtil.containsSearchQuery('Proteína de Suero', 'proteina')).toBe(true);
      expect(UnicodeUtil.containsSearchQuery('Krafttraining Übung', 'ubung')).toBe(true);
    });

    it('performs deterministic locale-aware sorting', () => {
      const words = ['apple', 'zoo', 'banana', 'orange'];
      const sorted = UnicodeUtil.localeSort(words, (w) => w, 'en');
      expect(sorted).toEqual(['apple', 'banana', 'orange', 'zoo']);
    });
  });

  describe('6. User Preferences & Localization API Endpoints', () => {
    let service: UsersService;
    let controller: UsersController;

    const mockUser: IAuthUser = {
      id: 'athlete_global_001',
      email: 'athlete@alpha.os',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    };

    beforeEach(() => {
      service = new UsersService();
      controller = new UsersController(service);
    });

    it('retrieves default user preferences with metric, UTC, en settings', async () => {
      const prefs = await controller.getMePreferences(mockUser);
      expect(prefs).toBeDefined();
      expect(prefs.userId).toBe(mockUser.id);
      expect(prefs.unitSystem).toBe(UnitSystem.METRIC);
      expect(prefs.timezone).toBe('UTC');
      expect(prefs.language).toBe('en');
      expect(prefs.theme).toBe('black_glass');
    });

    it('updates user preferences to IMPERIAL, Asia/Kolkata, hi (Hindi)', async () => {
      const updateDto: UpdatePreferencesDto = {
        unitSystem: UnitSystem.IMPERIAL,
        timezone: 'Asia/Kolkata',
        language: 'hi',
      };

      const updated = await controller.updateMePreferences(mockUser, updateDto);
      expect(updated.unitSystem).toBe(UnitSystem.IMPERIAL);
      expect(updated.timezone).toBe('Asia/Kolkata');
      expect(updated.language).toBe('hi');

      // Verify persistence in service
      const fetched = await controller.getMePreferences(mockUser);
      expect(fetched.unitSystem).toBe(UnitSystem.IMPERIAL);
      expect(fetched.timezone).toBe('Asia/Kolkata');
      expect(fetched.language).toBe('hi');
    });

    it('supports user isolation on :userId/preferences route', async () => {
      const athletePref = await controller.getUserPreferences(mockUser.id);
      expect(athletePref.userId).toBe(mockUser.id);

      const updateDto: UpdatePreferencesDto = {
        language: 'ar',
        timezone: 'Asia/Dubai',
      };
      const updated = await controller.updateUserPreferences(mockUser.id, updateDto);
      expect(updated.language).toBe('ar');
      expect(updated.timezone).toBe('Asia/Dubai');
    });
  });
});
