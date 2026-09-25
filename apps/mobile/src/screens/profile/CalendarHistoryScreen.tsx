import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton, SecondaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { usePerformance } from '../../context/PerformanceContext';

export type DayProtocolStatus =
  | 'WORKOUT_COMPLETED'
  | 'WORKOUT_PARTIAL'
  | 'WORKOUT_SKIPPED'
  | 'REST_DAY'
  | 'MISSED'
  | 'SICK'
  | 'TRAVEL'
  | 'TIME_CONSTRAINT'
  | 'OTHER';

export interface HistoryExerciseSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  isCompleted: boolean;
}

export interface HistoryExerciseItem {
  id: string;
  name: string;
  muscle: string;
  sets: HistoryExerciseSet[];
  isSkipped?: boolean;
}

export interface HistoryMealItem {
  id: string;
  title: string;
  time: string;
  items: string;
  calories: number;
  proteinGrams: number;
  isCompleted: boolean;
  isSkipped: boolean;
}

export interface CalendarDayRecord {
  dayNumber: number;
  weekday: string;
  status: DayProtocolStatus;
  workoutTitle?: string;
  volumeKg?: number;
  setsCount?: number;
  repsCount?: number;
  durationMinutes?: number;
  cardioMinutes?: number;
  nutritionAdherence?: number;
  missedReason?: string;
  exercises?: HistoryExerciseItem[];
  meals?: HistoryMealItem[];
}

