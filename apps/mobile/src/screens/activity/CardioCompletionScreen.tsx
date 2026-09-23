import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { AlphaScreen, PrimaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

interface CardioCompletionScreenProps {
  stats: {
    durationSeconds: number;
    distanceKm: number;
    avgPace: string;
    calories: number;
    avgHr: number;
  };
  onFinish: (notes: string) => void;
}

export const CardioCompletionScreen: React.FC<CardioCompletionScreenProps> = ({
  stats,
  onFinish,
}) => {
  const [notes, setNotes] = useState('');

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <AlphaScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <View style={styles.trophyRing}>
            <Text style={styles.trophyIcon}>⚡</Text>
          </View>
          <Text style={styles.completeTitle}>CARDIO RECORDED</Text>
          <Text style={styles.sessionName}>AEROBIC ENDURANCE PROTOCOL</Text>
        </View>

        {/* Telemetry Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>{stats.distanceKm.toFixed(2)}</Text>
            <Text style={styles.statUnit}>km</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{formatTimer(stats.durationSeconds)}</Text>
            <Text style={styles.statUnit}>elapsed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVG PACE</Text>
            <Text style={styles.statValue}>{stats.avgPace}</Text>
            <Text style={styles.statUnit}>pace</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ENERGY BURN</Text>
            <Text style={styles.statValue}>{stats.calories}</Text>
            <Text style={styles.statUnit}>kcal</Text>
          </View>
        </View>

        {/* Heart Rate Telemetry Bar */}
        <View style={styles.hrCard}>
          <View style={styles.hrHeader}>
            <Text style={styles.hrTitle}>AEROBIC EFFICIENCY & HR</Text>
            <StatusBadge label="ZONE 2 TARGET" status="success" />
          </View>
          <Text style={styles.hrValue}>Average Heart Rate: {stats.avgHr} BPM</Text>
          <Text style={styles.hrDesc}>
            Mitochondrial density stimuli achieved. 82% of duration maintained within aerobic threshold.
          </Text>
        </View>

        {/* Notes input */}
        <Text style={styles.sectionHeader}>CONDITIONS & ATHLETE LOG</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Outdoor temperature, humidity, shoe model, cadence notes..."
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Commit to Activity Protocol"
          onPress={() => onFinish(notes)}
        />
      </View>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 16,
    paddingBottom: 28,
    gap: 16,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  trophyRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 2,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  trophyIcon: {
    fontSize: 32,
  },
  completeTitle: {
    fontSize: 22,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sessionName: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.5,
    marginTop: 4,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  statUnit: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  hrCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 6,
  },
  hrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hrTitle: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
  hrValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  hrDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
    color: Theme.colors.textPrimary,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: 12,
  },
});
