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
import { AlphaScreen, StatusBadge, PrimaryButton, SecondaryButton } from '../../components';
import {
  BellIcon,
  FlameIcon,
  CheckIcon,
  HeartPulseIcon,
} from '../../components/icons';
import { Theme } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { usePerformance } from '../../context/PerformanceContext';

interface HomeScreenProps {
  onStartWorkout: () => void;
  onNavigateToWorkout: () => void;
  onNavigateToNutrition: () => void;
  onNavigateToActivity: () => void;
  onNavigateToAICoach: () => void;
  onOpenNotifications: () => void;
  onOpenCommandHub: () => void;
  onOpenIntegrations: () => void;
  onOpenCalendarHistory: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartWorkout,
  onNavigateToWorkout,
  onNavigateToNutrition,
  onNavigateToActivity,
  onNavigateToAICoach,
  onOpenNotifications,
  onOpenCommandHub,
  onOpenIntegrations,
  onOpenCalendarHistory,
}) => {
  const { user } = useAuth();
  const {
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
    addWater,
    toggleUpNext,
    saveDailyNote,
  } = usePerformance();

  // Daily note editing modal
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteInput, setNoteInput] = useState(dailyNote);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const athleteName =
    (user as any)?.fullName ||
    user?.email?.split('@')[0]?.replace(/^\w/, (c: string) => c.toUpperCase()) ||
    'Sagar';

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleSaveNote = () => {
    saveDailyNote(noteInput);
    setNoteModalVisible(false);
  };

  const isWorkoutCompleted = workout.status === 'COMPLETED';
  const workoutCtaTitle = isWorkoutCompleted
    ? 'VIEW WORKOUT'
    : workout.status === 'IN_PROGRESS'
    ? 'CONTINUE WORKOUT'
    : 'START WORKOUT';

  return (
    <AlphaScreen>
      {/* 1. Clean Header (Section 7) */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={onOpenCommandHub}
            activeOpacity={0.7}
            accessibilityLabel="Open profile and command hub"
          >
            <Text style={styles.avatarText}>
              {athleteName.substring(0, 2).toUpperCase()}
            </Text>
            <View style={styles.onlineDot} />
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingLabel}>{getGreeting()}</Text>
            <Text style={styles.athleteNameText}>{athleteName}</Text>
            <Text style={styles.dateText}>{currentDateFormatted}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.streakPill}>
            <FlameIcon size={14} color="#F59E0B" />
            <Text style={styles.streakPillText}>{streak.label}</Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
            accessibilityLabel="Open notifications"
          >
            <BellIcon size={18} color={Theme.colors.textPrimary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Today's Workout — Hero Card (Sections 11, 12, 13) */}
        <View style={styles.workoutHeroCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>
              <View style={styles.titleRow}>
                <Text style={styles.workoutTitle}>{workout.name}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{workout.category}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.metaTime}>
              {workout.totalExercises} Exercises · {workout.totalSets} Sets · ~{workout.estimatedMinutes} min
            </Text>
          </View>

          {/* Planned vs Actual Volume Callouts */}
          <View style={styles.volumeCompareBlock}>
            <View style={styles.volumeCol}>
              <Text style={styles.volumeLabel}>TARGET VOLUME (PLAN)</Text>
              <Text style={styles.volumeVal}>{workout.targetVolumeKg.toLocaleString()} KG</Text>
            </View>
            <View style={styles.volumeDivider} />
            <View style={styles.volumeCol}>
              <Text style={styles.volumeLabel}>COMPLETED VOLUME (ACTUAL)</Text>
              <Text
                style={[
                  styles.volumeVal,
                  workout.completedVolumeKg > 0 ? { color: Theme.colors.cyanGlow } : { color: Theme.colors.textMuted },
                ]}
              >
                {workout.completedVolumeKg.toLocaleString()} KG
              </Text>
            </View>
          </View>

          {/* Session Progress Bar */}
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                Session Progress: {workout.completedExercisesCount} / {workout.totalExercises} exercises · {workout.completedSetsCount} / {workout.totalSets} sets
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round((workout.completedExercisesCount / workout.totalExercises) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min((workout.completedExercisesCount / workout.totalExercises) * 100, 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Structured Exercise Lineup (Compact 01 - 06) */}
          <View style={styles.exercisesList}>
            {workout.exercises.map((ex) => (
              <View key={ex.number} style={styles.exerciseRowItem}>
                <Text style={styles.exerciseNum}>{ex.number}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseItemName}>{ex.name}</Text>
                  <Text style={styles.exerciseItemPresc}>{ex.prescription}</Text>
                </View>
                {ex.isCompleted ? (
                  <View style={styles.completedTag}>
                    <CheckIcon size={12} color="#10B981" />
                    <Text style={styles.completedTagText}>Done</Text>
                  </View>
                ) : (
                  <Text style={styles.pendingTagText}>Pending</Text>
                )}
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.workoutActionRow}>
            <PrimaryButton
              title={workoutCtaTitle}
              onPress={isWorkoutCompleted ? onNavigateToWorkout : onStartWorkout}
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              style={styles.fullPlanLink}
              onPress={onNavigateToWorkout}
              activeOpacity={0.7}
            >
              <Text style={styles.fullPlanText}>View Full Plan →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Today's Daily Scorecard (Section 14) */}
        <View style={styles.scorecardSection}>
          <Text style={styles.sectionLabel}>TODAY</Text>
          <View style={styles.scorecardGrid}>
            <View style={styles.scorecardCol}>
              <Text style={styles.scorecardName}>WORKOUT</Text>
              <Text style={styles.scorecardValue}>
                {workout.completedExercisesCount} / {workout.totalExercises}
              </Text>
              <Text style={styles.scorecardSub}>exercises</Text>
            </View>

            <View style={styles.scorecardCol}>
              <Text style={styles.scorecardName}>NUTRITION</Text>
              <Text style={styles.scorecardValue}>
                {nutrition.meals.filter((m) => m.status.startsWith('COMPLETED')).length} / {nutrition.meals.length}
              </Text>
              <Text style={styles.scorecardSub}>meals logged</Text>
            </View>

            <View style={styles.scorecardCol}>
              <Text style={styles.scorecardName}>ACTIVITY</Text>
              <Text style={styles.scorecardValue}>
                {activity.steps.toLocaleString()}
              </Text>
              <Text style={styles.scorecardSub}>/ {activity.stepsTarget.toLocaleString()} steps</Text>
            </View>

            <View style={styles.scorecardCol}>
              <Text style={styles.scorecardName}>HYDRATION</Text>
              <Text style={styles.scorecardValue}>{activity.waterLiters.toFixed(1)} L</Text>
              <Text style={styles.scorecardSub}>/ {activity.waterTarget} L</Text>
            </View>
          </View>
        </View>

        {/* 4. Today's Nutrition (Sections 15, 16, 17) */}
        <View style={styles.nutritionCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionLabel}>TODAY'S NUTRITION</Text>
              <View style={styles.calsRow}>
                <Text style={styles.calsBig}>{nutrition.caloriesConsumed.toLocaleString()}</Text>
                <Text style={styles.calsTarget}>/ {nutrition.caloriesTarget.toLocaleString()} kcal</Text>
              </View>
            </View>
            <View style={styles.remainingPill}>
              <Text style={styles.remainingVal}>
                {Math.max(nutrition.caloriesTarget - nutrition.caloriesConsumed, 0)}
              </Text>
              <Text style={styles.remainingSub}>kcal left</Text>
            </View>
          </View>

          {/* Caloric Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min((nutrition.caloriesConsumed / nutrition.caloriesTarget) * 100, 100)}%` },
              ]}
            />
          </View>

          {/* Macro Breakdown */}
          <View style={styles.macrosRow}>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>PROTEIN</Text>
              <Text style={styles.macroValue}>
                {nutrition.proteinConsumed} / {nutrition.proteinTarget} g
              </Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>CARBS</Text>
              <Text style={styles.macroValue}>
                {nutrition.carbsConsumed} / {nutrition.carbsTarget} g
              </Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>FAT</Text>
              <Text style={styles.macroValue}>
                {nutrition.fatConsumed} / {nutrition.fatTarget} g
              </Text>
            </View>
          </View>

          {/* Meals Status Items */}
          <View style={styles.mealsListBlock}>
            {nutrition.meals.map((m) => (
              <View key={m.id} style={styles.mealRowItem}>
                <View style={styles.mealStatusIndicator}>
                  {m.status === 'COMPLETED_PLANNED' && (
                    <View style={styles.statusDotCompleted}>
                      <Text style={styles.statusDotGlyph}>✓</Text>
                    </View>
                  )}
                  {m.status === 'COMPLETED_MODIFIED' && (
                    <View style={styles.statusDotModified}>
                      <Text style={styles.statusDotGlyph}>✓</Text>
                    </View>
                  )}
                  {m.status === 'PARTIAL' && (
                    <View style={styles.statusDotPartial}>
                      <Text style={styles.statusDotGlyph}>◐</Text>
                    </View>
                  )}
                  {m.status === 'UPCOMING' && (
                    <View style={styles.statusDotUpcoming}>
                      <Text style={styles.statusDotGlyph}>○</Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.mealNameRow}>
                    <Text style={styles.mealName}>{m.title}</Text>
                    <Text style={styles.mealCalsText}>
                      {m.actualCals > 0 ? m.actualCals : m.plannedCals} kcal
                    </Text>
                  </View>
                  <Text style={styles.mealStatusDesc}>{m.statusLabel}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.sectionLink}
            onPress={onNavigateToNutrition}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLinkText}>Log Food / View Nutrition Plan →</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Today's Activity (Section 18) */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionLabel}>TODAY'S ACTIVITY</Text>
            <TouchableOpacity onPress={onNavigateToActivity} activeOpacity={0.7}>
              <Text style={styles.cardActionLink}>Open Activity →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityRow}>
            <View style={styles.activityCol}>
              <Text style={styles.actName}>STEPS</Text>
              <Text style={styles.actNum}>{activity.steps.toLocaleString()}</Text>
              <Text style={styles.actSub}>
                {Math.round((activity.steps / activity.stepsTarget) * 100)}% of {activity.stepsTarget.toLocaleString()} goal
              </Text>
            </View>

            <View style={styles.activityCol}>
              <Text style={styles.actName}>CARDIO</Text>
              <Text style={styles.actNum}>{activity.cardioSessionsCount}</Text>
              <Text style={styles.actSub}>sessions recorded</Text>
            </View>

            <View style={styles.activityCol}>
              <Text style={styles.actName}>HYDRATION</Text>
              <Text style={styles.actNum}>{activity.waterLiters.toFixed(1)} L</Text>
              <Text style={styles.actSub}>of {activity.waterTarget} L goal</Text>
              <TouchableOpacity
                style={styles.quickWaterBtn}
                onPress={() => addWater(0.25)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickWaterText}>+250 ml</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. Weekly Momentum (Section 19) */}
        <View style={styles.momentumCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionLabel}>WEEKLY MOMENTUM</Text>
            <Text style={styles.momentumAdherence}>
              {weeklyMomentum.completedCount} Completed · {weeklyMomentum.restCount} Rest · {weeklyMomentum.missedCount} Missed
            </Text>
          </View>

          <View style={styles.momentumStrip}>
            {weeklyMomentum.days.map((item, idx) => {
              const isCompleted = item.status === 'COMPLETED';
              const isRest = item.status === 'REST';
              const isMissed = item.status === 'MISSED';
              const isUpcoming = item.status === 'UPCOMING';

              return (
                <View
                  key={idx}
                  style={[
                    styles.momentumBox,
                    isCompleted && styles.boxCompleted,
                    isRest && styles.boxRest,
                    isMissed && styles.boxMissed,
                    isUpcoming && styles.boxUpcoming,
                  ]}
                >
                  <Text style={styles.boxDay}>{item.day}</Text>
                  <Text
                    style={[
                      styles.boxSymbol,
                      isCompleted && { color: Theme.colors.cyanGlow },
                      isRest && { color: Theme.colors.textMuted },
                      isMissed && { color: Theme.colors.crimsonError },
                      isUpcoming && { color: Theme.colors.textDisabled },
                    ]}
                  >
                    {item.symbol}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Text Legend */}
          <View style={styles.legendRow}>
            <Text style={styles.legendItemText}>✓ Completed</Text>
            <Text style={styles.legendItemText}>◐ Partial</Text>
            <Text style={styles.legendItemText}>R Rest</Text>
            <Text style={styles.legendItemText}>✕ Missed</Text>
            <Text style={styles.legendItemText}>○ Upcoming</Text>
          </View>

          <Text style={styles.momentumSummaryText}>
            {weeklyMomentum.completedCount} workouts completed this week · {weeklyMomentum.restCount} rest day · {weeklyMomentum.missedCount} missed
          </Text>
        </View>

        {/* 7. Recent Performance (Section 20) */}
        <View style={styles.performanceCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionLabel}>RECENT PERFORMANCE</Text>
              <Text style={styles.performanceExerciseTitle}>{recentPerformance.exercise}</Text>
            </View>
            <StatusBadge
              label={recentPerformance.hasImproved ? 'Performance Improved' : 'Maintained'}
              status={recentPerformance.hasImproved ? 'success' : 'neutral'}
            />
          </View>

          <View style={styles.compareGrid}>
            <View style={styles.compareCol}>
              <Text style={styles.compareColLabel}>PREVIOUS</Text>
              <Text style={styles.compareColValue}>{recentPerformance.previous}</Text>
            </View>
            <View style={styles.compareVsBlock}>
              <Text style={styles.compareVsText}>VS</Text>
            </View>
            <View style={styles.compareCol}>
              <Text style={styles.compareColLabel}>LATEST</Text>
              <Text style={styles.compareColValueHighlight}>{recentPerformance.latest}</Text>
            </View>
          </View>

          <View style={styles.progressionFooter}>
            <Text style={styles.progressionText}>
              Progression: <Text style={styles.cyanText}>{recentPerformance.change}</Text> confirmed on primary pushing compound.
            </Text>
          </View>
        </View>

        {/* 8. Personal Record (Section 21 - only shown when genuine PR exists) */}
        {personalRecord && personalRecord.isReal && (
          <View style={styles.prCard}>
            <View style={styles.prHeader}>
              <Text style={styles.prTag}>⚡ NEW PERSONAL RECORD</Text>
              <StatusBadge label="ACHIEVEMENT" status="success" />
            </View>
            <Text style={styles.prExerciseName}>{personalRecord.exercise}</Text>
            <Text style={styles.prValueText}>{personalRecord.record}</Text>
          </View>
        )}

        {/* 9. Recovery / Health Data (Source-Aware, Developer UI Removed) (Sections 8, 9, 10) */}
        <View style={styles.recoveryCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <HeartPulseIcon size={16} color={Theme.colors.cyanGlow} />
              <Text style={styles.sectionLabel}>RECOVERY</Text>
            </View>
            {recovery.isAvailable && (
              <StatusBadge label={recovery.sourceName || 'SYNCED'} status="success" />
            )}
          </View>

          {recovery.isAvailable ? (
            <View style={styles.recoveryActiveGrid}>
              <View style={styles.recCol}>
                <Text style={styles.recLab}>SCORE</Text>
                <Text style={styles.recVal}>{recovery.score}/100</Text>
              </View>
              <View style={styles.recCol}>
                <Text style={styles.recLab}>SLEEP</Text>
                <Text style={styles.recVal}>{recovery.sleep}</Text>
              </View>
              <View style={styles.recCol}>
                <Text style={styles.recLab}>HRV</Text>
                <Text style={styles.recVal}>{recovery.hrv}</Text>
              </View>
              <View style={styles.recCol}>
                <Text style={styles.recLab}>RESTING HR</Text>
                <Text style={styles.recVal}>{recovery.restingHr}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.recoveryEmptyBlock}>
              <Text style={styles.recoveryEmptyTitle}>Recovery data unavailable</Text>
              <Text style={styles.recoveryEmptyDesc}>
                Connect a health source to unlock recovery, sleep, and readiness insights.
              </Text>
              <TouchableOpacity
                style={styles.connectHealthBtn}
                onPress={onOpenIntegrations}
                activeOpacity={0.8}
              >
                <Text style={styles.connectHealthText}>Connect Health Data</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 10. Up Next / Reminders (Sections 25, 26) */}
        <View style={styles.upNextCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionLabel}>UP NEXT</Text>
            <Text style={styles.upNextTime}>{upNext.time}</Text>
          </View>

          <View style={styles.upNextMainRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.upNextTitle}>{upNext.title}</Text>
              <Text style={styles.upNextDetail}>{upNext.detail}</Text>
            </View>

            <TouchableOpacity
              style={[styles.upNextToggleBtn, upNext.isCompleted && styles.upNextToggleBtnDone]}
              onPress={toggleUpNext}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.upNextToggleText,
                  upNext.isCompleted && styles.upNextToggleTextDone,
                ]}
              >
                {upNext.isCompleted ? '✓ Taken' : '○ Not Taken'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 11. Your Journey (Section 22) */}
        <TouchableOpacity
          style={styles.journeyCard}
          onPress={onOpenCalendarHistory}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionLabel}>YOUR JOURNEY</Text>
            <Text style={styles.journeyMonth}>This Month</Text>
          </View>

          <View style={styles.journeyStatsRow}>
            <View style={styles.journeyCol}>
              <Text style={styles.journeyVal}>{monthlyJourney.workouts}</Text>
              <Text style={styles.journeyLab}>workouts</Text>
            </View>
            <View style={styles.journeyCol}>
              <Text style={styles.journeyVal}>{monthlyJourney.exercises}</Text>
              <Text style={styles.journeyLab}>exercises</Text>
            </View>
            <View style={styles.journeyCol}>
              <Text style={styles.journeyVal}>{monthlyJourney.prs}</Text>
              <Text style={styles.journeyLab}>PRs broken</Text>
            </View>
            <View style={styles.journeyCol}>
              <Text style={styles.journeyVal}>{monthlyJourney.consistencyRate}</Text>
              <Text style={styles.journeyLab}>consistency</Text>
            </View>
          </View>

          <View style={styles.journeyFooter}>
            <Text style={styles.journeyLinkText}>VIEW FULL JOURNEY →</Text>
          </View>
        </TouchableOpacity>

        {/* 12. Daily Note / Journal Access (Section 24) */}
        <View style={styles.noteCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionLabel}>DAILY NOTE</Text>
            <TouchableOpacity
              onPress={() => {
                setNoteInput(dailyNote);
                setNoteModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cardActionLink}>Edit Note ✏️</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.noteContentText}>
            {dailyNote ? `"${dailyNote}"` : 'No note recorded for today. Tap to add reflections or context.'}
          </Text>
        </View>

        {/* 13. AI Coach Card (Section 27) */}
        <TouchableOpacity
          style={styles.aiCoachCard}
          onPress={onNavigateToAICoach}
          activeOpacity={0.85}
        >
          <View style={styles.aiHeader}>
            <Text style={styles.aiCoachTag}>AI COACH</Text>
            <Text style={styles.aiActionText}>Ask AI Coach →</Text>
          </View>
          <Text style={styles.aiCoachBody}>
            "Your next scheduled session is Chest + Triceps. Volume progression on pressing movements is trending +4.2% week-over-week. Ensure caloric surplus is maintained today."
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Daily Note Modal */}
      <Modal visible={noteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeading}>DAILY PERFORMANCE NOTE</Text>
            <Text style={styles.modalSubheading}>
              Record how you felt, schedule constraints, energy levels, or nutrition notes.
            </Text>

            <TextInput
              style={styles.modalTextInput}
              multiline
              numberOfLines={4}
              placeholder="Record your daily note here..."
              placeholderTextColor={Theme.colors.textMuted}
              value={noteInput}
              onChangeText={setNoteInput}
            />

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setNoteModalVisible(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Save Note"
                onPress={handleSaveNote}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 16,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 1,
    right: 1,
    borderWidth: 1.5,
    borderColor: '#05070B',
  },
  greetingLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  athleteNameText: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: 0.2,
  },
  dateText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.sm,
  },
  streakPillText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#F59E0B',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.cyanGlow,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutHeroCard: {
    backgroundColor: '#0A0E17',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  workoutTitle: {
    fontSize: 20,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  metaTime: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    textAlign: 'right',
  },
  volumeCompareBlock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  volumeCol: {
    flex: 1,
    gap: 2,
  },
  volumeDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 10,
  },
  volumeLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  volumeVal: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  progressBlock: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  progressPercent: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.cyanGlow,
    borderRadius: 3,
  },
  exercisesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 6,
  },
  exerciseRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  exerciseNum: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    width: 20,
  },
  exerciseItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  exerciseItemPresc: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedTagText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#10B981',
    fontWeight: '800',
  },
  pendingTagText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  workoutActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  fullPlanLink: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  fullPlanText: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  scorecardSection: {
    gap: 8,
  },
  scorecardGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  scorecardCol: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  scorecardName: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  scorecardValue: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
    marginTop: 2,
  },
  scorecardSub: {
    fontSize: 8,
    color: Theme.colors.textMuted,
  },
  nutritionCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  calsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  calsBig: {
    fontSize: 24,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  calsTarget: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  remainingPill: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  remainingVal: {
    fontSize: 14,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
  },
  remainingSub: {
    fontSize: 8,
    color: Theme.colors.textMuted,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    padding: 8,
  },
  macroCol: {
    alignItems: 'center',
    gap: 2,
  },
  macroLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  macroValue: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  mealsListBlock: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  mealRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealStatusIndicator: {
    width: 18,
    alignItems: 'center',
  },
  statusDotCompleted: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotModified: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotPartial: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotUpcoming: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotGlyph: {
    fontSize: 10,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  mealNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  mealCalsText: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  mealStatusDesc: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  sectionLink: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  sectionLinkText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  activityCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  cardActionLink: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  activityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  activityCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 3,
  },
  actName: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  actNum: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  actSub: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  quickWaterBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderRadius: 4,
    paddingVertical: 3,
    alignItems: 'center',
    marginTop: 4,
  },
  quickWaterText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  momentumCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 10,
  },
  momentumAdherence: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  momentumStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  momentumBox: {
    flex: 1,
    aspectRatio: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 2,
  },
  boxCompleted: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  boxRest: {
    opacity: 0.5,
  },
  boxMissed: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  boxUpcoming: {
    borderStyle: 'dashed',
  },
  boxDay: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  boxSymbol: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  legendItemText: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  momentumSummaryText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  performanceCard: {
    backgroundColor: '#0A0E17',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    gap: 12,
  },
  performanceExerciseTitle: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  compareGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 12,
  },
  compareCol: {
    flex: 1,
    gap: 2,
  },
  compareColLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  compareColValue: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textMuted,
  },
  compareColValueHighlight: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
  },
  compareVsBlock: {
    paddingHorizontal: 12,
  },
  compareVsText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  progressionFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  progressionText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  cyanText: {
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  prCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    padding: 14,
    gap: 6,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prTag: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#F59E0B',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  prExerciseName: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  prValueText: {
    fontSize: 12,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  recoveryCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 10,
  },
  recoveryActiveGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  recCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 8,
    gap: 2,
  },
  recLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  recVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
  },
  recoveryEmptyBlock: {
    gap: 6,
    paddingVertical: 4,
  },
  recoveryEmptyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  recoveryEmptyDesc: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    lineHeight: 16,
  },
  connectHealthBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  connectHealthText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  upNextCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 10,
  },
  upNextTime: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  upNextMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  upNextTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  upNextDetail: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  upNextToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  upNextToggleBtnDone: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  upNextToggleText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  upNextToggleTextDone: {
    color: '#10B981',
  },
  journeyCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  journeyMonth: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  journeyStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  journeyCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  journeyVal: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  journeyLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  journeyFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  journeyLinkText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  noteCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 8,
  },
  noteContentText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  aiCoachCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: Theme.borderRadius.lg,
    padding: 16,
    gap: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiCoachTag: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#C084FC',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  aiActionText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#C084FC',
    fontWeight: '800',
  },
  aiCoachBody: {
    fontSize: 11,
    color: Theme.colors.textPrimary,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    padding: 18,
    gap: 12,
  },
  modalHeading: {
    fontSize: 14,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
    letterSpacing: 0.8,
  },
  modalSubheading: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    lineHeight: 16,
  },
  modalTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 10,
    color: Theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
