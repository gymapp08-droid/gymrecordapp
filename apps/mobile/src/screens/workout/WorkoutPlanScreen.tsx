import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Theme } from '../../theme/tokens';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { StatusBadge } from '../../components/StatusBadge';
import { getTodayDayOfWeek } from '../../utils/timezone';
import { usePerformance } from '../../context/PerformanceContext';
import {
  CANONICAL_6_WEEK_SPLIT,
  HIIC_TREADMILL_PROTOCOL,
  SIX_WEEK_SHREDDED_PROGRAM_DETAIL,
} from '../../data/sixWeekShredded';
import programCatalogData from '../../data/program-catalog.json';

interface WorkoutPlanScreenProps {
  onStartWorkout?: (dayTitle: string) => void;
  onBrowsePrograms?: () => void;
}

const DAY_TAB_INFO: { dayOfWeek: number; dayShort: string; dayFull: string; colorAccent: string }[] = [
  { dayOfWeek: 1, dayShort: 'Mon', dayFull: 'Monday', colorAccent: '#3882F6' },
  { dayOfWeek: 2, dayShort: 'Tue', dayFull: 'Tuesday', colorAccent: '#818CF8' },
  { dayOfWeek: 3, dayShort: 'Wed', dayFull: 'Wednesday', colorAccent: '#00F0FF' },
  { dayOfWeek: 4, dayShort: 'Thu', dayFull: 'Thursday', colorAccent: '#3882F6' },
  { dayOfWeek: 5, dayShort: 'Fri', dayFull: 'Friday', colorAccent: '#C084FC' },
  { dayOfWeek: 6, dayShort: 'Sat', dayFull: 'Saturday', colorAccent: '#00F0FF' },
  { dayOfWeek: 7, dayShort: 'Sun', dayFull: 'Sunday', colorAccent: '#10B981' },
];

