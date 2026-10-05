import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTodayDayOfWeek, DEFAULT_TIMEZONE } from '../utils/timezone';
import { SecureStorage } from '../services/secureStorage';
import { ApiClient } from '../services/api';
import { CANONICAL_6_WEEK_SPLIT } from '../data/sixWeekShredded';
import programCatalogData from '../data/program-catalog.json';

export interface WorkoutExerciseSummary {
  number: string;
  name: string;
  prescription: string;
  isCompleted: boolean;
  setGroupType?: 'STRAIGHT_SET' | 'SUPERSET' | 'GIANT_SET' | 'DROP_SET' | string;
  groupNumber?: number;
  restInstructions?: string;
  tempo?: string;
}

export interface TodayWorkoutState {
  id: string;
  name: string;
  category: string;
  dayOfWeek: number;
  dayName: string;
  isRestDay: boolean;
  estimatedMinutes: number;
  totalExercises: number;
  totalSets: number;
  targetVolumeKg: number;
  completedVolumeKg: number;
  completedExercisesCount: number;
  completedSetsCount: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REST_DAY';
  exercises: WorkoutExerciseSummary[];
}

export type MealCategory = 'BREAKFAST' | 'SNACK' | 'LUNCH' | 'PRE_WORKOUT' | 'DINNER';

export interface MealRecord {
  id: string;
  type: MealCategory;
  title: string;
  mealNumber: number;
  scheduledTime: string;
  plannedGrams: number;
  actualGrams: number;
  plannedCals: number;
  actualCals: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  status: 'COMPLETED_PLANNED' | 'COMPLETED_MODIFIED' | 'PARTIAL' | 'SKIPPED' | 'UPCOMING';
  statusLabel: string;
  itemsSummary: string;
}

export interface TodayNutritionState {
  caloriesTarget: number;
  caloriesConsumed: number;
  proteinTarget: number;
  proteinConsumed: number;
  carbsTarget: number;
  carbsConsumed: number;
  fatTarget: number;
  fatConsumed: number;
  meals: MealRecord[];
}

export interface TodayActivityState {
  steps: number;
  stepsTarget: number;
  cardioSessionsCount: number;
  waterLiters: number;
  waterTarget: number;
  isWearableConnected: boolean;
}

export interface MomentumDay {
  day: string;
  dayOfWeek: number;
  status: 'COMPLETED' | 'PARTIAL' | 'REST' | 'MISSED' | 'UPCOMING';
  symbol: string;
  label: string;
}

export interface RecentPerformanceState {
  exercise: string;
  previous: string;
  latest: string;
  change: string;
  hasImproved: boolean;
  hasHistory: boolean;
}

export interface PersonalRecordState {
  exercise: string;
  record: string;
  isReal: boolean;
}

export interface RecoveryState {
  isAvailable: boolean;
  sourceName: string | null;
  score: number | null;
  sleep: string | null;
  hrv: string | null;
  restingHr: string | null;
}

export interface UpNextItem {
  type: 'SUPPLEMENT' | 'MEAL' | 'WORKOUT' | 'HYDRATION';
  title: string;
  detail: string;
  time: string;
  isCompleted: boolean;
}

interface PerformanceContextType {
  workout: TodayWorkoutState;
  nutrition: TodayNutritionState;
  activity: TodayActivityState;
  streak: { days: number; label: string };
  weeklyMomentum: {
    days: MomentumDay[];
    completedCount: number;
    restCount: number;
    missedCount: number;
  };
  recentPerformance: RecentPerformanceState;
  personalRecord: PersonalRecordState | null;
  recovery: RecoveryState;
  upNext: UpNextItem;
  dailyNote: string;
  monthlyJourney: {
    workouts: number;
    exercises: number;
    prs: number;
    consistencyRate: string;
  };
  recordWorkoutCompletion: (summary: {
    totalVolumeKg: number;
    totalSetsCompleted: number;
    totalRepsCompleted: number;
    exercisesCompletedCount: number;
    prsAchieved: string[];
    sessionTitle?: string;
  }) => void;
  addWater: (liters: number) => void;
  toggleUpNext: () => void;
  saveDailyNote: (note: string) => void;
  connectHealth: (sourceName: string) => void;
  updateMealStatus: (
    mealType: string,
    actualCals: number,
    status: 'COMPLETED_PLANNED' | 'COMPLETED_MODIFIED' | 'PARTIAL' | 'SKIPPED' | 'UPCOMING',
    statusLabel?: string
  ) => void;
  refreshDayState: () => void;
  activeProgramId: string;
  activeProgramTitle: string;
  currentProgramWeek: number;
  setActiveProgramId: (programId: string) => void;
  setCurrentProgramWeek: (week: number) => void;
  selectWorkoutDay: (dayOfWeek: number) => void;
}

