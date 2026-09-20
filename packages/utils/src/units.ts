/**
 * Production Units Conversion & Presentation Formatting Utilities
 * Canonical database storage is strictly Metric (kg, cm, m, km, celsius).
 * Presentation conversions are deterministic and locale-aware.
 */

export const Units = {
  // Mass / Weight
  kgToLb(kg: number): number {
    return Math.round(kg * 2.20462 * 10) / 10;
  },

  lbToKg(lb: number): number {
    return Math.round((lb / 2.20462) * 10) / 10;
  },

  convertWeight(val: number, from: 'kg' | 'lb', to: 'kg' | 'lb'): number {
    if (from === to) return val;
    return from === 'kg' ? this.kgToLb(val) : this.lbToKg(val);
  },

  // Length / Height / Distance
  cmToInches(cm: number): number {
    return Math.round((cm / 2.54) * 10) / 10;
  },

  inchesToCm(inches: number): number {
    return Math.round(inches * 2.54 * 10) / 10;
  },

  cmToFeetInches(cm: number): { feet: number; inches: number } {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  },

  feetInchesToCm(feet: number, inches: number): number {
    const totalInches = feet * 12 + inches;
    return Math.round(totalInches * 2.54 * 10) / 10;
  },

  kmToMiles(km: number): number {
    return Math.round(km * 0.621371 * 100) / 100;
  },

  milesToKm(miles: number): number {
    return Math.round((miles / 0.621371) * 100) / 100;
  },

  convertDistance(val: number, from: 'km' | 'mi', to: 'km' | 'mi'): number {
    if (from === to) return val;
    return from === 'km' ? this.kmToMiles(val) : this.milesToKm(val);
  },

  // Speed
  kmhToMph(kmh: number): number {
    return Math.round(kmh * 0.621371 * 10) / 10;
  },

  mphToKmh(mph: number): number {
    return Math.round((mph / 0.621371) * 10) / 10;
  },

  // Temperature
  celsiusToFahrenheit(c: number): number {
    return Math.round((c * (9 / 5) + 32) * 10) / 10;
  },

  fahrenheitToCelsius(f: number): number {
    return Math.round(((f - 32) * (5 / 9)) * 10) / 10;
  },

  // Formatting numbers and currencies
  formatNumber(value: number, locale = 'en-US', options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(locale, options).format(value);
  },

  formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  },

  formatDistanceWithUnit(km: number, unitSystem: 'METRIC' | 'IMPERIAL', locale = 'en-US'): string {
    if (unitSystem === 'IMPERIAL') {
      const miles = this.kmToMiles(km);
      return `${this.formatNumber(miles, locale, { maximumFractionDigits: 2 })} mi`;
    }
    return `${this.formatNumber(km, locale, { maximumFractionDigits: 2 })} km`;
  },

  formatWeightWithUnit(kg: number, unitSystem: 'METRIC' | 'IMPERIAL', locale = 'en-US'): string {
    if (unitSystem === 'IMPERIAL') {
      const lbs = this.kgToLb(kg);
      return `${this.formatNumber(lbs, locale, { maximumFractionDigits: 1 })} lbs`;
    }
    return `${this.formatNumber(kg, locale, { maximumFractionDigits: 1 })} kg`;
  },
};
