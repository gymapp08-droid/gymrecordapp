import * as crypto from 'crypto';
import { ISecurityAuditEvent } from '@alpha/types';

export const GENESIS_AUDIT_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditVerificationResult {
  isValid: boolean;
  brokenAtIndex?: number;
  error?: string;
  totalEvents: number;
}

export const AuditCryptoUtil = {
  /**
   * Compute deterministic SHA-256 integrity hash for an audit event chained to previous hash
   */
  computeEventIntegrityHash(
    previousHash: string,
    event: {
      id: string;
      eventType: string;
      actorId: string;
      actorRole: string;
      targetUserId?: string;
      organizationId?: string;
      timestamp: string;
      details?: Record<string, unknown>;
    },
  ): string {
    const detailsCanonical = event.details ? JSON.stringify(event.details, Object.keys(event.details).sort()) : '{}';
    const rawPayload = [
      previousHash,
      event.id,
      event.eventType,
      event.actorId,
      event.actorRole,
      event.targetUserId || '',
      event.organizationId || '',
      event.timestamp,
      detailsCanonical,
    ].join('|');

    return crypto.createHash('sha256').update(rawPayload, 'utf8').digest('hex');
  },

  /**
   * Cryptographically verify an audit log chain for tampering or deletion
   */
  verifyAuditChain(events: ISecurityAuditEvent[]): AuditVerificationResult {
    if (!events || events.length === 0) {
      return { isValid: true, totalEvents: 0 };
    }

    let expectedPrevHash = GENESIS_AUDIT_HASH;

    for (let i = 0; i < events.length; i++) {
      const event = events[i]!;

      // 1. Verify previous hash pointer
      if (event.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          brokenAtIndex: i,
          error: `Chain broken at event [${event.id}]: expected previousHash '${expectedPrevHash}', but found '${event.previousHash}'`,
          totalEvents: events.length,
        };
      }

      // 2. Recompute integrity hash to detect payload tampering
      const recomputedHash = this.computeEventIntegrityHash(event.previousHash, {
        id: event.id,
        eventType: event.eventType,
        actorId: event.actorId,
        actorRole: event.actorRole,
        targetUserId: event.targetUserId,
        organizationId: event.organizationId,
        timestamp: event.timestamp,
        details: event.details,
      });

      if (recomputedHash !== event.integrityHash) {
        return {
          isValid: false,
          brokenAtIndex: i,
          error: `Payload tampering detected at event [${event.id}]: recorded hash does not match recomputed SHA-256`,
          totalEvents: events.length,
        };
      }

      expectedPrevHash = event.integrityHash;
    }

    return { isValid: true, totalEvents: events.length };
  },
};
