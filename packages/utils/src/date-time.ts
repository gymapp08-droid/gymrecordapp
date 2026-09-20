import { DEFAULT_LOCALE } from './i18n';

export const DEFAULT_TIMEZONE = 'UTC';

export const DateTimeUtil = {
  /**
   * Validate if a string is a valid IANA timezone name
   */
  isValidTimezone(tz?: string): boolean {
    if (!tz || typeof tz !== 'string') return false;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Normalize date input to a valid Date object
   */
  toDate(input: Date | string | number): Date {
    if (input instanceof Date) return input;
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date value: ${input}`);
    }
    return parsed;
  },

  /**
   * Format a date into a localized date string in user's timezone
   */
  formatDate(
    date: Date | string | number,
    locale: string = DEFAULT_LOCALE,
    timezone: string = DEFAULT_TIMEZONE,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const d = this.toDate(date);
    const validTz = this.isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: validTz,
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  },

  /**
   * Format a date into a localized time string in user's timezone
   */
  formatTime(
    date: Date | string | number,
    locale: string = DEFAULT_LOCALE,
    timezone: string = DEFAULT_TIMEZONE,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const d = this.toDate(date);
    const validTz = this.isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: validTz,
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  },

  /**
   * Format a date into a combined localized date & time string in user's timezone
   */
  formatDateTime(
    date: Date | string | number,
    locale: string = DEFAULT_LOCALE,
    timezone: string = DEFAULT_TIMEZONE,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const d = this.toDate(date);
    const validTz = this.isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: validTz,
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  },

  /**
   * Format a relative time difference (e.g. "5 minutes ago", "in 2 hours")
   */
  formatRelativeTime(
    date: Date | string | number,
    baseDate: Date = new Date(),
    locale: string = DEFAULT_LOCALE,
  ): string {
    const d = this.toDate(date);
    const elapsedSeconds = Math.round((d.getTime() - baseDate.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    const absSeconds = Math.abs(elapsedSeconds);
    if (absSeconds < 60) {
      return rtf.format(elapsedSeconds, 'second');
    }
    const elapsedMinutes = Math.round(elapsedSeconds / 60);
    const absMinutes = Math.abs(elapsedMinutes);
    if (absMinutes < 60) {
      return rtf.format(elapsedMinutes, 'minute');
    }
    const elapsedHours = Math.round(elapsedMinutes / 60);
    const absHours = Math.abs(elapsedHours);
    if (absHours < 24) {
      return rtf.format(elapsedHours, 'hour');
    }
    const elapsedDays = Math.round(elapsedHours / 24);
    const absDays = Math.abs(elapsedDays);
    if (absDays < 30) {
      return rtf.format(elapsedDays, 'day');
    }
    const elapsedMonths = Math.round(elapsedDays / 30);
    const absMonths = Math.abs(elapsedMonths);
    if (absMonths < 12) {
      return rtf.format(elapsedMonths, 'month');
    }
    const elapsedYears = Math.round(elapsedDays / 365);
    return rtf.format(elapsedYears, 'year');
  },
};
