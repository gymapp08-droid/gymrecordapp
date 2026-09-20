import * as crypto from 'crypto';
import { IDataPortabilityBundle } from '@alpha/types';

function canonicalStringify(val: any): string {
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map((item) => canonicalStringify(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(val).sort();
  const pairs = sortedKeys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(val[k])}`);
  return '{' + pairs.join(',') + '}';
}

export const ExportChecksumUtil = {
  /**
   * Produce deterministic SHA-256 checksum over data portability payload
   */
  generateChecksum(payload: Record<string, any>): string {
    // Exclude existing checksum property to allow verification
    const { checksum: _omitted, ...cleanPayload } = payload;
    const serialized = canonicalStringify(cleanPayload);
    return crypto.createHash('sha256').update(serialized, 'utf8').digest('hex');
  },

  /**
   * Verify integrity of an exported data bundle against its embedded checksum
   */
  verifyBundle(bundle: IDataPortabilityBundle): boolean {
    if (!bundle || !bundle.checksum) return false;
    const computed = this.generateChecksum(bundle as unknown as Record<string, any>);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(bundle.checksum));
  },
};
