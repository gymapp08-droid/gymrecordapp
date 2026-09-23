/**
 * ALPHA Personal Performance OS — Timezone & Biometric Utilities
 * Default Timezone: Asia/Kolkata (IST)
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export type TimezoneGreeting = 'GOOD MORNING' | 'GOOD AFTERNOON' | 'GOOD EVENING';

export type BmiCategory = 'UNDERWEIGHT' | 'HEALTHY_RANGE' | 'OVERWEIGHT' | 'OBESITY_RANGE' | 'UNAVAILABLE';

export interface BmiResult {
  value: number | null;
  category: BmiCategory;
  categoryLabel: string;
  disclaimer: string;
}

export type TrainingMaturity = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NOT_ESTABLISHED';

/**
 * Get current time-aware greeting in user's timezone
 */
export function getTimeAwareGreeting(timezone: string = DEFAULT_TIMEZONE): TimezoneGreeting {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    if (hour >= 4 && hour < 12) return 'GOOD MORNING';
    if (hour >= 12 && hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  } catch {
    const localHour = new Date().getHours();
    if (localHour >= 4 && localHour < 12) return 'GOOD MORNING';
    if (localHour >= 12 && localHour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }
}

export const getGreeting = getTimeAwareGreeting;

/**
 * Get day of week in user's timezone: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
 */
export function getTodayDayOfWeek(timezone: string = DEFAULT_TIMEZONE): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: timezone,
    });
    const dayStr = formatter.format(new Date()).toLowerCase();
    const map: Record<string, number> = {
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
      sun: 7,
    };
    return map[dayStr] || 1;
  } catch {
    const day = new Date().getDay(); // 0 = Sun, 1 = Mon ...
    return day === 0 ? 7 : day;
  }
}

/**
 * Format localized date string for header: e.g. "Wednesday, September 24"
 */
export function formatLocalizedDate(date: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
}

/**
 * Get ISO date string YYYY-MM-DD for today in user's timezone
 */
export function getTodayDateString(timezone: string = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Returns YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0]!;
  }
}

/**
 * Calculate BMI dynamically with strict unit validation:
 * Metric: weightKg / (heightM)^2
 * Imperial: (weightLbs * 703) / (heightInches)^2
 */
export function calculateBmi(
  weight: number | null | undefined,
  height: number | null | undefined,
  unitSystem: 'METRIC' | 'IMPERIAL' = 'METRIC'
): BmiResult {
  const disclaimer = 'BMI is a general screening metric, not a clinical body composition or medical diagnosis.';

  if (!weight || !height || weight <= 0 || height <= 0) {
    return {
      value: null,
      category: 'UNAVAILABLE',
      categoryLabel: 'Unavailable',
      disclaimer,
    };
  }

  let bmi: number;
  if (unitSystem === 'IMPERIAL') {
    // weight in lbs, height in inches
    bmi = (weight * 703) / (height * height);
  } else {
    // weight in kg, height in cm
    const heightM = height / 100;
    bmi = weight / (heightM * heightM);
  }

  const rounded = Math.round(bmi * 10) / 10;

  if (rounded < 18.5) {
    return {
      value: rounded,
      category: 'UNDERWEIGHT',
      categoryLabel: 'Underweight Range',
      disclaimer,
    };
  }
  if (rounded < 25.0) {
    return {
      value: rounded,
      category: 'HEALTHY_RANGE',
      categoryLabel: 'Healthy Range',
      disclaimer,
    };
  }
  if (rounded < 30.0) {
    return {
      value: rounded,
      category: 'OVERWEIGHT',
      categoryLabel: 'Overweight Range',
      disclaimer,
    };
  }
  return {
    value: rounded,
    category: 'OBESITY_RANGE',
    categoryLabel: 'Obesity Range',
    disclaimer,
  };
}

/**
 * Determine training maturity based on transparent rule-based inputs
 */
export function determineTrainingMaturity(
  experienceLevel?: string,
  trainingYears?: number
): { maturity: TrainingMaturity; label: string; description: string } {
  if (!experienceLevel && (trainingYears === undefined || trainingYears === null)) {
    return {
      maturity: 'NOT_ESTABLISHED',
      label: 'Not established yet',
      description: 'Complete training calibration to establish progressive overload baseline.',
    };
  }

  const level = (experienceLevel || '').toUpperCase();
  const years = trainingYears || 0;

  if (level === 'BEGINNER' || years < 1) {
    return {
      maturity: 'BEGINNER',
      label: 'Beginner',
      description: 'Focus on neuromuscular adaptation, movement patterns, and form consistency.',
    };
  }

  if (level === 'ADVANCED' || level === 'ELITE' || years >= 4) {
    return {
      maturity: 'ADVANCED',
      label: 'Advanced',
      description: 'Periodized wave loading, targeted weak-point volume, and systemic fatigue management.',
    };
  }

  return {
    maturity: 'INTERMEDIATE',
    label: 'Intermediate',
    description: 'Systematic progressive overload, compound progression, and controlled volume accumulation.',
  };
}
