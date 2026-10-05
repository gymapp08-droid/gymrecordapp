import React from 'react';
import { UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

export type PortalTab =
  | 'overview'
  | 'dashboard'
  | 'clients'
  | 'trainers'
  | 'programs'
  | 'shredded-program'
  | 'shredded-admin'
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
  onLogout: _onLogout,
  authenticatedUser,
}) => {
  const isTrainer = currentRole === UserRole.TRAINER;
  const isNutritionist = currentRole === UserRole.NUTRITIONIST;
  const isAdmin = currentRole === UserRole.ADMIN;

  const navGroups: NavGroup[] = [
    {
      groupName: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: '🏠' },
        { id: 'clients', label: 'Athletes', icon: '👥' },
        { id: 'shredded-program', label: '6 WEEK SHREDDED', icon: '⚡' },
        { id: 'programs', label: 'Programs', icon: '📖', disabled: isNutritionist, hint: isNutritionist ? 'Trainers only' : undefined },
        { id: 'workouts', label: 'Workouts', icon: '🏋️', disabled: isNutritionist, hint: isNutritionist ? 'Trainers only' : undefined },
        { id: 'nutrition', label: 'Nutrition', icon: '🍎', disabled: isTrainer, hint: isTrainer ? 'Nutritionists only' : undefined },
      ],
    },
    {
      groupName: 'LIBRARY',
      items: [
        { id: 'exercises', label: 'Exercises', icon: '🏋️', disabled: isNutritionist, hint: isNutritionist ? 'Trainers only' : undefined },
        { id: 'workouts', label: 'Workout Templates', icon: '📋', disabled: isNutritionist, hint: isNutritionist ? 'Trainers only' : undefined },
      ],
    },
    {
      groupName: 'OPERATIONS',
      items: [
        { id: 'calendar', label: 'Schedule', icon: '📅' },
        { id: 'check-ins', label: 'Check-Ins', icon: '☑️' },
        { id: 'messages', label: 'Messages', icon: '💬' },
      ],
    },
    {
      groupName: 'INSIGHTS',
      items: [
        { id: 'dashboard', label: 'Analytics', icon: '📊' },
        { id: 'reports', label: 'Reports', icon: '📑' },
      ],
    },
    {
      groupName: 'SYSTEM',
      items: [
        { id: 'admin', label: 'Admin Dashboard', icon: '🛡️', adminOnly: true },
        { id: 'shredded-admin', label: 'Shredded Access', icon: '🔒', adminOnly: true },
        { id: 'trainers', label: 'Team', icon: '👥' },
        { id: 'settings', label: 'Settings & Audit Log', icon: '⚙️' },
      ],
    },
  ];

  const displayName = authenticatedUser?.fullName || 'Master Administrator';
  const displayRole = (authenticatedUser?.role || currentRole || 'ADMIN').toUpperCase();
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside
      style={{
        width: '230px',
        backgroundColor: '#07090E',
        borderRight: `1px solid rgba(255, 255, 255, 0.08)`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        userSelect: 'none',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
          flexShrink: 0,
          backgroundColor: '#07090E',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '16px',
            color: '#000000',
            flexShrink: 0,
            boxShadow: '0 0 14px rgba(0, 240, 255, 0.3)',
          }}
        >
          G
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              letterSpacing: '0.08em',
              fontSize: '14px',
              color: '#FFFFFF',
              lineHeight: 1.1,
            }}
          >
            GRAVITY
          </div>
          <div
            style={{
              fontSize: '9.5px',
              color: '#00F0FF',
              letterSpacing: '0.08em',
              fontFamily: STITCH_THEME.typography.fontMono,
              textTransform: 'uppercase',
              fontWeight: 700,
              marginTop: '3px',
            }}
          >
            Management Portal
          </div>
        </div>
      </div>

      {/* Nav List with Subtle Minimal Scrollbar */}
      <nav
        style={{
          flex: 1,
          padding: '14px 10px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.08) transparent',
        }}
      >
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((it) => !it.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} style={{ marginBottom: '22px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#64748B',
                  letterSpacing: '0.12em',
                  padding: '0 12px 6px',
                  textTransform: 'uppercase',
                }}
              >
                {group.groupName}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: isActive ? '1px solid rgba(0, 240, 255, 0.22)' : '1px solid transparent',
                        backgroundColor: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                        color: item.disabled
                          ? '#475569'
                          : isActive
                          ? '#00F0FF'
                          : '#94A3B8',
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 400,
                        cursor: item.disabled ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.15s ease',
                        opacity: item.disabled ? 0.45 : 1,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && !item.disabled) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.color = '#F8FAFC';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !item.disabled) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#94A3B8';
                        }
                      }}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '6px',
                            bottom: '6px',
                            width: '3px',
                            backgroundColor: '#00F0FF',
                            borderRadius: '0 3px 3px 0',
                            boxShadow: '0 0 8px rgba(0, 240, 255, 0.6)',
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: '14px',
                          width: '18px',
                          textAlign: 'center',
                          flexShrink: 0,
                          opacity: isActive ? 1 : 0.75,
                        }}
                      >
                        {item.icon}
                      </span>
                      <span style={{ flex: 1, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Profile Area */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: `1px solid rgba(255, 255, 255, 0.08)`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
          backgroundColor: '#07090E',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            border: `1px solid rgba(0, 240, 255, 0.35)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#00F0FF',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#F8FAFC',
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
              color: '#94A3B8',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {displayRole}
          </div>
        </div>
        <div style={{ color: '#64748B', fontSize: '11px' }}>
          ⇅
        </div>
      </div>
    </aside>
  );
};
