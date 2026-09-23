import React from 'react';
import { UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

export type PortalTab =
  | 'dashboard'
  | 'clients'
  | 'programs'
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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, currentRole, onLogout }) => {
  const isTrainer = currentRole === UserRole.TRAINER;
  const isNutritionist = currentRole === UserRole.NUTRITIONIST;
  const isAdmin = currentRole === UserRole.ADMIN;

  const navItems: { id: PortalTab; label: string; icon: string; disabled?: boolean; hint?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
    { id: 'clients', label: 'Clients', icon: '👥' },
    {
      id: 'programs',
      label: 'Programs',
      icon: '🏋️',
      disabled: isNutritionist,
      hint: isNutritionist ? 'Trainers/Coaches only' : undefined,
    },
    { id: 'exercises', label: 'Exercises', icon: '📚', disabled: isNutritionist },
    {
      id: 'nutrition',
      label: 'Nutrition',
      icon: '🥗',
      disabled: isTrainer,
      hint: isTrainer ? 'Nutritionists/Coaches only' : undefined,
    },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'check-ins', label: 'Check-Ins', icon: '📋' },
    ...(isAdmin ? [{ id: 'admin' as PortalTab, label: 'Admin Control', icon: '🛡️' }] : []),
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
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
          padding: '24px 20px',
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
          <div style={{ fontWeight: 800, letterSpacing: '0.1em', fontSize: '15px', color: '#F8FAFC' }}>
            ALPHA PORTAL
          </div>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, letterSpacing: '0.04em' }}>
            COACHING OS
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div
          style={{
            padding: '6px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
            Role
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color:
                currentRole === UserRole.COACH
                  ? STITCH_THEME.colors.accentCyan
                  : currentRole === UserRole.TRAINER
                  ? STITCH_THEME.colors.accentAmber
                  : currentRole === UserRole.NUTRITIONIST
                  ? STITCH_THEME.colors.accentEmerald
                  : STITCH_THEME.colors.accentViolet,
              letterSpacing: '0.05em',
            }}
          >
            {currentRole}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isDisabled = item.disabled;

          return (
            <button
              key={item.id}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelectTab(item.id)}
              title={item.hint}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: isActive
                  ? `1px solid ${STITCH_THEME.colors.borderActive}`
                  : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                color: isDisabled
                  ? 'rgba(148, 163, 184, 0.3)'
                  : isActive
                  ? STITCH_THEME.colors.accentCyan
                  : STITCH_THEME.colors.textSecondary,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.15s ease',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '15px', opacity: isDisabled ? 0.3 : 1 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {isDisabled && (
                <span
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: STITCH_THEME.colors.textMuted,
                  }}
                >
                  LOCK
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Tenant Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>TENANT ISOLATION</div>
        <div
          style={{
            fontSize: '12px',
            color: STITCH_THEME.colors.textPrimary,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: onLogout ? '8px' : 0,
          }}
        >
          Apex Performance Lab
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              color: STITCH_THEME.colors.accentCrimson,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
};
