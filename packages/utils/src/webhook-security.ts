import * as crypto from 'crypto';

export const WebhookSecurityUtil = {
  /**
   * Compute HMAC-SHA256 signature for webhook payload
   */
  generateSignature(payload: string | Buffer, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  },

  /**
   * Verify HMAC-SHA256 signature using timing-safe comparison
   */
  verifySignature(
    payload: string | Buffer,
    signatureHeader: string,
    secret: string,
  ): boolean {
    if (!payload || !signatureHeader || !secret) return false;

    const expectedSignature = this.generateSignature(payload, secret);
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(signatureHeader);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  },

  /**
   * Verify timestamp freshness to prevent webhook replay attacks
   * Rejects requests older than maxAgeSeconds (default: 300s / 5 min) or futuristic timestamps (>60s clock skew)
   */
  verifyTimestampFreshness(
    timestampHeader: string | number,
    maxAgeSeconds = 300,
    currentTimestampMs = Date.now(),
  ): boolean {
    let parsed =
      typeof timestampHeader === 'string' ? parseInt(timestampHeader, 10) : timestampHeader;

    if (isNaN(parsed)) return false;

    // Normalize epoch seconds (< 1e11) to milliseconds
    if (parsed < 1e11) {
      parsed *= 1000;
    }

    const diffMs = currentTimestampMs - parsed;

    // Reject futuristic timestamps (clock skew allowance of 60 seconds)
    if (diffMs < -60000) {
      return false;
    }

    // Reject expired payloads
    const maxAgeMs = maxAgeSeconds * 1000;
    return diffMs <= maxAgeMs;
  },
};
