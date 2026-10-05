import React, { useState } from 'react';
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
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  const workspaceLabel =
    currentRole === UserRole.ADMIN
      ? 'Admin Workspace'
      : currentRole === UserRole.TRAINER
      ? 'Trainer Workspace'
      : currentRole === UserRole.NUTRITIONIST
      ? 'Nutrition Workspace'
      : 'Coach Workspace';

  const displayName = authenticatedUser?.fullName || 'Master Administrator';
  const displayRole = (authenticatedUser?.role || currentRole || 'ADMIN').toUpperCase();
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: '#07090E',
        borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
        gap: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Left: Workspace label pill */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: STITCH_THEME.colors.accentCyan,
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '6px',
            padding: '4px 10px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00F0FF' }} />
          {workspaceLabel}
        </div>
      </div>

      {/* Center: Global Search Bar with Ctrl+K badge */}
      <div style={{ flex: 1, maxWidth: '440px', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px',
            color: '#64748B',
            pointerEvents: 'none',
          }}
        >
          ⌕
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search athletes, programs..."
          style={{
            width: '100%',
            height: '38px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid rgba(255, 255, 255, 0.09)`,
            borderRadius: '8px',
            padding: '0 64px 0 34px',
            color: '#F8FAFC',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(0, 240, 255, 0.5)';
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.09)';
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '10px',
            fontFamily: STITCH_THEME.typography.fontMono,
            color: '#64748B',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '2px 6px',
            pointerEvents: 'none',
          }}
        >
          Ctrl + K
        </span>
      </div>

      {/* Right: Actions, utilities & account controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Utility Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Theme switch */}
          <button
            title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
            onClick={() => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid rgba(255, 255, 255, 0.08)`,
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            ☀️
          </button>

          {/* Help */}
          <button
            title="Help & Documentation"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid rgba(255, 255, 255, 0.08)`,
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            ?
          </button>

          {/* Notifications */}
          <button
            title="Notifications (4 unread)"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid rgba(255, 255, 255, 0.08)`,
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            🔔
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 4px',
                lineHeight: '12px',
                border: '1.5px solid #07090E',
              }}
            >
              4
            </span>
          </button>
        </div>

        {/* Invite CTA Button */}
        <button
          onClick={onOpenInviteModal}
          style={{
            height: '36px',
            padding: '0 16px',
            borderRadius: '8px',
            backgroundColor: '#00F0FF',
            border: 'none',
            color: '#000000',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 14px rgba(0, 240, 255, 0.25)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#38F9D7';
            e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 240, 255, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00F0FF';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 240, 255, 0.25)';
          }}
        >
          + Invite Athlete
        </button>

        {/* Subtle Vertical Divider */}
        <div
          style={{
            width: '1px',
            height: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            margin: '0 4px',
          }}
        />

        {/* Account Profile Group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '3px 8px 3px 4px',
            borderRadius: '8px',
            cursor: 'default',
          }}
        >
          <div
            title={`${displayName} (${authenticatedUser?.email || ''})`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 240, 255, 0.12)',
              border: `1px solid rgba(0, 240, 255, 0.35)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '11px',
              color: '#00F0FF',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.04em' }}>
                {displayRole}
              </span>
              <span style={{ fontSize: '8px', color: '#64748B' }}>▾</span>
            </div>
          </div>
        </div>

        {/* Sign Out Action Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out of Admin Control Center"
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)';
              e.currentTarget.style.borderColor = '#EF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
};
