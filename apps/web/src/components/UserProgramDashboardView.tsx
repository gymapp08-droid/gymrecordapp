import React, { useState, useMemo } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import PROGRAM_CATALOG_RAW from '../data/program-catalog.json';

interface UserProgramDashboardProps {
  userId?: string;
  programId?: string;
  onBack?: () => void;
}

export const UserProgramDashboardView: React.FC<UserProgramDashboardProps> = ({
  userId: _userId = 'ath_current',
  programId,
  onBack,
}) => {
  const [activeProgramId, setActiveProgramId] = useState<string>(programId || 'prog-6-week-shredded');
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [currentDay, setCurrentDay] = useState<number>(1); // 1 = Monday
  const [programStatus, setProgramStatus] = useState<'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ACTIVE');
  const [programStartDate, setProgramStartDate] = useState<string>('2026-03-01T08:00:00Z');
  const [completedDayKeys, setCompletedDayKeys] = useState<Set<string>>(new Set(['w1_d1']));
  const [loggedSets, setLoggedSets] = useState<Record<string, { weightKg: number; actualReps: number; completed: boolean }>>({
    'w1_d1_sws_db_shoulder_press_1': { weightKg: 24, actualReps: 15, completed: true },
    'w1_d1_sws_db_shoulder_press_2': { weightKg: 26, actualReps: 12, completed: true },
    'w1_d1_sws_db_shoulder_press_3': { weightKg: 28, actualReps: 10, completed: true },
  });
  const [workoutNote, setWorkoutNote] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const is6WeekShredded =
    activeProgramId === 'prog_6_week_shredded_12w' ||
    activeProgramId === 'prog-6-week-shredded' ||
    activeProgramId === '6-week-shredded' ||
    activeProgramId === '6_WEEK_SHREDDED';

  const catalogProgram = (PROGRAM_CATALOG_RAW.programs || []).find(
    (p: any) => p.id === activeProgramId || p.slug === activeProgramId
  );

  const totalProgramWeeks = is6WeekShredded ? 12 : ((catalogProgram as any)?.durationWeeks || (catalogProgram as any)?.weeksCount || 6);

  const handleStartProgram = () => {
    setProgramStatus('ACTIVE');
    setProgramStartDate(new Date().toISOString());
    const progTitle = is6WeekShredded ? '6 WEEK SHREDDED' : (catalogProgram?.name || 'Workout Program');
    setActionNotice(`${progTitle} program activated! Week 1 Day 1 ready.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSetChange = (key: string, field: 'weightKg' | 'actualReps', value: number) => {
    setLoggedSets((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        weightKg: field === 'weightKg' ? value : prev[key]?.weightKg || 0,
        actualReps: field === 'actualReps' ? value : prev[key]?.actualReps || 0,
        completed: true,
      },
    }));
  };

  const handleCompleteDay = () => {
    const dayKey = `w${currentWeek}_d${currentDay}`;
    const nextSet = new Set(completedDayKeys);
    nextSet.add(dayKey);
    setCompletedDayKeys(nextSet);

    // Advance to next day or next week
    if (currentDay < 7) {
      setCurrentDay(currentDay + 1);
    } else if (currentWeek < totalProgramWeeks) {
      setCurrentWeek(currentWeek + 1);
      setCurrentDay(1);
    } else {
      setProgramStatus('COMPLETED');
    }

    setActionNotice(`Week ${currentWeek} Day ${currentDay} marked as COMPLETED! Progress saved.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const isCurrentDayDone = completedDayKeys.has(`w${currentWeek}_d${currentDay}`);
  const activeCycle = currentWeek <= 6 ? 1 : 2;
  const canonicalSourceWeek = currentWeek <= 6 ? currentWeek : currentWeek - 6;

  // Day workout details matching the authoritative source split
  const SHREDDED_SPLIT_DAYS = [
    {
      dayOfWeek: 1,
      dayName: 'Monday',
      title: 'Shoulders + Triceps & Upper Abs',
      muscleGroups: 'Shoulders, Triceps, Upper Abs',
      restNote: 'No rest between exercises. 90 sec after giant set, 60 sec after superset. Take 30 sec after upper abs superset.',
      tempoNote: 'Lifting speed: 1 sec to lift, 1-2 sec to lower.',
      isCardio: false,
      isRest: false,
      groups: [
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_db_shoulder_press', name: 'DB Shoulder Press', targetReps: '15 / 12 / 10 reps', sets: 3 },
            { id: 'sws_rear_delt_cable_fly', name: 'Rear Delt Cable Fly', targetReps: '15 / 12 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { id: 'sws_db_side_raise', name: 'DB Side Raise', targetReps: '12 / 10 / 10 reps', sets: 3 },
            { id: 'sws_cable_front_raise', name: 'Cable Front Raise', targetReps: '12 / 10 / 10 reps', sets: 3 },
            { id: 'sws_single_hand_cable_rear_fly', name: 'Single Hand Cable Rear Fly', targetReps: '12 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { id: 'sws_db_front_raise', name: 'DB Front Raise', targetReps: '10 / 10 / 10 reps', sets: 3 },
            { id: 'sws_cable_side_raise', name: 'Cable Side Raise', targetReps: '10 / 10 / 10 reps', sets: 3 },
            { id: 'sws_db_arm_circles', name: 'DB Arm Circles', targetReps: '10 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_db_skull_crusher', name: 'DB Skull Crusher', targetReps: '12 / 10 / 10 reps', sets: 3 },
            { id: 'sws_triceps_pushdown', name: 'Triceps Pushdown', targetReps: '12 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_rope_overhead_ext', name: 'Rope Overhead Ext.', targetReps: '12 / 10 / 10 reps', sets: 3 },
            { id: 'sws_db_kick_back', name: 'DB Kick Back', targetReps: '12 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { id: 'sws_rope_overhead_ext_bench', name: 'Rope overhead Ext (on bench)', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_close_hand_pushups', name: 'Close Hand Pushups', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_bench_dips', name: 'Bench Dips', targetReps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set (Upper Abs)',
          exercises: [
            { id: 'sws_incline_crunches', name: 'Incline Crunches', targetReps: '20 / 20 / 20 reps', sets: 3 },
            { id: 'sws_plate_twist', name: 'Plate Twist', targetReps: '20 / 20 / 20 reps', sets: 3 },
          ],
        },
      ],
    },
    {
      dayOfWeek: 2,
      dayName: 'Tuesday',
      title: 'Chest + Upper Back & Lower Abs',
      muscleGroups: 'Chest, Upper Back, Lower Abs',
      restNote: 'No rest between exercises. 90 sec after giant set, 60 sec after superset.',
      tempoNote: 'Lifting speed: 1 sec to lift, 1-2 sec to lower.',
      isCardio: false,
      isRest: false,
      groups: [
        {
          type: 'Giant Set',
          exercises: [
            { id: 'sws_db_inclined_press', name: 'DB Inclined Press', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_db_flat_bench_press', name: 'DB Flat Bench Press', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_db_decline_press', name: 'DB Decline Press', targetReps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_cable_fly', name: 'Cable Fly', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_decline_cable_fly', name: 'Decline Cable Fly', targetReps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Drop Set',
          exercises: [
            { id: 'sws_incline_cable_fly_bench', name: 'Incline Cable Fly (on bench)', targetReps: '6,8,10,12 reps', sets: 1 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_decline_pushups', name: 'Decline Pushups', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_regular_pushups', name: 'Regular Pushups', targetReps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Angle Drop Set',
          exercises: [
            { id: 'sws_rope_upright_row_angle_1', name: 'Rope Upright Row (Angle 1)', targetReps: '10 / 10 / 10 reps', sets: 3 },
            { id: 'sws_rope_upright_row_angle_2', name: 'Rope Upright Row (Angle 2)', targetReps: '10 / 10 / 10 reps', sets: 3 },
            { id: 'sws_rope_upright_row_angle_3', name: 'Rope Upright Row (Angle 3)', targetReps: '10 / 10 / 10 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set (Lower Abs)',
          exercises: [
            { id: 'sws_laying_leg_pull_in', name: 'Laying Leg Pull-in', targetReps: '20 / 20 / 20 reps', sets: 3 },
            { id: 'sws_mountain_climber_cross_body', name: 'Mountain Climber Cross Body', targetReps: '20/side / 20/side / 20/side', sets: 3 },
          ],
        },
      ],
    },
    {
      dayOfWeek: 3,
      dayName: 'Wednesday',
      title: 'Cardio & Upper Abs',
      muscleGroups: 'Cardiovascular Endurance, Upper Abs',
      restNote: 'Follow 30 sec intervals on treadmill. Take 30 sec rest after upper abs supersets.',
      tempoNote: 'Treadmill interval training alternating between sprint and recovery.',
      isCardio: true,
      isRest: false,
      groups: [
        {
          type: 'Regular Set (HIIC Cardio)',
          exercises: [
            { id: 'sws_treadmill_protocol', name: 'HIIC Treadmill Sprint Protocol', targetReps: '20 mins Total (5m Warmup + 10x [30s Sprint / 30s Jump-off] + 5m Cooldown)', sets: 1 },
          ],
        },
        {
          type: 'Super Set (Upper Abs)',
          exercises: [
            { id: 'sws_incline_crunches_w', name: 'Incline Crunches', targetReps: '20 / 20 / 20 reps', sets: 3 },
            { id: 'sws_plate_twist_w', name: 'Plate Twist', targetReps: '20 / 20 / 20 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set (Upper Abs)',
          exercises: [
            { id: 'sws_db_side_bends', name: 'DB Side Bends', targetReps: '20 each side', sets: 3 },
            { id: 'sws_standing_cable_crunches', name: 'Standing Cable Crunches', targetReps: '20 / 20 / 20 reps', sets: 3 },
          ],
        },
      ],
    },
    {
      dayOfWeek: 4,
      dayName: 'Thursday',
      title: 'Lat, Mid Back + Biceps & Lower Abs',
      muscleGroups: 'Lats, Mid-Back, Biceps, Lower Abs',
      restNote: 'No rest between exercises. 90 sec after giant set, 60 sec after superset.',
      tempoNote: 'Lifting speed: 1 sec to lift, 1-2 sec to lower.',
      isCardio: false,
      isRest: false,
      groups: [
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_close_grip_lat_pull_down', name: 'Close Grip Lat Pull down', targetReps: '15 / 10 / 8 reps', sets: 3 },
            { id: 'sws_machine_rows', name: 'Machine Rows', targetReps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_db_rows', name: 'DB Rows', targetReps: '15 / 10 / 8 reps', sets: 3 },
            { id: 'sws_single_hand_cable_lat_pulldown', name: 'Single Hand Cable Lat Pulldown', targetReps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_straight_bar_pull_down', name: 'Straight Bar Pull down', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_rope_rows', name: 'Rope Rows', targetReps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_machine_preacher_curl_long_head', name: 'Machine Preacher Curl (Long Head)', targetReps: '15 / 10 / 8 reps', sets: 3 },
            { id: 'sws_machine_preacher_curl_shot_head', name: 'Machine Preacher Curl (Shot Head)', targetReps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_db_hammer_curl', name: 'DB Hammer Curl', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_cable_overhead_biceps_curl', name: 'Cable Overhead Biceps Curl', targetReps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { id: 'sws_cable_conc_curl_mid_lower', name: 'Cable Conc. Curl (Mid-Lower Angle)', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_cable_curl_45', name: 'Cable Curl 45*', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_laying_biceps_curl', name: 'Laying Biceps Curl', targetReps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set (Lower Abs)',
          exercises: [
            { id: 'sws_hanging_knee_raise', name: 'Hanging Knee Raise', targetReps: '20 / 20 / 20 reps', sets: 3 },
            { id: 'sws_side_bridges', name: 'Side Bridges', targetReps: '15-20/side / 15-20/side / 15-20/side', sets: 3 },
          ],
        },
      ],
    },
    {
      dayOfWeek: 5,
      dayName: 'Friday',
      title: 'Quads, Ham & Calves & Upper Abs',
      muscleGroups: 'Quads, Hamstrings, Calves, Upper Abs',
      restNote: 'No rest between exercises. 90 sec after giant set. Take 30 sec after upper abs superset.',
      tempoNote: 'Lifting speed: 1 sec to lift, 1-2 sec to lower.',
      isCardio: false,
      isRest: false,
      groups: [
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_db_squat', name: 'DB Squat', targetReps: '15 / 10 / 8 reps', sets: 3 },
            { id: 'sws_db_step_up', name: 'DB Step Up', targetReps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_db_lunges', name: 'DB Lunges', targetReps: '15 / 10 / 8 reps', sets: 3 },
            { id: 'sws_db_sumo_squat', name: 'DB Sumo Squat', targetReps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_leg_extension', name: 'Leg Extension', targetReps: '15 / 10 / 8 reps', sets: 3 },
            { id: 'sws_laying_leg_curl', name: 'Laying Leg Curl', targetReps: '15 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set',
          exercises: [
            { id: 'sws_rope_side_lunges', name: 'Rope Side Lunges', targetReps: '10 / 10 / 8 reps', sets: 3 },
            { id: 'sws_rope_cross_lunges', name: 'Rope Cross Lunges', targetReps: '10 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Giant Set',
          exercises: [
            { id: 'sws_calf_raise_toe_inward', name: 'Calf Raise (Toe Inward)', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_calf_raise_toe_outward', name: 'Calf Raise (Toe Outward)', targetReps: '12 / 10 / 8 reps', sets: 3 },
            { id: 'sws_seated_calf_raise_db', name: 'Seated Calf Raise (with DB)', targetReps: '12 / 10 / 8 reps', sets: 3 },
          ],
        },
        {
          type: 'Super Set (Upper Abs)',
          exercises: [
            { id: 'sws_kneeling_cable_crunches', name: 'Kneeling Cable Crunches', targetReps: '20 / 20 / 20 reps', sets: 3 },
            { id: 'sws_kneeling_cable_crunches_cross', name: 'Kneeling Cable Crunches (Cross Side)', targetReps: '20 each side', sets: 3 },
          ],
        },
      ],
    },
    {
      dayOfWeek: 6,
      dayName: 'Saturday',
      title: 'Cardio & Lower Abs',
      muscleGroups: 'Cardiovascular Conditioning, Lower Abs',
      restNote: 'Follow 30 sec intervals on treadmill. Take 30 sec rest after lower abs supersets.',
      tempoNote: 'Treadmill interval training + deep pelvic core contraction.',
      isCardio: true,
      isRest: false,
      groups: [
        {
          type: 'Regular Set (HIIC Cardio)',
          exercises: [
            { id: 'sws_treadmill_protocol_sat', name: 'HIIC Treadmill Sprint Protocol', targetReps: '20 mins Total (5m Warmup + 10x [30s Sprint / 30s Jump-off] + 5m Cooldown)', sets: 1 },
          ],
        },
        {
          type: 'Super Set (Lower Abs)',
          exercises: [
            { id: 'sws_v_crunch', name: 'V - Crunch', targetReps: '20 / 20 / 20 reps', sets: 3 },
            { id: 'sws_hanging_side_raise', name: 'Hanging side Raise', targetReps: '15-20/side / 15-20/side / 15-20/side', sets: 3 },
          ],
        },
        {
          type: 'Super Set (Lower Abs)',
          exercises: [
            { id: 'sws_scissor_kick', name: 'Scissor Kick', targetReps: '15-20 / 15-20 / 15-20 reps', sets: 3 },
            { id: 'sws_side_plank', name: 'Side Plank', targetReps: '30-45 sec each side', sets: 3 },
          ],
        },
      ],
    },
    {
      dayOfWeek: 7,
      dayName: 'Sunday',
      title: 'Recovery',
      muscleGroups: 'Rest, Recovery & Glycogen Replenishment',
      restNote: 'Non-training recovery day. Refill muscle glycogen depleted during low carbohydrate days.',
      tempoNote: 'Complete physical recovery.',
      isCardio: false,
      isRest: true,
      groups: [
        {
          type: 'Regular Set',
          exercises: [
            { id: 'sws_recovery_rest', name: 'Muscle Glycogen Refill & Mobility', targetReps: 'Non-training day. Focus on carbohydrate refeed and hydration.', sets: 1 },
          ],
        },
      ],
    },
  ];

  const splitDays = useMemo(() => {
    if (is6WeekShredded || !catalogProgram) {
      return SHREDDED_SPLIT_DAYS;
    }
    return (catalogProgram.days || []).map((d: any) => ({
      dayOfWeek: d.dayOfWeek,
      dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][d.dayOfWeek - 1] || `Day ${d.dayOfWeek}`,
      title: d.title || `Day ${d.dayOfWeek} Workout`,
      muscleGroups: d.muscleGroup || catalogProgram.goal || 'Target Muscles',
      restNote: 'Follow standard rest intervals between rounds.',
      tempoNote: 'Controlled eccentric cadence, explosive concentric drive.',
      isCardio: d.title?.toLowerCase().includes('cardio') || false,
      isRest: (d.exercises || []).length === 0,
      groups: [
        {
          type: 'Targeted Exercises',
          exercises: (d.exercises || []).map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            targetReps: `${ex.targetSets || 3} sets · ${ex.prescribedReps || '10-12 reps'}`,
            sets: ex.targetSets || 3,
          })),
        },
      ],
    }));
  }, [is6WeekShredded, catalogProgram]);

  const currentSplit = splitDays.find((d: any) => d.dayOfWeek === currentDay) || splitDays[0] || SHREDDED_SPLIT_DAYS[0]!;
  const completedWorkoutsCount = completedDayKeys.size;
  const totalWorkoutsCount = totalProgramWeeks * (splitDays.filter((d: any) => !d.isRest).length || 6);
  const completionPercentage = Math.min(100, Math.round((completedWorkoutsCount / (totalWorkoutsCount || 72)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar with Back button and Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                ...STITCH_THEME.styles.secondaryButton,
                padding: '4px 10px',
                fontSize: '12px',
              }}
            >
              ← My Programs
            </button>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={activeProgramId}
                onChange={(e) => {
                  setActiveProgramId(e.target.value);
                  setCurrentDay(1);
                  setCurrentWeek(1);
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '6px',
                  color: STITCH_THEME.colors.textPrimary,
                  padding: '6px 12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="prog-6-week-shredded">6 WEEK SHREDDED (12 Weeks • Fat Loss)</option>
                {(PROGRAM_CATALOG_RAW.programs || [])
                  .filter((p: any) => p.id !== 'prog-6-week-shredded')
                  .map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationWeeks || 6}W • {p.categoryName || 'General'})
                    </option>
                  ))}
              </select>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: STITCH_THEME.typography.fontMono,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: STITCH_THEME.colors.accentCyanDim,
                  color: STITCH_THEME.colors.accentCyan,
                }}
              >
                {is6WeekShredded ? '12 WEEKS • 2 CYCLES' : `${totalProgramWeeks} WEEKS`}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: '2px 0 0 0' }}>
              {is6WeekShredded
                ? 'High-density superset, giant set, and drop set fat loss program.'
                : (catalogProgram as any)?.description || 'Engineered training progression from Gravity catalog.'}
            </p>
          </div>
        </div>

        <div>
          {programStatus === 'NOT_STARTED' ? (
            <button
              onClick={handleStartProgram}
              style={{
                ...STITCH_THEME.styles.primaryButton,
                padding: '8px 20px',
                fontSize: '13px',
              }}
            >
              ▶ Start Program
            </button>
          ) : (
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: STITCH_THEME.colors.accentEmeraldDim,
                border: `1px solid ${STITCH_THEME.colors.accentEmerald}`,
                color: STITCH_THEME.colors.accentEmerald,
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: STITCH_THEME.colors.accentEmerald }} />
              ACTIVE PROGRAM
            </div>
          )}
        </div>
      </div>

      {actionNotice && (
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
          ✓ {actionNotice}
        </div>
      )}

      {/* Author Attribution Block */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          padding: '16px 20px',
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          backgroundColor: 'rgba(0, 229, 255, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color: STITCH_THEME.colors.accentCyan, textTransform: 'uppercase' }}>
            Authoritative Program Source
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary, marginTop: '2px' }}>
            Designed & Created by Guru Mann, USA
          </div>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textSecondary, marginTop: '2px' }}>
            Certified Advanced Fitness Trainer · Certified Nutrition Specialist · Sports Nutritionist & Strength Coach
          </div>
        </div>
        <div style={{ fontSize: '11px', fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.textMuted }}>
          Cycle 1: Weeks 1–6 · Cycle 2: Weeks 7–12 (Exact Repeat)
        </div>
      </div>

      {/* Progress Metric Banner */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          padding: '24px',
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>Program Pace</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary, marginTop: '4px' }}>
            Week {currentWeek} of 12 · Day {currentDay}
          </div>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.accentCyan, marginTop: '2px' }}>
            Cycle {activeCycle} (Canonical Week {canonicalSourceWeek})
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>Total Completion</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.accentCyan }}>
              {completionPercentage}%
            </span>
            <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
              ({completedWorkoutsCount} / 72 Workouts)
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '3px',
              marginTop: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${completionPercentage}%`,
                height: '100%',
                backgroundColor: STITCH_THEME.colors.accentCyan,
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textSecondary }}>Program Started</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: STITCH_THEME.colors.textPrimary, marginTop: '4px' }}>
            {new Date(programStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, marginTop: '2px' }}>
            Status: {programStatus}
          </div>
        </div>
      </div>

      {/* 12-Week Interactive Calendar Navigation */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          padding: '20px 24px',
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textSecondary, marginBottom: '12px' }}>
          SELECT WEEK & CYCLE:
        </div>

        {/* Week Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${totalProgramWeeks}, 1fr)`, gap: '6px', overflowX: 'auto' }}>
          {Array.from({ length: totalProgramWeeks }, (_, i) => i + 1).map((w) => {
            const isSelected = currentWeek === w;
            const isCycle1 = w <= 6;
            return (
              <button
                key={w}
                onClick={() => setCurrentWeek(w)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '6px',
                  border: isSelected
                    ? `1px solid ${STITCH_THEME.colors.accentCyan}`
                    : `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  backgroundColor: isSelected
                    ? STITCH_THEME.colors.accentCyanDim
                    : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textPrimary,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '9px', color: isSelected ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textMuted }}>
                  {is6WeekShredded ? (isCycle1 ? 'C1' : 'C2') : `Wk`}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: STITCH_THEME.typography.fontMono, marginTop: '2px' }}>
                  W{w}
                </div>
              </button>
            );
          })}
        </div>

        {/* Day Buttons Mon-Sun */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`, paddingTop: '16px' }}>
          {splitDays.map((day: any) => {
            const isSelected = currentDay === day.dayOfWeek;
            const isDone = completedDayKeys.has(`w${currentWeek}_d${day.dayOfWeek}`);
            return (
              <button
                key={day.dayOfWeek}
                onClick={() => setCurrentDay(day.dayOfWeek)}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: isSelected
                    ? `1px solid ${STITCH_THEME.colors.accentCyan}`
                    : `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textPrimary }}>
                    {day.dayName}
                  </span>
                  {isDone && (
                    <span style={{ fontSize: '10px', color: STITCH_THEME.colors.accentEmerald, fontWeight: 700 }}>
                      ✓ Done
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {day.dayOfWeek === 7 ? 'Recovery' : day.muscleGroups.split(',')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workout HUD for Selected Day */}
      <div
        style={{
          ...STITCH_THEME.styles.glassCard,
          padding: '24px',
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
                WEEK {currentWeek} · {currentSplit.dayName.toUpperCase()}
              </span>
              <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
                Target: {currentSplit.muscleGroups}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: STITCH_THEME.colors.textPrimary }}>
              {currentSplit.title}
            </h2>
          </div>

          <button
            onClick={handleCompleteDay}
            style={{
              ...STITCH_THEME.styles.primaryButton,
              backgroundColor: isCurrentDayDone ? STITCH_THEME.colors.accentEmerald : STITCH_THEME.colors.accentCyan,
              color: '#000',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {isCurrentDayDone ? '✓ Workout Completed' : 'Mark Day Completed'}
          </button>
        </div>

        {/* Execution & Rest Guidance Bar */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            fontSize: '12px',
            color: STITCH_THEME.colors.textSecondary,
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
        >
          <div><strong>Tempo & Lifting Speed:</strong> {currentSplit.tempoNote}</div>
          <div style={{ marginTop: '2px' }}><strong>Rest Instructions:</strong> {currentSplit.restNote}</div>
        </div>

        {/* Exercise Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentSplit.groups.map((group, gIdx) => (
            <div
              key={gIdx}
              style={{
                borderRadius: '8px',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: STITCH_THEME.typography.fontMono,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      group.type.includes('Giant')
                        ? STITCH_THEME.colors.accentVioletDim
                        : group.type.includes('Super')
                        ? STITCH_THEME.colors.accentCyanDim
                        : STITCH_THEME.colors.accentAmberDim,
                    color:
                      group.type.includes('Giant')
                        ? STITCH_THEME.colors.accentViolet
                        : group.type.includes('Super')
                        ? STITCH_THEME.colors.accentCyan
                        : STITCH_THEME.colors.accentAmber,
                  }}
                >
                  {group.type}
                </span>
                <span style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
                  {group.exercises.length} {group.exercises.length === 1 ? 'Movement' : 'Movements Back-to-Back'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {group.exercises.map((ex: any, exIdx: number) => {
                  return (
                    <div
                      key={exIdx}
                      style={{
                        padding: '14px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>
                            {ex.name}
                          </div>
                          <div style={{ fontSize: '12px', fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.accentCyan, marginTop: '2px' }}>
                            Prescribed: {ex.targetReps} ({ex.sets} Sets)
                          </div>
                        </div>
                      </div>

                      {/* Interactive Set Logger */}
                      {currentSplit.dayOfWeek !== 7 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                          {Array.from({ length: ex.sets }, (_, sIdx) => {
                            const setNumber = sIdx + 1;
                            const setKey = `w${currentWeek}_d${currentDay}_${ex.id}_${setNumber}`;
                            const logged = loggedSets[setKey];
                            return (
                              <div
                                key={setNumber}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                  border: `1px solid ${logged?.completed ? STITCH_THEME.colors.accentCyanDim : STITCH_THEME.colors.borderSubtle}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <span style={{ fontSize: '11px', fontFamily: STITCH_THEME.typography.fontMono, color: STITCH_THEME.colors.textSecondary }}>
                                  Set {setNumber}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="number"
                                    placeholder="kg"
                                    value={logged?.weightKg || ''}
                                    onChange={(e) => handleSetChange(setKey, 'weightKg', parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: '54px',
                                      fontSize: '11px',
                                      padding: '3px 6px',
                                      backgroundColor: 'transparent',
                                      border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                                      borderRadius: '4px',
                                      color: STITCH_THEME.colors.textPrimary,
                                      textAlign: 'center',
                                    }}
                                  />
                                  <input
                                    type="number"
                                    placeholder="reps"
                                    value={logged?.actualReps || ''}
                                    onChange={(e) => handleSetChange(setKey, 'actualReps', parseInt(e.target.value, 10) || 0)}
                                    style={{
                                      width: '54px',
                                      fontSize: '11px',
                                      padding: '3px 6px',
                                      backgroundColor: 'transparent',
                                      border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                                      borderRadius: '4px',
                                      color: STITCH_THEME.colors.textPrimary,
                                      textAlign: 'center',
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Workout Notes */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: STITCH_THEME.colors.textSecondary, marginBottom: '6px' }}>
            Workout Reflection & Notes
          </label>
          <textarea
            rows={2}
            placeholder="Record weight increments, tempo feeling, pump quality, and recovery observations..."
            value={workoutNote}
            onChange={(e) => setWorkoutNote(e.target.value)}
            style={{
              ...STITCH_THEME.styles.input,
              width: '100%',
              fontSize: '12px',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </div>
  );
};