// Section 17 & 21: Weekday Schedule Mapping (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun)
const WEEK_WORKOUT_SCHEDULE: Record<
  number,
  {
    name: string;
    category: string;
    estimatedMinutes: number;
    isRest: boolean;
    exercises: WorkoutExerciseSummary[];
  }
> = {
  1: {
    name: 'Chest + Triceps',
    category: 'Hypertrophy',
    estimatedMinutes: 55,
    isRest: false,
    exercises: [
      { number: '01', name: 'Barbell Bench Press', prescription: '4 sets · 8–12 reps', isCompleted: false },
      { number: '02', name: 'Incline DB Press', prescription: '3 sets · 10–12 reps', isCompleted: false },
      { number: '03', name: 'Cable Chest Flyes', prescription: '3 sets · 12–15 reps', isCompleted: false },
      { number: '04', name: 'Cable Tricep Pushdown', prescription: '4 sets · 10–12 reps', isCompleted: false },
      { number: '05', name: 'Overhead Tricep Extension', prescription: '3 sets · 12–15 reps', isCompleted: false },
    ],
  },
  2: {
    name: 'Back + Biceps',
    category: 'Hypertrophy',
    estimatedMinutes: 55,
    isRest: false,
    exercises: [
      { number: '01', name: 'Weighted / Bodyweight Pull-up', prescription: '4 sets · 8–10 reps', isCompleted: false },
      { number: '02', name: 'Barbell Bent-Over Row', prescription: '4 sets · 8–12 reps', isCompleted: false },
      { number: '03', name: 'Seated Cable Row', prescription: '3 sets · 10–12 reps', isCompleted: false },
      { number: '04', name: 'Barbell Bicep Curl', prescription: '4 sets · 10–12 reps', isCompleted: false },
      { number: '05', name: 'Incline Dumbbell Curl', prescription: '3 sets · 12–15 reps', isCompleted: false },
    ],
  },
  3: {
    name: 'Shoulders + Abs',
    category: 'Delts & Core',
    estimatedMinutes: 50,
    isRest: false,
    exercises: [
      { number: '01', name: 'Standing Overhead Press', prescription: '4 sets · 8–10 reps', isCompleted: false },
      { number: '02', name: 'Dumbbell Lateral Raise', prescription: '4 sets · 12–15 reps', isCompleted: false },
      { number: '03', name: 'Face Pull (Rear Delts)', prescription: '3 sets · 15 reps', isCompleted: false },
      { number: '04', name: 'Hanging Leg Raise', prescription: '3 sets · 15 reps', isCompleted: false },
      { number: '05', name: 'Cable Woodchopper', prescription: '3 sets · 12 reps/side', isCompleted: false },
    ],
  },
  4: {
    name: 'Legs & Calves',
    category: 'Lower Body Strength',
    estimatedMinutes: 60,
    isRest: false,
    exercises: [
      { number: '01', name: 'Barbell Back Squat', prescription: '4 sets · 6–10 reps', isCompleted: false },
      { number: '02', name: 'Romanian Deadlift (RDL)', prescription: '4 sets · 8–12 reps', isCompleted: false },
      { number: '03', name: 'Leg Press', prescription: '3 sets · 10–12 reps', isCompleted: false },
      { number: '04', name: 'Seated Leg Curl', prescription: '3 sets · 12–15 reps', isCompleted: false },
      { number: '05', name: 'Standing Calf Raise', prescription: '4 sets · 15 reps', isCompleted: false },
    ],
  },
  5: {
    name: 'Upper Body Power',
    category: 'Volume & Symmetry',
    estimatedMinutes: 55,
    isRest: false,
    exercises: [
      { number: '01', name: 'Flat Dumbbell Press', prescription: '4 sets · 8–10 reps', isCompleted: false },
      { number: '02', name: 'Chest-Supported Row', prescription: '4 sets · 10–12 reps', isCompleted: false },
      { number: '03', name: 'Dips / Machine Dip', prescription: '3 sets · 10–12 reps', isCompleted: false },
      { number: '04', name: 'Hammer Curls', prescription: '3 sets · 12 reps', isCompleted: false },
      { number: '05', name: 'Cable Lateral Raise', prescription: '4 sets · 15 reps', isCompleted: false },
    ],
  },
  6: {
    name: 'Active Recovery & Cardio',
    category: 'Conditioning & Mobility',
    estimatedMinutes: 40,
    isRest: false,
    exercises: [
      { number: '01', name: 'Zone 2 Incline Walk / Jog', prescription: '30 mins steady-state', isCompleted: false },
      { number: '02', name: 'Thoracic & Hip Mobility Flow', prescription: '10 mins stretching', isCompleted: false },
    ],
  },
  7: {
    name: 'Rest & Recovery',
    category: 'Complete Rest',
    estimatedMinutes: 0,
    isRest: true,
    exercises: [],
  },
};

