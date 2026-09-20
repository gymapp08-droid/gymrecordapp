import {
  AccessibilityUtil,
  WCAG_STANDARDS,
  STITCH_COLOR_TOKENS,
} from '@alpha/utils';

describe('PHASE 11 — GATE B: ACCESSIBILITY (A11Y) & USABILITY FOUNDATION', () => {
  describe('1. WCAG 2.1 Luminance and Contrast Calculation', () => {
    it('calculates relative luminance accurately for standard extremes', () => {
      const blackLum = AccessibilityUtil.calculateRelativeLuminance('#000000');
      const whiteLum = AccessibilityUtil.calculateRelativeLuminance('#FFFFFF');

      expect(blackLum).toBeCloseTo(0, 4);
      expect(whiteLum).toBeCloseTo(1, 4);
      expect(whiteLum).toBeGreaterThan(blackLum);
    });

    it('calculates maximum contrast ratio (21:1) between pure white and pure black', () => {
      const ratio = AccessibilityUtil.calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBe(21);

      const inverse = AccessibilityUtil.calculateContrastRatio('#000000', '#FFFFFF');
      expect(inverse).toBe(21);
    });

    it('calculates minimum contrast ratio (1:1) for identical colors', () => {
      const ratio = AccessibilityUtil.calculateContrastRatio('#111318', '#111318');
      expect(ratio).toBe(1);
    });

    it('handles 3-digit shorthand hex codes as well as 6-digit codes', () => {
      const ratioShort = AccessibilityUtil.calculateContrastRatio('#FFF', '#000');
      expect(ratioShort).toBe(21);
    });

    it('throws descriptive error on invalid hex input', () => {
      expect(() => AccessibilityUtil.calculateRelativeLuminance('not-a-color')).toThrow(
        'Invalid hex color string',
      );
    });
  });

  describe('2. Stitch Black Glass Design System Contrast Audit', () => {
    it('MANDATORY: Primary text on dark canvas passes WCAG 2.1 AA and AAA (>= 7.0:1)', () => {
      const evalResult = AccessibilityUtil.evaluateContrast(
        STITCH_COLOR_TOKENS.textPrimary, // #E2E2E8
        STITCH_COLOR_TOKENS.backgroundCanvas, // #05070B
      );

      expect(evalResult.ratio).toBeGreaterThanOrEqual(WCAG_STANDARDS.MIN_NORMAL_TEXT_AAA);
      expect(evalResult.passesNormalTextAA).toBe(true);
      expect(evalResult.passesNormalTextAAA).toBe(true);
    });

    it('MANDATORY: Secondary text on card surface passes WCAG 2.1 AA (>= 4.5:1)', () => {
      const evalResult = AccessibilityUtil.evaluateContrast(
        STITCH_COLOR_TOKENS.textSecondary, // #C3C6D7
        STITCH_COLOR_TOKENS.backgroundCard, // #0A0C10
      );

      expect(evalResult.ratio).toBeGreaterThanOrEqual(WCAG_STANDARDS.MIN_NORMAL_TEXT_AA);
      expect(evalResult.passesNormalTextAA).toBe(true);
    });

    it('MANDATORY: Accent Cyan on dark background passes WCAG 2.1 AA (>= 4.5:1)', () => {
      const evalResult = AccessibilityUtil.evaluateContrast(
        STITCH_COLOR_TOKENS.accentCyan, // #00F0FF
        STITCH_COLOR_TOKENS.backgroundCanvas, // #05070B
      );

      expect(evalResult.ratio).toBeGreaterThanOrEqual(10.0);
      expect(evalResult.passesNormalTextAA).toBe(true);
    });

    it('MANDATORY: High-contrast Accent Blue passes WCAG 2.1 AAA for accessible reading', () => {
      const evalResult = AccessibilityUtil.evaluateContrast(
        STITCH_COLOR_TOKENS.accentBlueLight, // #93C5FD
        STITCH_COLOR_TOKENS.backgroundCanvas, // #05070B
      );

      expect(evalResult.ratio).toBeGreaterThanOrEqual(WCAG_STANDARDS.MIN_NORMAL_TEXT_AAA);
      expect(evalResult.passesNormalTextAAA).toBe(true);
    });

    it('MANDATORY: Error callout text on dark canvas passes WCAG 2.1 AA (>= 4.5:1)', () => {
      const evalResult = AccessibilityUtil.evaluateContrast(
        STITCH_COLOR_TOKENS.accentError, // #FFB4AB
        STITCH_COLOR_TOKENS.backgroundCanvas, // #05070B
      );

      expect(evalResult.ratio).toBeGreaterThanOrEqual(WCAG_STANDARDS.MIN_NORMAL_TEXT_AA);
      expect(evalResult.passesNormalTextAA).toBe(true);
    });
  });

  describe('3. Minimum Touch Target (44x44 pt) Enforcement', () => {
    it('accepts compliant touch target dimensions (>= 44x44 pt)', () => {
      expect(AccessibilityUtil.isAccessibleTouchTarget(44, 44)).toBe(true);
      expect(AccessibilityUtil.isAccessibleTouchTarget(52, 48)).toBe(true);
      expect(AccessibilityUtil.isAccessibleTouchTarget(64, 44)).toBe(true);
    });

    it('flags non-compliant touch targets (< 44 pt in either dimension)', () => {
      expect(AccessibilityUtil.isAccessibleTouchTarget(40, 44)).toBe(false);
      expect(AccessibilityUtil.isAccessibleTouchTarget(44, 32)).toBe(false);
      expect(AccessibilityUtil.isAccessibleTouchTarget(28, 28)).toBe(false);
    });

    it('calculates hitSlop expansion needed to satisfy 44x44 pt touch requirements', () => {
      const hitSlop = AccessibilityUtil.calculateHitSlop(30, 30);
      // 44 - 30 = 14 shortfall -> 7 padding on each side
      expect(hitSlop.top).toBe(7);
      expect(hitSlop.bottom).toBe(7);
      expect(hitSlop.left).toBe(7);
      expect(hitSlop.right).toBe(7);

      // Verify no hitSlop needed if already compliant
      const noSlop = AccessibilityUtil.calculateHitSlop(48, 50);
      expect(noSlop.top).toBe(0);
      expect(noSlop.bottom).toBe(0);
      expect(noSlop.left).toBe(0);
      expect(noSlop.right).toBe(0);
    });
  });

  describe('4. Screen Reader Semantics & Telemetry Descriptors', () => {
    it('formats biometric and performance telemetry with units and contextual meaning', () => {
      const readout = AccessibilityUtil.formatMetricForScreenReader(
        'Readiness Score',
        88,
        'percent',
        'Optimal physiological state for maximal overload',
      );
      expect(readout).toBe(
        'Readiness Score: 88 percent. Optimal physiological state for maximal overload',
      );
    });

    it('formats heart rate telemetry clearly for assistive audio', () => {
      const hr = AccessibilityUtil.formatMetricForScreenReader(
        'Current Heart Rate',
        155,
        'beats per minute',
        'Zone 4 threshold training',
      );
      expect(hr).toBe('Current Heart Rate: 155 beats per minute. Zone 4 threshold training');
    });

    it('builds comprehensive button accessibility descriptor with state', () => {
      const desc = AccessibilityUtil.buildButtonAccessibility(
        'Start Live Workout Session',
        'Launches the active workout HUD and initiates heart rate telemetry',
        { disabled: false, busy: false },
      );

      expect(desc.role).toBe('button');
      expect(desc.label).toBe('Start Live Workout Session');
      expect(desc.hint).toContain('active workout HUD');
      expect(desc.state?.disabled).toBe(false);
      expect(desc.state?.busy).toBe(false);
    });
  });

  describe('5. Dynamic Scaling & Reduced Motion Preferences', () => {
    it('clamps font scaling safely between 1.0x and 2.0x', () => {
      expect(AccessibilityUtil.clampFontScale(1.0)).toBe(1.0);
      expect(AccessibilityUtil.clampFontScale(1.5)).toBe(1.5);
      expect(AccessibilityUtil.clampFontScale(2.0)).toBe(2.0);

      // Clamps under-scaled font (< 1.0)
      expect(AccessibilityUtil.clampFontScale(0.8)).toBe(1.0);

      // Clamps excessive font scale (> 2.0) to prevent interface overflow
      expect(AccessibilityUtil.clampFontScale(3.2)).toBe(2.0);
    });

    it('safely disables animation when prefersReducedMotion is true', () => {
      expect(AccessibilityUtil.shouldDisableAnimations(true)).toBe(true);
      expect(AccessibilityUtil.shouldDisableAnimations(false)).toBe(false);
    });
  });
});