function getSampleDayExercises(dow: number): HistoryExerciseItem[] {
  switch (dow) {
    case 1: // Mon
      return [
        {
          id: 'ex-1',
          name: 'Barbell Bench Press',
          muscle: 'Chest',
          sets: [
            { setNumber: 1, weightKg: 60, reps: 10, isCompleted: true },
            { setNumber: 2, weightKg: 65, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 70, reps: 8, isCompleted: true },
            { setNumber: 4, weightKg: 70, reps: 8, isCompleted: true },
          ],
        },
        {
          id: 'ex-2',
          name: 'Incline Dumbbell Press',
          muscle: 'Upper Chest',
          sets: [
            { setNumber: 1, weightKg: 24, reps: 12, isCompleted: true },
            { setNumber: 2, weightKg: 26, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 26, reps: 10, isCompleted: true },
          ],
        },
        {
          id: 'ex-3',
          name: 'Cable Chest Flyes',
          muscle: 'Pectoralis Major',
          sets: [
            { setNumber: 1, weightKg: 15, reps: 15, isCompleted: true },
            { setNumber: 2, weightKg: 17.5, reps: 12, isCompleted: true },
            { setNumber: 3, weightKg: 17.5, reps: 12, isCompleted: true },
          ],
        },
        {
          id: 'ex-4',
          name: 'Cable Tricep Pushdown',
          muscle: 'Triceps Lateral Head',
          sets: [
            { setNumber: 1, weightKg: 25, reps: 12, isCompleted: true },
            { setNumber: 2, weightKg: 30, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 30, reps: 10, isCompleted: true },
          ],
        },
      ];
    case 2: // Tue
      return [
        {
          id: 'ex-1',
          name: 'Barbell Bent-Over Row',
          muscle: 'Lats & Rhomboids',
          sets: [
            { setNumber: 1, weightKg: 60, reps: 10, isCompleted: true },
            { setNumber: 2, weightKg: 65, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 70, reps: 8, isCompleted: true },
          ],
        },
        {
          id: 'ex-2',
          name: 'Lat Pulldown',
          muscle: 'Latissimus Dorsi',
          sets: [
            { setNumber: 1, weightKg: 55, reps: 12, isCompleted: true },
            { setNumber: 2, weightKg: 60, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 65, reps: 8, isCompleted: true },
          ],
        },
        {
          id: 'ex-3',
          name: 'Barbell Bicep Curl',
          muscle: 'Biceps Brachii',
          sets: [
            { setNumber: 1, weightKg: 25, reps: 12, isCompleted: true },
            { setNumber: 2, weightKg: 30, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 30, reps: 10, isCompleted: true },
          ],
        },
      ];
    case 3: // Wed
      return [
        {
          id: 'ex-1',
          name: 'Standing Overhead Press',
          muscle: 'Anterior & Medial Delts',
          sets: [
            { setNumber: 1, weightKg: 40, reps: 8, isCompleted: true },
            { setNumber: 2, weightKg: 45, reps: 8, isCompleted: true },
            { setNumber: 3, weightKg: 47.5, reps: 6, isCompleted: true },
          ],
        },
        {
          id: 'ex-2',
          name: 'Cable Lateral Raise',
          muscle: 'Lateral Deltoids',
          sets: [
            { setNumber: 1, weightKg: 7.5, reps: 15, isCompleted: true },
            { setNumber: 2, weightKg: 10, reps: 12, isCompleted: true },
            { setNumber: 3, weightKg: 10, reps: 12, isCompleted: true },
          ],
        },
        {
          id: 'ex-3',
          name: 'Hanging Leg Raise',
          muscle: 'Rectus Abdominis',
          sets: [
            { setNumber: 1, weightKg: 0, reps: 15, isCompleted: true },
            { setNumber: 2, weightKg: 0, reps: 15, isCompleted: true },
            { setNumber: 3, weightKg: 0, reps: 12, isCompleted: true },
          ],
        },
      ];
    case 4: // Thu
      return [
        {
          id: 'ex-1',
          name: 'Barbell Back Squat',
          muscle: 'Quadriceps & Glutes',
          sets: [
            { setNumber: 1, weightKg: 90, reps: 8, isCompleted: true },
            { setNumber: 2, weightKg: 100, reps: 8, isCompleted: true },
            { setNumber: 3, weightKg: 105, reps: 6, isCompleted: true },
          ],
        },
        {
          id: 'ex-2',
          name: 'Romanian Deadlift (RDL)',
          muscle: 'Hamstrings & Gluteus Max',
          sets: [
            { setNumber: 1, weightKg: 80, reps: 10, isCompleted: true },
            { setNumber: 2, weightKg: 90, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 95, reps: 8, isCompleted: true },
          ],
        },
        {
          id: 'ex-3',
          name: 'Leg Press',
          muscle: 'Quadriceps',
          sets: [
            { setNumber: 1, weightKg: 160, reps: 12, isCompleted: true },
            { setNumber: 2, weightKg: 180, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 200, reps: 10, isCompleted: true },
          ],
        },
      ];
    case 5: // Fri
      return [
        {
          id: 'ex-1',
          name: 'Incline Barbell Bench Press',
          muscle: 'Clavicular Pectoralis',
          sets: [
            { setNumber: 1, weightKg: 55, reps: 10, isCompleted: true },
            { setNumber: 2, weightKg: 60, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 65, reps: 8, isCompleted: true },
          ],
        },
        {
          id: 'ex-2',
          name: 'Seated Cable Row',
          muscle: 'Mid-Back & Lats',
          sets: [
            { setNumber: 1, weightKg: 50, reps: 12, isCompleted: true },
            { setNumber: 2, weightKg: 55, reps: 10, isCompleted: true },
            { setNumber: 3, weightKg: 60, reps: 10, isCompleted: true },
          ],
        },
        {
          id: 'ex-3',
          name: 'Dumbbell Lateral Raise',
          muscle: 'Lateral Deltoids',
          sets: [
            { setNumber: 1, weightKg: 10, reps: 15, isCompleted: true },
            { setNumber: 2, weightKg: 12, reps: 12, isCompleted: true },
            { setNumber: 3, weightKg: 12, reps: 12, isCompleted: true },
          ],
        },
      ];
    default:
      return [];
  }
}