export const WorkoutPlanScreen: React.FC<WorkoutPlanScreenProps> = ({ onStartWorkout, onBrowsePrograms }) => {
  const {
    activeProgramId,
    activeProgramTitle,
    currentProgramWeek,
    setCurrentProgramWeek,
    selectWorkoutDay,
    weeklyMomentum: _weeklyMomentum,
  } = usePerformance();

  const todayDow = getTodayDayOfWeek();
  const [selectedDay, setSelectedDay] = useState<number>(todayDow);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentProgramWeek || 1);
  const [showProgramInfo, setShowProgramInfo] = useState<boolean>(false);

  const isCycle1 = selectedWeek <= 6;

  const is6WeekShredded =
    !activeProgramId ||
    activeProgramId === 'prog_6_week_shredded_12w' ||
    activeProgramId === 'prog-6-week-shredded' ||
    activeProgramId === '6-week-shredded' ||
    activeProgramId === '6_WEEK_SHREDDED';

  const catalogProgram = React.useMemo(() => {
    if (is6WeekShredded) return null;
    return (programCatalogData.programs || []).find((p: any) => p.id === activeProgramId);
  }, [is6WeekShredded, activeProgramId]);

  const canonicalDayPlan = React.useMemo(() => {
    if (is6WeekShredded || !catalogProgram) {
      return CANONICAL_6_WEEK_SPLIT[selectedDay] || CANONICAL_6_WEEK_SPLIT[1]!;
    }
    const day = (catalogProgram.days || []).find((d: any) => d.dayOfWeek === selectedDay);
    if (!day || !day.exercises || day.exercises.length === 0) {
      return {
        dayNumber: selectedDay,
        dayName: DAY_TAB_INFO.find((d) => d.dayOfWeek === selectedDay)?.dayFull || 'Rest Day',
        workoutType: 'RECOVERY' as const,
        title: 'Rest & Recovery',
        muscleGroups: ['Regeneration & Mobility'],
        liftingSpeedInstructions: 'Rest and replenish glycogen stores.',
        restInstructions: 'Full muscular recovery.',
        prescriptions: [],
      };
    }

    return {
      dayNumber: selectedDay,
      dayName: DAY_TAB_INFO.find((d) => d.dayOfWeek === selectedDay)?.dayFull || `Day ${selectedDay}`,
      workoutType: 'RESISTANCE' as const,
      title: day.title || `${catalogProgram.name} - Day ${selectedDay}`,
      muscleGroups: [catalogProgram.goal || catalogProgram.name],
      liftingSpeedInstructions: 'Controlled eccentric cadence, explosive concentric drive.',
      restInstructions: day.exercises[0]?.restInstructions || '60–90 sec rest between sets.',
      prescriptions: day.exercises.map((ex: any, idx: number) => ({
        exerciseId: `ex-${idx + 1}`,
        exerciseName: ex.name,
        primaryMuscle: catalogProgram.goal || 'General Movement',
        orderIndex: idx,
        setGroupType: (ex.setGroupType || 'Regular Set') as any,
        groupNumber: ex.groupNumber || idx + 1,
        targetSets: 3,
        targetReps: 10,
        prescribedReps: ex.prescribedReps || '3 sets · 10–12 reps',
        setReps: ['12 reps', '10 reps', '10 reps'],
        restSeconds: 60,
        restInstructions: ex.restInstructions || '60 sec rest',
        workoutInstructions: ex.notes || 'Execute with strict technique and controlled tempo.',
        notes: ex.notes || undefined,
      })),
    };
  }, [is6WeekShredded, catalogProgram, selectedDay]);

  const handleSelectDay = (dow: number) => {
    setSelectedDay(dow);
    selectWorkoutDay(dow);
  };

  const handleStartWorkout = () => {
    selectWorkoutDay(selectedDay);
    if (onStartWorkout) {
      onStartWorkout(canonicalDayPlan.title);
    }
  };

  // Group prescriptions by groupNumber if resistance day
  const groupedPrescriptions = React.useMemo(() => {
    const groups: {
      groupNumber: number;
      groupType: string;
      restInstructions?: string;
      items: any[];
    }[] = [];

    for (const p of canonicalDayPlan.prescriptions) {
      let g = groups.find((grp) => grp.groupNumber === p.groupNumber);
      if (!g) {
        g = {
          groupNumber: p.groupNumber,
          groupType: p.setGroupType,
          restInstructions: p.restInstructions,
          items: [],
        };
        groups.push(g);
      }
      g.items.push(p);
    }
    return groups;
  }, [canonicalDayPlan]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />

      {/* Program Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.programTagRow}>
            <Text style={styles.headerSubtitle}>PROGRAM PROTOCOL</Text>
            <StatusBadge label={catalogProgram ? (catalogProgram.duration || 'PROGRAM') : '12 WEEKS'} status="neutral" />
            {is6WeekShredded ? (
              <StatusBadge label={isCycle1 ? 'CYCLE 1 (W1-6)' : 'CYCLE 2 (W7-12)'} status="info" />
            ) : (
              <StatusBadge label="ACTIVE" status="success" />
            )}
          </View>
          <Text style={styles.headerTitle}>{activeProgramTitle || '6 WEEK SHREDDED'}</Text>
          <Text style={styles.authorText}>
            {is6WeekShredded ? 'Author: Guru Mann, USA · Certified Strength Coach' : 'Program fitted by Gravity'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onBrowsePrograms && (
            <TouchableOpacity
              style={styles.catalogButton}
              onPress={onBrowsePrograms}
              activeOpacity={0.7}
            >
              <Text style={styles.catalogButtonText}>CATALOG 📚</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowProgramInfo(!showProgramInfo)}
            activeOpacity={0.7}
          >
            <Text style={styles.infoButtonText}>{showProgramInfo ? '✕' : 'ℹ'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Program Info Drawer (Toggleable) */}
      {showProgramInfo && (
        <View style={styles.programInfoDrawer}>
          <Text style={styles.programInfoHeading}>CANONICAL PROGRAM SPECIFICATION</Text>
          <Text style={styles.programInfoBody}>
            {SIX_WEEK_SHREDDED_PROGRAM_DETAIL.description}
          </Text>
          <View style={styles.cycleComparisonRow}>
            <View style={styles.cycleBadgeBox}>
              <Text style={styles.cycleBoxTitle}>CYCLE 1: WEEKS 1–6</Text>
              <Text style={styles.cycleBoxDesc}>Original source program structure</Text>
            </View>
            <View style={styles.cycleBadgeBox}>
              <Text style={styles.cycleBoxTitle}>CYCLE 2: WEEKS 7–12</Text>
              <Text style={styles.cycleBoxDesc}>Identical repeat referencing canonical split</Text>
            </View>
          </View>
        </View>
      )}

      {/* 12-Week Horizontal Cycle / Week Selector */}
      <View style={styles.weekSelectorSection}>
        <Text style={styles.selectorLabel}>
          SELECT WEEK · {selectedWeek <= 6 ? `CYCLE 1 (WEEK ${selectedWeek} OF 6)` : `CYCLE 2 (WEEK ${selectedWeek} OF 12)`}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekScrollContent}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((wk) => {
            const isSelected = wk === selectedWeek;
            const isC1 = wk <= 6;
            return (
              <TouchableOpacity
                key={wk}
                style={[
                  styles.weekPill,
                  isSelected && styles.weekPillActive,
                  !isSelected && isC1 && styles.weekPillCycle1,
                  !isSelected && !isC1 && styles.weekPillCycle2,
                ]}
                onPress={() => {
                  setSelectedWeek(wk);
                  setCurrentProgramWeek(wk);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.weekPillText, isSelected && styles.weekPillTextActive]}>
                  W{wk}
                </Text>
                <Text style={[styles.weekCycleSub, isSelected && styles.weekCycleSubActive]}>
                  {isC1 ? 'C1' : 'C2'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Weekday Selector Bar (Mon - Sun) */}
      <View style={styles.daySelectorContainer}>
        {DAY_TAB_INFO.map((day) => {
          const isSelected = day.dayOfWeek === selectedDay;
          const isToday = day.dayOfWeek === todayDow;
          const plan = CANONICAL_6_WEEK_SPLIT[day.dayOfWeek];
          const isRest = plan?.workoutType === 'RECOVERY';

          return (
            <TouchableOpacity
              key={day.dayOfWeek}
              style={[
                styles.dayTab,
                isSelected && styles.dayTabActive,
                isToday && !isSelected && styles.dayTabToday,
              ]}
              onPress={() => handleSelectDay(day.dayOfWeek)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}>
                {day.dayShort}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  { backgroundColor: isRest ? '#10B981' : isSelected ? '#FFFFFF' : day.colorAccent },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Workout Details */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Day Header Card */}
        <GlassCard style={styles.dayHeaderCard}>
          <View style={styles.dayHeaderTop}>
            <View>
              <Text style={styles.dayFullTitle}>{canonicalDayPlan.dayName.toUpperCase()}</Text>
              <Text style={styles.workoutMainTitle}>{canonicalDayPlan.title}</Text>
            </View>
            <View
              style={[
                styles.workoutTypeTag,
                {
                  borderColor:
                    canonicalDayPlan.workoutType === 'RECOVERY'
                      ? '#10B981'
                      : canonicalDayPlan.workoutType === 'CARDIO'
                      ? '#00F0FF'
                      : '#3882F6',
                },
              ]}
            >
              <Text
                style={[
                  styles.workoutTypeTagText,
                  {
                    color:
                      canonicalDayPlan.workoutType === 'RECOVERY'
                        ? '#10B981'
                        : canonicalDayPlan.workoutType === 'CARDIO'
                        ? '#00F0FF'
                        : '#3882F6',
                  },
                ]}
              >
                {canonicalDayPlan.workoutType}
              </Text>
            </View>
          </View>

          {/* Muscle Focus Badges */}
          <View style={styles.muscleRow}>
            {canonicalDayPlan.muscleGroups.map((mg, idx) => (
              <View key={idx} style={styles.muscleBadge}>
                <Text style={styles.muscleBadgeText}>{mg}</Text>
              </View>
            ))}
          </View>

          {/* Execution & Rest Guidelines */}
          <View style={styles.executionBox}>
            <Text style={styles.executionLabel}>⚡ TEMPO & REST RULES</Text>
            <Text style={styles.executionText}>{canonicalDayPlan.liftingSpeedInstructions || '1 sec lift, 1–2 sec lower.'}</Text>
            <Text style={styles.executionText}>{canonicalDayPlan.restInstructions}</Text>
          </View>
        </GlassCard>

        {/* REST DAY DISPLAY */}
        {canonicalDayPlan.workoutType === 'RECOVERY' && (
          <GlassCard style={styles.recoveryCard}>
            <Text style={styles.recoveryEmoji}>🌿</Text>
            <Text style={styles.recoveryTitle}>Active Recovery & Regeneration</Text>
            <Text style={styles.recoveryDesc}>
              Complete central nervous system reset. Focus on hydration, mobility flow, and lean protein synthesis to prepare for Week {selectedWeek}, Day 1.
            </Text>
          </GlassCard>
        )}

        {/* CARDIO DAY DISPLAY (Wednesday & Saturday) */}
        {canonicalDayPlan.workoutType === 'CARDIO' && (
          <View style={styles.cardioSection}>
            <Text style={styles.sectionHeading}>HIIC 20-MINUTE TREADMILL PROTOCOL</Text>
            <GlassCard style={styles.cardioCard}>
              <View style={styles.cardioHeaderRow}>
                <Text style={styles.cardioTitle}>HIGH INTENSITY INTERVAL CARDIO</Text>
                <StatusBadge label="20 MIN TOTAL" status="info" />
              </View>
              <Text style={styles.cardioSubtitle}>Preserved verbatim from Guru Mann USA source PDF</Text>

              {/* Protocol Table */}
              <View style={styles.cardioTable}>
                {HIIC_TREADMILL_PROTOCOL.intervals.map((item, idx) => {
                  const isSprint = item.activity.toLowerCase().includes('sprint');
                  const isRecovery = item.activity.toLowerCase().includes('jump') || item.activity.toLowerCase().includes('recovery');
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.cardioTableRow,
                        isSprint && styles.cardioRowSprint,
                        isRecovery && styles.cardioRowRecovery,
                      ]}
                    >
                      <Text style={styles.cardioColTime}>{item.timeRange}</Text>
                      <View style={styles.cardioColDetail}>
                        <Text style={styles.cardioColActivity}>{item.activity}</Text>
                        <Text style={styles.cardioColSpeed}>{item.speedMph}</Text>
                      </View>
                      <View
                        style={[
                          styles.cardioBadge,
                          isSprint ? styles.cardioBadgeSprint : styles.cardioBadgeNormal,
                        ]}
                      >
                        <Text style={styles.cardioBadgeText}>{isSprint ? 'SPRINT' : isRecovery ? 'RECOVER' : 'PACE'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </View>
        )}

        {/* EXERCISES SECTION (Grouped into Super Sets / Giant Sets / Drop Sets) */}
        {canonicalDayPlan.prescriptions.length > 0 && (
          <View style={styles.exercisesSection}>
            <Text style={styles.sectionHeading}>
              {canonicalDayPlan.workoutType === 'CARDIO' ? 'ABDOMINAL PRESCRIPTIONS' : 'PRESCRIBED EXERCISE SEQUENCE'}
            </Text>

            {groupedPrescriptions.map((grp) => (
              <View key={grp.groupNumber} style={styles.groupContainer}>
                {/* Group Header Badge */}
                <View style={styles.groupHeaderRow}>
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupBadgeText}>
                      GROUP {grp.groupNumber} · {grp.groupType.toUpperCase()}
                    </Text>
                  </View>
                  {grp.restInstructions && (
                    <Text style={styles.groupRestText}>{grp.restInstructions}</Text>
                  )}
                </View>

                {/* Exercises inside Group */}
                {grp.items.map((ex, _itemIdx) => (
                  <GlassCard key={ex.exerciseId} style={styles.exerciseCard}>
                    <View style={styles.exerciseCardHeader}>
                      <View style={styles.exerciseNumBadge}>
                        <Text style={styles.exerciseNumText}>
                          {String(ex.orderIndex + 1).padStart(2, '0')}
                        </Text>
                      </View>
                      <View style={styles.exerciseNameCol}>
                        <Text style={styles.exerciseNameText}>{ex.exerciseName}</Text>
                        <Text style={styles.exerciseMuscleText}>{ex.primaryMuscle}</Text>
                      </View>
                    </View>

                    {/* Prescribed Reps Badge */}
                    <View style={styles.prescribedRepsRow}>
                      <View style={styles.repsTag}>
                        <Text style={styles.repsTagLabel}>PRESCRIBED REPS</Text>
                        <Text style={styles.repsTagValue}>{ex.prescribedReps}</Text>
                      </View>
                      <View style={styles.repsTag}>
                        <Text style={styles.repsTagLabel}>SETS</Text>
                        <Text style={styles.repsTagValue}>{ex.targetSets} Sets</Text>
                      </View>
                    </View>

                    {/* Set breakdown chips if multi-set */}
                    {ex.setReps && ex.setReps.length > 0 && (
                      <View style={styles.setChipsRow}>
                        {ex.setReps.map((r: string, sIdx: number) => (
                          <View key={sIdx} style={styles.setChip}>
                            <Text style={styles.setChipLabel}>Set {sIdx + 1}:</Text>
                            <Text style={styles.setChipReps}>{r}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Exercise Notes if present */}
                    {ex.notes && (
                      <Text style={styles.exerciseNotesText}>📝 {ex.notes}</Text>
                    )}
                  </GlassCard>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.footer}>
        <NeonButton
          title={
            canonicalDayPlan.workoutType === 'RECOVERY'
              ? 'Log Recovery Session'
              : `Start ${canonicalDayPlan.title}`
          }
          onPress={handleStartWorkout}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleContainer: {
    flex: 1,
  },
  programTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  authorText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  catalogButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.md,
  },
  catalogButtonText: {
    color: Theme.colors.cyanGlow,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  infoButtonText: {
    fontSize: 14,
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
  programInfoDrawer: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    gap: 8,
  },
  programInfoHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
    letterSpacing: 1,
  },
  programInfoBody: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  cycleComparisonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cycleBadgeBox: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cycleBoxTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  cycleBoxDesc: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  weekSelectorSection: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  weekScrollContent: {
    gap: 8,
  },
  weekPill: {
    width: 52,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceElevated,
  },
  weekPillActive: {
    backgroundColor: Theme.colors.primaryBlue,
    borderColor: Theme.colors.cyanGlow,
    shadowColor: Theme.colors.primaryBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  weekPillCycle1: {
    borderColor: 'rgba(56, 130, 246, 0.3)',
  },
  weekPillCycle2: {
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  weekPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  weekPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  weekCycleSub: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  weekCycleSubActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  daySelectorContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  dayTabActive: {
    backgroundColor: Theme.colors.primaryBlue,
    shadowColor: Theme.colors.primaryBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  dayTabToday: {
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  dayTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 14,
  },
  dayHeaderCard: {
    padding: 16,
    gap: 10,
  },
  dayHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayFullTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
    letterSpacing: 1,
  },
  workoutMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  workoutTypeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  workoutTypeTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  muscleBadgeText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  executionBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  executionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  executionText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  recoveryCard: {
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
  },
  recoveryEmoji: {
    fontSize: 36,
  },
  recoveryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  recoveryDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  cardioSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  cardioCard: {
    padding: 14,
    gap: 10,
  },
  cardioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardioTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
  },
  cardioSubtitle: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  cardioTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardioTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cardioRowSprint: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cardioRowRecovery: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  cardioColTime: {
    width: 80,
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  cardioColDetail: {
    flex: 1,
  },
  cardioColActivity: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cardioColSpeed: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  cardioBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardioBadgeSprint: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  cardioBadgeNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardioBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exercisesSection: {
    gap: 12,
  },
  groupContainer: {
    gap: 8,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.4)',
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3882F6',
    letterSpacing: 0.8,
  },
  groupRestText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  exerciseCard: {
    padding: 14,
    gap: 10,
    marginBottom: 6,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  exerciseNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
  },
  exerciseNameCol: {
    flex: 1,
  },
  exerciseNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  exerciseMuscleText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  prescribedRepsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  repsTag: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  repsTagLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 0.6,
  },
  repsTagValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.cyanGlow,
    marginTop: 2,
  },
  setChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  setChipLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  setChipReps: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  exerciseNotesText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(5, 7, 11, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
});
