import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { UserRole, AccountStatus, IAdminUserSummary, IAdminSystemConfig, IAuditLogRecord } from '@alpha/types';
import { AuditLogsView } from './AuditLogsView';

interface AdminDashboardViewProps {
  auditLogs?: IAuditLogRecord[];
}

const INITIAL_USERS: IAdminUserSummary[] = [
  {
    id: 'usr_admin_1',
    email: 'admin@alpha.io',
    fullName: 'System Administrator',
    role: UserRole.ADMIN,
    status: AccountStatus.ACTIVE,
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: '2026-09-23T18:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    assignedTrainerId: null,
    assignedTrainerName: null,
  },
  {
    id: 'usr_coach_1',
    email: 'coach.marcus@alpha.io',
    fullName: 'Marcus Vance (Head Coach)',
    role: UserRole.TRAINER,
    status: AccountStatus.ACTIVE,
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: '2026-09-23T14:30:00.000Z',
    createdAt: '2026-01-05T00:00:00.000Z',
    assignedTrainerId: null,
    assignedTrainerName: null,
  },
  {
    id: 'usr_ath_1',
    email: 'alex.rivera@alpha.io',
    fullName: 'Alex Rivera (Athlete)',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: '2026-09-23T12:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    assignedTrainerId: 'usr_coach_1',
    assignedTrainerName: 'Marcus Vance (Head Coach)',
  },
  {
    id: 'usr_ath_2',
    email: 'sara.chen@alpha.io',
    fullName: 'Sara Chen (Athlete)',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: '2026-09-22T09:15:00.000Z',
    createdAt: '2026-02-15T00:00:00.000Z',
    assignedTrainerId: 'usr_coach_1',
    assignedTrainerName: 'Marcus Vance (Head Coach)',
  },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ auditLogs = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'config' | 'audit'>('users');
  const [users, setUsers] = useState<IAdminUserSummary[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // System Configuration State
  const [config, setConfig] = useState<IAdminSystemConfig>({
    defaultWorkoutReminderTime: '06:00',
    defaultMealReminderTimes: ['08:00', '11:00', '14:00', '17:00', '20:00'],
    defaultWeeklyCheckInDay: 7, // Sunday
    defaultWeeklyCheckInTime: '09:00',
    primaryTimezone: 'Asia/Kolkata',
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const token = localStorage.getItem('alpha_auth_token');
      await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });
    } catch (e) {
      // In-memory update
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    );
    setActionSuccess(`Updated role for user [${userId}] to ${newRole}`);
  };

  const handleStatusToggle = async (userId: string, currentStatus: AccountStatus) => {
    const nextStatus =
      currentStatus === AccountStatus.ACTIVE
        ? AccountStatus.SUSPENDED
        : AccountStatus.ACTIVE;

    try {
      const token = localStorage.getItem('alpha_auth_token');
      await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (e) {
      // In-memory update
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus, isActive: nextStatus === AccountStatus.ACTIVE } : u)),
    );
    setActionSuccess(`Updated status for user [${userId}] to ${nextStatus}`);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('alpha_auth_token');
      await fetch('/api/v1/admin/system/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(config),
      });
    } catch (e) {
      // in-memory ok
    }
    setActionSuccess('System reminder and timezone configuration saved.');
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              System Administration & Security Control
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: '6px 0 0 0' }}>
            Authoritative privilege management, user role assignments, reminder scheduling, and global governance.
          </p>
        </div>

        {/* Sub tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '4px',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          }}
        >
          <button
            onClick={() => setActiveSubTab('users')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeSubTab === 'users' ? STITCH_THEME.colors.accentCyan : 'transparent',
              color: activeSubTab === 'users' ? '#000000' : STITCH_THEME.colors.textPrimary,
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Users & Roles
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeSubTab === 'config' ? STITCH_THEME.colors.accentCyan : 'transparent',
              color: activeSubTab === 'config' ? '#000000' : STITCH_THEME.colors.textPrimary,
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Reminder Engine
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeSubTab === 'audit' ? STITCH_THEME.colors.accentCyan : 'transparent',
              color: activeSubTab === 'audit' ? '#000000' : STITCH_THEME.colors.textPrimary,
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            color: STITCH_THEME.colors.accentEmerald,
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Users & Roles View */}
      {activeSubTab === 'users' && (
        <div
          style={{
            backgroundColor: STITCH_THEME.colors.bgSecondary,
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Table Header controls */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>
              ALL REGISTERED ACCOUNTS ({filteredUsers.length})
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                width: '260px',
              }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  color: STITCH_THEME.colors.textMuted,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '14px 20px' }}>User</th>
                <th style={{ padding: '14px 20px' }}>Assigned Role</th>
                <th style={{ padding: '14px 20px' }}>Assigned Coach</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isAdmin = u.role === UserRole.ADMIN;
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{u.fullName}</div>
                      <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>{u.email}</div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                          color:
                            u.role === UserRole.ADMIN
                              ? STITCH_THEME.colors.accentCrimson
                              : u.role === UserRole.TRAINER
                              ? STITCH_THEME.colors.accentCyan
                              : STITCH_THEME.colors.textPrimary,
                          fontSize: '12px',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                      >
                        <option value={UserRole.ATHLETE}>ATHLETE (User)</option>
                        <option value={UserRole.TRAINER}>TRAINER (Coach)</option>
                        <option value={UserRole.ADMIN}>ADMIN (Superuser)</option>
                      </select>
                    </td>

                    <td style={{ padding: '16px 20px', color: STITCH_THEME.colors.textSecondary }}>
                      {u.assignedTrainerName || 'None (Direct Athlete)'}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            u.status === AccountStatus.ACTIVE
                              ? 'rgba(0, 230, 118, 0.15)'
                              : 'rgba(255, 59, 48, 0.15)',
                          color:
                            u.status === AccountStatus.ACTIVE
                              ? STITCH_THEME.colors.accentEmerald
                              : STITCH_THEME.colors.accentCrimson,
                        }}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {!isAdmin && (
                        <button
                          onClick={() => handleStatusToggle(u.id, u.status)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            color:
                              u.status === AccountStatus.ACTIVE
                                ? STITCH_THEME.colors.accentCrimson
                                : STITCH_THEME.colors.accentEmerald,
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {u.status === AccountStatus.ACTIVE ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reminder Engine Configuration */}
      {activeSubTab === 'config' && (
        <form
          onSubmit={handleSaveConfig}
          style={{
            backgroundColor: STITCH_THEME.colors.bgSecondary,
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '680px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0' }}>
              Smart Reminder & Alarm Defaults
            </h2>
            <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, margin: 0 }}>
              Global operational timings for workout alarms, meal reminders, and weekly check-in prompts.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              PRIMARY TIMEZONE
            </label>
            <input
              type="text"
              value={config.primaryTimezone}
              onChange={(e) => setConfig({ ...config, primaryTimezone: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                color: '#FFFFFF',
                fontSize: '13px',
              }}
            />
            <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
              Default standard is Indian Standard Time (Asia/Kolkata).
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              DEFAULT WORKOUT REMINDER TIME
            </label>
            <input
              type="time"
              value={config.defaultWorkoutReminderTime}
              onChange={(e) => setConfig({ ...config, defaultWorkoutReminderTime: e.target.value })}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                color: '#FFFFFF',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              DEFAULT 5-MEAL REMINDER SCHEDULE
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {config.defaultMealReminderTimes.map((mealTime, idx) => (
                <input
                  key={idx}
                  type="time"
                  value={mealTime}
                  onChange={(e) => {
                    const updated = [...config.defaultMealReminderTimes];
                    updated[idx] = e.target.value;
                    setConfig({ ...config, defaultMealReminderTimes: updated });
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, display: 'block', marginTop: '4px' }}>
              5 daily slots: Breakfast (08:00), Mid-Morning (11:00), Lunch (14:00), Snack (17:00), Dinner (20:00).
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              WEEKLY PROGRESS CHECK-IN TIME (SUNDAY)
            </label>
            <input
              type="time"
              value={config.defaultWeeklyCheckInTime}
              onChange={(e) => setConfig({ ...config, defaultWeeklyCheckInTime: e.target.value })}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                color: '#FFFFFF',
                fontSize: '13px',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              alignSelf: 'flex-start',
              marginTop: '12px',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: STITCH_THEME.colors.accentCyan,
              color: '#000000',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Save Global System Settings
          </button>
        </form>
      )}

      {activeSubTab === 'audit' && (
        <AuditLogsView logs={auditLogs} />
      )}
    </div>
  );
};
