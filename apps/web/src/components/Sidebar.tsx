import React from 'react';
import { UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

export type PortalTab =
  | 'overview'
  | 'dashboard'
  | 'clients'
  | 'trainers'
  | 'programs'
  | 'workouts'
  | 'exercises'
  | 'nutrition'
  | 'calendar'
  | 'progress'
  | 'check-ins'
  | 'admin'
  | 'messages'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  currentRole: UserRole;
  onLogout?: () => void;
  authenticatedUser?: { fullName?: string; role?: string; email?: string };
}

interface NavItem {
  id: PortalTab;
  label: string;
  icon: string;
  adminOnly?: boolean;
  disabled?: boolean;
  hint?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  onLogout,
  authenticatedUser,
}) => {
  const isTrainer = currentRole === UserRole.TRAINER;
  const isNutritionist = currentRole === UserRole.NUTRITIONIST;
  const isAdmin = currentRole === UserRole.ADMIN;

  const navGroups: NavGroup[] = [
    {
      groupName: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: '◈' },
        { id: 'dashboard', label: 'Analytics', icon: '▦' },
      ],
    },
    {
      groupName: 'LIBRARY',
      items: [
        { id: 'exercises', label: 'Exercise Library', icon: '⊞', disabled: isNutritionist, hint: isNutritionist ? 'Trainers only' : undefined },
        { id: 'workouts', label: 'Workout Templates', icon: '◫', disabled: isNutritionist, hint: isNutritionist ? 'Trainers only' : undefined },
        { id: 'programs', label: 'Training Programs', icon: '⊟', disabled: isNutritionist, hint: isNutritionist ? 'Trainers only' : undefined },
        { id: 'nutrition', label: 'Nutrition Plans', icon: '◉', disabled: isTrainer, hint: isTrainer ? 'Nutritionists only' : undefined },
      ],
    },
    {
      groupName: 'OPERATIONS',
      items: [
        { id: 'clients', label: 'Athlete Directory', icon: '⊕' },
        { id: 'trainers', label: 'Trainers', icon: '◎' },
        { id: 'check-ins', label: 'Weekly Check-Ins', icon: '◷' },
        { id: 'calendar', label: 'Schedule', icon: '▦' },
        { id: 'messages', label: 'Messages', icon: '◌' },
        { id: 'reports', label: 'Reports', icon: '▤' },
      ],
    },
    {
      groupName: 'SYSTEM',
      items: [
        { id: 'admin', label: 'Admin Control', icon: '◉', adminOnly: true },
        { id: 'settings', label: 'Settings', icon: '◈' },
      ],
    },
  ];

  const displayName = authenticatedUser?.fullName || 'Alpha Control';
  const displayRole = authenticatedUser?.role || currentRole;
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside
      style={{
        width: '220px',
        backgroundColor: STITCH_THEME.colors.bgSecondary,
        borderRight: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        userSelect: 'none',
        overflowY: 'auto',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '18px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00E5FF 0%, #7928CA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '15px',
            color: '#000',
            flexShrink: 0,
          }}
        >
          α
        </div>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: '0.1em', fontSize: '13px', color: STITCH_THEME.colors.textPrimary }}>
            ALPHA
          </div>
          <div
            style={{
              fontSize: '9px',
              color: STITCH_THEME.colors.accentCyan,
              letterSpacing: '0.06em',
              fontFamily: STITCH_THEME.typography.fontMono,
              textTransform: 'uppercase',
            }}
          >
            Management Portal
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((it) => !it.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: STITCH_THEME.colors.textMuted,
                  letterSpacing: '0.1em',
                  padding: '0 10px 6px',
                  textTransform: 'uppercase',
                }}
              >
                {group.groupName}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {visibleItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => !item.disabled && onSelectTab(item.id)}
                      disabled={item.disabled}
                      title={item.hint}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '7px 10px 7px 13px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isActive ? 'rgba(0, 229, 255, 0.06)' : 'transparent',
                        color: item.disabled
                          ? STITCH_THEME.colors.textDisabled
                          : isActive
                          ? STITCH_THEME.colors.accentCyan
                          : STITCH_THEME.colors.textSecondary,
                        fontSize: '12.5px',
                        fontWeight: isActive ? 600 : 400,
                        cursor: item.disabled ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background-color 0.1s ease, color 0.1s ease',
                        opacity: item.disabled ? 0.4 : 1,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && !item.disabled) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.color = STITCH_THEME.colors.textPrimary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !item.disabled) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = STITCH_THEME.colors.textSecondary;
                        }
                      }}
                    >
                      {/* Active left accent */}
                      {isActive && (
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '4px',
                            bottom: '4px',
                            width: '3px',
                            backgroundColor: STITCH_THEME.colors.accentCyan,
                            borderRadius: '0 2px 2px 0',
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: '13px',
                          width: '15px',
                          textAlign: 'center',
                          flexShrink: 0,
                          fontFamily: STITCH_THEME.typography.fontMono,
                          opacity: isActive ? 1 : 0.7,
                        }}
                      >
                        {item.icon}
                      </span>
                      <span style={{ flex: 1, letterSpacing: '0.01em' }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 229, 255, 0.12)',
            border: `1px solid rgba(0, 229, 255, 0.25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: STITCH_THEME.colors.accentCyan,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: STITCH_THEME.colors.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: STITCH_THEME.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {String(displayRole)}
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              color: STITCH_THEME.colors.textMuted,
              cursor: 'pointer',
              fontSize: '13px',
              padding: '4px',
              borderRadius: '4px',
              flexShrink: 0,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = STITCH_THEME.colors.accentCrimson)}
            onMouseLeave={(e) => (e.currentTarget.style.color = STITCH_THEME.colors.textMuted)}
          >
            ↩
          </button>
        )}
      </div>
    </aside>
  );
};
