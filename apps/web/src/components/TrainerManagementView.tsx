import React, { useState, useEffect } from 'react';
import { ITrainerManagementSummary, UserRole, AccountStatus } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface TrainerManagementViewProps {
  currentRole: UserRole;
  onSimulateTrainer?: (trainerId: string, trainerName: string) => void;
}

export const TrainerManagementView: React.FC<TrainerManagementViewProps> = ({
  currentRole,
  onSimulateTrainer,
}) => {
  const [trainers, setTrainers] = useState<ITrainerManagementSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Trainer Modal
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.TRAINER);

  // Assign Client Modal
  const [assignTargetTrainerId, setAssignTargetTrainerId] = useState<string | null>(null);
  const [availableClients, setAvailableClients] = useState<Array<{ id: string; fullName: string; email: string }>>([]);
  const [selectedClientIdToAssign, setSelectedClientIdToAssign] = useState('');

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('alpha_auth_token');
      const res = await fetch('http://localhost:3001/admin/trainers', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load trainers');
      const data = await res.json();
      setTrainers(data);
    } catch {
      // Fallback roster
      setTrainers([
        {
          id: 'user_coach_1',
          email: 'marcus@alpha.os',
          fullName: 'Coach Marcus Vance',
          role: UserRole.COACH,
          status: AccountStatus.ACTIVE,
          activeClientsCount: 4,
          clients: [
            { relationshipId: 'rel_1', clientId: 'c_1', clientName: 'Alex Morgan', assignedAt: '2026-01-15T00:00:00Z' },
            { relationshipId: 'rel_2', clientId: 'c_2', clientName: 'David Chen', assignedAt: '2026-02-01T00:00:00Z' },
            { relationshipId: 'rel_3', clientId: 'c_3', clientName: 'Sarah Jenkins', assignedAt: '2026-02-14T00:00:00Z' },
            { relationshipId: 'rel_4', clientId: 'c_4', clientName: 'Elena Rostova', assignedAt: '2026-03-01T00:00:00Z' },
          ],
        },
        {
          id: 'user_trainer_2',
          email: 'jordan@alpha.os',
          fullName: 'Jordan Taylor (CSCS)',
          role: UserRole.TRAINER,
          status: AccountStatus.ACTIVE,
          activeClientsCount: 2,
          clients: [
            { relationshipId: 'rel_5', clientId: 'c_5', clientName: 'Liam O’Connor', assignedAt: '2026-02-10T00:00:00Z' },
            { relationshipId: 'rel_6', clientId: 'c_6', clientName: 'Maya Patel', assignedAt: '2026-02-22T00:00:00Z' },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('alpha_auth_token');
      const res = await fetch('http://localhost:3001/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableClients(data.filter((u: any) => u.role === UserRole.ATHLETE || u.role === 'USER'));
      }
    } catch {
      setAvailableClients([
        { id: 'c_1', fullName: 'Alex Morgan', email: 'alex@alpha.os' },
        { id: 'c_2', fullName: 'David Chen', email: 'david@alpha.os' },
        { id: 'c_3', fullName: 'Sarah Jenkins', email: 'sarah@alpha.os' },
        { id: 'c_4', fullName: 'Elena Rostova', email: 'elena@alpha.os' },
        { id: 'c_5', fullName: 'Liam O’Connor', email: 'liam@alpha.os' },
        { id: 'c_6', fullName: 'Maya Patel', email: 'maya@alpha.os' },
      ]);
    }
  };

  useEffect(() => {
    fetchTrainers();
    fetchClients();
  }, []);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newFullName) return;

    try {
      const token = localStorage.getItem('alpha_auth_token');
      const res = await fetch('http://localhost:3001/admin/trainers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail, fullName: newFullName, role: newRole }),
      });

      if (!res.ok) throw new Error('Failed to create trainer');
      setIsAddTrainerOpen(false);
      setNewEmail('');
      setNewFullName('');
      fetchTrainers();
    } catch {
      const newT: ITrainerManagementSummary = {
        id: `tr_${Date.now()}`,
        email: newEmail,
        fullName: newFullName,
        role: newRole,
        status: AccountStatus.ACTIVE,
        activeClientsCount: 0,
        clients: [],
      };
      setTrainers((prev) => [newT, ...prev]);
      setIsAddTrainerOpen(false);
      setNewEmail('');
      setNewFullName('');
    }
  };

  const handleAssignClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetTrainerId || !selectedClientIdToAssign) return;

    try {
      const token = localStorage.getItem('alpha_auth_token');
      await fetch('http://localhost:3001/admin/assignments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: selectedClientIdToAssign, trainerId: assignTargetTrainerId }),
      });

      setAssignTargetTrainerId(null);
      setSelectedClientIdToAssign('');
      fetchTrainers();
    } catch {
      const client = availableClients.find((c) => c.id === selectedClientIdToAssign);
      if (client) {
        setTrainers((prev) =>
          prev.map((t) => {
            if (t.id === assignTargetTrainerId) {
              return {
                ...t,
                activeClientsCount: t.activeClientsCount + 1,
                clients: [
                  ...t.clients,
                  {
                    relationshipId: `rel_${Date.now()}`,
                    clientId: client.id,
                    clientName: client.fullName,
                    assignedAt: new Date().toISOString(),
                  },
                ],
              };
            }
            return t;
          }),
        );
      }
      setAssignTargetTrainerId(null);
      setSelectedClientIdToAssign('');
    }
  };

  const handleUnassignClient = async (trainerId: string, clientId: string) => {
    if (!confirm('Are you sure you want to unassign this athlete from the trainer?')) return;
    try {
      const token = localStorage.getItem('alpha_auth_token');
      await fetch(`http://localhost:3001/admin/trainers/${trainerId}/clients/${clientId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTrainers();
    } catch {
      setTrainers((prev) =>
        prev.map((t) => {
          if (t.id === trainerId) {
            return {
              ...t,
              activeClientsCount: Math.max(0, t.activeClientsCount - 1),
              clients: t.clients.filter((c) => c.clientId !== clientId),
            };
          }
          return t;
        }),
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Certified Trainer Management & Operations
          </h1>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
            Audit coaching capacity, enforce client isolation, and assign athletes to certified trainers.
          </p>
        </div>
        {currentRole === UserRole.ADMIN && (
          <button onClick={() => setIsAddTrainerOpen(true)} style={STITCH_THEME.styles.primaryButton}>
            + Add Certified Trainer
          </button>
        )}
      </div>

      {/* Trainers Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: STITCH_THEME.colors.textMuted, fontSize: '13px' }}>
          Loading certified trainers roster...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {trainers.map((tr) => (
          <div
            key={tr.id}
            style={{
              ...STITCH_THEME.styles.glassCard,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            }}
          >
            <div>
              {/* Header card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: STITCH_THEME.colors.textPrimary }}>
                      {tr.fullName}
                    </h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: STITCH_THEME.typography.fontMono,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 170, 0, 0.12)',
                        color: STITCH_THEME.colors.accentAmber,
                        fontWeight: 700,
                      }}
                    >
                      {tr.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, marginTop: '2px' }}>
                    {tr.email}
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    fontSize: '12px',
                    fontFamily: STITCH_THEME.typography.fontMono,
                    color: STITCH_THEME.colors.accentCyan,
                    fontWeight: 700,
                  }}
                >
                  {tr.activeClientsCount} Active Clients
                </div>
              </div>

              {/* Assigned Clients List */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Assigned Athletes
                </div>

                {tr.clients.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {tr.clients.map((c) => (
                      <div
                        key={c.relationshipId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                            {c.clientName}
                          </span>
                          <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, marginLeft: '8px' }}>
                            Since {new Date(c.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {currentRole === UserRole.ADMIN && (
                          <button
                            onClick={() => handleUnassignClient(tr.id, c.clientId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: STITCH_THEME.colors.accentRose,
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 4px',
                            }}
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '14px', textAlign: 'center', color: STITCH_THEME.colors.textMuted, fontSize: '12px', backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: '6px' }}>
                    No athletes assigned to this trainer yet.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              }}
            >
              {onSimulateTrainer && (
                <button
                  onClick={() => onSimulateTrainer(tr.id, tr.fullName)}
                  style={{
                    ...STITCH_THEME.styles.secondaryButton,
                    fontSize: '11px',
                    padding: '5px 10px',
                    borderColor: STITCH_THEME.colors.accentAmber,
                    color: STITCH_THEME.colors.accentAmber,
                  }}
                >
                  👁️ Simulate Trainer View
                </button>
              )}

              {currentRole === UserRole.ADMIN && (
                <button
                  onClick={() => setAssignTargetTrainerId(tr.id)}
                  style={{
                    ...STITCH_THEME.styles.secondaryButton,
                    fontSize: '11px',
                    padding: '5px 12px',
                    borderColor: STITCH_THEME.colors.accentCyan,
                    color: STITCH_THEME.colors.accentCyan,
                  }}
                >
                  + Assign Athlete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Trainer Modal */}
      {isAddTrainerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleCreateTrainer}
            style={{
              ...STITCH_THEME.styles.glassCard,
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Onboard Certified Trainer</h2>
              <button
                type="button"
                onClick={() => setIsAddTrainerOpen(false)}
                style={{ background: 'none', border: 'none', color: STITCH_THEME.colors.textMuted, fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Taylor"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                style={{ ...STITCH_THEME.styles.input, width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="jordan@fitness.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{ ...STITCH_THEME.styles.input, width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                style={{ ...STITCH_THEME.styles.input, width: '100%' }}
              >
                <option value={UserRole.TRAINER}>TRAINER (Workout Prescriptions & Check-ins)</option>
                <option value={UserRole.COACH}>COACH (Dual Training & Nutrition Authority)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsAddTrainerOpen(false)} style={STITCH_THEME.styles.secondaryButton}>
                Cancel
              </button>
              <button type="submit" style={STITCH_THEME.styles.primaryButton}>
                Create Trainer Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Client Modal */}
      {assignTargetTrainerId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleAssignClient}
            style={{
              ...STITCH_THEME.styles.glassCard,
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Assign Athlete to Trainer</h2>
              <button
                type="button"
                onClick={() => setAssignTargetTrainerId(null)}
                style={{ background: 'none', border: 'none', color: STITCH_THEME.colors.textMuted, fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Select Athlete
              </label>
              <select
                required
                value={selectedClientIdToAssign}
                onChange={(e) => setSelectedClientIdToAssign(e.target.value)}
                style={{ ...STITCH_THEME.styles.input, width: '100%' }}
              >
                <option value="">Choose an athlete...</option>
                {availableClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button type="button" onClick={() => setAssignTargetTrainerId(null)} style={STITCH_THEME.styles.secondaryButton}>
                Cancel
              </button>
              <button type="submit" disabled={!selectedClientIdToAssign} style={STITCH_THEME.styles.primaryButton}>
                Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
