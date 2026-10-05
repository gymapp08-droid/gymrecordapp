import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { usePerformance } from '../../context/PerformanceContext';
import { useAuth } from '../../context/AuthContext';

interface MoreMenuScreenProps {
  onNavigate: (route: string) => void;
  onBack?: () => void;
}

export const MoreMenuScreen: React.FC<MoreMenuScreenProps> = ({ onNavigate, onBack }) => {
  const { user } = useAuth();
  const {
    activeProgramTitle,
    currentProgramWeek,
    workout,
    nutrition,
    streak,
  } = usePerformance();

  const sections = [
    {
      title: 'BIOMETRICS & TELEMETRY',
      items: [
        { id: 'PROFILE', label: 'Athlete Identity & Tier', icon: '👤', badge: 'PRO' },
        { id: 'BODY_METRICS', label: 'Body Mass & Circumferences', icon: '⚖️' },
        { id: 'GOALS', label: 'Protocol Objectives & Deadlines', icon: '🎯' },
        { id: 'MILESTONES', label: 'Achievements & Protocol Medals', icon: '🏆', badge: '3 UNLOCKED' },
      ],
    },
    {
      title: 'KNOWLEDGE & LIBRARIES',
      items: [
        { id: 'PROGRAM_CATALOG', label: 'GRAVITY Program Catalog', icon: '⚡', badge: '52 PROGRAMS' },
        { id: 'EXERCISE_LIBRARY', label: 'Exercise Biomechanics & Cues', icon: '📖' },
        { id: 'FOOD_LIBRARY', label: 'Nutritional Food Database', icon: '🥗' },
        { id: 'CALENDAR', label: 'Training History & Consistency', icon: '📅' },
      ],
    },
    {
      title: 'HARDWARE & SYSTEM',
      items: [
        { id: 'INTEGRATIONS', label: 'Wearables & Health Connections', icon: '⌚', badge: 'ACTIVE' },
        { id: 'REMINDERS', label: 'Hydration & Workout Schedules', icon: '⏰' },
        { id: 'NOTIFICATIONS', label: 'Protocol Alerts & Signals', icon: '🔔' },
        { id: 'SETTINGS', label: 'App Settings & Display Theme', icon: '⚙️' },
      ],
    },
  ];

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Command Hub"
        subtitle="GRAVITY PERFORMANCE PLATFORM"
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        bounces={true}
      >
        {/* Active Program Live Telemetry Banner */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View>
              <Text style={styles.telemetrySub}>
                {user?.fullName ? `ATHLETE: ${user.fullName.toUpperCase()}` : 'ACTIVE PROTOCOL'}
              </Text>
              <Text style={styles.telemetryTitle}>{activeProgramTitle || 'GRAVITY Core Split'}</Text>
            </View>
            <StatusBadge
              label={`WEEK ${currentProgramWeek}`}
              status="info"
            />
          </View>

          <View style={styles.telemetryStatsRow}>
            <View style={styles.telemetryStatItem}>
              <Text style={styles.statLabel}>TODAY WORKOUT</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {workout.isRestDay ? 'REST' : workout.name}
              </Text>
            </View>
            <View style={styles.telemetryStatItem}>
              <Text style={styles.statLabel}>EXERCISES</Text>
              <Text style={styles.statValue}>
                {workout.completedExercisesCount} / {workout.totalExercises}
              </Text>
            </View>
            <View style={styles.telemetryStatItem}>
              <Text style={styles.statLabel}>NUTRITION</Text>
              <Text style={styles.statValue}>
                {nutrition.caloriesConsumed}/{nutrition.caloriesTarget} kcal
              </Text>
            </View>
            <View style={styles.telemetryStatItem}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statValue}>{streak.days}D</Text>
            </View>
          </View>
        </View>

        {sections.map((sec, sIdx) => (
          <View key={sIdx} style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>{sec.title}</Text>
            <View style={styles.menuGroup}>
              {sec.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuRow}
                  onPress={() => onNavigate(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRight}>
                    {item.badge && <StatusBadge label={item.badge} status="neutral" />}
                    <Text style={styles.menuChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: 10,
    paddingBottom: 60,
    flexGrow: 1,
    gap: 18,
  },
  telemetryCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    gap: 12,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetrySub: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  telemetryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  telemetryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  telemetryStatItem: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.2,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  menuGroup: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuChevron: {
    fontSize: 18,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
});
