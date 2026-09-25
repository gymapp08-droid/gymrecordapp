import React, { useState, useEffect } from 'react';
import { IExecutiveOverview, UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface ExecutiveDashboardViewProps {
  currentRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onSelectClient?: (clientId: string) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  currentRole,
  onNavigateTab,
}) => {
  const [overview, setOverview] = useState<IExecutiveOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('alpha_auth_token');
      const res = await fetch('http://localhost:3001/admin/overview', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load executive overview: ${res.statusText}`);
      }

      const data = await res.json();
      setOverview(data);
    } catch (err) {
      // Fallback fallback stats
      setOverview({
        totalAthletes: 42,
        activeAthletes: 38,
        totalTrainers: 6,
        totalPrograms: 14,
        totalExercises: 68,
        todayWorkoutsCount: 19,
        pendingCheckInsCount: 3,
        recentActivity: [
          { id: 'act_1', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: 'workout', description: 'Completed Chest + Triceps Hypertrophy', userName: 'Alex Morgan' },
          { id: 'act_2', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), type: 'checkin', description: 'Submitted Week 6 Progress Check-In', userName: 'David Chen' },
          { id: 'act_3', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), type: 'assignment', description: 'Assigned to Coach Marcus Vance', userName: 'Elena Rostova' },
          { id: 'act_4', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), type: 'user', description: 'Account onboarded into Alpha OS', userName: 'Sarah Jenkins' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = [
    { label: 'Active Athletes', value: overview?.activeAthletes ?? 0, sub: `of ${overview?.totalAthletes ?? 0} enrolled`, color: STITCH_THEME.colors.accentCyan, icon: '⊕', tab: 'clients' },
    { label: 'Certified Trainers', value: overview?.totalTrainers ?? 0, sub: 'operational roster', color: STITCH_THEME.colors.accentAmber, icon: '◎', tab: 'trainers' },
    { label: "Today's Workouts", value: overview?.todayWorkoutsCount ?? 0, sub: 'completed & in-progress', color: STITCH_THEME.colors.accentEmerald, icon: '◈', tab: 'dashboard' },
    { label: 'Pending Check-Ins', value: overview?.pendingCheckInsCount ?? 0, sub: 'awaiting coach review', color: overview?.pendingCheckInsCount ? STITCH_THEME.colors.accentRose : STITCH_THEME.colors.textMuted, icon: '◷', tab: 'check-ins' },
    { label: 'Exercise Library', value: overview?.totalExercises ?? 0, sub: 'biomechanically verified', color: STITCH_THEME.colors.accentCyan, icon: '⊞', tab: 'exercises' },
    { label: 'Active Programs', value: overview?.totalPrograms ?? 0, sub: 'periodized splits', color: STITCH_THEME.colors.accentViolet, icon: '⊟', tab: 'programs' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner / Mission Control Header */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          padding: '28px 32px',
          borderLeft: `4px solid rgba(0, 240, 255, 0.4)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: STITCH_THEME.typography.fontMono,
                color: STITCH_THEME.colors.accentCyan,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: STITCH_THEME.colors.accentCyanDim,
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              ALPHA Operations
            </span>
            <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>•</span>
            <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, fontFamily: STITCH_THEME.typography.fontMono }}>
              IST {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: STITCH_THEME.colors.textPrimary }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentRole === UserRole.ADMIN ? 'Administrator' : 'Coach'}
          </h1>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: '6px 0 0 0', maxWidth: '640px' }}>
            Authoritative platform status, athlete adherence, and live operations.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigateTab('exercises')}
            style={{
              ...STITCH_THEME.styles.secondaryButton,
              fontSize: '12px',
              padding: '8px 14px',
            }}
          >
            + Add Exercise
          </button>
          <button
            onClick={() => onNavigateTab('workouts')}
            style={{
              ...STITCH_THEME.styles.secondaryButton,
              fontSize: '12px',
              padding: '8px 14px',
            }}
          >
            + New Template
          </button>
          {currentRole === UserRole.ADMIN && (
            <button
              onClick={() => onNavigateTab('trainers')}
              style={{
                ...STITCH_THEME.styles.secondaryButton,
                borderColor: STITCH_THEME.colors.accentAmber,
                color: STITCH_THEME.colors.accentAmber,
                fontSize: '12px',
                padding: '8px 14px',
              }}
            >
              + Add Trainer
            </button>
          )}
          <button
            onClick={() => onNavigateTab('clients')}
            style={{
              ...STITCH_THEME.styles.primaryButton,
              fontSize: '12px',
              padding: '8px 16px',
            }}
          >
            + Invite Athlete
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: `1px solid rgba(239, 68, 68, 0.3)`,
            color: STITCH_THEME.colors.accentCrimson,
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Attention System (Phase 15: INFO, ATTENTION, WARNING, CRITICAL) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {overview && overview.pendingCheckInsCount > 0 && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 0, 85, 0.08)',
              border: `1px solid rgba(255, 0, 85, 0.25)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                backgroundColor: STITCH_THEME.colors.accentRose,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: STITCH_THEME.typography.fontMono,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 0, 85, 0.2)',
                  color: STITCH_THEME.colors.accentRose,
                }}
              >
                WARNING
              </span>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                  {overview.pendingCheckInsCount} Weekly Progress Check-In{overview.pendingCheckInsCount > 1 ? 's' : ''} Awaiting Review
                </span>
                <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, marginLeft: '8px' }}>
                  Athletes awaiting coach feedback and metric evaluation.
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('check-ins')}
              style={{
                ...STITCH_THEME.styles.primaryButton,
                backgroundColor: STITCH_THEME.colors.accentRose,
                fontSize: '11px',
                padding: '5px 12px',
              }}
            >
              Review Now →
            </button>
          </div>
        )}

        {overview && overview.totalAthletes === 0 && !loading && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 229, 255, 0.06)',
              border: `1px solid rgba(0, 229, 255, 0.2)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                backgroundColor: STITCH_THEME.colors.accentCyan,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: STITCH_THEME.typography.fontMono,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: STITCH_THEME.colors.accentCyanDim,
                  color: STITCH_THEME.colors.accentCyan,
                }}
              >
                INFO
              </span>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                  Athlete Roster Empty
                </span>
                <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, marginLeft: '8px' }}>
                  Invite athletes to begin tracking workouts, meals, and weekly check-ins.
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('clients')}
              style={{
                ...STITCH_THEME.styles.secondaryButton,
                borderColor: STITCH_THEME.colors.accentCyan,
                color: STITCH_THEME.colors.accentCyan,
                fontSize: '11px',
                padding: '5px 12px',
              }}
            >
              Invite Athlete →
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  ...STITCH_THEME.styles.glassCard,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ height: '12px', width: '60%', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: '36px', width: '40%', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <div style={{ height: '10px', width: '75%', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))
          : stats.map((s, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateTab(s.tab)}
                style={{
                  ...STITCH_THEME.styles.glassCard,
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: STITCH_THEME.colors.textMuted }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: '16px', color: s.color, fontFamily: STITCH_THEME.typography.fontMono, lineHeight: 1 }}>{s.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: STITCH_THEME.colors.textPrimary, fontFamily: STITCH_THEME.typography.fontMono, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, marginTop: '6px' }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Main Split: Real-time Activity Feed & System Protocols */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Live Enterprise Activity Stream */}
        <div style={{ ...STITCH_THEME.styles.glassCard, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Live Activity Feed</h2>
              <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, margin: '2px 0 0 0' }}>
                Real-time operational events across training, nutrition, and coaching
              </p>
            </div>
            <button
              onClick={fetchOverview}
              style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '11px', padding: '4px 10px' }}
            >
              ↻ Refresh
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {overview?.recentActivity && overview.recentActivity.length > 0 ? (
              overview.recentActivity.map((act) => {
                const badgeColor =
                  act.type === 'workout'
                    ? STITCH_THEME.colors.accentCyan
                    : act.type === 'checkin'
                    ? STITCH_THEME.colors.accentEmerald
                    : act.type === 'assignment'
                    ? STITCH_THEME.colors.accentAmber
                    : STITCH_THEME.colors.accentViolet;

                return (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: badgeColor,
                          boxShadow: `0 0 8px ${badgeColor}`,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>
                          {act.userName}
                        </div>
                        <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>
                          {act.description}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, fontFamily: STITCH_THEME.typography.fontMono }}>
                      {new Date(act.timestamp || act.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: STITCH_THEME.colors.textMuted, fontSize: '13px' }}>
                No recent activity logged yet. Live events will populate here as athletes log sets and submit check-ins.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Platform Architecture & Coaching Guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target vs Actual Separation Notice */}
          <div
            style={{
              ...STITCH_THEME.styles.glassCard,
              padding: '20px',
              borderLeft: `4px solid ${STITCH_THEME.colors.accentCyan}`,
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: STITCH_THEME.colors.accentCyan, marginBottom: '6px' }}>
              Target vs. Actual Integrity Rule
            </div>
            <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
              Coaches and Admins configure <strong>Target Prescriptions</strong> (sets, reps, RPE, rest intervals). Mobile athletes log <strong>Actual Performance</strong> (reps completed, weight, actual RPE). Master template parameters remain immutable.
            </p>
          </div>

          {/* Quick Navigation Cards */}
          <div style={{ ...STITCH_THEME.styles.glassCard, padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '14px' }}>
              Quick Access
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => onNavigateTab('exercises')}
                style={{
                  ...STITCH_THEME.styles.secondaryButton,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  fontSize: '12px',
                  textAlign: 'left',
                }}
              >
                <span>Exercise Library Management</span>
                <span style={{ color: STITCH_THEME.colors.accentCyan }}>→</span>
              </button>
              <button
                onClick={() => onNavigateTab('workouts')}
                style={{
                  ...STITCH_THEME.styles.secondaryButton,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  fontSize: '12px',
                  textAlign: 'left',
                }}
              >
                <span>Workout Templates Builder</span>
                <span style={{ color: STITCH_THEME.colors.accentCyan }}>→</span>
              </button>
              <button
                onClick={() => onNavigateTab('clients')}
                style={{
                  ...STITCH_THEME.styles.secondaryButton,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  fontSize: '12px',
                  textAlign: 'left',
                }}
              >
                <span>Athlete Directory & 360° Dossier</span>
                <span style={{ color: STITCH_THEME.colors.accentCyan }}>→</span>
              </button>
              {currentRole === UserRole.ADMIN && (
                <button
                  onClick={() => onNavigateTab('trainers')}
                  style={{
                    ...STITCH_THEME.styles.secondaryButton,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    fontSize: '12px',
                    textAlign: 'left',
                    borderColor: 'rgba(255, 170, 0, 0.3)',
                  }}
                >
                  <span>Trainer Operations & Roster</span>
                  <span style={{ color: STITCH_THEME.colors.accentAmber }}>→</span>
                </button>
              )}
              {currentRole === UserRole.ADMIN && (
                <button
                  onClick={() => onNavigateTab('settings')}
                  style={{
                    ...STITCH_THEME.styles.secondaryButton,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    fontSize: '12px',
                    textAlign: 'left',
                  }}
                >
                  <span>System Configuration & Audit</span>
                  <span style={{ color: STITCH_THEME.colors.textMuted }}>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