export function buildShreddedExercisesForDay(dayOfWeek: number): WorkoutExerciseSummary[] {
  const plan = CANONICAL_6_WEEK_SPLIT[dayOfWeek];
  if (!plan) return [];

  const list: WorkoutExerciseSummary[] = [];
  let idx = 1;

  if (plan.workoutType === 'CARDIO') {
    list.push({
      number: String(idx++).padStart(2, '0'),
      name: 'HIIC Treadmill Cardio (20 Min)',
      prescription: '5m warm-up (3.0mph) + 10x (30s sprint @ 9-11mph / 30s jump-off) + 5m cool-down',
      isCompleted: false,
    });
  }

  for (const p of plan.prescriptions) {
    list.push({
      number: String(idx++).padStart(2, '0'),
      name: p.exerciseName,
      prescription: `${p.setGroupType} · ${p.prescribedReps}`,
      isCompleted: false,
    });
  }

  return list;
}

export const SHREDDED_WEEK_WORKOUT_SCHEDULE: Record<
  number,
  {
    name: string;
    category: string;
    estimatedMinutes: number;
    isRest: boolean;
    exercises: WorkoutExerciseSummary[];
  }
> = {
  1: {
    name: 'Shoulders + Triceps & Upper Abs',
    category: '6 WEEK SHREDDED',
    estimatedMinutes: 65,
    isRest: false,
    exercises: buildShreddedExercisesForDay(1),
  },
  2: {
    name: 'Chest + Upper Back & Lower Abs',
    category: '6 WEEK SHREDDED',
    estimatedMinutes: 60,
    isRest: false,
    exercises: buildShreddedExercisesForDay(2),
  },
  3: {
    name: 'Cardio & Upper Abs',
    category: '6 WEEK SHREDDED (HIIC 20 Min)',
    estimatedMinutes: 50,
    isRest: false,
    exercises: buildShreddedExercisesForDay(3),
  },
  4: {
    name: 'Lat, Mid Back + Biceps & Lower Abs',
    category: '6 WEEK SHREDDED',
    estimatedMinutes: 65,
    isRest: false,
    exercises: buildShreddedExercisesForDay(4),
  },
  5: {
    name: 'Quads, Ham & Calves & Upper Abs',
    category: '6 WEEK SHREDDED',
    estimatedMinutes: 60,
    isRest: false,
    exercises: buildShreddedExercisesForDay(5),
  },
  6: {
    name: 'Cardio & Lower Abs',
    category: '6 WEEK SHREDDED (HIIC 20 Min)',
    estimatedMinutes: 50,
    isRest: false,
    exercises: buildShreddedExercisesForDay(6),
  },
  7: {
    name: 'Active Rest & Recovery',
    category: '6 WEEK SHREDDED',
    estimatedMinutes: 0,
    isRest: true,
    exercises: [],
  },
};

export function resolveScheduleForProgram(programId: string, dayOfWeek: number) {
  if (
    programId === 'prog_6_week_shredded_12w' ||
    programId === '6-week-shredded' ||
    programId === '6_WEEK_SHREDDED' ||
    programId === 'prog-6-week-shredded'
  ) {
    return SHREDDED_WEEK_WORKOUT_SCHEDULE[dayOfWeek] || SHREDDED_WEEK_WORKOUT_SCHEDULE[1]!;
  }

  const catalog: any = programCatalogData;
  const program = (catalog.programs || []).find(
    (p: any) =>
      p.id === programId ||
      p.slug === programId ||
      (p.name && p.name.toLowerCase() === programId.toLowerCase())
  );

  if (program && Array.isArray(program.days)) {
    const day = program.days.find((d: any) => d.dayOfWeek === dayOfWeek);
    if (day && Array.isArray(day.exercises) && day.exercises.length > 0) {
      return {
        name: day.title || `Day ${dayOfWeek} Workout`,
        category: program.name,
        estimatedMinutes: 55,
        isRest: false,
        exercises: day.exercises.map((ex: any, i: number) => ({
          number: String(i + 1).padStart(2, '0'),
          name: ex.name,
          prescription: `${ex.setGroupType || 'STRAIGHT_SET'} · ${ex.prescribedReps || '10-12 reps'}`,
          isCompleted: false,
          setGroupType: ex.setGroupType || 'STRAIGHT_SET',
          groupNumber: ex.groupNumber || i + 1,
          restInstructions: ex.restInstructions,
          tempo: ex.tempo,
        })),
      };
    }
    // Found program but no exercises on this day -> Rest day
    return {
      name: 'Rest & Recovery',
      category: program.name,
      estimatedMinutes: 0,
      isRest: true,
      exercises: [],
    };
  }

  return WEEK_WORKOUT_SCHEDULE[dayOfWeek] || WEEK_WORKOUT_SCHEDULE[1]!;
}

