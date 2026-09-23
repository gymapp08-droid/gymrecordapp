import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { IAuditLogRecord } from '@alpha/types';

interface AuditLogsViewProps {
  logs: IAuditLogRecord[];
  onRefresh?: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, onRefresh }) => {
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const filteredLogs = logs.filter(
    (l) => selectedAction === 'ALL' || l.action === selectedAction,
  );

  const getActionColor = (action: string) => {
    if (action.includes('OFFBOARD') || action.includes('DELETE') || action.includes('REPLACE')) {
      return STITCH_THEME.colors.accentCrimson;
    }
    if (action.includes('ASSIGN') || action.includes('APPLY')) {
      return STITCH_THEME.colors.accentEmerald;
    }
    if (action.includes('AI')) {
      return STITCH_THEME.colors.accentViolet;
    }
    return STITCH_THEME.colors.accentCyan;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Security & Audit Trail
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: '6px 0 0 0' }}>
            Immutable chronological logging of all authoritative coaching operations, assignments, and AI mutations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              color: STITCH_THEME.colors.textPrimary,
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value="ALL">All Actions</option>
            <option value="ASSIGN_PROGRAM">ASSIGN_PROGRAM</option>
            <option value="REPLACE_PROGRAM">REPLACE_PROGRAM</option>
            <option value="OFFBOARD_CLIENT">OFFBOARD_CLIENT</option>
            <option value="SEND_COACH_MESSAGE">SEND_COACH_MESSAGE</option>
            <option value="GENERATE_COACH_AI_DRAFT">GENERATE_COACH_AI_DRAFT</option>
            <option value="APPLY_COACH_AI_DRAFT">APPLY_COACH_AI_DRAFT</option>
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '12px', padding: '8px 14px' }}
            >
              ↻ Refresh Logs
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div style={{ ...STITCH_THEME.styles.glassCard, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                color: STITCH_THEME.colors.textMuted,
                fontSize: '11px',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '14px 18px' }}>TIMESTAMP</th>
              <th style={{ padding: '14px 18px' }}>ACTION</th>
              <th style={{ padding: '14px 18px' }}>ACTOR</th>
              <th style={{ padding: '14px 18px' }}>RESOURCE</th>
              <th style={{ padding: '14px 18px' }}>METADATA SUMMARY</th>
              <th style={{ padding: '14px 18px' }}>AUDIT IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: STITCH_THEME.colors.textMuted }}>
                  No audit log records recorded matching filter
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '14px 18px', color: STITCH_THEME.colors.textSecondary, fontFamily: STITCH_THEME.typography.fontMono, fontSize: '12px' }}>
                    {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: STITCH_THEME.typography.fontMono,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        color: getActionColor(log.action || 'SYSTEM'),
                        border: `1px solid ${getActionColor(log.action || 'SYSTEM')}33`,
                      }}
                    >
                      {log.action || log.description || 'EVENT'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                    {log.actorName || 'Coach Marcus'}
                  </td>
                  <td style={{ padding: '14px 18px', color: STITCH_THEME.colors.textSecondary }}>
                    {log.resource} {log.resourceId ? `(#${log.resourceId.slice(0, 8)})` : ''}
                  </td>
                  <td style={{ padding: '14px 18px', color: STITCH_THEME.colors.textMuted, fontSize: '12px' }}>
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                  <td style={{ padding: '14px 18px', color: STITCH_THEME.colors.textMuted, fontFamily: STITCH_THEME.typography.fontMono, fontSize: '11px' }}>
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
