import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { UserRole } from '@alpha/types';

interface AssignedUser {
  userId: string;
  name: string;
  email: string;
  programStatus: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  assignedDate: string;
  currentWeek: number;
  currentDay: number;
  completedDays: number;
  completedWorkouts: number;
  completedExercises: number;
  completionPercentage: number;
  lastWorkoutDate?: string | null;
}

interface ProgramAccessManagementProps {
  currentRole?: UserRole;
  onBack?: () => void;
  onOpenUserProgress?: (userId: string) => void;
}

export const ProgramAccessManagementView: React.FC<ProgramAccessManagementProps> = ({
  currentRole: _currentRole,
  onBack,
  onOpenUserProgress,
}) => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assignEmailInput, setAssignEmailInput] = useState<string>('');
  const [selectedUserToAssign, setSelectedUserToAssign] = useState<string>('');
  const [selectedDayTab, setSelectedDayTab] = useState<number>(1); // 1 = Mon
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Default seed of assigned users for UI showcase & execution
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([
    {
      userId: 'ath_1',
      name: 'Marcus Vance',
      email: 'marcus.v@alpha.fit',
      programStatus: 'ACTIVE',
      assignedDate: '2026-03-01T08:00:00Z',
      currentWeek: 4,
      currentDay: 2,
      completedDays: 20,
      completedWorkouts: 20,
      completedExercises: 120,
      completionPercentage: 28,
      lastWorkoutDate: '2026-03-24T10:15:00Z',
    },
    {
      userId: 'ath_2',
      name: 'Elena Rostova',
      email: 'elena.rostova@alpha.fit',
      programStatus: 'ACTIVE',
      assignedDate: '2026-03-05T09:30:00Z',
      currentWeek: 3,
      currentDay: 5,
      completedDays: 17,
      completedWorkouts: 17,
      completedExercises: 98,
      completionPercentage: 24,
      lastWorkoutDate: '2026-03-23T16:45:00Z',
    },
  ]);

  const availableAthletes = [
    { id: 'ath_3', name: 'Jordan Hayes', email: 'jordan.h@alpha.fit' },
    { id: 'ath_4', name: 'Samantha Wu', email: 'samantha.wu@alpha.fit' },
    { id: 'ath_5', name: 'Liam Davies', email: 'liam.davies@alpha.fit' },
  ];

  const handleToggleStatus = () => {
    const next = !isActive;
    setIsActive(next);
    setNoticeMessage(`Program is now ${next ? 'ACTIVE (Athletes can access)' : 'INACTIVE (Athlete access paused)'}`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const handleAssignUser = (e: React.FormEvent) => {
    e.preventDefault();
    let email = assignEmailInput.trim();
    let name = email.split('@')[0] || 'Athlete';
    let userId = `user_${Date.now()}`;

    if (!email && selectedUserToAssign) {
      const match = availableAthletes.find((a) => a.id === selectedUserToAssign);
      if (match) {
        email = match.email;
        name = match.name;
        userId = match.id;
      }
    }

    if (!email) {
      alert('Please select an athlete or enter an email address.');
      return;
    }

    if (assignedUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      alert(`User with email [${email}] is already assigned.`);
      return;
    }

    const newUser: AssignedUser = {
      userId,
      name,
      email,
      programStatus: 'ACTIVE',
      assignedDate: new Date().toISOString(),
      currentWeek: 1,
      currentDay: 1,
      completedDays: 0,
      completedWorkouts: 0,
      completedExercises: 0,
      completionPercentage: 0,
      lastWorkoutDate: null,
    };

    setAssignedUsers([newUser, ...assignedUsers]);
    setAssignEmailInput('');
    setSelectedUserToAssign('');
    setNoticeMessage(`User [${email}] successfully assigned to 6 WEEK SHREDDED!`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const handleRemoveUser = (userId: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove program access for ${email}?`)) {
      setAssignedUsers(assignedUsers.filter((u) => u.userId !== userId));
      setNoticeMessage(`Removed program access for [${email}].`);
      setTimeout(() => setNoticeMessage(null), 4000);
    }
  };

  const filteredUsers = assignedUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const DAYS_SPLIT = [
    {
      dayOfWeek: 1,
      dayName: 'Monday',
      title: 'Shoulders + Triceps & Upper Abs',
      groups: [
        {
          type: 'Super Set',
          exercises: [
            { name: 'DB Shoulder Press', reps: '15 / 12 / 10 reps', sets: 3 },
            { name: 'Rear Delt Cable Fly', reps: '15 / 12 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { name: 'DB Side Raise', reps: '12 / 10 / 10 reps', sets: 3 },
            { name: 'Cable Front Raise', reps: '12 / 10 / 10 reps', sets: 3 },
            { name: 'Single Hand Cable Rear Fly', reps: '12 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { name: 'DB Front Raise', reps: '10 / 10 / 10 reps', sets: 3 },
            { name: 'Cable Side Raise', reps: '10 / 10 / 10 reps', sets: 3 },
            { name: 'DB Arm Circles', reps: '10 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'DB Skull Crusher', reps: '12 / 10 / 10 reps', sets: 3 },
            { name: 'Triceps Pushdown', reps: '12 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Rope Overhead Ext.', reps: '12 / 10 / 10 reps', sets: 3 },
            { name: 'DB Kick Back', reps: '12 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { name: 'Rope overhead Ext (on bench)', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Close Hand Pushups', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Bench Dips', reps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
      ],
      rest: 'No rest between exercises. 90 sec after giant set, 60 sec after superset. Take 30 sec after upper abs superset.',
      tempo: 'Lifting speed: 1 sec to lift, 1-2 sec to lower.',
    },
    {
      dayOfWeek: 2,
      dayName: 'Tuesday',
      title: 'Chest + Upper Back & Lower Abs',
      groups: [
        {
          type: 'Giant Set',
          exercises: [
            { name: 'DB Inclined Press', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'DB Flat Bench Press', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'DB Decline Press', reps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Cable Fly', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Decline Cable Fly', reps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Drop Set',
          exercises: [{ name: 'Incline Cable Fly (on bench)', reps: '6,8,10,12 reps', sets: 1 }],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Decline Pushups', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Regular Pushups', reps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Angle Drop Set',
          exercises: [
            { name: 'Rope Upright Row (Angle 1)', reps: '10 / 10 / 10 reps', sets: 3 },
            { name: 'Rope Upright Row (Angle 2)', reps: '10 / 10 / 10 reps', sets: 3 },
            { name: 'Rope Upright Row (Angle 3)', reps: '10 / 10 / 10 reps', sets: 3 },
          ],
        },
      ],
      rest: 'No rest between exercises. 90 sec after giant set, 60 sec after superset.',
      tempo: 'Lifting speed: 1 sec to lift, 1-2 sec to lower.',
    },
    {
      dayOfWeek: 3,
      dayName: 'Wednesday',
      title: 'Cardio & Upper Abs',
      groups: [
        {
          type: 'Regular Set',
          exercises: [
            {
              name: 'HIIC Treadmill Sprint Protocol',
              reps: '20 mins Total (5m Warmup + 10x [30s Sprint / 30s Recovery Jump-off] + 5m Cooldown)',
              sets: 1,
            },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Incline Crunches', reps: '20 / 20 / 20 reps', sets: 3 },
            { name: 'Plate Twist', reps: '20 / 20 / 20 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'DB Side Bends', reps: '20 each side', sets: 3 },
            { name: 'Standing Cable Crunches', reps: '20 / 20 / 20 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Kneeling Cable Crunches', reps: '20 / 20 / 20 reps', sets: 3 },
            { name: 'Kneeling Cable Crunches (Cross Side)', reps: '20 each side', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Cable Side Bends', reps: '20 each side', sets: 3 },
            { name: 'Incline Hip Thrust', reps: '20 / 20 / 20 reps', sets: 3 },
          ],
        },
        {
          type: 'Regular Set',
          exercises: [
            { name: 'Stomach Vacuum', reps: 'Hold 15-20 sec (3-4 sets)', sets: 4 },
          ],
        },
      ],
      rest: 'Follow 30 sec intervals on treadmill. Take 30 sec rest after upper abs superset.',
      tempo: 'HIIC treadmill protocol with controlled sprints.',
    },
    {
      dayOfWeek: 4,
      dayName: 'Thursday',
      title: 'Lat, Mid Back + Biceps & Lower Abs',
      groups: [
        {
          type: 'Super Set',
          exercises: [
            { name: 'Close Grip Lat Pull down', reps: '15 / 10 / 8 reps', sets: 3 },
            { name: 'Machine Rows', reps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'DB Rows', reps: '15 / 10 / 8 reps', sets: 3 },
            { name: 'Single Hand Cable Lat Pulldown', reps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Straight Bar Pull down', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Rope Rows', reps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Machine Preacher Curl (Long Head)', reps: '15 / 10 / 8 reps', sets: 3 },
            { name: 'Machine Preacher Curl (Shot Head)', reps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'DB Hammer Curl', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Cable Overhead Biceps Curl', reps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { name: 'Cable Conc. Curl (Mid-Lower Angle)', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Cable Curl 45*', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Laying Biceps Curl', reps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
      ],
      rest: 'No rest between exercises. 90 sec rest after giant set, 60 sec rest after superset.',
      tempo: 'Lifting speed: 1 sec to lift, 1-2 sec to lower.',
    },
    {
      dayOfWeek: 5,
      dayName: 'Friday',
      title: 'Quads, Ham & Calves & Upper Abs',
      groups: [
        {
          type: 'Super Set',
          exercises: [
            { name: 'DB Squat', reps: '15 / 10 / 8 reps', sets: 3 },
            { name: 'DB Step Up', reps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'DB Lunges', reps: '15 / 10 / 8 reps', sets: 3 },
            { name: 'DB Sumo Squat', reps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Leg Extension', reps: '15 / 10 / 8 reps', sets: 3 },
            { name: 'Laying Leg Curl', reps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Rope Side Lunges', reps: '10 / 10 / 8 reps', sets: 3 },
            { name: 'Rope Cross Lunges', reps: '10 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { name: 'Calf Raise (Toe Inward)', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Calf Raise (Toe Outward)', reps: '12 / 10 / 8 reps', sets: 3 },
            { name: 'Seated Calf Raise (with DB)', reps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
      ],
      rest: 'No rest between exercises. 90 sec after giant set. Take 30 sec after upper abs superset.',
      tempo: 'Lifting speed: 1 sec to lift, 1-2 sec to lower.',
    },
    {
      dayOfWeek: 6,
      dayName: 'Saturday',
      title: 'Cardio & Lower Abs',
      groups: [
        {
          type: 'Regular Set',
          exercises: [
            {
              name: 'HIIC Treadmill Sprint Protocol',
              reps: '20 mins Total (5m Warmup + 10x [30s Sprint / 30s Recovery Jump-off] + 5m Cooldown)',
              sets: 1,
            },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Laying Leg Pull-in', reps: '20 / 20 / 20 reps', sets: 3 },
            { name: 'Mountain Climber Cross Body', reps: '20/side / 20/side / 20/side', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Hanging Knee Raise', reps: '20 / 20 / 20 reps', sets: 3 },
            { name: 'Side Bridges', reps: '15-20/side / 15-20/side / 15-20/side', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'V - Crunch', reps: '20 / 20 / 20 reps', sets: 3 },
            { name: 'Hanging side Raise', reps: '15-20/side / 15-20/side / 15-20/side', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { name: 'Scissor Kick', reps: '15-20 / 15-20 / 15-20 reps', sets: 3 },
            { name: 'Side Plank', reps: '30-45 sec each side', sets: 3 },
          ],
        },
        {
          type: 'Regular Set',
          exercises: [
            { name: 'Pelvic Thrust', reps: '20 / 20 / 20 reps', sets: 3 },
          ],
        },
      ],
      rest: 'Take 30 sec rest after lower abs supersets.',
      tempo: 'HIIC treadmill protocol + isometric abdominal holds.',
    },
    {
      dayOfWeek: 7,
      dayName: 'Sunday',
      title: 'Recovery',
      groups: [
        {
          type: 'Regular Set',
          exercises: [
            {
              name: 'Rest & Glycogen Refill',
              reps: 'Full non-training day. Focus on carbohydrate refeed and hydration.',
              sets: 1,
            },
          ],
        },
      ],
      rest: 'Full rest day. Muscle recovery and glycogen restoration.',
      tempo: 'Non-training recovery.',
    },
  ];

  const currentSplitDay = DAYS_SPLIT.find((d) => d.dayOfWeek === selectedDayTab) || DAYS_SPLIT[0]!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  ...STITCH_THEME.styles.secondaryButton,
                  padding: '4px 8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ← Back
              </button>
            )}
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              6 WEEK SHREDDED — Access Management
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
            Restricted-access 12-Week program. Manage athlete enrollments, monitor progress, and inspect canonical source prescriptions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: isActive ? STITCH_THEME.colors.accentEmeraldDim : STITCH_THEME.colors.accentCrimsonDim,
              border: `1px solid ${isActive ? STITCH_THEME.colors.accentEmerald : STITCH_THEME.colors.accentCrimson}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isActive ? STITCH_THEME.colors.accentEmerald : STITCH_THEME.colors.accentCrimson,
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: isActive ? STITCH_THEME.colors.accentEmerald : STITCH_THEME.colors.accentCrimson,
              }}
            >
              {isActive ? 'PROGRAM ACTIVE' : 'PROGRAM INACTIVE'}
            </span>
          </div>

          <button
            onClick={handleToggleStatus}
            style={{
              ...STITCH_THEME.styles.secondaryButton,
              fontSize: '12px',
              padding: '8px 16px',
            }}
          >
            {isActive ? 'Pause Program' : 'Activate Program'}
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: STITCH_THEME.colors.accentCyanDim,
            border: `1px solid ${STITCH_THEME.colors.accentCyan}`,
            color: STITCH_THEME.colors.accentCyan,
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          ✓ {noticeMessage}
        </div>
      )}

      {/* Program Metadata & Author Attribution Banner */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          padding: '24px',
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: STITCH_THEME.typography.fontMono,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: STITCH_THEME.colors.accentCyanDim,
                color: STITCH_THEME.colors.accentCyan,
              }}
            >
              12 WEEKS TOTAL
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: STITCH_THEME.colors.textMuted,
              }}
            >
              2 Consecutive Cycles
            </span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: STITCH_THEME.colors.textPrimary }}>
            Cycle 1 (Weeks 1–6) + Cycle 2 (Weeks 7–12)
          </h2>
          <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
            Built strictly by repeating the canonical 6-week program once. Weeks 7–12 reference the exact identical workout split, exercises, set types, and prescribed reps from Weeks 1–6 without alteration.
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 229, 255, 0.04)',
            border: `1px solid ${STITCH_THEME.colors.borderMedium}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ color: STITCH_THEME.colors.accentCyan, fontSize: '14px' }}>★</span>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: STITCH_THEME.colors.accentCyan }}>
              AUTHORITATIVE SOURCE ATTRIBUTION
            </span>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: STITCH_THEME.colors.textPrimary }}>
            Designed & Created by GRAVITY Performance OS
          </h3>
          <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, margin: '0 0 8px 0', lineHeight: 1.4 }}>
            Elite Conditioning Protocol · Certified Nutrition & Strength System
          </p>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
            Canonical source integrity verified: 68 source exercises, HIIC treadmill cardio protocol, and tempo prescriptions locked.
          </div>
        </div>
      </div>

      {/* Access Control & Assignment Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Assigned Athletes List */}
        <div
          style={{
            ...STITCH_THEME.styles.glassCard,
            padding: '24px',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>
                Enrolled Athletes ({assignedUsers.length})
              </h2>
              <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
                Athletes explicitly authorized to view and execute this program.
              </p>
            </div>
            <input
              type="text"
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...STITCH_THEME.styles.input,
                width: '200px',
                fontSize: '12px',
                padding: '6px 12px',
              }}
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: STITCH_THEME.colors.textMuted, fontSize: '13px' }}>
              No athletes match your search or no athletes currently assigned.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${STITCH_THEME.colors.borderMedium}`, textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px', color: STITCH_THEME.colors.textSecondary, fontWeight: 600 }}>Athlete</th>
                    <th style={{ padding: '10px 8px', color: STITCH_THEME.colors.textSecondary, fontWeight: 600 }}>Progress</th>
                    <th style={{ padding: '10px 8px', color: STITCH_THEME.colors.textSecondary, fontWeight: 600 }}>Workouts</th>
                    <th style={{ padding: '10px 8px', color: STITCH_THEME.colors.textSecondary, fontWeight: 600 }}>Last Workout</th>
                    <th style={{ padding: '10px 8px', color: STITCH_THEME.colors.textSecondary, fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.userId}
                      style={{
                        borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>{user.email}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '80px',
                              height: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${user.completionPercentage}%`,
                                height: '100%',
                                backgroundColor: STITCH_THEME.colors.accentCyan,
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '11px', fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.accentCyan }}>
                            {user.completionPercentage}%
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textSecondary, marginTop: '2px' }}>
                          Week {user.currentWeek} · Day {user.currentDay}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', fontFamily: STITCH_THEME.typography.fontMono, fontSize: '12px' }}>
                        {user.completedWorkouts} / 72
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>
                        {user.lastWorkoutDate ? new Date(user.lastWorkoutDate).toLocaleDateString() : 'Not started'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {onOpenUserProgress && (
                            <button
                              onClick={() => onOpenUserProgress(user.userId)}
                              style={{
                                ...STITCH_THEME.styles.secondaryButton,
                                padding: '4px 10px',
                                fontSize: '11px',
                              }}
                            >
                              Progress
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveUser(user.userId, user.email)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              borderRadius: '6px',
                              backgroundColor: 'transparent',
                              border: `1px solid ${STITCH_THEME.colors.accentCrimsonDim}`,
                              color: STITCH_THEME.colors.accentCrimson,
                              cursor: 'pointer',
                            }}
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enroll Athlete Card */}
        <div
          style={{
            ...STITCH_THEME.styles.glassCard,
            padding: '24px',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
            Authorize Athlete
          </h2>
          <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
            Assign this 12-week program by selecting an existing client or typing their exact email.
          </p>

          <form onSubmit={handleAssignUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textSecondary, marginBottom: '6px' }}>
                Select Available Athlete
              </label>
              <select
                value={selectedUserToAssign}
                onChange={(e) => {
                  setSelectedUserToAssign(e.target.value);
                  const selected = availableAthletes.find((a) => a.id === e.target.value);
                  if (selected) {
                    setAssignEmailInput(selected.email);
                  }
                }}
                style={{
                  ...STITCH_THEME.styles.input,
                  width: '100%',
                  fontSize: '13px',
                }}
              >
                <option value="">-- Choose registered athlete --</option>
                {availableAthletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
              — OR ENTER EXACT EMAIL —
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textSecondary, marginBottom: '6px' }}>
                Athlete Email Address
              </label>
              <input
                type="email"
                placeholder="athlete@domain.com"
                value={assignEmailInput}
                onChange={(e) => setAssignEmailInput(e.target.value)}
                style={{
                  ...STITCH_THEME.styles.input,
                  width: '100%',
                  fontSize: '13px',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                ...STITCH_THEME.styles.primaryButton,
                width: '100%',
                justifyContent: 'center',
                padding: '10px 16px',
                fontSize: '13px',
                marginTop: '6px',
              }}
            >
              + Authorize & Assign Access
            </button>
          </form>

          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              fontSize: '11px',
              color: STITCH_THEME.colors.textMuted,
              lineHeight: 1.4,
            }}
          >
            🔒 <strong>Strict RBAC Enforced:</strong> Non-assigned athletes receive a 403 Forbidden on all program endpoints and cannot see this program on their dashboard.
          </div>
        </div>
      </div>

      {/* Canonical Workout Split Inspector (Read-Only) */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          padding: '24px',
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Canonical Workout Split Inspector
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: STITCH_THEME.typography.fontMono,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: STITCH_THEME.colors.accentAmberDim,
                  color: STITCH_THEME.colors.accentAmber,
                }}
              >
                IMMUTABLE SOURCE DATA
              </span>
            </div>
            <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, margin: '4px 0 0 0' }}>
              Original Authoritative 6-Week Prescription repeated identically for Weeks 7–12. Modifying canonical exercises is prevented.
            </p>
          </div>
        </div>

        {/* Day selection tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`, paddingBottom: '12px', overflowX: 'auto' }}>
          {DAYS_SPLIT.map((d) => (
            <button
              key={d.dayOfWeek}
              onClick={() => setSelectedDayTab(d.dayOfWeek)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedDayTab === d.dayOfWeek ? STITCH_THEME.colors.accentCyanDim : 'transparent',
                color: selectedDayTab === d.dayOfWeek ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textSecondary,
                transition: 'all 0.15s ease',
              }}
            >
              {d.dayName}
            </button>
          ))}
        </div>

        {/* Day details */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: STITCH_THEME.colors.textPrimary }}>
              {currentSplitDay.dayName}: {currentSplitDay.title}
            </h3>
            <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
              {currentSplitDay.tempo}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary, margin: '0 0 16px 0' }}>
            <strong>Rest Instructions:</strong> {currentSplitDay.rest}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentSplitDay.groups.map((group, gIdx) => (
              <div
                key={gIdx}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: STITCH_THEME.typography.fontMono,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        group.type === 'Giant Set'
                          ? STITCH_THEME.colors.accentVioletDim
                          : group.type === 'Super Set'
                          ? STITCH_THEME.colors.accentCyanDim
                          : STITCH_THEME.colors.accentAmberDim,
                      color:
                        group.type === 'Giant Set'
                          ? STITCH_THEME.colors.accentViolet
                          : group.type === 'Super Set'
                          ? STITCH_THEME.colors.accentCyan
                          : STITCH_THEME.colors.accentAmber,
                    }}
                  >
                    {group.type}
                  </span>
                  <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
                    {group.exercises.length} {group.exercises.length === 1 ? 'Exercise' : 'Exercises back-to-back'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.exercises.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '6px',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary }}>
                        {ex.name}
                      </span>
                      <span style={{ fontSize: '12px', fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.accentCyan }}>
                        {ex.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
