import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, MetricCard, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

export interface CardioSessionRecord {
  id: string;
  type: 'RUNNING' | 'CYCLING' | 'ROWING' | 'HIIT';
  title: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  avgPace: string;
  avgHeartRate: number;
  calories: number;
}

interface ActivityDashboardScreenProps {
  onStartCardio: (modality: string) => void;
}

export const ActivityDashboardScreen: React.FC<ActivityDashboardScreenProps> = ({
  onStartCardio,
}) => {
  const [steps] = useState(7420);
  const [stepsTarget] = useState(10000);
  const [activeCalories] = useState(540);
  const [activeMinutes] = useState(48);

  const recentSessions: CardioSessionRecord[] = [
    {
      id: 'c-1',
      type: 'RUNNING',
      title: 'Zone 2 Base Aerobic Run',
      date: 'Yesterday, 06:45 AM',
      distanceKm: 6.42,
      durationMinutes: 34,
      avgPace: '5:18 /km',
      avgHeartRate: 142,
      calories: 410,
    },
    {
      id: 'c-2',
      type: 'ROWING',
      title: '500m Intervals Ergometer',
      date: '3 days ago',
      distanceKm: 4.0,
      durationMinutes: 18,
      avgPace: '1:48 /500m',
      avgHeartRate: 168,
      calories: 245,
    },
  ];

  const stepsPercent = Math.min(Math.round((steps / stepsTarget) * 100), 100);

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Activity & Cardio"
        subtitle="ENDURANCE & AEROBIC CAPACITY"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Step Telemetry Card */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View>
              <Text style={styles.stepLabel}>DAILY LOCOMOTION</Text>
              <View style={styles.stepRow}>
                <Text style={styles.stepCount}>{steps.toLocaleString()}</Text>
                <Text style={styles.stepTarget}>/ {stepsTarget.toLocaleString()} steps</Text>
              </View>
            </View>
            <StatusBadge label={`${stepsPercent}% MET`} status="neutral" />
          </View>

          <View style={styles.stepBarTrack}>
            <View style={[styles.stepBarFill, { width: `${stepsPercent}%` }]} />
          </View>

          <View style={styles.stepSubRow}>
            <Text style={styles.stepSubText}>Distance: {(steps * 0.00078).toFixed(1)} km</Text>
            <Text style={styles.stepSubText}>Burn: ~{Math.round(steps * 0.04)} kcal</Text>
          </View>
        </View>

        {/* Quick Launch Modality Grid */}
        <Text style={styles.sectionHeader}>LAUNCH CARDIO ENGINE</Text>
        <View style={styles.modalityGrid}>
          <TouchableOpacity
            style={styles.modalityCard}
            onPress={() => onStartCardio('OUTDOOR_RUN')}
            activeOpacity={0.8}
          >
            <Text style={styles.modalityIcon}>🏃‍♂️</Text>
            <Text style={styles.modalityTitle}>Run</Text>
            <Text style={styles.modalitySub}>GPS & Pace</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalityCard}
            onPress={() => onStartCardio('CYCLING')}
            activeOpacity={0.8}
          >
            <Text style={styles.modalityIcon}>🚴</Text>
            <Text style={styles.modalityTitle}>Cycle</Text>
            <Text style={styles.modalitySub}>Watts & Speed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalityCard}
            onPress={() => onStartCardio('ROWING')}
            activeOpacity={0.8}
          >
            <Text style={styles.modalityIcon}>🚣</Text>
            <Text style={styles.modalityTitle}>Row</Text>
            <Text style={styles.modalitySub}>Ergometer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalityCard}
            onPress={() => onStartCardio('HIIT')}
            activeOpacity={0.8}
          >
            <Text style={styles.modalityIcon}>⚡</Text>
            <Text style={styles.modalityTitle}>HIIT</Text>
            <Text style={styles.modalitySub}>Tabata/Metcon</Text>
          </TouchableOpacity>
        </View>

        {/* Aerobic Telemetry Grid */}
        <Text style={styles.sectionHeader}>WEEKLY AEROBIC LOAD</Text>
        <View style={styles.metricGrid}>
          <MetricCard
            label="ACTIVE TIME"
            value={activeMinutes}
            unit="min"
            delta="+15m vs avg"
            isPositive
          />
          <MetricCard
            label="ACTIVE BURN"
            value={activeCalories}
            unit="kcal"
            delta="Target 600"
          />
        </View>

        {/* Recent Cardio Log */}
        <Text style={styles.sectionHeader}>RECENT SESSIONS</Text>
        <View style={styles.sessionList}>
          {recentSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionCardTop}>
                <View>
                  <Text style={styles.sessionTag}>{session.type}</Text>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                </View>
                <Text style={styles.sessionDate}>{session.date}</Text>
              </View>

              <View style={styles.sessionMetricsRow}>
                <View style={styles.sessionMetric}>
                  <Text style={styles.metricVal}>{session.distanceKm} km</Text>
                  <Text style={styles.metricLab}>DISTANCE</Text>
                </View>
                <View style={styles.sessionMetric}>
                  <Text style={styles.metricVal}>{session.avgPace}</Text>
                  <Text style={styles.metricLab}>AVG PACE</Text>
                </View>
                <View style={styles.sessionMetric}>
                  <Text style={styles.metricVal}>{session.avgHeartRate} bpm</Text>
                  <Text style={styles.metricLab}>AVG HR</Text>
                </View>
                <View style={styles.sessionMetric}>
                  <Text style={styles.metricVal}>{session.calories}</Text>
                  <Text style={styles.metricLab}>KCAL</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 28,
    gap: 16,
  },
  stepCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    shadowColor: Theme.colors.cyanGlow,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  stepCount: {
    fontSize: 32,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  stepTarget: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  stepBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  stepBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.cyanGlow,
    borderRadius: 4,
  },
  stepSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepSubText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 4,
  },
  modalityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  modalityCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  modalityIcon: {
    fontSize: 22,
  },
  modalityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  modalitySub: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  sessionList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 10,
  },
  sessionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTag: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  sessionDate: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  sessionMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
  },
  sessionMetric: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Theme.typography.display.fontFamily,
    color: Theme.colors.textPrimary,
  },
  metricLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
});
