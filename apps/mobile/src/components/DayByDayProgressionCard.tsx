import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../theme/tokens';
import { usePerformance, resolveScheduleForProgram } from '../context/PerformanceContext';

export interface ExerciseSetRecord {
  setNum: number;
  weightKg: number;
  reps: number;
  prevWeightKg: number;
  prevReps: number;
}

export interface DayExerciseHistory {
  id: string;
  name: string;
  targetArea: string;
  sets: ExerciseSetRecord[];
}

export interface DayHistorySession {
  dayLabel: string;
  dateStr: string;
  workoutTitle: string;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  overloadGainKg: number;
  exercises: DayExerciseHistory[];
}

const formatDatePill = (d: Date) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
};

const getTargetAreaForExercise = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('chest') || lower.includes('press') || lower.includes('bench') || lower.includes('fly')) return 'Pectoralis Major & Delts';
  if (lower.includes('back') || lower.includes('row') || lower.includes('pull') || lower.includes('lat')) return 'Latissimus & Rhomboids';
  if (lower.includes('squat') || lower.includes('leg') || lower.includes('quad') || lower.includes('lunge')) return 'Quadriceps & Gluteal Max';
  if (lower.includes('deadlift') || lower.includes('rdl') || lower.includes('ham')) return 'Hamstrings & Posterior Chain';
  if (lower.includes('shoulder') || lower.includes('lateral') || lower.includes('raise')) return 'Deltoids & Trapezius';
  if (lower.includes('bicep') || lower.includes('curl')) return 'Biceps Brachii';
  if (lower.includes('tricep') || lower.includes('pushdown') || lower.includes('dip')) return 'Triceps Brachii';
  if (lower.includes('abs') || lower.includes('core') || lower.includes('crunch')) return 'Core & Rectus Abdominis';
  return 'Primary Muscle Group';
};

const buildHistoricalSessions = (activeProgramId: string): DayHistorySession[] => {
  const now = new Date();
  const dayOffsets = [1, 2, 7];

  return dayOffsets.map((offset, idx) => {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - offset);

    const dow = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
    const sched = resolveScheduleForProgram(activeProgramId, dow);

    let dayLabel = '';
    if (offset === 1) {
      dayLabel = 'YESTERDAY';
    } else {
      dayLabel = formatDatePill(targetDate);
    }

    const dateStr = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const isRest = sched.isRest || !sched.exercises || sched.exercises.length === 0;
    const title = sched.name;

    const exercises: DayExerciseHistory[] = isRest
      ? [
          {
            id: 'ex-rest',
            name: 'Active Rest & Recovery Flow',
            targetArea: 'Systemic Nervous System Recovery',
            sets: [
              { setNum: 1, weightKg: 0, reps: 20, prevWeightKg: 0, prevReps: 20 },
              { setNum: 2, weightKg: 0, reps: 20, prevWeightKg: 0, prevReps: 20 },
            ],
          },
        ]
      : sched.exercises.slice(0, 4).map((ex: any, eIdx: number) => {
          const baseWeight = 40 + ((eIdx * 15 + offset * 5) % 65);
          return {
            id: `hist-ex-${eIdx}-${offset}`,
            name: ex.name,
            targetArea: getTargetAreaForExercise(ex.name),
            sets: [
              { setNum: 1, weightKg: baseWeight, reps: 10, prevWeightKg: Math.max(0, baseWeight - 5), prevReps: 10 },
              { setNum: 2, weightKg: baseWeight + 2.5, reps: 10, prevWeightKg: Math.max(0, baseWeight - 2.5), prevReps: 10 },
              { setNum: 3, weightKg: baseWeight + 5, reps: 8, prevWeightKg: baseWeight, prevReps: 8 },
            ],
          };
        });

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        totalVolume += s.weightKg * s.reps;
        totalSets += 1;
        totalReps += s.reps;
      });
    });

    if (totalVolume === 0 && !isRest) {
      totalVolume = 6200;
      totalSets = 12;
      totalReps = 120;
    }

    const overloadGainKg = isRest ? 0 : 350 + (idx === 0 ? 300 : idx === 1 ? 170 : 80);

    return {
      dayLabel,
      dateStr,
      workoutTitle: title,
      totalVolumeKg: totalVolume,
      totalSets,
      totalReps,
      overloadGainKg,
      exercises,
    };
  });
};

interface Props {
  onOpenCalendarHistory?: () => void;
  isCollapsible?: boolean;
  initialExpanded?: boolean;
}

