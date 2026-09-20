import React, { useState } from 'react';
import { UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface InviteClientModalProps {
  onSendInvite: (email: string, role: UserRole) => void;
  onClose: () => void;
}

export const InviteClientModal: React.FC<InviteClientModalProps> = ({
  onSendInvite,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ATHLETE);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const handleInvite = () => {
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    onSendInvite(email.trim(), role);
    setGeneratedToken(`alpha_inv_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
    >
      <div style={{ ...STITCH_THEME.styles.glassCardElevated, width: '460px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
            Invite Athlete to Coaching Portal
          </div>
          <button onClick={onClose} style={{ ...STITCH_THEME.styles.secondaryButton, padding: '4px 8px' }}>
            ✕
          </button>
        </div>

        {!generatedToken ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary }}>
              An invitation token with a 7-day expiration will be issued. When the athlete registers or signs in, their account
              will be connected to your active roster.
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                Athlete Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  color: STITCH_THEME.colors.textPrimary,
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  color: STITCH_THEME.colors.textPrimary,
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value={UserRole.ATHLETE}>ATHLETE (Default)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button onClick={onClose} style={STITCH_THEME.styles.secondaryButton}>
                Cancel
              </button>
              <button onClick={handleInvite} style={STITCH_THEME.styles.primaryButton}>
                Generate Invitation
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: STITCH_THEME.colors.accentEmerald,
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              ✓ Invitation dispatched for {email}!
            </div>

            <div>
              <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                Secure 7-Day Token:
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '6px',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  fontFamily: STITCH_THEME.typography.fontMono,
                  fontSize: '11px',
                  color: STITCH_THEME.colors.accentCyan,
                  wordBreak: 'break-all',
                }}
              >
                {generatedToken}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={onClose} style={STITCH_THEME.styles.primaryButton}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
