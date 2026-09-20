export const SENSITIVE_BIOMETRIC_PATTERNS = [
  /\bbody\s*fat\s*(is|:)?\s*\d+(\.\d+)?\s*%/i,
  /\bweight\s*(is|:)?\s*\d+(\.\d+)?\s*(kg|lbs|pounds)\b/i,
  /\bheart\s*rate\s*(is|:)?\s*\d+\s*(bpm)?\b/i,
  /\bbmi\s*(is|:)?\s*\d+(\.\d+)?\b/i,
  /\bblood\s*pressure\b/i,
];

export const NotificationPrivacyUtil = {
  /**
   * Check if notification text contains sensitive biometric or medical telemetry
   */
  containsSensitiveTelemetry(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return SENSITIVE_BIOMETRIC_PATTERNS.some((pattern) => pattern.test(text));
  },

  /**
   * Sanitize notification title and body to prevent lock-screen PII/health data leakage
   */
  sanitizeForLockScreen(
    title: string,
    body: string,
    userOptedIntoSensitivePreviews = false,
  ): { title: string; body: string } {
    if (userOptedIntoSensitivePreviews) {
      return { title, body };
    }

    let sanitizedBody = body;

    // Redact body fat percentages
    sanitizedBody = sanitizedBody.replace(
      /\bbody\s*fat\s*(is|:)?\s*\d+(\.\d+)?\s*%/gi,
      'body composition updated',
    );

    // Redact specific weight readings
    sanitizedBody = sanitizedBody.replace(
      /\bweight\s*(is|:)?\s*\d+(\.\d+)?\s*(kg|lbs|pounds)\b/gi,
      'weight log recorded',
    );

    // Redact exact heart rate numbers
    sanitizedBody = sanitizedBody.replace(
      /\bheart\s*rate\s*(is|:)?\s*\d+\s*bpm\b/gi,
      'heart rate telemetry recorded',
    );

    return {
      title,
      body: sanitizedBody,
    };
  },
};
