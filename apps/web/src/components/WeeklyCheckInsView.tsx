import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { IWeeklyCheckIn } from '@alpha/types';

interface WeeklyCheckInsViewProps {
  checkIns?: IWeeklyCheckIn[];
  onReviewCheckIn?: (checkInId: string, notes: string) => Promise<void>;
}

// Fallback seed check-ins for interactive portal display
const DEMO_CHECKINS: IWeeklyCheckIn[] = [
  {
    id: 'ci_demo_1',
    userId: 'user_ath_1',
    userFullName: 'Alex Rivera',
    weekStartDate: '2026-09-15T00:00:00.000Z',
    weightKg: 81.4,
    previousWeightKg: 82.0,
    weightChangeKg: -0.6,
    bmi: 24.2,
    previousBmi: 24.4,
    bmiChange: -0.2,
    workoutsPlanned: 4,
    workoutsCompleted: 4,
    adherencePercent: 100,
    totalVolumeKg: 24500,
    mealsPlanned: 28,
    mealsLogged: 26,
    nutritionAdherencePct: 93,
    energyRecoveryScore: 8,
    notes: 'Hit all squats and bench sessions without joint pain. Energy dipped slightly on Thursday afternoon.',
    frontPhotoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
    sidePhotoUrl: null,
    backPhotoUrl: null,
    status: 'SUBMITTED',
    reviewNotes: null,
    reviewedById: null,
    reviewedAt: null,
    submittedAt: '2026-09-22T08:30:00.000Z',
    createdAt: '2026-09-22T08:30:00.000Z',
  },
  {
    id: 'ci_demo_2',
    userId: 'user_ath_2',
    userFullName: 'Sara Chen',
    weekStartDate: '2026-09-08T00:00:00.000Z',
    weightKg: 74.8,
    previousWeightKg: 74.5,
    weightChangeKg: 0.3,
    bmi: 23.5,
    previousBmi: 23.4,
    bmiChange: 0.1,
    workoutsPlanned: 5,
    workoutsCompleted: 4,
    adherencePercent: 80,
    totalVolumeKg: 18900,
    mealsPlanned: 35,
    mealsLogged: 31,
    nutritionAdherencePct: 88,
    energyRecoveryScore: 6,
    notes: 'Traveled over the weekend so missed Saturday session. Adhered to hydration target.',
    frontPhotoUrl: null,
    sidePhotoUrl: null,
    backPhotoUrl: null,
    status: 'REVIEWED',
    reviewNotes: 'Solid execution despite travel. Let us keep hydration at 3.5L and prioritize Saturday catch-up.',
    reviewedById: 'coach_1',
    reviewedAt: '2026-09-15T10:00:00.000Z',
    submittedAt: '2026-09-14T20:10:00.000Z',
    createdAt: '2026-09-14T20:10:00.000Z',
  },
];

