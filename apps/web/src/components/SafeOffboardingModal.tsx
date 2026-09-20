import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';

export interface SafeOffboardingModalProps {
  isOpen: boolean;
  client: {
    id: string;
    athleteId: string;
    name: string;
    email: string;
    activeProgramTitle?: string;
    activeMealPlanTitle?: string;
  } | null;
  onClose: () => void;
  onConfirm: (clientId: string, reason?: string) => Promise<void>;
}

export const SafeOffboardingModal: React.FC<SafeOffboardingModalProps> = ({
  isOpen,
  client,
  onClose,
  onConfirm,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('Program Completed');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !client) return null;

  const handleConfirm = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      const finalReason = reason === 'Other' ? customReason : reason;
      await onConfirm(client.id, finalReason);
      onClose();
    } catch (err) {
      console.error('Failed to offboard client:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          ...STITCH_THEME.styles.glassCardElevated,
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary, margin: 0 }}>
                Safe Client Offboarding
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
              Unlink coaching management for <strong style={{ color: STITCH_THEME.colors.textPrimary }}>{client.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: STITCH_THEME.colors.textMuted,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Safety Guarantee Callout */}
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 240, 255, 0.04)',
            border: `1px solid rgba(0, 240, 255, 0.25)`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: STITCH_THEME.colors.accentCyan }}>🛡️</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: STITCH_THEME.colors.accentCyan, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ALPHA Non-Destructive Guarantee
            </span>
          </div>
          <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, lineHeight: 1.5, margin: 0 }}>
            Offboarding unlinks this athlete from active coaching rosters. <strong>Athlete account data, past workout logs, personal records (PRs), nutrition logs, and historical metrics remain 100% intact and owned by the athlete.</strong>
          </p>
        </div>

        {/* Active Assignments Impact */}
        {(client.activeProgramTitle || client.activeMealPlanTitle) && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: `1px solid rgba(245, 158, 11, 0.25)`,
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.accentAmber, textTransform: 'uppercase', marginBottom: '6px' }}>
              Active Assignments Notice
            </div>
            <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>
              {client.activeProgramTitle && (
                <div>• Workout Program: <strong>{client.activeProgramTitle}</strong> will be archived.</div>
              )}
              {client.activeMealPlanTitle && (
                <div>• Nutrition Plan: <strong>{client.activeMealPlanTitle}</strong> will be unlinked.</div>
              )}
            </div>
          </div>
        )}

        {/* Reason Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>
            Reason for Offboarding
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              borderRadius: '8px',
              color: STITCH_THEME.colors.textPrimary,
              fontSize: '13px',
              outline: 'none',
              marginBottom: reason === 'Other' ? '8px' : 0,
            }}
          >
            <option value="Program Completed" style={{ background: '#0C1018' }}>Program Completed</option>
            <option value="Client Paused Coaching" style={{ background: '#0C1018' }}>Client Paused Coaching</option>
            <option value="Relocation / Schedule Conflict" style={{ background: '#0C1018' }}>Relocation / Schedule Conflict</option>
            <option value="Transferred to Different Coach" style={{ background: '#0C1018' }}>Transferred to Different Coach</option>
            <option value="Other" style={{ background: '#0C1018' }}>Other (Specify below)</option>
          </select>
          {reason === 'Other' && (
            <input
              type="text"
              placeholder="Enter specific reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                color: STITCH_THEME.colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          )}
        </div>

        {/* Confirmation Checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '12px',
            color: STITCH_THEME.colors.textSecondary,
            cursor: 'pointer',
            marginTop: '4px',
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ marginTop: '2px', accentColor: STITCH_THEME.colors.accentCyan, cursor: 'pointer' }}
          />
          <span>
            I confirm offboarding for <strong>{client.name}</strong>. I acknowledge this removes them from the active portal roster while safely preserving all historical training records.
          </span>
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={STITCH_THEME.styles.secondaryButton}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed || loading}
            style={{
              ...STITCH_THEME.styles.dangerButton,
              opacity: confirmed && !loading ? 1 : 0.5,
              cursor: confirmed && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Offboarding...' : 'Confirm Safe Offboarding'}
          </button>
        </div>
      </div>
    </div>
  );
};