export function resolveMealsForProgram(programId: string): MealRecord[] {
  if (
    programId === 'prog_6_week_shredded_12w' ||
    programId === '6-week-shredded' ||
    programId === '6_WEEK_SHREDDED' ||
    programId === 'prog-6-week-shredded'
  ) {
    return DEFAULT_5_MEALS;
  }

  const catalog: any = programCatalogData;
  const program = (catalog.programs || []).find(
    (p: any) =>
      p.id === programId ||
      p.slug === programId ||
      (p.name && p.name.toLowerCase() === programId.toLowerCase())
  );

  if (program && Array.isArray(program.nutritionPlans) && program.nutritionPlans.length > 0) {
    const plan = program.nutritionPlans[0];
    if (Array.isArray(plan.meals) && plan.meals.length > 0) {
      return plan.meals.map((m: any, idx: number) => {
        let type: MealCategory = 'LUNCH';
        const name = (m.mealName || '').toUpperCase();
        if (name.includes('BREAKFAST') || idx === 0) type = 'BREAKFAST';
        else if (name.includes('PRE') || name.includes('SNACK')) type = 'SNACK';
        else if (name.includes('POST') || name.includes('SHAKE')) type = 'PRE_WORKOUT';
        else if (name.includes('DINNER') || idx === plan.meals.length - 1) type = 'DINNER';

        const itemsStr = Array.isArray(m.items) && m.items.length > 0
          ? m.items.map((it: any) => it.foodName).join(', ')
          : 'Prescribed whole foods';

        return {
          id: `m-prog-${idx + 1}`,
          type,
          title: m.mealName || `Meal ${idx + 1}`,
          mealNumber: m.mealNumber || idx + 1,
          scheduledTime: m.mealTime || '12:00',
          plannedGrams: 350,
          actualGrams: 0,
          plannedCals: m.calories || 500,
          actualCals: 0,
          proteinGrams: m.proteinGrams || 35,
          carbsGrams: m.carbGrams || 50,
          fatGrams: m.fatGrams || 14,
          status: 'UPCOMING' as const,
          statusLabel: 'Planned',
          itemsSummary: itemsStr,
        };
      });
    }
  }

  return DEFAULT_5_MEALS;
}

