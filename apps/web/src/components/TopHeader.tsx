import React from 'react';
import { UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface TopHeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenInviteModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRole,
  onChangeRole,
  onOpenInviteModal,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header
      style={{
        height: '68px',
        backgroundColor: STITCH_THEME.colors.bgSecondary,
        borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Search Bar */}
      <div style={{ position: 'relative', width: '380px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search assigned athletes, programs, or PRs... (⌘K)"
          style={{
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            borderRadius: '8px',
            padding: '9px 14px 9px 36px',
            color: STITCH_THEME.colors.textPrimary,
            fontSize: '13px',
            outline: 'none',
            transition: 'border 0.15s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = STITCH_THEME.colors.accentCyan)}
          onBlur={(e) => (e.target.style.borderColor = STITCH_THEME.colors.borderSubtle)}
        />
        <span
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px',
            color: STITCH_THEME.colors.textMuted,
          }}
        >
          🔍
        </span>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Role Simulator Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
            Simulate Role:
          </span>
          <select
            value={currentRole}
            onChange={(e) => onChangeRole(e.target.value as UserRole)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              color: STITCH_THEME.colors.textPrimary,
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value={UserRole.COACH}>COACH (Full Access)</option>
            <option value={UserRole.TRAINER}>TRAINER (No Nutrition)</option>
            <option value={UserRole.NUTRITIONIST}>NUTRITIONIST (No Workouts)</option>
            <option value={UserRole.ORG_ADMIN}>ORG ADMIN (All Clients)</option>
          </select>
        </div>

        {/* Invite Client CTA */}
        <button
          onClick={onOpenInviteModal}
          style={STITCH_THEME.styles.primaryButton}
        >
          <span>+</span>
          <span>Invite Client</span>
        </button>

        {/* Coach Profile Avatar */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px',
            color: STITCH_THEME.colors.accentCyan,
            cursor: 'pointer',
          }}
          title="Coach Profile"
        >
          CP
        </div>
      </div>
    </header>
  );
};
