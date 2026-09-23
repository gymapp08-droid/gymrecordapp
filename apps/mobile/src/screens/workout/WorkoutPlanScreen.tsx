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
import { getTodayDayOfWeek } from '../../utils/timezone';
import { usePerformance } from '../../context/PerformanceContext';

interface DaySchedule {
  dayOfWeek: number;
  dayShort: string;
  dayFull: string;
  title: string;
  isCompleted: boolean;
  colorAccent: string;
}

const WEEK_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 1, dayShort: 'Mon', dayFull: 'Monday', title: 'Chest + Triceps', isCompleted: false, colorAccent: '#3882F6' },
  { dayOfWeek: 2, dayShort: 'Tue', dayFull: 'Tuesday', title: 'Back + Biceps', isCompleted: false, colorAccent: '#818CF8' },
  { dayOfWeek: 3, dayShort: 'Wed', dayFull: 'Wednesday', title: 'Shoulders + Abs', isCompleted: false, colorAccent: '#00F0FF' },
  { dayOfWeek: 4, dayShort: 'Thu', dayFull: 'Thursday', title: 'Legs', isCompleted: false, colorAccent: '#3882F6' },
  { dayOfWeek: 5, dayShort: 'Fri', dayFull: 'Friday', title: 'Upper Body', isCompleted: false, colorAccent: '#C084FC' },
  { dayOfWeek: 6, dayShort: 'Sat', dayFull: 'Saturday', title: 'Rest & Recovery', isCompleted: false, colorAccent: '#94A3B8' },
  { dayOfWeek: 7, dayShort: 'Sun', dayFull: 'Sunday', title: 'Conditioning', isCompleted: false, colorAccent: '#F59E0B' },
];

interface WorkoutPlanScreenProps {
  onStartWorkout?: (dayTitle: string) => void;
}

export const WorkoutPlanScreen: React.FC<WorkoutPlanScreenProps> = ({ onStartWorkout }) => {
  const { weeklyMomentum } = usePerformance();
  const todayDow = getTodayDayOfWeek();
  const [selectedDay, setSelectedDay] = useState<number>(todayDow);

  const scheduleWithStatus = WEEK_SCHEDULE.map((day) => {
    const momentum = weeklyMomentum?.days?.find((d) => d.dayOfWeek === day.dayOfWeek);
    const isCompleted = momentum ? momentum.status === 'COMPLETED' : false;
    return {
      ...day,
      isCompleted,
    };
  });

  const activeDaySchedule: DaySchedule =
    scheduleWithStatus.find((d) => d.dayOfWeek === selectedDay) || scheduleWithStatus[0]!;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workout</Text>
          <Text style={styles.headerSubtitle}>Weekly Hypertrophy Split</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Selector Bar */}
      <View style={styles.daySelectorContainer}>
        {scheduleWithStatus.map((day) => {
          const isSelected = day.dayOfWeek === selectedDay;
          return (
            <TouchableOpacity
              key={day.dayOfWeek}
              style={[styles.dayTab, isSelected && styles.dayTabActive]}
              onPress={() => setSelectedDay(day.dayOfWeek)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}>
                {day.dayShort}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Schedule Workout List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeading}>Weekly Schedule</Text>
        {scheduleWithStatus.map((item) => {
          const isSelected = item.dayOfWeek === selectedDay;
          return (
            <TouchableOpacity
              key={item.dayOfWeek}
              activeOpacity={0.8}
              onPress={() => setSelectedDay(item.dayOfWeek)}
            >
              <GlassCard
                style={[
                  styles.workoutCard,
                  isSelected && styles.workoutCardSelected,
                ]}
              >
                <View style={styles.workoutCardLeft}>
                  <View
                    style={[
                      styles.thumbnailBadge,
                      { backgroundColor: `${item.colorAccent}18`, borderColor: `${item.colorAccent}40` },
                    ]}
                  >
                    <Text style={[styles.thumbnailIcon, { color: item.colorAccent }]}>⚡</Text>
                  </View>
                  <View>
                    <Text style={styles.dayLabel}>{item.dayFull}</Text>
                    <Text style={styles.workoutName}>{item.title}</Text>
                  </View>
                </View>

                {/* Completed / Pending Indicator */}
                {item.isCompleted ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                ) : (
                  <View style={styles.pendingRing} />
                )}
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.footer}>
        <NeonButton
          title={`Start ${activeDaySchedule.title}`}
          onPress={() => onStartWorkout && onStartWorkout(activeDaySchedule.title)}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  daySelectorContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
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
  dayTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  dayTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  workoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 14,
  },
  workoutCardSelected: {
    borderColor: Theme.colors.borderHighlight,
    backgroundColor: 'rgba(26, 38, 64, 0.65)',
  },
  workoutCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: {
    fontSize: 18,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  completedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: Theme.colors.emeraldSuccess,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: Theme.colors.emeraldSuccess,
    fontSize: 14,
    fontWeight: '900',
  },
  pendingRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