// Section 34: 5 structured meals per day
const DEFAULT_5_MEALS: MealRecord[] = [
  {
    id: 'm-1',
    type: 'BREAKFAST',
    title: 'Breakfast',
    mealNumber: 1,
    scheduledTime: '08:00',
    plannedGrams: 320,
    actualGrams: 0,
    plannedCals: 580,
    actualCals: 0,
    proteinGrams: 42,
    carbsGrams: 55,
    fatGrams: 20,
    status: 'UPCOMING',
    statusLabel: 'Planned',
    itemsSummary: '4 Whole Eggs, 80g Rolled Oats, 30g Whey Isolate',
  },
  {
    id: 'm-2',
    type: 'SNACK',
    title: 'Morning Snack',
    mealNumber: 2,
    scheduledTime: '11:00',
    plannedGrams: 180,
    actualGrams: 0,
    plannedCals: 260,
    actualCals: 0,
    proteinGrams: 20,
    carbsGrams: 30,
    fatGrams: 6,
    status: 'UPCOMING',
    statusLabel: 'Planned',
    itemsSummary: '150g Greek Yogurt 0%, 50g Mixed Berries, 15g Almonds',
  },
  {
    id: 'm-3',
    type: 'LUNCH',
    title: 'Lunch',
    mealNumber: 3,
    scheduledTime: '13:30',
    plannedGrams: 480,
    actualGrams: 0,
    plannedCals: 680,
    actualCals: 0,
    proteinGrams: 55,
    carbsGrams: 65,
    fatGrams: 18,
    status: 'UPCOMING',
    statusLabel: 'Planned',
    itemsSummary: '200g Grilled Chicken Breast, 160g Jasmine Rice, Steamed Broccoli',
  },
  {
    id: 'm-4',
    type: 'PRE_WORKOUT',
    title: 'Pre-Workout Fuel',
    mealNumber: 4,
    scheduledTime: '17:00',
    plannedGrams: 200,
    actualGrams: 0,
    plannedCals: 300,
    actualCals: 0,
    proteinGrams: 15,
    carbsGrams: 50,
    fatGrams: 3,
    status: 'UPCOMING',
    statusLabel: 'Planned',
    itemsSummary: '2 Rice Cakes with 1 Banana & 1 scoop Whey Protein',
  },
  {
    id: 'm-5',
    type: 'DINNER',
    title: 'Dinner',
    mealNumber: 5,
    scheduledTime: '20:30',
    plannedGrams: 420,
    actualGrams: 0,
    plannedCals: 580,
    actualCals: 0,
    proteinGrams: 48,
    carbsGrams: 45,
    fatGrams: 16,
    status: 'UPCOMING',
    statusLabel: 'Planned',
    itemsSummary: '180g Salmon / Lean Fish Fillet, 180g Roasted Sweet Potato, Green Salad',
  },
];

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Section 17 & 21: Dynamic Day-of-Week evaluation
  const todayDayOfWeek = getTodayDayOfWeek(DEFAULT_TIMEZONE);
  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [activeProgramId, setActiveProgramIdState] = useState<string>('prog_6_week_shredded_12w');
  const [activeProgramTitle, setActiveProgramTitle] = useState<string>('6 WEEK SHREDDED (12 WEEKS)');
  const [currentProgramWeek, setCurrentProgramWeek] = useState<number>(1);

  const getActiveSchedule = useCallback(
    (dow: number, programIdToUse?: string) => {
      const pid = programIdToUse || activeProgramId;
      return resolveScheduleForProgram(pid, dow);
    },
    [activeProgramId]
  );

  const todaySchedule = SHREDDED_WEEK_WORKOUT_SCHEDULE[todayDayOfWeek] || SHREDDED_WEEK_WORKOUT_SCHEDULE[1]!;

  const [workout, setWorkout] = useState<TodayWorkoutState>(() => ({
    id: `wo-day-${todayDayOfWeek}`,
    name: todaySchedule.name,
    category: todaySchedule.category,
    dayOfWeek: todayDayOfWeek,
    dayName: dayNames[todayDayOfWeek] || 'Today',
    isRestDay: todaySchedule.isRest,
    estimatedMinutes: todaySchedule.estimatedMinutes,
    totalExercises: todaySchedule.exercises.length,
    totalSets: todaySchedule.exercises.length * 3,
    targetVolumeKg: todaySchedule.isRest ? 0 : 7500,
    completedVolumeKg: 0,
    completedExercisesCount: 0,
    completedSetsCount: 0,
    status: todaySchedule.isRest ? 'REST_DAY' : 'NOT_STARTED',
    exercises: todaySchedule.exercises,
  }));

  const [nutrition, setNutrition] = useState<TodayNutritionState>(() => ({
    caloriesTarget: 2400,
    caloriesConsumed: 0,
    proteinTarget: 180,
    proteinConsumed: 0,
    carbsTarget: 245,
    carbsConsumed: 0,
    fatTarget: 63,
    fatConsumed: 0,
    meals: DEFAULT_5_MEALS,
  }));

  // Section 52: Activity starts with 0 fake steps unless device connected
  const [activity, setActivity] = useState<TodayActivityState>({
    steps: 0,
    stepsTarget: 10000,
    cardioSessionsCount: 0,
    waterLiters: 0,
    waterTarget: 3.5,
    isWearableConnected: false,
  });

  // Section 20: Real streak (0 = "Start your streak")
  const [streak, setStreak] = useState<{ days: number; label: string }>({
    days: 0,
    label: 'Start your streak',
  });

  const [weeklyMomentum, _setWeeklyMomentum] = useState<{
    days: MomentumDay[];
    completedCount: number;
    restCount: number;
    missedCount: number;
  }>(() => {
    const shortNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysList: MomentumDay[] = [];
    for (let d = 1; d <= 7; d++) {
      const isPast = d < todayDayOfWeek;
      const isToday = d === todayDayOfWeek;
      const sched = WEEK_WORKOUT_SCHEDULE[d];
      let status: MomentumDay['status'] = 'UPCOMING';
      let symbol = '○';
      let label = 'Upcoming';

      if (sched?.isRest) {
        status = 'REST';
        symbol = 'R';
        label = 'Rest';
      } else if (isPast) {
        status = 'COMPLETED';
        symbol = '✓';
        label = 'Completed';
      } else if (isToday) {
        status = 'UPCOMING';
        symbol = '●';
        label = 'Today';
      }

      daysList.push({
        day: shortNames[d] || `D${d}`,
        dayOfWeek: d,
        status,
        symbol,
        label,
      });
    }

    return {
      days: daysList,
      completedCount: Math.max(0, todayDayOfWeek - 1),
      restCount: 1,
      missedCount: 0,
    };
  });

  const [recentPerformance, _setRecentPerformance] = useState<RecentPerformanceState>({
    exercise: 'Barbell Bench Press',
    previous: '60 kg × 10 reps',
    latest: '60 kg × 12 reps',
    change: '+2 reps overload',
    hasImproved: true,
    hasHistory: true,
  });

  const [personalRecord, setPersonalRecord] = useState<PersonalRecordState | null>(null);

  const [recovery, setRecovery] = useState<RecoveryState>({
    isAvailable: false,
    sourceName: null,
    score: null,
    sleep: null,
    hrv: null,
    restingHr: null,
  });

  const [upNext, setUpNext] = useState<UpNextItem>({
    type: 'WORKOUT',
    title: todaySchedule.isRest ? 'Active Recovery Protocol' : todaySchedule.name,
    detail: todaySchedule.isRest ? 'Light mobility & hydration' : `${todaySchedule.exercises.length} prescribed exercises`,
    time: '18:00',
    isCompleted: false,
  });

  const [dailyNote, setDailyNote] = useState<string>('');

  const [monthlyJourney, setMonthlyJourney] = useState({
    workouts: 0,
    exercises: 0,
    prs: 0,
    consistencyRate: '0%',
  });

  // Load persistent stats on mount
  useEffect(() => {
    loadPersistentData();
  }, []);

  const loadPersistentData = async () => {
    try {
      // 1. Restore completed streak count
      const savedStreak = await SecureStorage.getItem('alpha_training_streak');
      if (savedStreak) {
        const count = parseInt(savedStreak, 10) || 0;
        setStreak({
          days: count,
          label: count > 0 ? `${count} DAY STREAK` : 'Start your streak',
        });
      }

      // 2. Restore hydration logged today
      const savedWater = await SecureStorage.getItem('alpha_water_liters');
      if (savedWater) {
        const w = parseFloat(savedWater) || 0;
        setActivity((prev) => ({ ...prev, waterLiters: w }));
      }

      // 3. Restore daily note
      const savedNote = await SecureStorage.getItem('alpha_daily_note');
      if (savedNote) setDailyNote(savedNote);

      // 3b. Restore active program selection
      const savedProgId = (await SecureStorage.getItem('gravity_active_program_id')) || (await SecureStorage.getItem('alpha_active_program_id'));
      if (savedProgId) {
        setActiveProgramIdState(savedProgId);
        const catalog: any = programCatalogData;
        const prog = (catalog.programs || []).find(
          (p: any) => p.id === savedProgId || p.slug === savedProgId || (p.name && p.name.toLowerCase() === savedProgId.toLowerCase())
        );
        if (savedProgId === 'prog_6_week_shredded_12w' || savedProgId === '6-week-shredded') {
          setActiveProgramTitle('6 WEEK SHREDDED (12 WEEKS)');
        } else if (prog && prog.name) {
          setActiveProgramTitle(prog.name);
        } else {
          setActiveProgramTitle('GRAVITY Training Program');
        }

        const restoredSched = resolveScheduleForProgram(savedProgId, todayDayOfWeek);
        setWorkout((prev) => ({
          ...prev,
          name: restoredSched.name,
          category: restoredSched.category,
          isRestDay: restoredSched.isRest,
          estimatedMinutes: restoredSched.estimatedMinutes,
          totalExercises: restoredSched.exercises.length,
          totalSets: restoredSched.exercises.length * 3,
          status: restoredSched.isRest ? 'REST_DAY' : 'NOT_STARTED',
          exercises: restoredSched.exercises,
        }));

        const restoredMeals = resolveMealsForProgram(savedProgId);
        const totalCals = restoredMeals.reduce((acc, m) => acc + (m.plannedCals || 0), 0);
        const totalP = restoredMeals.reduce((acc, m) => acc + (m.proteinGrams || 0), 0);
        const totalC = restoredMeals.reduce((acc, m) => acc + (m.carbsGrams || 0), 0);
        const totalF = restoredMeals.reduce((acc, m) => acc + (m.fatGrams || 0), 0);
        setNutrition((prev) => ({
          ...prev,
          meals: restoredMeals,
          caloriesTarget: totalCals > 0 ? totalCals : prev.caloriesTarget,
          proteinTarget: totalP > 0 ? totalP : prev.proteinTarget,
          carbsTarget: totalC > 0 ? totalC : prev.carbsTarget,
          fatTarget: totalF > 0 ? totalF : prev.fatTarget,
        }));
      }

      // 4. Fetch user's active program from backend if authenticated
      const res = await ApiClient.get<any>('/workouts/program/active');
      if (res.success && res.data && res.data.days) {
        const serverDays = res.data.days;
        const matchingDay = serverDays.find((d: any) => d.dayOfWeek === todayDayOfWeek);
        if (matchingDay && matchingDay.templates && matchingDay.templates.length > 0) {
          const tpl = matchingDay.templates[0];
          const exList: WorkoutExerciseSummary[] = (tpl.exercises || []).map((e: any, idx: number) => ({
            number: String(idx + 1).padStart(2, '0'),
            name: e.exerciseName,
            prescription: `${e.targetSets} sets · ${e.targetReps} reps`,
            isCompleted: false,
          }));

          setWorkout((prev) => ({
            ...prev,
            name: matchingDay.title || tpl.name,
            totalExercises: exList.length,
            totalSets: exList.length * 3,
            isRestDay: false,
            status: 'NOT_STARTED',
            exercises: exList,
          }));
        }
      }
    } catch {
      // Graceful offline fallback
    }
  };

  const selectWorkoutDay = useCallback(
    (dow: number) => {
      const sched = getActiveSchedule(dow);
      setWorkout((prev) => ({
        ...prev,
        id: `wo-day-${dow}`,
        dayOfWeek: dow,
        dayName: dayNames[dow] || 'Today',
        name: sched.name,
        category: sched.category,
        isRestDay: sched.isRest,
        estimatedMinutes: sched.estimatedMinutes,
        totalExercises: sched.exercises.length,
        totalSets: sched.exercises.length * 3,
        status: sched.isRest ? 'REST_DAY' : 'NOT_STARTED',
        exercises: sched.exercises,
      }));
    },
    [getActiveSchedule, dayNames]
  );

  const setActiveProgramId = (programId: string) => {
    setActiveProgramIdState(programId);
    const catalog: any = programCatalogData;
    const prog = (catalog.programs || []).find(
      (p: any) => p.id === programId || p.slug === programId || (p.name && p.name.toLowerCase() === programId.toLowerCase())
    );
    if (programId === 'prog_6_week_shredded_12w' || programId === '6-week-shredded') {
      setActiveProgramTitle('6 WEEK SHREDDED (12 WEEKS)');
    } else if (prog && prog.name) {
      setActiveProgramTitle(prog.name);
    } else {
      setActiveProgramTitle('GRAVITY Training Program');
    }

    SecureStorage.setItem('gravity_active_program_id', programId);
    SecureStorage.setItem('alpha_active_program_id', programId);

    const sched = resolveScheduleForProgram(programId, todayDayOfWeek);
    setWorkout((prev) => ({
      ...prev,
      name: sched.name,
      category: sched.category,
      isRestDay: sched.isRest,
      estimatedMinutes: sched.estimatedMinutes,
      totalExercises: sched.exercises.length,
      totalSets: sched.exercises.length * 3,
      status: sched.isRest ? 'REST_DAY' : 'NOT_STARTED',
      exercises: sched.exercises,
    }));

    const meals = resolveMealsForProgram(programId);
    const totalCals = meals.reduce((acc, m) => acc + (m.plannedCals || 0), 0);
    const totalP = meals.reduce((acc, m) => acc + (m.proteinGrams || 0), 0);
    const totalC = meals.reduce((acc, m) => acc + (m.carbsGrams || 0), 0);
    const totalF = meals.reduce((acc, m) => acc + (m.fatGrams || 0), 0);
    setNutrition((prev) => ({
      ...prev,
      meals,
      caloriesTarget: totalCals > 0 ? totalCals : prev.caloriesTarget,
      proteinTarget: totalP > 0 ? totalP : prev.proteinTarget,
      carbsTarget: totalC > 0 ? totalC : prev.carbsTarget,
      fatTarget: totalF > 0 ? totalF : prev.fatTarget,
    }));
  };

  const refreshDayState = useCallback(() => {
    const curDay = getTodayDayOfWeek(DEFAULT_TIMEZONE);
    const sched = getActiveSchedule(curDay);
    setWorkout((prev) => ({
      ...prev,
      dayOfWeek: curDay,
      dayName: dayNames[curDay] || 'Today',
      name: sched.name,
      category: sched.category,
      isRestDay: sched.isRest,
      status: sched.isRest ? 'REST_DAY' : 'NOT_STARTED',
      exercises: sched.exercises,
    }));
  }, [getActiveSchedule, dayNames]);

  const recordWorkoutCompletion = async (summary: {
    totalVolumeKg: number;
    totalSetsCompleted: number;
    totalRepsCompleted: number;
    exercisesCompletedCount: number;
    prsAchieved: string[];
    sessionTitle?: string;
  }) => {
    setWorkout((prev) => ({
      ...prev,
      completedVolumeKg: summary.totalVolumeKg,
      completedSetsCount: summary.totalSetsCompleted,
      completedExercisesCount: summary.exercisesCompletedCount,
      status: 'COMPLETED',
      exercises: prev.exercises.map((e) => ({ ...e, isCompleted: true })),
    }));

    // Increment streak
    const newStreakDays = streak.days + 1;
    const newStreak = {
      days: newStreakDays,
      label: `${newStreakDays} DAY STREAK`,
    };
    setStreak(newStreak);
    await SecureStorage.setItem('alpha_training_streak', String(newStreakDays));

    // Update monthly metrics
    setMonthlyJourney((prev) => ({
      ...prev,
      workouts: prev.workouts + 1,
      exercises: prev.exercises + summary.exercisesCompletedCount,
      prs: prev.prs + summary.prsAchieved.length,
      consistencyRate: `${Math.min(100, Math.round(((prev.workouts + 1) / 20) * 100))}%`,
    }));

    if (summary.prsAchieved.length > 0) {
      setPersonalRecord({
        exercise: summary.prsAchieved[0]!.split(':')[0] || 'Personal Record',
        record: summary.prsAchieved[0]!,
        isReal: true,
      });
    }

    // Clear active in-progress draft
    await SecureStorage.removeItem('alpha_active_workout_draft');
  };

  const addWater = async (liters: number) => {
    setActivity((prev) => {
      const nextLiters = Math.round((prev.waterLiters + liters) * 10) / 10;
      SecureStorage.setItem('alpha_water_liters', String(nextLiters));
      return { ...prev, waterLiters: nextLiters };
    });
  };

  const toggleUpNext = () => {
    setUpNext((prev) => ({ ...prev, isCompleted: !prev.isCompleted }));
  };

  const saveDailyNote = async (note: string) => {
    setDailyNote(note);
    await SecureStorage.setItem('alpha_daily_note', note);
  };

  const connectHealth = (sourceName: string) => {
    setRecovery({
      isAvailable: true,
      sourceName,
      score: 85,
      sleep: '7h 45m',
      hrv: '62 ms',
      restingHr: '54 bpm',
    });
    setActivity((prev) => ({ ...prev, isWearableConnected: true, steps: 5840 }));
  };

  const updateMealStatus = (
    mealType: string,
    actualCals: number,
    status: 'COMPLETED_PLANNED' | 'COMPLETED_MODIFIED' | 'PARTIAL' | 'SKIPPED' | 'UPCOMING',
    statusLabel?: string
  ) => {
    setNutrition((prev) => {
      let totalConsumed = 0;
      let totalProt = 0;
      let totalCarb = 0;
      let totalFat = 0;

      const updatedMeals = prev.meals.map((m) => {
        if (m.type === mealType) {
          const mCals = status === 'SKIPPED' ? 0 : actualCals > 0 ? actualCals : m.plannedCals;
          return {
            ...m,
            actualCals: mCals,
            status,
            statusLabel: statusLabel || (status === 'COMPLETED_PLANNED' ? 'Completed as planned' : status),
          };
        }
        return m;
      });

      updatedMeals.forEach((m) => {
        if (m.status.startsWith('COMPLETED')) {
          totalConsumed += m.actualCals;
          totalProt += m.proteinGrams;
          totalCarb += m.carbsGrams;
          totalFat += m.fatGrams;
        }
      });

      return {
        ...prev,
        caloriesConsumed: totalConsumed,
        proteinConsumed: totalProt,
        carbsConsumed: totalCarb,
        fatConsumed: totalFat,
        meals: updatedMeals,
      };
    });
  };

  return (
    <PerformanceContext.Provider
      value={{
        workout,
        nutrition,
        activity,
        streak,
        weeklyMomentum,
        recentPerformance,
        personalRecord,
        recovery,
        upNext,
        dailyNote,
        monthlyJourney,
        recordWorkoutCompletion,
        addWater,
        toggleUpNext,
        saveDailyNote,
        connectHealth,
        updateMealStatus,
        refreshDayState,
        activeProgramId,
        activeProgramTitle,
        currentProgramWeek,
        setActiveProgramId,
        setCurrentProgramWeek,
        selectWorkoutDay,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};