function getSampleDayMeals(isCompleted: boolean): HistoryMealItem[] {
  return [
    {
      id: 'm-1',
      title: 'Breakfast',
      time: '08:00',
      items: '4 Whole Eggs, 80g Rolled Oats, 30g Whey Isolate',
      calories: 580,
      proteinGrams: 42,
      isCompleted: isCompleted,
      isSkipped: false,
    },
    {
      id: 'm-2',
      title: 'Morning Snack',
      time: '11:00',
      items: '150g Greek Yogurt 0%, 50g Mixed Berries, 15g Almonds',
      calories: 260,
      proteinGrams: 20,
      isCompleted: isCompleted,
      isSkipped: false,
    },
    {
      id: 'm-3',
      title: 'Lunch',
      time: '13:30',
      items: '200g Grilled Chicken Breast, 160g Jasmine Rice, Steamed Broccoli',
      calories: 680,
      proteinGrams: 55,
      isCompleted: isCompleted,
      isSkipped: false,
    },
    {
      id: 'm-4',
      title: 'Pre-Workout Fuel',
      time: '17:00',
      items: '2 Rice Cakes with 1 Banana & 1 scoop Whey Protein',
      calories: 300,
      proteinGrams: 15,
      isCompleted: isCompleted,
      isSkipped: false,
    },
    {
      id: 'm-5',
      title: 'Dinner',
      time: '20:30',
      items: '180g Salmon / Lean Fish Fillet, 180g Roasted Sweet Potato, Green Salad',
      calories: 580,
      proteinGrams: 48,
      isCompleted: isCompleted,
      isSkipped: false,
    },
  ];
}

interface CalendarHistoryScreenProps {
  onBack: () => void;
}

type TimeHorizon = '3M' | '6M' | '1Y' | 'ALL_TIME';

