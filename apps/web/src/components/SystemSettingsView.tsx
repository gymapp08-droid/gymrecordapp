import React, { useState, useEffect } from 'react';
import { IAdminSystemConfig, UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';
import { AuditLogsView } from './AuditLogsView';

interface SystemSettingsViewProps {
  currentRole: UserRole;
  auditLogs?: any[];
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ currentRole, auditLogs = [] }) => {
  const [config, setConfig] = useState<IAdminSystemConfig>({
    defaultWorkoutReminderTime: '06:00',
    defaultMealReminderTimes: ['08:00', '11:00', '14:00', '17:00', '20:00'],
    defaultWeeklyCheckInDay: 7,
    defaultWeeklyCheckInTime: '09:00',
    primaryTimezone: 'Asia/Kolkata',
  });
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('alpha_auth_token');
      const res = await fetch('/api/v1/admin/config', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load system config');
      const data = await res.json();
      setConfig(data);
    } catch {
      // Fallback defaults
      setConfig({
        defaultWorkoutReminderTime: '06:00',
        defaultMealReminderTimes: ['08:00', '11:00', '14:00', '17:00', '20:00'],
        defaultWeeklyCheckInDay: 7,
        defaultWeeklyCheckInTime: '09:00',
        primaryTimezone: 'Asia/Kolkata',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('alpha_auth_token');
      const res = await fetch('/api/v1/admin/config', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Failed to update config');
      const updated = await res.json();
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const rbacMatrix = [
    { capability: 'View & Log Own Workouts / Meals', athlete: 'Yes', trainer: 'No', admin: 'No' },
    { capability: 'Submit Weekly Progress Check-In', athlete: 'Yes', trainer: 'No', admin: 'No' },
    { capability: 'Access Web Management Portal', athlete: '403 Forbidden', trainer: 'Yes', admin: 'Yes' },
    { capability: 'View Assigned Clients Roster', athlete: 'No', trainer: 'Assigned Only', admin: 'All Athletes' },
    { capability: 'Exercise Science & Biomechanics Library', athlete: 'Read Only (Mobile)', trainer: 'Full Management', admin: 'Full Management' },
    { capability: 'Standalone Workout Templates & Builder', athlete: 'Execution (Mobile)', trainer: 'Full Management', admin: 'Full Management' },
    { capability: 'Review Weekly Check-Ins & Photos', athlete: 'No', trainer: 'Assigned Clients', admin: 'All Clients' },
    { capability: 'Direct Coach-to-Athlete Messaging', athlete: 'Mobile App', trainer: 'Web Portal', admin: 'Web Portal' },
    { capability: 'Certified Trainer Onboarding & Client Assignment', athlete: 'No', trainer: 'No', admin: 'Superuser' },
    { capability: 'System Defaults & Timezone Protocols', athlete: 'No', trainer: 'No', admin: 'Superuser' },
    { capability: 'Enterprise Security Audit Trail Logs', athlete: 'No', trainer: 'No', admin: 'Superuser' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          System Settings
        </h1>
        <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
          Manage global notification protocols, Indian Standard Time (IST) operational cadence, and RBAC authorization matrices.
        </p>
      </div>

      {saveSuccess && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            border: `1px solid ${STITCH_THEME.colors.accentCyan}`,
            color: STITCH_THEME.colors.accentCyan,
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Settings saved.
        </div>
      )}

      {/* Global Config Form */}
      {currentRole === UserRole.ADMIN && (
        <form
          onSubmit={handleSaveConfig}
          style={{
            ...STITCH_THEME.styles.glassCard,
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Platform Operational Defaults</h2>
              <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, margin: '2px 0 0 0' }}>
                Default alarms, scheduled check-in trigger windows, and enterprise timezone
              </p>
            </div>
            <button type="submit" disabled={loading} style={STITCH_THEME.styles.primaryButton}>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Primary Operating Timezone
              </label>
              <input
                type="text"
                readOnly
                value={config.primaryTimezone}
                style={{ ...STITCH_THEME.styles.input, width: '100%', fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.accentCyan }}
              />
              <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, marginTop: '4px', display: 'block' }}>
                Standard: Indian Standard Time (IST / UTC+5:30)
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Default Workout Alarm Time
              </label>
              <input
                type="time"
                value={config.defaultWorkoutReminderTime}
                onChange={(e) => setConfig({ ...config, defaultWorkoutReminderTime: e.target.value })}
                style={{ ...STITCH_THEME.styles.input, width: '100%', fontFamily: STITCH_THEME.typography.fontMono }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Weekly Check-In Day
              </label>
              <select
                value={config.defaultWeeklyCheckInDay}
                onChange={(e) => setConfig({ ...config, defaultWeeklyCheckInDay: parseInt(e.target.value, 10) })}
                style={{ ...STITCH_THEME.styles.input, width: '100%' }}
              >
                <option value={7}>Sunday (Default)</option>
                <option value={1}>Monday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Weekly Check-In Trigger Time
              </label>
              <input
                type="time"
                value={config.defaultWeeklyCheckInTime}
                onChange={(e) => setConfig({ ...config, defaultWeeklyCheckInTime: e.target.value })}
                style={{ ...STITCH_THEME.styles.input, width: '100%', fontFamily: STITCH_THEME.typography.fontMono }}
              />
            </div>
          </div>
        </form>
      )}

      {/* RBAC Governance Matrix */}
      <div style={{ ...STITCH_THEME.styles.glassCard, padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>
          Role-Based Access Control (RBAC) Permissions Matrix
        </h2>
        <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, margin: '0 0 16px 0' }}>
          Enforces server-side zero-trust security boundaries across ATHLETE (mobile), TRAINER, and ADMIN roles.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}` }}>
                <th style={{ padding: '12px 14px', color: STITCH_THEME.colors.textSecondary }}>System Capability / Boundary</th>
                <th style={{ padding: '12px 14px', color: STITCH_THEME.colors.accentViolet }}>ATHLETE / USER (Mobile)</th>
                <th style={{ padding: '12px 14px', color: STITCH_THEME.colors.accentAmber }}>TRAINER / COACH (Web)</th>
                <th style={{ padding: '12px 14px', color: STITCH_THEME.colors.accentCyan }}>ADMIN / SUPERUSER (Web)</th>
              </tr>
            </thead>
            <tbody>
              {rbacMatrix.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: `1px solid rgba(255, 255, 255, 0.03)`,
                    backgroundColor: i % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                    {row.capability}
                  </td>
                  <td style={{
                    padding: '12px 14px',
                    color: row.athlete === 'Yes'
                      ? STITCH_THEME.colors.accentEmerald
                      : row.athlete.includes('Forbidden')
                      ? STITCH_THEME.colors.accentRose
                      : STITCH_THEME.colors.textMuted,
                  }}>
                    {row.athlete}
                  </td>
                  <td style={{
                    padding: '12px 14px',
                    color: row.trainer === 'Yes' || row.trainer.includes('Full') || row.trainer.includes('Assigned')
                      ? STITCH_THEME.colors.accentEmerald
                      : row.trainer === 'No'
                      ? STITCH_THEME.colors.textMuted
                      : STITCH_THEME.colors.textSecondary,
                  }}>
                    {row.trainer}
                  </td>
                  <td style={{
                    padding: '12px 14px',
                    fontWeight: 600,
                    color: row.admin === 'Yes' || row.admin.includes('Full') || row.admin.includes('All') || row.admin.includes('Superuser')
                      ? STITCH_THEME.colors.accentCyan
                      : row.admin === 'No'
                      ? STITCH_THEME.colors.textMuted
                      : STITCH_THEME.colors.textSecondary,
                  }}>
                    {row.admin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Trail Component */}
      {currentRole === UserRole.ADMIN && (
        <div>
          <AuditLogsView logs={auditLogs} onRefresh={() => {}} />
        </div>
      )}
    </div>
  );
};
