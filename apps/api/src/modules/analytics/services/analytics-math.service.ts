import { Injectable } from '@nestjs/common';
import { IPeriodComparison } from '@alpha/types';

@Injectable()
export class AnalyticsMathService {
  /**
   * Safe division handling zero or negative denominator
   * Returns null if denominator is 0 or negative, indicating insufficient/invalid data
   */
  safeDivide(numerator: number, denominator: number): number | null {
    if (denominator <= 0 || isNaN(denominator) || isNaN(numerator)) {
      return null;
    }
    return numerator / denominator;
  }

  /**
   * Safe percentage calculation bounded to [0, 100]
   * Returns null if eligible denominator is 0
   */
  calculatePercentage(part: number, total: number): number | null {
    if (total <= 0 || isNaN(total) || isNaN(part)) {
      return null;
    }
    const pct = (part / total) * 100;
    // Strictly validate mathematical bounds
    if (pct < 0) return 0;
    if (pct > 100) return 100;
    return Math.round(pct * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculates period comparison with strict distinction between:
   * 1. Percentage Points (for rates, e.g. 84% - 78% = +6 pp)
   * 2. Percentage Growth / Relative change (e.g. ((84 - 78) / 78) * 100 = +7.7%)
   */
  comparePeriods(
    current: number | null,
    previous: number | null,
    isRateOrPercentage = false,
  ): IPeriodComparison<number> {
    if (current === null || previous === null || isNaN(current) || isNaN(previous)) {
      return {
        current: current ?? 0,
        previous: previous ?? 0,
        changeAbsolute: 0,
        changePercentage: null,
        changePercentagePoints: null,
        trendDirection: 'INSUFFICIENT_DATA',
      };
    }

    const changeAbsolute = Math.round((current - previous) * 100) / 100;

    let changePercentage: number | null = null;
    if (previous !== 0) {
      changePercentage = Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
    }

    let changePercentagePoints: number | null = null;
    if (isRateOrPercentage) {
      changePercentagePoints = Math.round((current - previous) * 10) / 10;
    }

    let trendDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    if (changeAbsolute > 0.001) {
      trendDirection = 'UP';
    } else if (changeAbsolute < -0.001) {
      trendDirection = 'DOWN';
    }

    return {
      current,
      previous,
      changeAbsolute,
      changePercentage,
      changePercentagePoints,
      trendDirection,
    };
  }

  /**
   * Data quality verification: ensures metrics do not violate mathematical logic
   */
  validateQuality(metricName: string, value: number, isPercentage = false): void {
    if (value < 0) {
      throw new Error(`Data quality violation: Metric [${metricName}] cannot be negative (${value})`);
    }
    if (isPercentage && value > 100) {
      throw new Error(`Data quality violation: Metric [${metricName}] percentage cannot exceed 100% (${value})`);
    }
  }
}