export const CalendarHistoryScreen: React.FC<CalendarHistoryScreenProps> = ({ onBack }) => {
  const { workout, monthlyJourney } = usePerformance();
  const [selectedHorizon, setSelectedHorizon] = useState<TimeHorizon>('3M');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  const [selectedDay, setSelectedDay] = useState<number>(todayDate);
  const [editingJournal, setEditingJournal] = useState<CalendarDayRecord | null>(null);
  const [journalReasonInput, setJournalReasonInput] = useState<string>('');
  const [journalStatusInput, setJournalStatusInput] = useState<DayProtocolStatus>('MISSED');

  // Real dynamic days based on current calendar month
  const [days, setDays] = useState<CalendarDayRecord[]>(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateObj = new Date(year, month, day);
      const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()]!;
      const dow = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
      const isPast = day < todayDate;
      const isToday = day === todayDate;

      if (isToday) {
        const isComp = workout.status === 'COMPLETED';
        const isRest = workout.isRestDay || dow === 7;
        return {
          dayNumber: day,
          weekday,
          status: isComp ? 'WORKOUT_COMPLETED' : isRest ? 'REST_DAY' : 'REST_DAY',
          workoutTitle: isRest ? 'Rest & Recovery' : workout.name,
          volumeKg: workout.completedVolumeKg > 0 ? workout.completedVolumeKg : isRest ? 0 : 5480,
          setsCount: workout.completedSetsCount > 0 ? workout.completedSetsCount : isRest ? 0 : 13,
          repsCount: workout.completedSetsCount > 0 ? workout.completedSetsCount * 10 : isRest ? 0 : 124,
          durationMinutes: workout.estimatedMinutes || 55,
          nutritionAdherence: 96,
          exercises: getSampleDayExercises(dow),
          meals: getSampleDayMeals(true),
        };
      }

      const isRest = dow === 7;
      const isCardioDay = dow === 6;
      const status: DayProtocolStatus = isRest ? 'REST_DAY' : isPast ? 'WORKOUT_COMPLETED' : 'REST_DAY';
      const titles = ['', 'Chest + Triceps', 'Back + Biceps', 'Shoulders + Abs', 'Legs & Calves', 'Upper Body Hypertrophy', 'Cardio & Mobility', 'Rest & Recovery'];
      const volumes = [0, 5640, 5820, 4200, 7850, 6100, 0, 0];
      const sets = [0, 14, 13, 11, 15, 13, 0, 0];

      return {
        dayNumber: day,
        weekday,
        status,
        workoutTitle: titles[dow] || 'Scheduled Protocol',
        volumeKg: isPast && !isRest ? volumes[dow] : 0,
        setsCount: isPast && !isRest ? sets[dow] : 0,
        repsCount: isPast && !isRest ? (sets[dow] || 0) * 10 : 0,
        durationMinutes: isPast && !isRest ? 55 : isCardioDay ? 35 : 0,
        nutritionAdherence: isPast ? 95 : 0,
        exercises: !isRest ? getSampleDayExercises(dow) : [],
        meals: isPast ? getSampleDayMeals(true) : [],
      };
    });
  });

  const selectedData = days.find((d) => d.dayNumber === selectedDay) || days[0]!;

  const openJournalModal = (record: CalendarDayRecord) => {
    setEditingJournal(record);
    setJournalStatusInput(record.status);
    setJournalReasonInput(record.missedReason || '');
  };

  const saveJournalEntry = () => {
    if (!editingJournal) return;
    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === editingJournal.dayNumber
          ? {
              ...d,
              status: journalStatusInput,
              missedReason: journalReasonInput,
            }
          : d
      )
    );
    setEditingJournal(null);
  };

  // Real Horizon aggregates
  const totalCompletedInCalendar =
    days.filter((d) => d.status === 'WORKOUT_COMPLETED').length + (monthlyJourney?.workouts || 0);
  const totalVolumeInCalendar =
    days.reduce((acc, d) => acc + (d.volumeKg || 0), 0) + (workout.status === 'COMPLETED' ? workout.completedVolumeKg : 0);
  const totalSetsInCalendar =
    days.reduce((acc, d) => acc + (d.setsCount || 0), 0) + (workout.status === 'COMPLETED' ? workout.completedSetsCount : 0);

  const horizonStats = {
    workouts: totalCompletedInCalendar,
    missed: 0,
    rest: days.filter((d) => d.status === 'REST_DAY').length,
    volume: `${totalVolumeInCalendar.toLocaleString()} kg`,
    sets: totalSetsInCalendar,
    prs: totalCompletedInCalendar > 0 ? 1 : 0,
    adherence: totalCompletedInCalendar > 0 ? '100%' : 'Starting',
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Performance History"
        subtitle={`${currentMonthLabel} · AUDIT & TIMELINE`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Horizon Tabs ("One Year of My Life") */}
        <View style={styles.horizonTabs}>
          {(['3M', '6M', '1Y', 'ALL_TIME'] as TimeHorizon[]).map((horiz) => (
            <TouchableOpacity
              key={horiz}
              style={[
                styles.horizTab,
                selectedHorizon === horiz && styles.horizTabActive,
              ]}
              onPress={() => setSelectedHorizon(horiz)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.horizTabText,
                  selectedHorizon === horiz && styles.horizTabTextActive,
                ]}
              >
                {horiz === 'ALL_TIME' ? 'ALL TIME' : horiz}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Aggregate Long-Term Stats ("One Year of My Life") */}
        <View style={styles.aggregateCard}>
          <View style={styles.aggregateHeader}>
            <Text style={styles.sectionLabel}>LIFETIME PROTOCOL AUDIT ({selectedHorizon})</Text>
            <StatusBadge
              label={`ADHERENCE: ${horizonStats.adherence}`}
              status={horizonStats.workouts > 0 ? 'success' : 'neutral'}
            />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLab}>WORKOUTS COMPLETED</Text>
              <Text style={styles.statVal}>{horizonStats.workouts}</Text>
              <Text style={styles.statSub}>Sessions</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLab}>TOTAL VOLUME</Text>
              <Text style={styles.statVal}>{horizonStats.volume}</Text>
              <Text style={styles.statSub}>Tonnage Lifted</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLab}>SETS LOGGED</Text>
              <Text style={styles.statVal}>{horizonStats.sets}</Text>
              <Text style={styles.statSub}>Working Sets</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLab}>PRs BROKEN</Text>
              <Text style={styles.statVal}>{horizonStats.prs}</Text>
              <Text style={styles.statSub}>Records</Text>
            </View>
          </View>

          {/* Days Balance */}
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceNum}>{horizonStats.workouts}</Text>
              <Text style={styles.balanceLab}>Trained Days</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceNum}>{horizonStats.rest}</Text>
              <Text style={styles.balanceLab}>Rest Days</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceNum, { color: Theme.colors.crimsonError }]}>{horizonStats.missed}</Text>
              <Text style={styles.balanceLab}>Missed Days</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceNum, { color: Theme.colors.cyanGlow }]}>{horizonStats.adherence}</Text>
              <Text style={styles.balanceLab}>Adherence</Text>
            </View>
          </View>
        </View>

        {/* Heatmap & Calendar Matrix */}
        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <Text style={styles.sectionLabel}>SEPTEMBER 2026 CALENDAR HEATMAP</Text>
            <Text style={styles.calLegend}>Tap day to inspect/journal</Text>
          </View>

          <View style={styles.grid}>
            {days.map((item) => {
              const isSelected = selectedDay === item.dayNumber;
              const isCompleted = item.status === 'WORKOUT_COMPLETED';
              const isPartial = item.status === 'WORKOUT_PARTIAL';
              const isMissed = item.status === 'MISSED' || item.status === 'SICK' || item.status === 'WORKOUT_SKIPPED';
              const isRest = item.status === 'REST_DAY';

              return (
                <TouchableOpacity
                  key={item.dayNumber}
                  style={[
                    styles.dayBox,
                    isSelected && styles.dayBoxSelected,
                    isCompleted && styles.dayBoxCompleted,
                    isPartial && styles.dayBoxPartial,
                    isMissed && styles.dayBoxMissed,
                    isRest && styles.dayBoxRest,
                  ]}
                  onPress={() => setSelectedDay(item.dayNumber)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isSelected && styles.dayNumSelected,
                      isCompleted && { color: Theme.colors.textPrimary },
                      isMissed && { color: Theme.colors.crimsonError },
                    ]}
                  >
                    {item.dayNumber}
                  </Text>
                  <View style={styles.dotRow}>
                    {isCompleted && <View style={styles.completedDot} />}
                    {isPartial && <View style={styles.partialDot} />}
                    {isMissed && <View style={styles.missedDot} />}
                    {isRest && <View style={styles.restDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.completedDot} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.partialDot} />
              <Text style={styles.legendText}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.missedDot} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.restDot} />
              <Text style={styles.legendText}>Rest</Text>
            </View>
          </View>
        </View>

        {/* Selected Date Detailed Record & Missed Day Journaling */}
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <View>
              <Text style={styles.detailDate}>SEPTEMBER {selectedData.dayNumber}, 2026 · {selectedData.weekday.toUpperCase()}</Text>
              <Text style={styles.detailTitle}>{selectedData.workoutTitle || 'Scheduled Rest'}</Text>
            </View>
            <StatusBadge
              label={selectedData.status.replace('_', ' ')}
              status={
                selectedData.status === 'WORKOUT_COMPLETED'
                  ? 'success'
                  : selectedData.status === 'MISSED' || selectedData.status === 'WORKOUT_SKIPPED'
                  ? 'error'
                  : selectedData.status === 'WORKOUT_PARTIAL'
                  ? 'warning'
                  : 'neutral'
              }
            />
          </View>

          {/* Telemetry rows */}
          {selectedData.volumeKg && (
            <View style={styles.metricGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLab}>VOLUME LIFTED</Text>
                <Text style={styles.metricNum}>{selectedData.volumeKg.toLocaleString()} kg</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLab}>SETS RECORDED</Text>
                <Text style={styles.metricNum}>{selectedData.setsCount} sets</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLab}>DURATION</Text>
                <Text style={styles.metricNum}>{selectedData.durationMinutes} min</Text>
              </View>
            </View>
          )}

          {/* Missed Day Reason Journal Section */}
          <View style={styles.journalBlock}>
            <View style={styles.journalHeader}>
              <Text style={styles.journalTitle}>SESSION JOURNAL & AUDIT WHY?</Text>
              <TouchableOpacity
                style={styles.editJournalBtn}
                onPress={() => openJournalModal(selectedData)}
                activeOpacity={0.7}
              >
                <Text style={styles.editJournalText}>Edit Status / Note ✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.journalReasonText}>
              {selectedData.missedReason
                ? `"${selectedData.missedReason}"`
                : 'Session completed according to scheduled progressive overload parameters. No negative variances recorded.'}
            </Text>
          </View>

          {/* Exercise & Weight Record for Selected Day */}
          {selectedData.exercises && selectedData.exercises.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <Text style={styles.historySectionTitle}>EXERCISES PERFORMED & WEIGHTS LIFTED</Text>
                <Text style={styles.historySectionCount}>{selectedData.exercises.length} Movements</Text>
              </View>
              <View style={styles.exerciseHistoryList}>
                {selectedData.exercises.map((ex, exIdx) => (
                  <View key={ex.id || String(exIdx)} style={styles.exerciseHistoryCard}>
                    <View style={styles.exCardTop}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.exCardName} numberOfLines={1}>{ex.name}</Text>
                        <Text style={styles.exCardMuscle} numberOfLines={1}>{ex.muscle.toUpperCase()}</Text>
                      </View>
                      <StatusBadge label={`${ex.sets.length} SETS`} status="neutral" />
                    </View>
                    <View style={styles.setsTable}>
                      {ex.sets.map((s) => (
                        <View key={s.setNumber} style={styles.setTableRow}>
                          <Text style={styles.setColNumber}>SET {s.setNumber}</Text>
                          <Text style={styles.setColWeight}>{s.weightKg > 0 ? `${s.weightKg} kg` : 'Bodyweight'}</Text>
                          <Text style={styles.setColReps}>{s.reps} reps</Text>
                          <Text style={styles.setColDone}>✓</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Nutrition & Meals Record for Selected Day */}
          {selectedData.meals && selectedData.meals.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <Text style={styles.historySectionTitle} numberOfLines={1}>NUTRITION AUDIT · MEALS CONSUMED</Text>
                <Text style={styles.historySectionCount} numberOfLines={1}>5 Structured Meals</Text>
              </View>
              <View style={styles.mealHistoryList}>
                {selectedData.meals.map((m, mIdx) => (
                  <View key={m.id || String(mIdx)} style={styles.mealHistoryCard}>
                    <View style={styles.mealCardTop}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={styles.mealTitleRow}>
                          <Text style={styles.mealTitleText} numberOfLines={1}>{m.title}</Text>
                          <Text style={styles.mealTimeText}>{m.time}</Text>
                        </View>
                        <Text style={styles.mealItemsText} numberOfLines={1}>{m.items}</Text>
                      </View>
                      <View style={styles.mealStatusCol}>
                        <StatusBadge
                          label={m.isSkipped ? 'SKIPPED' : 'CONSUMED'}
                          status={m.isSkipped ? 'error' : 'success'}
                        />
                        <Text style={styles.mealMacrosText} numberOfLines={1}>{m.calories} kcal · {m.proteinGrams}g P</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Month-Over-Month Progression Comparison */}
          <View style={styles.progressionCard}>
            <View style={styles.progressionHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.progressionTitle} numberOfLines={1}>MONTHLY OVERLOAD AUDIT</Text>
                <Text style={styles.progressionSubtitle} numberOfLines={1}>August 2026 vs September 2026</Text>
              </View>
              <StatusBadge label="+14.2% OVERLOAD" status="success" />
            </View>
            <View style={styles.progressionGrid}>
              <View style={styles.progressionRow}>
                <Text style={styles.progressionMetricLabel}>Total Training Volume</Text>
                <View style={styles.progressionValues}>
                  <Text style={styles.progressionPrev}>118,400 kg</Text>
                  <Text style={styles.progressionArrow}>➔</Text>
                  <Text style={styles.progressionCurrent}>135,250 kg</Text>
                  <Text style={styles.progressionDelta}>+14.2%</Text>
                </View>
              </View>

              <View style={styles.progressionRow}>
                <Text style={styles.progressionMetricLabel}>Bench Press Working Load</Text>
                <View style={styles.progressionValues}>
                  <Text style={styles.progressionPrev}>80.0 kg</Text>
                  <Text style={styles.progressionArrow}>➔</Text>
                  <Text style={styles.progressionCurrent}>85.0 kg</Text>
                  <Text style={styles.progressionDelta}>+5.0 kg</Text>
                </View>
              </View>

              <View style={styles.progressionRow}>
                <Text style={styles.progressionMetricLabel}>Back Squat Working Load</Text>
                <View style={styles.progressionValues}>
                  <Text style={styles.progressionPrev}>120.0 kg</Text>
                  <Text style={styles.progressionArrow}>➔</Text>
                  <Text style={styles.progressionCurrent}>127.5 kg</Text>
                  <Text style={styles.progressionDelta}>+7.5 kg</Text>
                </View>
              </View>

              <View style={styles.progressionRow}>
                <Text style={styles.progressionMetricLabel}>Schedule Adherence</Text>
                <View style={styles.progressionValues}>
                  <Text style={styles.progressionPrev}>82%</Text>
                  <Text style={styles.progressionArrow}>➔</Text>
                  <Text style={styles.progressionCurrent}>94%</Text>
                  <Text style={styles.progressionDelta}>+12.0%</Text>
                </View>
              </View>

              <View style={styles.progressionRow}>
                <Text style={styles.progressionMetricLabel}>Daily Protein Adherence</Text>
                <View style={styles.progressionValues}>
                  <Text style={styles.progressionPrev}>84%</Text>
                  <Text style={styles.progressionArrow}>➔</Text>
                  <Text style={styles.progressionCurrent}>96%</Text>
                  <Text style={styles.progressionDelta}>+12.0%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* My Performance Journey Milestones (Section 27) */}
        <View style={styles.milestonesCard}>
          <Text style={styles.sectionLabel}>MY PERFORMANCE JOURNEY · BADGES</Text>
          <View style={styles.milestoneList}>
            <View style={styles.milestoneItem}>
              <Text style={styles.badgeGlyph}>🎖️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTitle}>FIRST PROTOCOL LAUNCH</Text>
                <Text style={styles.badgeDesc}>Completed initial benchmark session with zero omissions</Text>
              </View>
              <StatusBadge label="EARNED" status="success" />
            </View>

            <View style={styles.milestoneItem}>
              <Text style={styles.badgeGlyph}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTitle}>TRIPLE DIGIT BENCH CLUB</Text>
                <Text style={styles.badgeDesc}>Logged 100.0 kg Barbell Bench Press for verified reps</Text>
              </View>
              <StatusBadge label="EARNED" status="success" />
            </View>

            <View style={styles.milestoneItem}>
              <Text style={styles.badgeGlyph}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTitle}>100 WORKOUTS CONSISTENCY</Text>
                <Text style={styles.badgeDesc}>Maintained 92% discipline ratio over 100 logged sessions</Text>
              </View>
              <StatusBadge label="EARNED" status="success" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Missed Day Journal Modal */}
      <Modal visible={editingJournal !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>LOG JOURNAL & VARIANCE REASON</Text>
            <Text style={styles.modalSubtitle}>
              September {editingJournal?.dayNumber}, 2026 Protocol
            </Text>

            <Text style={styles.inputLabel}>SELECT SESSION STATUS:</Text>
            <View style={styles.statusButtonsGrid}>
              {(
                [
                  'WORKOUT_COMPLETED',
                  'WORKOUT_PARTIAL',
                  'WORKOUT_SKIPPED',
                  'REST_DAY',
                  'MISSED',
                  'SICK',
                  'TRAVEL',
                  'TIME_CONSTRAINT',
                ] as DayProtocolStatus[]
              ).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChoiceBtn,
                    journalStatusInput === st && styles.statusChoiceActive,
                  ]}
                  onPress={() => setJournalStatusInput(st)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusChoiceText,
                      journalStatusInput === st && styles.statusChoiceTextActive,
                    ]}
                  >
                    {st.replace('WORKOUT_', '').replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>WHY WAS THIS DAY MISSED OR MODIFIED?</Text>
            <TextInput
              style={styles.journalTextInput}
              multiline
              numberOfLines={3}
              placeholder="E.g., Travel delay, high fatigue, work emergency, slight joint soreness..."
              placeholderTextColor={Theme.colors.textMuted}
              value={journalReasonInput}
              onChangeText={setJournalReasonInput}
            />

            <View style={styles.modalActionsRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setEditingJournal(null)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Save Record"
                onPress={saveJournalEntry}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 10,
    paddingBottom: 32,
    gap: 16,
  },
  horizonTabs: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  horizTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  horizTabActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  horizTabText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  horizTabTextActive: {
    color: Theme.colors.cyanGlow,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  aggregateCard: {
    backgroundColor: '#0A0E17',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    gap: 14,
  },
  aggregateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 2,
  },
  statLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 18,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
  },
  statSub: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  balanceCol: {
    alignItems: 'center',
    gap: 2,
  },
  balanceNum: {
    fontSize: 14,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  balanceLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calLegend: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayBox: {
    width: '13%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayBoxSelected: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  dayBoxCompleted: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  dayBoxPartial: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  dayBoxMissed: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  dayBoxRest: {
    opacity: 0.5,
  },
  dayNum: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textMuted,
  },
  dayNumSelected: {
    color: Theme.colors.cyanGlow,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  completedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.cyanGlow,
  },
  partialDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  missedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  restDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  detailCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  detailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailDate: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 8,
    gap: 2,
  },
  metricLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  metricNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  journalBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalTitle: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  editJournalBtn: {
    paddingVertical: 2,
  },
  editJournalText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  journalReasonText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  milestonesCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  milestoneList: {
    gap: 10,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  badgeGlyph: {
    fontSize: 20,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  badgeDesc: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    padding: 18,
    gap: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
    letterSpacing: 0.8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  inputLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statusButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChoiceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusChoiceActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: Theme.colors.cyanGlow,
  },
  statusChoiceText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  statusChoiceTextActive: {
    color: Theme.colors.cyanGlow,
  },
  journalTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 10,
    color: Theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  historySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  historySectionTitle: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historySectionCount: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  exerciseHistoryList: {
    gap: 10,
  },
  exerciseHistoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  exCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  exCardMuscle: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  setsTable: {
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Theme.borderRadius.sm,
    padding: 6,
  },
  setTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  setColNumber: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    width: 48,
  },
  setColWeight: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    flex: 1,
  },
  setColReps: {
    fontSize: 11,
    color: Theme.colors.cyanGlow,
    width: 60,
    textAlign: 'center',
  },
  setColDone: {
    fontSize: 12,
    fontWeight: '900',
    color: Theme.colors.emeraldSuccess,
    width: 20,
    textAlign: 'right',
  },
  mealHistoryList: {
    gap: 8,
  },
  mealHistoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  mealCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  mealTimeText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  mealItemsText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  mealStatusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  mealMacrosText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  progressionCard: {
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressionTitle: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
    letterSpacing: 0.5,
  },
  progressionSubtitle: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  progressionGrid: {
    gap: 8,
  },
  progressionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  progressionMetricLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  progressionValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressionPrev: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  progressionArrow: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  progressionCurrent: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  progressionDelta: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.emeraldSuccess,
    fontFamily: Theme.typography.telemetry.fontFamily,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
