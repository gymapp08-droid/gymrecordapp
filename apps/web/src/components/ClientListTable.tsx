import React, { useState } from 'react';
import { IPortalClientSummary, ClientStatus, UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface ClientListTableProps {
  clients: IPortalClientSummary[];
  onSelectClient: (clientId: string) => void;
  onAssignProgram: (client: IPortalClientSummary) => void;
  onOffboardClient: (client: IPortalClientSummary) => void;
  currentRole: UserRole;
}

export const ClientListTable: React.FC<ClientListTableProps> = ({
  clients = [],
  onSelectClient,
  onAssignProgram,
  onOffboardClient,
  currentRole,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClientStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const safeClients = Array.isArray(clients) ? clients : [];
  const filteredClients = safeClients.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.primaryGoal || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const canAssignWorkouts = currentRole !== UserRole.NUTRITIONIST;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Table Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Status Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '3px',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          }}
        >
          {(['ALL', ClientStatus.ACTIVE, ClientStatus.INVITED, ClientStatus.INACTIVE, ClientStatus.ARCHIVED] as const).map(
            (st) => {
              const isActive = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                    color: isActive ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textSecondary,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {st}
                </button>
              );
            },
          )}
        </div>

        {/* Filter Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by name, email, or goal..."
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            borderRadius: '6px',
            padding: '6px 12px',
            color: STITCH_THEME.colors.textPrimary,
            fontSize: '12px',
            outline: 'none',
            width: '260px',
          }}
        />
      </div>

      {/* Main Data Table */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <th style={thStyle}>Athlete</th>
              <th style={thStyle}>Goal</th>
              <th style={thStyle}>Current Program</th>
              <th style={thStyle}>Last Workout</th>
              <th style={thStyle}>Consistency</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '56px 24px', color: STITCH_THEME.colors.textMuted }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: STITCH_THEME.colors.accentCyanDim,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      fontSize: '18px',
                      color: STITCH_THEME.colors.accentCyan,
                      fontFamily: STITCH_THEME.typography.fontMono,
                      fontWeight: 700,
                    }}
                  >
                    ⊕
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: STITCH_THEME.colors.textSecondary }}>
                    No athletes found
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Adjust your filter criteria or invite a new client.
                  </div>
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                const isArchived = client.status === ClientStatus.ARCHIVED;

                return (
                  <tr
                    key={client.clientId}
                    style={{
                      borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      transition: 'background-color 0.15s ease',
                      opacity: isArchived ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.02)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                    }
                  >
                    {/* Athlete Column */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: STITCH_THEME.colors.accentCyan,
                          }}
                        >
                          {client.fullName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: STITCH_THEME.colors.textPrimary }}>
                            {client.fullName}
                          </div>
                          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
                            {client.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Goal Column */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(121, 40, 202, 0.15)',
                          color: '#C084FC',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {client.primaryGoal}
                      </span>
                    </td>

                    {/* Current Program */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: STITCH_THEME.colors.textPrimary }}>
                        {client.currentProgramTitle || (
                          <span style={{ color: STITCH_THEME.colors.textMuted, fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Workout */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>
                        {client.lastWorkoutDate ? new Date(client.lastWorkoutDate).toLocaleDateString() : 'Never'}
                      </div>
                    </td>

                    {/* Consistency Progress Bar */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            maxWidth: '70px',
                            height: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${client.workoutConsistencyPercent}%`,
                              height: '100%',
                              backgroundColor:
                                client.workoutConsistencyPercent >= 80
                                  ? STITCH_THEME.colors.accentEmerald
                                  : client.workoutConsistencyPercent >= 50
                                  ? STITCH_THEME.colors.accentAmber
                                  : STITCH_THEME.colors.accentCrimson,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                          {client.workoutConsistencyPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          letterSpacing: '0.05em',
                          backgroundColor:
                            client.status === ClientStatus.ACTIVE
                              ? 'rgba(16, 185, 129, 0.15)'
                              : client.status === ClientStatus.INVITED
                              ? 'rgba(0, 240, 255, 0.15)'
                              : client.status === ClientStatus.ARCHIVED
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(255, 255, 255, 0.08)',
                          color:
                            client.status === ClientStatus.ACTIVE
                              ? STITCH_THEME.colors.accentEmerald
                              : client.status === ClientStatus.INVITED
                              ? STITCH_THEME.colors.accentCyan
                              : client.status === ClientStatus.ARCHIVED
                              ? STITCH_THEME.colors.accentCrimson
                              : STITCH_THEME.colors.textMuted,
                        }}
                      >
                        {client.status}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onSelectClient(client.clientId)}
                          style={{
                            ...STITCH_THEME.styles.secondaryButton,
                            padding: '5px 10px',
                            fontSize: '11px',
                          }}
                        >
                          View
                        </button>

                        {canAssignWorkouts && !isArchived && (
                          <button
                            onClick={() => onAssignProgram(client)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              backgroundColor: 'rgba(0, 240, 255, 0.1)',
                              color: STITCH_THEME.colors.accentCyan,
                              border: '1px solid rgba(0, 240, 255, 0.25)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Assign
                          </button>
                        )}

                        {!isArchived && (
                          <button
                            onClick={() => onOffboardClient(client)}
                            title="Safe Offboarding (Preserves athlete history)"
                            style={{
                              padding: '5px 8px',
                              fontSize: '11px',
                              backgroundColor: 'transparent',
                              color: STITCH_THEME.colors.textMuted,
                              border: '1px solid transparent',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: '11px',
  fontWeight: 600,
  color: STITCH_THEME.colors.textMuted,
  letterSpacing: '0.02em',
};

const tdStyle: React.CSSProperties = {
  padding: '13px 16px',
  verticalAlign: 'middle',
  fontSize: '13px',
};