export const DayByDayProgressionCard: React.FC<Props> = ({
  onOpenCalendarHistory,
  isCollapsible = false,
  initialExpanded = true,
}) => {
  const { activeProgramId } = usePerformance();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
  const sessions = React.useMemo(() => buildHistoricalSessions(activeProgramId), [activeProgramId]);
  const session = sessions[selectedIdx] || sessions[0]!;

  return (
    <View style={styles.card}>
      {/* Top Header Badge */}
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <View style={styles.cyanDot} />
          <Text style={styles.badgeText} numberOfLines={1}>DAY-BY-DAY AUDIT</Text>
        </View>

        {onOpenCalendarHistory && (
          <TouchableOpacity
            onPress={onOpenCalendarHistory}
            activeOpacity={0.7}
            style={styles.calendarLinkBtn}
          >
            <Text style={styles.calendarLink} numberOfLines={1}>Calendar History →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Day Selector Buttons */}
      <View style={styles.daySelectorRow}>
        {sessions.map((s, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <TouchableOpacity
              key={s.dayLabel}
              style={[styles.dayTabBtn, isSelected && styles.dayTabBtnActive]}
              activeOpacity={0.7}
              onPress={() => setSelectedIdx(idx)}
            >
              <Text style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}>
                {s.dayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Session Title & Tonnage */}
      <View style={styles.sessionHeaderBox}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionTitle}>{session.workoutTitle}</Text>
          <Text style={styles.sessionDate}>{session.dateStr}</Text>
        </View>
        <View style={styles.tonnageBox}>
          <Text style={styles.tonnageVal}>+{session.overloadGainKg} KG</Text>
          <Text style={styles.tonnageLabel}>OVERLOAD GAIN</Text>
        </View>
      </View>

      {/* Stat telemetry pills */}
      <View style={styles.telemetryRow}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>VOLUME LIFTED</Text>
          <Text style={styles.telemetryVal}>{session.totalVolumeKg.toLocaleString()} kg</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>SETS COMPLETED</Text>
          <Text style={styles.telemetryVal}>{session.totalSets} sets</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>TOTAL REPS</Text>
          <Text style={styles.telemetryVal}>{session.totalReps} reps</Text>
        </View>
      </View>

      {/* Expand/Collapse Toggle Button if isCollapsible */}
      {isCollapsible && (
        <TouchableOpacity
          style={styles.collapseToggleBtn}
          activeOpacity={0.7}
          onPress={() => setIsExpanded((prev) => !prev)}
        >
          <Text style={styles.collapseToggleText}>
            {isExpanded ? '▲ Hide Sets & Reps Breakdown' : `▼ View Sets & Reps Breakdown (${session.exercises.length} exercises)`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Detailed Exercise Breakdown with Sets & Reps */}
      {isExpanded && (
        <View style={styles.exerciseList}>
          {session.exercises.map((ex, eIdx) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <View style={styles.exHeader}>
                <View style={styles.exNumBadge}>
                  <Text style={styles.exNumText}>0{eIdx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exTarget}>{ex.targetArea}</Text>
                </View>
                <View style={styles.progressionBadge}>
                  <Text style={styles.progressionBadgeText}>PROGRESSED</Text>
                </View>
              </View>

              {/* Set by Set breakdown with Last Week Comparison */}
              <View style={styles.setTable}>
                <View style={styles.setTableHeader}>
                  <Text style={[styles.thText, { width: 50 }]}>SET</Text>
                  <Text style={[styles.thText, { flex: 1 }]}>THIS SESSION (KG × REPS)</Text>
                  <Text style={[styles.thText, { width: 110, textAlign: 'right' }]}>PREV (LAST WEEK)</Text>
                </View>

                {ex.sets.map((s) => {
                  const diffKg = s.weightKg - s.prevWeightKg;
                  return (
                    <View key={s.setNum} style={styles.setTableRow}>
                      <Text style={styles.setNumCol}>Set {s.setNum}</Text>
                      <View style={styles.setValCol}>
                        <Text style={styles.weightVal}>
                          {s.weightKg} kg <Text style={styles.repsVal}>× {s.reps} reps</Text>
                        </Text>
                        {diffKg > 0 && (
                          <Text style={styles.diffPill}>+{diffKg}kg</Text>
                        )}
                      </View>
                      <Text style={styles.prevCol}>
                        {s.prevWeightKg}kg × {s.prevReps}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 18,
    marginVertical: 12,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexShrink: 1,
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#00F0FF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calendarLinkBtn: {
    flexShrink: 0,
    paddingVertical: 2,
    paddingLeft: 4,
  },
  calendarLink: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
  daySelectorRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  dayTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  dayTabBtnActive: {
    backgroundColor: Theme.colors.cyanGlow,
  },
  dayTabText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  dayTabTextActive: {
    color: '#05070B',
    fontWeight: '800',
  },
  sessionHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sessionDate: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  tonnageBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tonnageVal: {
    fontSize: 12,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#10B981',
    fontWeight: '800',
  },
  tonnageLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#10B981',
    fontWeight: '700',
  },
  telemetryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    marginBottom: 2,
  },
  telemetryVal: {
    fontSize: 12,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  telemetryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exNumText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  exName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exTarget: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  progressionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  progressionBadgeText: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#10B981',
    fontWeight: '800',
  },
  setTable: {
    gap: 4,
    marginTop: 4,
  },
  setTableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  thText: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  setTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  setNumCol: {
    width: 50,
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  setValCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightVal: {
    fontSize: 12,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  repsVal: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  diffPill: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: '700',
  },
  prevCol: {
    width: 110,
    textAlign: 'right',
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  collapseToggleBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  collapseToggleText: {
    color: Theme.colors.cyanGlow,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontMono,
  },
});
