import React, { createContext, useContext, useState } from 'react';

export interface WorkoutExerciseSummary {
  number: string;
  name: string;
  prescription: string;
  isCompleted: boolean;
}

export interface TodayWorkoutState {
  id: string;
  name: string;
  category: string;
  estimatedMinutes: number;
  totalExercises: number;
  totalSets: number;
  targetVolumeKg: number;
  completedVolumeKg: number;
  completedExercisesCount: number;
  completedSetsCount: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  exercises: WorkoutExerciseSummary[];
}

export interface MealRecord {
  id: string;
  type: 'BREAKFAST' | 'LUNCH' | 'PRE_WORKOUT' | 'DINNER';
  title: string;
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
}

export interface MomentumDay {
  day: string;
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
}

const INITIAL_WORKOUT: TodayWorkoutState = {
  id: 'wo-chest-triceps',
  name: 'Chest + Triceps',
  category: 'Hypertrophy',
  estimatedMinutes: 55,
  totalExercises: 6,
  totalSets: 18,
  targetVolumeKg: 8450,
  completedVolumeKg: 0,
  completedExercisesCount: 0,
  completedSetsCount: 0,
  status: 'NOT_STARTED',
  exercises: [
    { number: '01', name: 'Barbell Bench Press', prescription: '3 sets · 8–12 reps', isCompleted: false },
    { number: '02', name: 'Incline DB Press', prescription: '3 sets · 8–12 reps', isCompleted: false },
    { number: '03', name: 'Cable Fly', prescription: '3 sets · 10–15 reps', isCompleted: false },
    { number: '04', name: 'Barbell Skull Crushers', prescription: '3 sets · 10–12 reps', isCompleted: false },
    { number: '05', name: 'Overhead Tricep Extension', prescription: '3 sets · 12–15 reps', isCompleted: false },
    { number: '06', name: 'Close Grip Pushups', prescription: '3 sets · To Failure', isCompleted: false },
  ],
};

