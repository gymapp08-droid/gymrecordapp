import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { AlphaScreen, PrimaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

interface WorkoutCompletionProps {
  sessionTitle?: string;
  durationSeconds?: number;
  totalVolumeKg?: number;
  setsCompleted?: number;
  repsCompleted?: number;
  prsAchieved?: string[];
  onFinish: (result: { rpe: number; notes: string }) => void;
}

export const WorkoutCompletionScreen: React.FC<WorkoutCompletionProps> = ({
  sessionTitle = 'Upper Hypertrophy Split',
  durationSeconds = 3480, // 58 mins
  totalVolumeKg = 8450,
  setsCompleted = 18,
  repsCompleted = 192,
  prsAchieved = ['Incline Dumbbell Press (42.5kg × 8)', 'Cable Lateral Raise (15kg × 14)'],
  onFinish,
}) => {
  const [rpe, setRpe] = useState<number>(8);
  const [notes, setNotes] = useState<string>('');

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleFinish = () => {
    onFinish({ rpe, notes });
  };

  return (
    <AlphaScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Glyphs */}
        <View style={styles.headerArea}>
          <View style={styles.trophyRing}>
            <Text style={styles.trophyIcon}>🏆</Text>
          </View>
          <Text style={styles.completeTitle}>SESSION COMPLETE</Text>
          <Text style={styles.sessionName}>{sessionTitle.toUpperCase()}</Text>
          <Text style={styles.timestampText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Telemetry Summary Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>VOLUME LIFTED</Text>
            <Text style={styles.statValue}>{totalVolumeKg.toLocaleString()}</Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{formatDuration(durationSeconds)}</Text>
            <Text style={styles.statUnit}>time elapsed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SETS LOGGED</Text>
            <Text style={styles.statValue}>{setsCompleted}</Text>
            <Text style={styles.statUnit}>completed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL REPS</Text>
            <Text style={styles.statValue}>{repsCompleted}</Text>
            <Text style={styles.statUnit}>recorded</Text>
          </View>
        </View>

        {/* PRs Section */}
        {prsAchieved.length > 0 && (
          <View style={styles.prContainer}>
            <View style={styles.prHeader}>
              <Text style={styles.prSectionTitle}>⚡ NEW PERSONAL RECORDS BROKEN</Text>
              <StatusBadge label="ACHIEVEMENT" status="success" />
            </View>
            {prsAchieved.map((pr, idx) => (
              <View key={idx} style={styles.prItem}>
                <Text style={styles.prCheck}>✓</Text>
                <Text style={styles.prText}>{pr}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rate of Perceived Exertion (RPE) */}
        <Text style={styles.sectionHeader}>RATE OF EXERTION (RPE)</Text>
        <Text style={styles.rpeDesc}>How strenuous was this session? (10 = absolute limit/failure)</Text>
        <View style={styles.rpeSelector}>
          {[6, 7, 8, 9, 10].map((val) => {
            const isSelected = rpe === val;
            return (
              <TouchableOpacity
                key={val}
                style={[styles.rpeBtn, isSelected && styles.rpeBtnActive]}
                onPress={() => setRpe(val)}
              >
                <Text style={[styles.rpeBtnText, isSelected && styles.rpeBtnTextActive]}>
                  {val}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text style={[styles.sectionHeader, { marginTop: 16 }]}>SESSION REFLECTION / NOTES</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Pumps felt strong, grip fatigue on pull-ups, hydration on point..."
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Commit Session to Database" onPress={handleFinish} />
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  trophyIcon: {
    fontSize: 34,
  },
  completeTitle: {
    fontSize: 22,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sessionName: {
    fontSize: 12,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.5,
    marginTop: 4,
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
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
    fontSize: 22,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  statUnit: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  prContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    gap: 8,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prSectionTitle: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.emeraldSuccess,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  prItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prCheck: {
    color: Theme.colors.emeraldSuccess,
    fontWeight: '900',
    fontSize: 14,
  },
  prText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  rpeDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: -8,
  },
  rpeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  rpeBtn: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rpeBtnActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  rpeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
  },
  rpeBtnTextActive: {
    color: Theme.colors.cyanGlow,
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
