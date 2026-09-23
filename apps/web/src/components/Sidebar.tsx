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
}

interface NavGroup {
  groupName: string;
  items: {
    id: PortalTab;
    label: string;
    icon: string;
    adminOnly?: boolean;
    disabled?: boolean;
    hint?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, currentRole, onLogout }) => {
  const isTrainer = currentRole === UserRole.TRAINER;
  const isNutritionist = currentRole === UserRole.NUTRITIONIST;
  const isAdmin = currentRole === UserRole.ADMIN;

  const navGroups: NavGroup[] = [
    {
      groupName: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Executive Overview', icon: '⚡' },
        { id: 'dashboard', label: 'Cohort Analytics', icon: '📊' },
      ],
    },
    {
      groupName: 'CONTENT & BUILDERS',
      items: [
        { id: 'exercises', label: 'Exercise Library', icon: '📚', disabled: isNutritionist },
        { id: 'workouts', label: 'Workout Templates', icon: '🏋️', disabled: isNutritionist },
        {
          id: 'programs',
          label: 'Training Splits',
          icon: '📋',
          disabled: isNutritionist,
          hint: isNutritionist ? 'Trainers/Coaches only' : undefined,
        },
        {
          id: 'nutrition',
          label: 'Nutrition Plans',
          icon: '🥗',
          disabled: isTrainer,
          hint: isTrainer ? 'Nutritionists/Coaches only' : undefined,
        },
      ],
    },
    {
      groupName: 'OPERATIONS',
      items: [
        { id: 'clients', label: 'Athlete Directory', icon: '👥' },
        { id: 'trainers', label: 'Trainers Roster', icon: '🎖️' },
        { id: 'check-ins', label: 'Weekly Check-Ins', icon: '📝' },
        { id: 'calendar', label: 'Schedule Calendar', icon: '📅' },
        { id: 'messages', label: 'Athlete Messages', icon: '💬' },
        { id: 'reports', label: 'Reports & Export', icon: '📑' },
      ],
    },
    {
      groupName: 'SYSTEM & CONTROL',
      items: [
        { id: 'admin', label: 'Superuser Control', icon: '🛡️', adminOnly: true },
        { id: 'settings', label: 'System Settings', icon: '⚙️' },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: STITCH_THEME.colors.bgSecondary,
        borderRight: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00F0FF 0%, #7928CA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '16px',
            color: '#000000',
            boxShadow: '0 0 12px rgba(0, 240, 255, 0.35)',
          }}
        >
          α
        </div>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: '0.08em', fontSize: '14px', color: '#F8FAFC' }}>
            ALPHA PORTAL
          </div>
          <div style={{ fontSize: '10px', color: STITCH_THEME.colors.accentCyan, letterSpacing: '0.06em', fontFamily: STITCH_THEME.typography.fontMono }}>
            ENTERPRISE OPS
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div style={{ padding: '12px 18px 6px' }}>
        <div
          style={{
            padding: '5px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
            Role
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: STITCH_THEME.typography.fontMono,
              color:
                currentRole === UserRole.COACH
                  ? STITCH_THEME.colors.accentCyan
                  : currentRole === UserRole.TRAINER
                  ? STITCH_THEME.colors.accentAmber
                  : currentRole === UserRole.NUTRITIONIST
                  ? STITCH_THEME.colors.accentEmerald
                  : '#FF0055',
            }}
          >
            {currentRole}
          </span>
        </div>
      </div>

      {/* Navigation Groups List */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((it) => !it.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} style={{ marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: STITCH_THEME.colors.textMuted,
                  letterSpacing: '0.08em',
                  padding: '4px 10px',
                  textTransform: 'uppercase',
                }}
              >
                {group.groupName}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                {visibleItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => !item.disabled && onSelectTab(item.id)}
                      disabled={item.disabled}
                      title={item.hint}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isActive ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                        color: item.disabled
                          ? STITCH_THEME.colors.textMuted
                          : isActive
                          ? STITCH_THEME.colors.accentCyan
                          : STITCH_THEME.colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 500,
                        cursor: item.disabled ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.12s ease',
                        opacity: item.disabled ? 0.45 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && !item.disabled) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
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
                      <span style={{ fontSize: '14px', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && (
                        <span
                          style={{
                            width: '4px',
                            height: '14px',
                            backgroundColor: STITCH_THEME.colors.accentCyan,
                            borderRadius: '2px',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div
        style={{
          padding: '14px 18px',
          borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: STITCH_THEME.colors.borderSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: STITCH_THEME.colors.accentCyan,
            }}
          >
            {currentRole.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>
              Alpha Control
            </div>
            <div style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted }}>
              Asia/Kolkata
            </div>
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
              fontSize: '14px',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            🚪
          </button>
        )}
      </div>
    </aside>
  );
};