const INITIAL_NUTRITION: TodayNutritionState = {
  caloriesTarget: 2600,
  caloriesConsumed: 1950,
  proteinTarget: 160,
  proteinConsumed: 142,
  carbsTarget: 280,
  carbsConsumed: 190,
  fatTarget: 70,
  fatConsumed: 52,
  meals: [
    {
      id: 'm-1',
      type: 'BREAKFAST',
      title: 'Breakfast',
      plannedGrams: 310,
      actualGrams: 310,
      plannedCals: 627,
      actualCals: 627,
      proteinGrams: 42,
      carbsGrams: 55,
      fatGrams: 25,
      status: 'COMPLETED_PLANNED',
      statusLabel: 'Completed as planned',
      itemsSummary: '4 Whole Eggs, 80g Rolled Oats, 30g Whey Isolate',
    },
    {
      id: 'm-2',
      type: 'LUNCH',
      title: 'Lunch',
      plannedGrams: 470,
      actualGrams: 460,
      plannedCals: 670,
      actualCals: 645,
      proteinGrams: 58,
      carbsGrams: 52,
      fatGrams: 16,
      status: 'COMPLETED_MODIFIED',
      statusLabel: 'Modified (180g Chicken vs 200g)',
      itemsSummary: '180g Chicken Breast, 160g Jasmine Rice, Broccoli',
    },
    {
      id: 'm-3',
      type: 'PRE_WORKOUT',
      title: 'Pre-Workout',
      plannedGrams: 250,
      actualGrams: 0,
      plannedCals: 320,
      actualCals: 0,
      proteinGrams: 22,
      carbsGrams: 40,
      fatGrams: 2,
      status: 'UPCOMING',
      statusLabel: 'Upcoming',
      itemsSummary: 'Greek Yogurt 0%, Blueberries, Rice Cakes',
    },
    {
      id: 'm-4',
      type: 'DINNER',
      title: 'Dinner',
      plannedGrams: 430,
      actualGrams: 0,
      plannedCals: 530,
      actualCals: 0,
      proteinGrams: 38,
      carbsGrams: 43,
      fatGrams: 14,
      status: 'UPCOMING',
      statusLabel: 'Upcoming',
      itemsSummary: 'Wild Salmon Fillet, Sweet Potato, Asparagus',
    },
  ],
};

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workout, setWorkout] = useState<TodayWorkoutState>(INITIAL_WORKOUT);
  const [nutrition, setNutrition] = useState<TodayNutritionState>(INITIAL_NUTRITION);
  const [activity, setActivity] = useState<TodayActivityState>({
    steps: 7420,
    stepsTarget: 10000,
    cardioSessionsCount: 0,
    waterLiters: 2.6,
    waterTarget: 3.5,
  });

  const [streak] = useState({
    days: 5,
    label: '5 DAY TRAINING STREAK',
  });

  const [weeklyMomentum] = useState({
    days: [
      { day: 'MON', status: 'COMPLETED' as const, symbol: '✓', label: 'Completed' },
      { day: 'TUE', status: 'COMPLETED' as const, symbol: '✓', label: 'Completed' },
      { day: 'WED', status: 'REST' as const, symbol: 'R', label: 'Rest Day' },
      { day: 'THU', status: 'COMPLETED' as const, symbol: '✓', label: 'Completed' },
      { day: 'FRI', status: 'MISSED' as const, symbol: '✕', label: 'Missed' },
      { day: 'SAT', status: 'COMPLETED' as const, symbol: '✓', label: 'Completed' },
      { day: 'SUN', status: 'UPCOMING' as const, symbol: '○', label: 'Upcoming' },
    ],
    completedCount: 4,
    restCount: 1,
    missedCount: 1,
  });

  const [recentPerformance, setRecentPerformance] = useState<RecentPerformanceState>({
    exercise: 'Barbell Bench Press',
    previous: '60.0 KG × 10',
    latest: '60.0 KG × 12',
    change: '+2 reps',
    hasImproved: true,
    hasHistory: true,
  });

  const [personalRecord, setPersonalRecord] = useState<PersonalRecordState | null>({
    exercise: 'Barbell Bench Press',
    record: '65.0 KG × 8',
    isReal: true,
  });

  // Source-aware recovery telemetry (defaults to unavailable if no health source)
  const [recovery, setRecovery] = useState<RecoveryState>({
    isAvailable: false,
    sourceName: null,
    score: null,
    sleep: null,
    hrv: null,
    restingHr: null,
  });

  const [upNext, setUpNext] = useState<UpNextItem>({
    type: 'SUPPLEMENT',
    title: 'Creatine Monohydrate',
    detail: '1 serving (5g) with water',
    time: '8:00 PM',
    isCompleted: false,
  });

  const [dailyNote, setDailyNote] = useState<string>('Slight lower back stiffness from Thursday deadlifts. Kept leg drive controlled.');

  const [monthlyJourney] = useState({
    workouts: 12,
    exercises: 36,
    prs: 4,
    consistencyRate: '87%',
  });

  const recordWorkoutCompletion = (summary: {
    totalVolumeKg: number;
    totalSetsCompleted: number;
    totalRepsCompleted: number;
    exercisesCompletedCount: number;
    prsAchieved: string[];
  }) => {
    setWorkout((prev) => ({
      ...prev,
      status: 'COMPLETED',
      completedVolumeKg: summary.totalVolumeKg,
      completedExercisesCount: summary.exercisesCompletedCount,
      completedSetsCount: summary.totalSetsCompleted,
      exercises: prev.exercises.map((ex, idx) => ({
        ...ex,
        isCompleted: idx < summary.exercisesCompletedCount,
      })),
    }));

    if (summary.prsAchieved && summary.prsAchieved.length > 0) {
      setPersonalRecord({
        exercise: summary.prsAchieved[0]!.split(':')[0] || 'Chest Push',
        record: summary.prsAchieved[0]!,
        isReal: true,
      });
      setRecentPerformance((prev) => ({
        ...prev,
        hasImproved: true,
      }));
    }
  };

  const addWater = (liters: number) => {
    setActivity((prev) => ({
      ...prev,
      waterLiters: Math.min(Number((prev.waterLiters + liters).toFixed(1)), 8),
    }));
  };

  const toggleUpNext = () => {
    setUpNext((prev) => ({ ...prev, isCompleted: !prev.isCompleted }));
  };

  const saveDailyNote = (note: string) => {
    setDailyNote(note);
  };

  const connectHealth = (sourceName: string) => {
    setRecovery({
      isAvailable: true,
      sourceName,
      score: 88,
      sleep: '7h 45m',
      hrv: '58 ms',
      restingHr: '52 bpm',
    });
  };

  const updateMealStatus = (
    mealType: string,
    actualCals: number,
    status: 'COMPLETED_PLANNED' | 'COMPLETED_MODIFIED' | 'PARTIAL' | 'SKIPPED' | 'UPCOMING',
    statusLabel?: string
  ) => {
    setNutrition((prev) => {
      const updatedMeals = prev.meals.map((m) =>
        m.type === mealType
          ? {
              ...m,
              actualCals,
              status,
              statusLabel: statusLabel || status.replace('_', ' '),
            }
          : m
      );
      const totalCals = updatedMeals.reduce(
        (sum, m) => sum + (m.status.startsWith('COMPLETED') ? m.actualCals : 0),
        0
      );
      return {
        ...prev,
        meals: updatedMeals,
        caloriesConsumed: totalCals,
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
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = (): PerformanceContextType => {
  const ctx = useContext(PerformanceContext);
  if (!ctx) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return ctx;
};
