import * as crypto from 'crypto';

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export const MAGIC_BYTE_SIGNATURES: Record<AllowedMimeType, number[][]> = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff], // Standard JPEG start of image
  ],
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // Standard PNG magic bytes
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF header (offset 0..3)
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF magic bytes
  ],
};

export const FileSecurityUtil = {
  /**
   * Validate file buffer header against known binary magic byte signatures
   */
  validateMagicBytes(buffer: Buffer, mimeType: AllowedMimeType): boolean {
    if (!buffer || buffer.length < 8) return false;

    const signatures = MAGIC_BYTE_SIGNATURES[mimeType];
    if (!signatures) return false;

    return signatures.some((sig) => {
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Sanitize filename to prevent path traversal and null-byte injection attacks
   */
  sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return 'unnamed_file';

    // Remove null bytes
    let clean = filename.replace(/\0/g, '');

    // Extract basename taking both / and \ into account
    const parts = clean.split(/[/\\]+/);
    clean = parts[parts.length - 1] || 'unnamed_file';

    // Remove any remaining ..
    clean = clean.replace(/\.\./g, '').trim();

    // Preserve only safe alphanumeric, hyphen, underscore, and dot, collapsing repeated underscores
    clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');

    // Limit length
    if (clean.length > 100) {
      const extIndex = clean.lastIndexOf('.');
      const ext = extIndex !== -1 ? clean.substring(extIndex) : '';
      clean = clean.substring(0, 90) + ext;
    }

    return clean || 'unnamed_file';
  },

  /**
   * Enforce maximum file size limits (e.g. 10MB images, 25MB documents)
   */
  validateFileSize(bytes: number, maxMb: number): boolean {
    const maxBytes = maxMb * 1024 * 1024;
    return bytes > 0 && bytes <= maxBytes;
  },

  /**
   * Generate unpredictable, isolated object storage keys
   * Format: tenants/{tenantId}/users/{userId}/{category}/{timestamp}_{randomUuid}.{ext}
   */
  generateSecureStorageKey(
    userId: string,
    category: string,
    extension: string,
    tenantId = 'default',
  ): string {
    const sanitizedExt = extension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();

    return `tenants/${tenantId}/users/${userId}/${sanitizedCategory}/${timestamp}_${uuid}.${sanitizedExt}`;
  },

  /**
   * Verify presigned S3 URL TTL conforms to short-lived policy (max 15 minutes / 900 seconds)
   */
  isValidSignedUrlTtl(ttlSeconds: number, maxAllowed = 900): boolean {
    return ttlSeconds > 0 && ttlSeconds <= maxAllowed;
  },
};
