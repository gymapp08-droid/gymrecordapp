import React, { useState } from 'react';
import { IClientDetailDossier, UserRole, ClientStatus, IClientProgressPhoto } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';
import { ProgressPhotosGallery } from './ProgressPhotosGallery';

interface ClientDetailViewProps {
  dossier: IClientDetailDossier;
  onBack: () => void;
  onOpenReplaceProgram: () => void;
  onOpenOffboardModal: () => void;
  currentRole: UserRole;
}

type DetailTab = 'overview' | 'workout' | 'nutrition' | 'activity' | 'progress' | 'goals';

const MOCK_PHOTOS: IClientProgressPhoto[] = [
  {
    id: 'photo_1',
    clientId: 'ath_1',
    pose: 'FRONT',
    takenAt: '2026-03-01T08:00:00Z',
    photoUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=60',
    isCoachAuthorized: true,
  },
  {
    id: 'photo_2',
    clientId: 'ath_1',
    pose: 'SIDE',
    takenAt: '2026-03-01T08:02:00Z',
    photoUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=60',
    isCoachAuthorized: true,
  },
  {
    id: 'photo_3',
    clientId: 'ath_1',
    pose: 'BACK',
    takenAt: '2026-03-01T08:05:00Z',
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60',
    isCoachAuthorized: true,
  },
  {
    id: 'photo_4',
    clientId: 'ath_1',
    pose: 'FRONT',
    takenAt: '2026-03-15T08:00:00Z',
    photoUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=60',
    isCoachAuthorized: true,
  },
];

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  dossier,
  onBack,
  onOpenReplaceProgram,
  onOpenOffboardModal,
  currentRole,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  const { overview, profile, activeProgram, activeMealPlan, recentWorkouts, recentMetrics } = dossier;
  const canAssignWorkouts = currentRole !== UserRole.NUTRITIONIST;
  const isArchived = overview.status === ClientStatus.ARCHIVED;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Breadcrumb & Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              ...STITCH_THEME.styles.secondaryButton,
              padding: '6px 12px',
              fontSize: '12px',
            }}
          >
            ← Back to Clients
          </button>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
              {overview.fullName}
            </div>
            <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
              {overview.email} • Goal: <span style={{ color: STITCH_THEME.colors.accentCyan }}>{overview.primaryGoal}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {canAssignWorkouts && !isArchived && (
            <button
              onClick={onOpenReplaceProgram}
              style={{
                ...STITCH_THEME.styles.primaryButton,
                fontSize: '12px',
                padding: '8px 16px',
              }}
            >
              🔄 Replace Program
            </button>
          )}

          {!isArchived && (
            <button
              onClick={onOpenOffboardModal}
              style={STITCH_THEME.styles.dangerButton}
            >
              Archive Client
            </button>
          )}
        </div>
      </div>

      {/* Subnavigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          paddingBottom: '12px',
        }}
      >
        {(
          [
            { id: 'overview', label: 'Overview', icon: '📋' },
            { id: 'workout', label: 'Workout Plan', icon: '🏋️' },
            { id: 'nutrition', label: 'Nutrition Plan', icon: '🥗' },
            { id: 'activity', label: 'Activity & Cardio', icon: '🏃' },
            { id: 'progress', label: 'Body Metrics & PRs', icon: '📈' },
            { id: 'goals', label: 'Goals & Profile', icon: '🎯' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: isActive
                  ? `1px solid ${STITCH_THEME.colors.borderActive}`
                  : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                color: isActive ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textSecondary,
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key KPI Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ ...STITCH_THEME.styles.glassCard, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                Workout Adherence
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: STITCH_THEME.colors.accentCyan, marginTop: '6px' }}>
                {overview.workoutConsistencyPercent}%
              </div>
              <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, marginTop: '4px' }}>
                4 / 5 sessions this week
              </div>
            </div>

            <div style={{ ...STITCH_THEME.styles.glassCard, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                Nutrition Adherence
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: STITCH_THEME.colors.accentEmerald, marginTop: '6px' }}>
                {overview.nutritionAdherencePercent || 84}%
              </div>
              <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, marginTop: '4px' }}>
                6/7 days logged targets
              </div>
            </div>

            <div style={{ ...STITCH_THEME.styles.glassCard, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                Average Daily Steps
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#F8FAFC', marginTop: '6px' }}>
                8,421
              </div>
              <div style={{ fontSize: '12px', color: STITCH_THEME.colors.accentEmerald, marginTop: '4px' }}>
                +12% vs last month
              </div>
            </div>

            <div style={{ ...STITCH_THEME.styles.glassCard, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                Current Weight & BMI
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#F8FAFC', marginTop: '6px' }}>
                {recentMetrics.weightKg ? `${recentMetrics.weightKg} kg` : '78.0 kg'}
              </div>
              <div style={{ fontSize: '12px', color: STITCH_THEME.colors.accentCyan, marginTop: '4px' }}>
                BMI: {recentMetrics.bmi || 24.1} ({recentMetrics.bmiCategory || 'NORMAL'})
              </div>
            </div>
          </div>

          {/* Active Assignments Overview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Active Workout Card */}
            <div style={{ ...STITCH_THEME.styles.glassCard, padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>
                  CURRENT WORKOUT PROGRAM
                </span>
                {activeProgram && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 240, 255, 0.15)',
                      color: STITCH_THEME.colors.accentCyan,
                      fontWeight: 700,
                    }}
                  >
                    v{activeProgram.version}
                  </span>
                )}
              </div>

              {activeProgram ? (
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
                    {activeProgram.programTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, marginTop: '4px' }}>
                    Active since: {new Date(activeProgram.startDate).toLocaleDateString()}
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setActiveTab('workout')}
                      style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '11px', padding: '6px 12px' }}
                    >
                      View Prescription Details
                    </button>
                    {canAssignWorkouts && (
                      <button
                        onClick={onOpenReplaceProgram}
                        style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '11px', padding: '6px 12px' }}
                      >
                        Change Program
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ color: STITCH_THEME.colors.textMuted, fontSize: '13px', padding: '12px 0' }}>
                  No active workout program assigned. Click "Replace Program" to assign a split.
                </div>
              )}
            </div>

            {/* Active Nutrition Card */}
            <div style={{ ...STITCH_THEME.styles.glassCard, padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>
                  CURRENT NUTRITION PROTOCOL
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: STITCH_THEME.colors.accentEmerald,
                    fontWeight: 700,
                  }}
                >
                  ACTIVE
                </span>
              </div>

              {activeMealPlan ? (
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
                    {activeMealPlan.mealPlanTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, marginTop: '4px' }}>
                    Target: {activeMealPlan.calories} kcal • {activeMealPlan.proteinG}g P • {activeMealPlan.carbsG}g C • {activeMealPlan.fatG}g F
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <button
                      onClick={() => setActiveTab('nutrition')}
                      style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '11px', padding: '6px 12px' }}
                    >
                      View Meal Schedule
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: STITCH_THEME.colors.textMuted, fontSize: '13px', padding: '12px 0' }}>
                  No custom nutrition protocol assigned. Default macro formula applied.
                </div>
              )}
            </div>
          </div>

          {/* Recent Completed Workouts Table */}
          <div style={{ ...STITCH_THEME.styles.glassCard, padding: '22px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary, marginBottom: '14px' }}>
              RECENT VERIFIED WORKOUT SESSIONS
            </div>
            {recentWorkouts.length === 0 ? (
              <div style={{ color: STITCH_THEME.colors.textMuted, fontSize: '13px', padding: '12px 0' }}>
                No completed sessions logged yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`, color: STITCH_THEME.colors.textMuted }}>
                    <th style={{ padding: '8px 12px' }}>TITLE</th>
                    <th style={{ padding: '8px 12px' }}>DATE</th>
                    <th style={{ padding: '8px 12px' }}>DURATION</th>
                    <th style={{ padding: '8px 12px' }}>TOTAL VOLUME</th>
                    <th style={{ padding: '8px 12px' }}>EXERCISES</th>
                  </tr>
                </thead>
                <tbody>
                  {recentWorkouts.map((session) => (
                    <tr key={session.id} style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.04)` }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                        {session.title}
                      </td>
                      <td style={{ padding: '12px', color: STITCH_THEME.colors.textSecondary }}>
                        {new Date(session.completedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', color: STITCH_THEME.colors.textSecondary }}>
                        {Math.round(session.durationSeconds / 60)} mins
                      </td>
                      <td style={{ padding: '12px', color: STITCH_THEME.colors.accentCyan, fontWeight: 600 }}>
                        {session.totalVolumeKg.toLocaleString()} kg
                      </td>
                      <td style={{ padding: '12px', color: STITCH_THEME.colors.textSecondary }}>
                        {session.exercisesCount} movements
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Workout Tab */}
      {activeTab === 'workout' && (
        <div style={{ ...STITCH_THEME.styles.glassCard, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
                {activeProgram ? activeProgram.programTitle : 'No Program Assigned'}
              </div>
              <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
                Version: v{activeProgram?.version || 1} • Authoritative workout split prescription
              </div>
            </div>
            {canAssignWorkouts && (
              <button onClick={onOpenReplaceProgram} style={STITCH_THEME.styles.primaryButton}>
                Replace Program
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {['Monday: Lower Strength', 'Wednesday: Upper Hypertrophy', 'Friday: Full Body Volume'].map(
              (dayTitle, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: STITCH_THEME.colors.accentCyan, marginBottom: '12px' }}>
                    {dayTitle}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ color: '#F8FAFC' }}>• Barbell Squat: 4 sets × 8 reps (90s rest)</div>
                    <div style={{ color: '#F8FAFC' }}>• Romanian Deadlift: 3 sets × 10 reps (90s rest)</div>
                    <div style={{ color: '#F8FAFC' }}>• Leg Press: 3 sets × 12 reps (60s rest)</div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Nutrition Tab */}
      {activeTab === 'nutrition' && (
        <div style={{ ...STITCH_THEME.styles.glassCard, padding: '24px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary, marginBottom: '8px' }}>
            {activeMealPlan ? activeMealPlan.mealPlanTitle : 'Custom Nutrition Plan'}
          </div>
          <div style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, marginBottom: '20px' }}>
            Daily Macros: {activeMealPlan?.calories || 2200} kcal • {activeMealPlan?.proteinG || 180}g Protein • {activeMealPlan?.carbsG || 220}g Carbs • {activeMealPlan?.fatG || 65}g Fat
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { meal: 'Meal 1 (Breakfast)', items: '3 whole eggs, 80g rolled oats, 1 banana' },
              { meal: 'Meal 2 (Lunch)', items: '200g grilled chicken breast, 150g jasmine rice, steamed broccoli' },
              { meal: 'Meal 3 (Pre-Workout)', items: '1 scoop whey isolate, 1 rice cake with peanut butter' },
              { meal: 'Meal 4 (Dinner)', items: '200g salmon fillet, 200g sweet potato, mixed green salad' },
            ].map((m, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: STITCH_THEME.colors.accentEmerald, marginBottom: '6px' }}>
                  {m.meal}
                </div>
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textPrimary }}>
                  {m.items}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity & Cardio Tab */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...STITCH_THEME.styles.glassCard, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
                  Cardio & Daily Steps Engine
                </div>
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, marginTop: '2px' }}>
                  Aggregated telemetry • Zero raw GPS / coordinates exposed for athlete privacy
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: STITCH_THEME.colors.accentEmerald,
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                🔒 PRIVACY-COMPLIANT
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>CURRENT STEP GOAL</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: STITCH_THEME.colors.accentCyan, marginTop: '6px' }}>
                  10,000 / day
                </div>
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, marginTop: '4px' }}>
                  Avg actual: 8,421 steps (84.2%)
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>ACTIVE DAYS (LAST 30D)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: STITCH_THEME.colors.accentEmerald, marginTop: '6px' }}>
                  26 / 30 days
                </div>
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, marginTop: '4px' }}>
                  Target: 24+ days (Met)
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>CARDIO TIME LOGGED</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', marginTop: '6px' }}>
                  185 mins
                </div>
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.accentCyan, marginTop: '4px' }}>
                  Zone 2 base building
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary, marginBottom: '12px' }}>
                LOGGED CARDIO SESSIONS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`, color: STITCH_THEME.colors.textMuted }}>
                    <th style={{ padding: '8px 12px' }}>TYPE</th>
                    <th style={{ padding: '8px 12px' }}>DATE</th>
                    <th style={{ padding: '8px 12px' }}>DURATION</th>
                    <th style={{ padding: '8px 12px' }}>DISTANCE</th>
                    <th style={{ padding: '8px 12px' }}>AVG HR</th>
                    <th style={{ padding: '8px 12px' }}>CALORIES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: STITCH_THEME.colors.accentCyan }}>Zone 2 Incline Walk</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.textSecondary }}>2026-03-15</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.textSecondary }}>45 mins</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.textSecondary }}>3.8 km</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.accentAmber }}>132 bpm</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.textPrimary }}>380 kcal</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: STITCH_THEME.colors.accentCyan }}>Outdoor Ruck</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.textSecondary }}>2026-03-12</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.textSecondary }}>60 mins</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.textSecondary }}>5.2 km</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.accentAmber }}>141 bpm</td>
                    <td style={{ padding: '10px 12px', color: STITCH_THEME.colors.textPrimary }}>540 kcal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Body Metrics & PRs Tab */}
      {activeTab === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {showPhotoGallery ? (
            <div>
              <button
                onClick={() => setShowPhotoGallery(false)}
                style={{ ...STITCH_THEME.styles.secondaryButton, marginBottom: '16px', fontSize: '12px' }}
              >
                ← Back to Body Metrics & Strength Curves
              </button>
              <ProgressPhotosGallery athleteName={overview.fullName} photos={MOCK_PHOTOS} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
                    Body Metrics & 1RM Progression
                  </div>
                  <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted, marginTop: '2px' }}>
                    Epley 1RM formula calculations & biometric weigh-in curves
                  </div>
                </div>
                <button
                  onClick={() => setShowPhotoGallery(true)}
                  style={{
                    ...STITCH_THEME.styles.primaryButton,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    padding: '8px 14px',
                  }}
                >
                  <span>📷</span>
                  <span>View Progress Photos Vault</span>
                </button>
              </div>

              {/* Weight & Body Comp */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ ...STITCH_THEME.styles.glassCard, padding: '18px' }}>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>START WEIGHT</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', marginTop: '6px' }}>87.2 kg</div>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, marginTop: '2px' }}>Feb 1, 2026</div>
                </div>
                <div style={{ ...STITCH_THEME.styles.glassCard, padding: '18px' }}>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>CURRENT WEIGHT</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.accentCyan, marginTop: '6px' }}>84.5 kg</div>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.accentEmerald, marginTop: '2px' }}>-2.7 kg (-3.1%)</div>
                </div>
                <div style={{ ...STITCH_THEME.styles.glassCard, padding: '18px' }}>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>ESTIMATED BODY FAT</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.accentEmerald, marginTop: '6px' }}>14.8%</div>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, marginTop: '2px' }}>DEXA / Caliper verified</div>
                </div>
                <div style={{ ...STITCH_THEME.styles.glassCard, padding: '18px' }}>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>PERSONAL RECORDS</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.accentAmber, marginTop: '6px' }}>18 PRs</div>
                  <div style={{ fontSize: '11px', color: STITCH_THEME.colors.accentEmerald, marginTop: '2px' }}>+4 this month</div>
                </div>
              </div>

              {/* Strength PR Highlights */}
              <div style={{ ...STITCH_THEME.styles.glassCard, padding: '22px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary, marginBottom: '14px' }}>
                  COMPOUND ESTIMATED 1-REP MAX PROGRESSION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  {[
                    { lift: 'Barbell Back Squat', rm: '175.0 kg', prDate: 'Mar 10, 2026', delta: '+12.5 kg' },
                    { lift: 'Romanian Deadlift', rm: '190.0 kg', prDate: 'Mar 08, 2026', delta: '+15.0 kg' },
                    { lift: 'Barbell Bench Press', rm: '122.5 kg', prDate: 'Mar 14, 2026', delta: '+7.5 kg' },
                    { lift: 'Weighted Pull-Up', rm: '+37.5 kg', prDate: 'Mar 12, 2026', delta: '+5.0 kg' },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                        borderRadius: '8px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>{p.lift}</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.accentCyan, marginTop: '6px' }}>
                        {p.rm}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px' }}>
                        <span style={{ color: STITCH_THEME.colors.accentEmerald }}>{p.delta}</span>
                        <span style={{ color: STITCH_THEME.colors.textMuted }}>{p.prDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile & Goals Tab */}
      {activeTab === 'goals' && (
        <div style={{ ...STITCH_THEME.styles.glassCard, padding: '24px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary, marginBottom: '16px' }}>
            Athlete Profile & Training Preferences
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '13px' }}>
            <div>
              <span style={{ color: STITCH_THEME.colors.textMuted }}>Height:</span>{' '}
              <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{profile.heightCm || 180} cm</span>
            </div>
            <div>
              <span style={{ color: STITCH_THEME.colors.textMuted }}>Weight:</span>{' '}
              <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{profile.weightKg || 78} kg</span>
            </div>
            <div>
              <span style={{ color: STITCH_THEME.colors.textMuted }}>Gender:</span>{' '}
              <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{profile.gender || 'MALE'}</span>
            </div>
            <div>
              <span style={{ color: STITCH_THEME.colors.textMuted }}>Units:</span>{' '}
              <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{profile.unitSystem}</span>
            </div>
            <div>
              <span style={{ color: STITCH_THEME.colors.textMuted }}>Timezone:</span>{' '}
              <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{profile.timezone}</span>
            </div>
            <div>
              <span style={{ color: STITCH_THEME.colors.textMuted }}>Experience:</span>{' '}
              <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{profile.experienceLevel || 'INTERMEDIATE'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
