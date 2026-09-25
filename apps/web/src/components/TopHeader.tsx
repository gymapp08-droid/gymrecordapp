import React from 'react';
import { UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface TopHeaderProps {
  currentRole: UserRole;
  onChangeRole?: (role: UserRole) => void;
  onOpenInviteModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  authenticatedUser?: { fullName?: string; role?: string; email?: string };
  onLogout?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRole,
  onOpenInviteModal,
  searchQuery,
  onSearchChange,
  authenticatedUser,
  onLogout,
}) => {
  const workspaceLabel =
    currentRole === UserRole.ADMIN
      ? 'Admin Workspace'
      : currentRole === UserRole.TRAINER
      ? 'Trainer Workspace'
      : currentRole === UserRole.NUTRITIONIST
      ? 'Nutrition Workspace'
      : 'Coach Workspace';

  const displayName = authenticatedUser?.fullName || 'Alpha Control';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: STITCH_THEME.colors.bgSecondary,
        borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexShrink: 0,
        gap: '16px',
      }}
    >
      {/* Left: Workspace label */}
      <div style={{ flexShrink: 0 }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: STITCH_THEME.colors.textMuted,
            letterSpacing: '0.01em',
          }}
        >
          {workspaceLabel}
        </span>
      </div>

      {/* Center: Search */}
      <div style={{ flex: 1, maxWidth: '360px', position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '11px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: STITCH_THEME.colors.textMuted,
            pointerEvents: 'none',
          }}
        >
          ⌕
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search athletes, programs…"
          style={{
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            borderRadius: '8px',
            padding: '7px 12px 7px 30px',
            color: STITCH_THEME.colors.textPrimary,
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = STITCH_THEME.colors.accentCyan)}
          onBlur={(e) => (e.target.style.borderColor = STITCH_THEME.colors.borderSubtle)}
        />
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Notifications */}
        <button
          title="Notifications"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'none',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            color: STITCH_THEME.colors.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'border-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = STITCH_THEME.colors.borderMedium;
            e.currentTarget.style.color = STITCH_THEME.colors.textSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = STITCH_THEME.colors.borderSubtle;
            e.currentTarget.style.color = STITCH_THEME.colors.textMuted;
          }}
        >
          ◉
        </button>

        {/* Help */}
        <button
          title="Help & Documentation"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'none',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            color: STITCH_THEME.colors.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            transition: 'border-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = STITCH_THEME.colors.borderMedium;
            e.currentTarget.style.color = STITCH_THEME.colors.textSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = STITCH_THEME.colors.borderSubtle;
            e.currentTarget.style.color = STITCH_THEME.colors.textMuted;
          }}
        >
          ?
        </button>

        {/* Invite CTA */}
        <button onClick={onOpenInviteModal} style={STITCH_THEME.styles.primaryButton}>
          + Invite Athlete
        </button>

        {/* User Profile & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
          <div
            title={`${displayName} (${authenticatedUser?.email || ''})`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              border: `1px solid rgba(0, 229, 255, 0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '11px',
              color: STITCH_THEME.colors.accentCyan,
              cursor: 'default',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
              {displayName}
            </span>
            <span style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted }}>
              {authenticatedUser?.role || currentRole}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out of Admin Control Center"
              style={{
                marginLeft: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                color: '#FF453A',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)')}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
