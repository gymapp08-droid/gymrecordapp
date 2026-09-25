import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { ICoachCalendarEvent, CalendarEventType, IPortalClientSummary } from '@alpha/types';

interface CalendarViewProps {
  clients: IPortalClientSummary[];
  events: ICoachCalendarEvent[];
  onCreateEvent: (dto: {
    clientId: string;
    title: string;
    eventType: CalendarEventType;
    startDateTime: string;
    endDateTime?: string;
    notes?: string;
  }) => void;
}

const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; text: string; border: string }> = {
  PLANNED_WORKOUT: { bg: 'rgba(0, 240, 255, 0.1)', text: '#00F0FF', border: 'rgba(0, 240, 255, 0.3)' },
  COMPLETED_WORKOUT: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
  MISSED_WORKOUT: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
  REST_DAY: { bg: 'rgba(148, 163, 184, 0.1)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.2)' },
  CARDIO_SESSION: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  CHECKIN: { bg: 'rgba(192, 132, 252, 0.15)', text: '#C084FC', border: 'rgba(192, 132, 252, 0.35)' },
  NUTRITION_START: { bg: 'rgba(5, 150, 105, 0.15)', text: '#34D399', border: 'rgba(5, 150, 105, 0.35)' },
};

export const CalendarView: React.FC<CalendarViewProps> = ({ clients = [], events = [], onCreateEvent }) => {
  const [selectedEventType, setSelectedEventType] = useState<'ALL' | CalendarEventType>('ALL');
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState((clients || [])[0]?.clientId || '');
  const [eventType, setEventType] = useState<CalendarEventType>('CHECKIN');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [startTime, setStartTime] = useState('14:00');
  const [notes, setNotes] = useState('');

  const safeEvents = Array.isArray(events) ? events : [];
  const filteredEvents = safeEvents.filter((e) => {
    const matchType = selectedEventType === 'ALL' || e.eventType === selectedEventType;
    const matchClient = selectedClientId === 'ALL' || e.clientId === selectedClientId;
    return matchType && matchClient;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    onCreateEvent({
      clientId,
      title: title.trim(),
      eventType,
      startDateTime: `${startDate}T${startTime}:00Z`,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
    setTitle('');
    setNotes('');
  };

  // Calendar days grid for visual representation (Monday - Sunday)
  const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Coaching Calendar & Events
          </h1>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
            Unified schedule of planned workouts, 1-on-1 check-ins, cardio milestones, and active program starts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Athlete Filter */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              borderRadius: '8px',
              color: STITCH_THEME.colors.textPrimary,
              padding: '8px 12px',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="ALL" style={{ background: '#0C1018' }}>All Athletes</option>
            {clients.map((c) => (
              <option key={c.clientId} value={c.clientId} style={{ background: '#0C1018' }}>
                {c.fullName}
              </option>
            ))}
          </select>

          {/* Event Type Filter */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value as any)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              borderRadius: '8px',
              color: STITCH_THEME.colors.textPrimary,
              padding: '8px 12px',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="ALL" style={{ background: '#0C1018' }}>All Event Types</option>
            <option value="CHECKIN" style={{ background: '#0C1018' }}>1-on-1 Check-ins</option>
            <option value="PLANNED_WORKOUT" style={{ background: '#0C1018' }}>Planned Workouts</option>
            <option value="COMPLETED_WORKOUT" style={{ background: '#0C1018' }}>Completed Workouts</option>
            <option value="CARDIO_SESSION" style={{ background: '#0C1018' }}>Cardio Sessions</option>
            <option value="REST_DAY" style={{ background: '#0C1018' }}>Rest Days</option>
          </select>

          <button onClick={() => setIsModalOpen(true)} style={STITCH_THEME.styles.primaryButton}>
            + Schedule Event
          </button>
        </div>
      </div>

      {/* Week Grid Header */}
      <div style={{ ...STITCH_THEME.styles.glassCard, padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '12px' }}>
          {DAYS_OF_WEEK.map((d, i) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                padding: '10px 0',
                fontSize: '12px',
                fontWeight: 700,
                color: i >= 5 ? STITCH_THEME.colors.textMuted : STITCH_THEME.colors.accentCyan,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '6px',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              }}
            >
              {d.toUpperCase()} (Mar {16 + i})
            </div>
          ))}
        </div>

        {/* Calendar Day Slots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', minHeight: '380px' }}>
          {DAYS_OF_WEEK.map((_, dayIdx) => {
            const dayEvents = filteredEvents.filter((_, idx) => idx % 7 === dayIdx);

            return (
              <div
                key={dayIdx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {dayEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
                    No events
                  </div>
                ) : (
                  dayEvents.map((e) => {
                    const color = EVENT_TYPE_COLORS[e.eventType] || EVENT_TYPE_COLORS.CHECKIN;
                    return (
                      <div
                        key={e.id}
                        style={{
                          backgroundColor: color.bg,
                          border: `1px solid ${color.border}`,
                          borderRadius: '6px',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(ev) => (ev.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(ev) => (ev.currentTarget.style.transform = 'translateY(0)')}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 700, color: color.text, textTransform: 'uppercase' }}>
                          {e.eventType.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                          {e.title}
                        </div>
                        <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textSecondary }}>
                          👤 {e.clientName}
                        </div>
                        {e.notes && (
                          <div style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted, fontStyle: 'italic' }}>
                            "{e.notes}"
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div style={{ ...STITCH_THEME.styles.glassCardElevated, width: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
                Schedule Coaching Event
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ ...STITCH_THEME.styles.secondaryButton, padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                  Target Athlete *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    borderRadius: '8px',
                    color: STITCH_THEME.colors.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  {clients.map((c) => (
                    <option key={c.clientId} value={c.clientId} style={{ background: '#0C1018' }}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bi-Weekly Strength Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    borderRadius: '8px',
                    color: STITCH_THEME.colors.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      borderRadius: '8px',
                      color: STITCH_THEME.colors.textPrimary,
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="CHECKIN" style={{ background: '#0C1018' }}>1-on-1 Check-in</option>
                    <option value="PLANNED_WORKOUT" style={{ background: '#0C1018' }}>Planned Workout</option>
                    <option value="CARDIO_SESSION" style={{ background: '#0C1018' }}>Cardio Session</option>
                    <option value="REST_DAY" style={{ background: '#0C1018' }}>Rest Day</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                    Date & Time
                  </label>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        flex: 2,
                        padding: '10px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                        borderRadius: '8px',
                        color: STITCH_THEME.colors.textPrimary,
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                        borderRadius: '8px',
                        color: STITCH_THEME.colors.textPrimary,
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
                  Coaching Notes / Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ensure client has updated weekly weigh-in before session."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                    borderRadius: '8px',
                    color: STITCH_THEME.colors.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={STITCH_THEME.styles.secondaryButton}>
                  Cancel
                </button>
                <button type="submit" style={STITCH_THEME.styles.primaryButton}>
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