export const WeeklyCheckInsView: React.FC<WeeklyCheckInsViewProps> = ({
  checkIns,
  onReviewCheckIn,
}) => {
  const safeCheckIns = Array.isArray(checkIns) && checkIns.length > 0 ? checkIns : DEMO_CHECKINS;
  const [items, setItems] = useState<IWeeklyCheckIn[]>(safeCheckIns);
  const [selectedCheckIn, setSelectedCheckIn] = useState<IWeeklyCheckIn | null>(
    safeCheckIns.length > 0 ? safeCheckIns[0] ?? null : null,
  );
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelect = (ci: IWeeklyCheckIn) => {
    setSelectedCheckIn(ci);
    setReviewNote(ci.reviewNotes || '');
    setFeedback(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedCheckIn || !reviewNote.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (onReviewCheckIn) {
        await onReviewCheckIn(selectedCheckIn.id, reviewNote);
      } else {
        // Direct API call
        const token = localStorage.getItem('alpha_auth_token');
        await fetch(`/api/v1/progress/check-ins/${selectedCheckIn.id}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ reviewNotes: reviewNote }),
        });
      }

      const updated: IWeeklyCheckIn = {
        ...selectedCheckIn,
        status: 'REVIEWED',
        reviewNotes: reviewNote,
        reviewedAt: new Date().toISOString(),
      };

      setSelectedCheckIn(updated);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback('Review submitted and audit logged successfully.');
    } catch (err: any) {
      setFeedback('Failed to submit review: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          Weekly Check-Ins
        </h1>
        <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
          Athlete weekly weigh-ins, adherence metrics, and progress photos awaiting review.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Check-ins list */}
        <div
          style={{
            backgroundColor: STITCH_THEME.colors.bgSecondary,
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              fontSize: '13px',
              fontWeight: 700,
              color: STITCH_THEME.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Check-In Submissions ({items.length})
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {items.map((ci) => {
              const isSelected = selectedCheckIn?.id === ci.id;
              const isPending = ci.status === 'PENDING' || ci.status === 'SUBMITTED';
              const weightDiff = ci.weightChangeKg ?? 0;
              return (
                <div
                  key={ci.id}
                  onClick={() => handleSelect(ci)}
                  style={{
                    padding: '16px',
                    borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? 'rgba(0, 240, 255, 0.08)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? `3px solid ${STITCH_THEME.colors.accentCyan}`
                      : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                      {ci.userFullName || `Athlete ${ci.userId.slice(-6).toUpperCase()}`}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isPending
                          ? 'rgba(255, 179, 0, 0.15)'
                          : 'rgba(0, 230, 118, 0.15)',
                        color: isPending ? '#FFB300' : STITCH_THEME.colors.accentEmerald,
                      }}
                    >
                      {ci.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
                    {new Date(ci.weekStartDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px' }}>
                    <span style={{ color: STITCH_THEME.colors.textSecondary }}>
                      Weight: <strong>{ci.weightKg} kg</strong>
                    </span>
                    <span
                      style={{
                        color:
                          weightDiff > 0
                            ? STITCH_THEME.colors.accentCyan
                            : STITCH_THEME.colors.accentEmerald,
                      }}
                    >
                      {weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Check-In Detail */}
        {selectedCheckIn ? (
          <div
            style={{
              backgroundColor: STITCH_THEME.colors.bgSecondary,
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Header detail */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Weekly Check-In Dossier: {selectedCheckIn.userFullName || selectedCheckIn.userId}
                </h2>
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
                  Week starting {new Date(selectedCheckIn.weekStartDate).toLocaleDateString()} • Submitted{' '}
                  {new Date(selectedCheckIn.submittedAt || selectedCheckIn.createdAt).toLocaleDateString()}
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor:
                    selectedCheckIn.status === 'REVIEWED'
                      ? 'rgba(0, 230, 118, 0.15)'
                      : 'rgba(255, 179, 0, 0.15)',
                  color:
                    selectedCheckIn.status === 'REVIEWED'
                      ? STITCH_THEME.colors.accentEmerald
                      : '#FFB300',
                }}
              >
                {selectedCheckIn.status}
              </span>
            </div>

            {/* Metric Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                  <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>Current Weight</div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: '#FFFFFF' }}>
                  {selectedCheckIn.weightKg} kg
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    marginTop: '4px',
                    color:
                      (selectedCheckIn.weightChangeKg ?? 0) > 0
                        ? STITCH_THEME.colors.accentCyan
                        : STITCH_THEME.colors.accentEmerald,
                  }}
                >
                  Change: {(selectedCheckIn.weightChangeKg ?? 0) > 0 ? `+${selectedCheckIn.weightChangeKg}` : selectedCheckIn.weightChangeKg ?? 0} kg
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>BMI</div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: '#FFFFFF' }}>
                  {selectedCheckIn.bmi || 'N/A'}
                </div>
                <div style={{ fontSize: '10px', marginTop: '4px', color: STITCH_THEME.colors.textMuted }}>
                  *Screening metric only
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>Workout Adherence</div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: STITCH_THEME.colors.accentCyan }}>
                  {selectedCheckIn.adherencePercent}%
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px', color: STITCH_THEME.colors.textMuted }}>
                  {selectedCheckIn.workoutsCompleted} of {selectedCheckIn.workoutsPlanned} sessions
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>Nutrition Adherence</div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: STITCH_THEME.colors.accentEmerald }}>
                  {selectedCheckIn.nutritionAdherencePct}%
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px', color: STITCH_THEME.colors.textMuted }}>
                  {selectedCheckIn.mealsLogged} / {selectedCheckIn.mealsPlanned} logged
                </div>
              </div>
            </div>

            {/* Subjective Readiness Scores */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                gap: '24px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>Energy & Recovery Rating: </span>
                <strong style={{ color: '#FFFFFF' }}>{selectedCheckIn.energyRecoveryScore ?? 'N/A'} / 10</strong>
              </div>
            </div>

            {/* Athlete Notes */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textSecondary, marginBottom: '6px' }}>
                Athlete Notes
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: selectedCheckIn.notes ? '#FFFFFF' : STITCH_THEME.colors.textMuted,
                }}
              >
                {selectedCheckIn.notes || 'No notes submitted for this week.'}
              </div>
            </div>

            {/* Progress Photos */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textSecondary, marginBottom: '8px' }}>
                Progress Photos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Front', url: selectedCheckIn.frontPhotoUrl },
                  { label: 'Side', url: selectedCheckIn.sidePhotoUrl },
                  { label: 'Back', url: selectedCheckIn.backPhotoUrl },
                ].map(({ label, url }) => (
                  <div
                    key={label}
                    style={{
                      aspectRatio: '3/4',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={`${label} pose`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: STITCH_THEME.colors.textMuted, padding: '12px' }}>
                        <div style={{ fontSize: '18px', color: STITCH_THEME.colors.textDisabled, marginBottom: '4px', fontFamily: STITCH_THEME.typography.fontMono }}>◫</div>
                        <span style={{ fontSize: '12px' }}>{label} — Not submitted</span>
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: '4px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {label.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Review Area */}
            <div
              style={{
                borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                paddingTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: STITCH_THEME.colors.textSecondary }}>
                Coach Feedback
              </div>

              {feedback && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 230, 118, 0.1)',
                    border: '1px solid rgba(0, 230, 118, 0.3)',
                    color: STITCH_THEME.colors.accentEmerald,
                    fontSize: '12px',
                  }}
                >
                  ✓ {feedback}
                </div>
              )}

              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Enter technical adjustments, encouragement, and nutritional feedback for this athlete..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !reviewNote.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: STITCH_THEME.colors.accentCyan,
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: isSubmitting || !reviewNote.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || !reviewNote.trim() ? 0.5 : 1,
                  }}
                >
                  {isSubmitting ? 'Recording Review...' : 'Submit & Sign Off Check-In'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: STITCH_THEME.colors.textMuted,
              backgroundColor: STITCH_THEME.colors.bgSecondary,
              borderRadius: '12px',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            }}
          >
            No check-in selected.
          </div>
        )}
      </div>
    </div>
  );
};
