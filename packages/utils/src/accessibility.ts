import {
  WcagLevel,
  IColorContrastResult,
  IAccessibilityLabelDescriptor,
} from '@alpha/types';

/**
 * Standard WCAG 2.1 AA & AAA Constants
 */
export const WCAG_STANDARDS = {
  MIN_NORMAL_TEXT_AA: 4.5,
  MIN_LARGE_TEXT_AA: 3.0,
  MIN_NORMAL_TEXT_AAA: 7.0,
  MIN_LARGE_TEXT_AAA: 4.5,
  MIN_UI_COMPONENT: 3.0,
  MIN_TOUCH_TARGET_SIZE: 44, // 44x44 pt minimum per Apple HIG & WCAG 2.5.5
  MIN_FONT_SCALE: 1.0,
  MAX_FONT_SCALE: 2.0,
} as const;

/**
 * Stitch Design System Token Palettes for Contrast Audit
 */
export const STITCH_COLOR_TOKENS = {
  backgroundCanvas: '#05070B',
  backgroundCard: '#0A0C10',
  backgroundSurface: '#111318',
  backgroundSurfaceHigh: '#1E2024',
  textPrimary: '#E2E2E8',
  textSecondary: '#C3C6D7',
  textMuted: '#8D90A0',
  accentBlue: '#3882F6',
  accentBlueLight: '#93C5FD',
  accentCyan: '#00F0FF',
  accentGreen: '#4EDEA3',
  accentError: '#FFB4AB',
} as const;

export const AccessibilityUtil = {
  /**
   * Parse hex string to RGB components [r, g, b] in [0, 255]
   */
  hexToRgb(hex: string): [number, number, number] {
    const cleaned = hex.replace('#', '').trim();
    let r = 0, g = 0, b = 0;

    if (cleaned.length === 3) {
      const c0 = cleaned.charAt(0);
      const c1 = cleaned.charAt(1);
      const c2 = cleaned.charAt(2);
      r = parseInt(c0 + c0, 16);
      g = parseInt(c1 + c1, 16);
      b = parseInt(c2 + c2, 16);
    } else if (cleaned.length === 6) {
      r = parseInt(cleaned.substring(0, 2), 16);
      g = parseInt(cleaned.substring(2, 4), 16);
      b = parseInt(cleaned.substring(4, 6), 16);
    } else {
      throw new Error(`Invalid hex color string: ${hex}`);
    }

    return [r, g, b];
  },

  /**
   * Calculate relative luminance according to W3C WCAG 2.1 formula
   * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
   */
  calculateRelativeLuminance(hex: string): number {
    const [r255, g255, b255] = this.hexToRgb(hex);

    const transform = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };

    const r = transform(r255);
    const g = transform(g255);
    const b = transform(b255);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Calculate contrast ratio between foreground and background colors
   * Formula: (L1 + 0.05) / (L2 + 0.05)
   * Returns a value between 1.0 and 21.0
   */
  calculateContrastRatio(foregroundHex: string, backgroundHex: string): number {
    const l1 = this.calculateRelativeLuminance(foregroundHex);
    const l2 = this.calculateRelativeLuminance(backgroundHex);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    const ratio = (lighter + 0.05) / (darker + 0.05);
    return Math.round(ratio * 100) / 100;
  },

  /**
   * Evaluate contrast ratio against WCAG 2.1 AA and AAA thresholds
   */
  evaluateContrast(foregroundHex: string, backgroundHex: string): IColorContrastResult {
    const ratio = this.calculateContrastRatio(foregroundHex, backgroundHex);

    return {
      ratio,
      passesNormalTextAA: ratio >= WCAG_STANDARDS.MIN_NORMAL_TEXT_AA,
      passesLargeTextAA: ratio >= WCAG_STANDARDS.MIN_LARGE_TEXT_AA,
      passesNormalTextAAA: ratio >= WCAG_STANDARDS.MIN_NORMAL_TEXT_AAA,
      passesLargeTextAAA: ratio >= WCAG_STANDARDS.MIN_LARGE_TEXT_AAA,
      passesUiComponent: ratio >= WCAG_STANDARDS.MIN_UI_COMPONENT,
    };
  },

  /**
   * Check if a color pair meets the specified WCAG requirement
   */
  meetsContrastRequirement(
    foregroundHex: string,
    backgroundHex: string,
    level: WcagLevel = 'AA',
    isLargeText = false,
  ): boolean {
    const evalResult = this.evaluateContrast(foregroundHex, backgroundHex);
    if (level === 'AAA') {
      return isLargeText ? evalResult.passesLargeTextAAA : evalResult.passesNormalTextAAA;
    }
    return isLargeText ? evalResult.passesLargeTextAA : evalResult.passesNormalTextAA;
  },

  /**
   * Verify if a touch target meets minimum dimension requirements (44x44 pt/px)
   */
  isAccessibleTouchTarget(width: number, height: number): boolean {
    return (
      width >= WCAG_STANDARDS.MIN_TOUCH_TARGET_SIZE &&
      height >= WCAG_STANDARDS.MIN_TOUCH_TARGET_SIZE
    );
  },

  /**
   * Calculate hitSlop padding required to bring an undersized element to 44x44 pt
   */
  calculateHitSlop(
    currentWidth: number,
    currentHeight: number,
    minSize = WCAG_STANDARDS.MIN_TOUCH_TARGET_SIZE,
  ): { top: number; bottom: number; left: number; right: number } {
    const horizontalShortfall = Math.max(0, minSize - currentWidth);
    const verticalShortfall = Math.max(0, minSize - currentHeight);

    const left = Math.ceil(horizontalShortfall / 2);
    const right = Math.floor(horizontalShortfall / 2);
    const top = Math.ceil(verticalShortfall / 2);
    const bottom = Math.floor(verticalShortfall / 2);

    return { top, bottom, left, right };
  },

  /**
   * Format complex performance telemetry metrics into descriptive screen reader strings
   */
  formatMetricForScreenReader(
    label: string,
    value: number | string,
    unit?: string,
    context?: string,
  ): string {
    const unitStr = unit ? ` ${unit}` : '';
    const contextStr = context ? `. ${context}` : '';
    return `${label}: ${value}${unitStr}${contextStr}`;
  },

  /**
   * Build complete accessibility descriptor for interactive controls
   */
  buildButtonAccessibility(
    label: string,
    hint?: string,
    state?: { disabled?: boolean; selected?: boolean; checked?: boolean; busy?: boolean },
  ): IAccessibilityLabelDescriptor {
    return {
      label,
      hint,
      role: 'button',
      state,
    };
  },

  /**
   * Clamp font scale multiplier between 1.0 and 2.0 to ensure layout resilience
   */
  clampFontScale(scale: number): number {
    return Math.min(
      Math.max(scale, WCAG_STANDARDS.MIN_FONT_SCALE),
      WCAG_STANDARDS.MAX_FONT_SCALE,
    );
  },

  /**
   * Determine whether animations should be skipped or replaced with static transforms
   */
  shouldDisableAnimations(prefersReducedMotion: boolean): boolean {
    return Boolean(prefersReducedMotion);
  },
};
