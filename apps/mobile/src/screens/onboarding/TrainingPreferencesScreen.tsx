import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton } from '../../components';
import { Theme } from '../../theme/tokens';

export interface TrainingPreferencesData {
  daysPerWeek: number;
  sessionDurationMin: number;
  equipment: 'COMMERCIAL_GYM' | 'HOME_GYM' | 'DUMBBELLS_ONLY' | 'BODYWEIGHT';
  splitPreference: 'PPL' | 'UPPER_LOWER' | 'FULL_BODY' | 'BRO_SPLIT';
}

interface TrainingPreferencesScreenProps {
  onBack: () => void;
  onFinish: (preferences: TrainingPreferencesData) => void;
}

const EQUIPMENT_OPTIONS = [
  { id: 'COMMERCIAL_GYM', label: 'Commercial Gym', sub: 'Full access to barbells, racks, cables & machines' },
  { id: 'HOME_GYM', label: 'Home Gym', sub: 'Power rack, barbell, plates & bench' },
  { id: 'DUMBBELLS_ONLY', label: 'Dumbbells Only', sub: 'Adjustable dumbbells & flat/incline bench' },
  { id: 'BODYWEIGHT', label: 'Bodyweight / Calisthenics', sub: 'Pull-up bar, dip station & rings' },
] as const;

const SPLIT_OPTIONS = [
  { id: 'PPL', label: 'Push · Pull · Legs', tag: 'Recommended' },
  { id: 'UPPER_LOWER', label: 'Upper · Lower Split', tag: 'High Frequency' },
  { id: 'FULL_BODY', label: 'Full Body Density', tag: 'Time Efficient' },
  { id: 'BRO_SPLIT', label: 'Classic Hypertrophy', tag: 'Isolation Focus' },
] as const;

export const TrainingPreferencesScreen: React.FC<TrainingPreferencesScreenProps> = ({ onBack, onFinish }) => {
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [sessionDurationMin, setSessionDurationMin] = useState<number>(60);
  const [equipment, setEquipment] = useState<'COMMERCIAL_GYM' | 'HOME_GYM' | 'DUMBBELLS_ONLY' | 'BODYWEIGHT'>('COMMERCIAL_GYM');
  const [splitPreference, setSplitPreference] = useState<'PPL' | 'UPPER_LOWER' | 'FULL_BODY' | 'BRO_SPLIT'>('PPL');

  const handleFinish = () => {
    onFinish({
      daysPerWeek,
      sessionDurationMin,
      equipment,
      splitPreference,
    });
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Protocol Setup"
        subtitle="Step 3 of 3 · Architecture"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.leadText}>
          Configure your training cadence. The periodization engine will structure progressive overload accordingly.
        </Text>

        {/* Days per week */}
        <Text style={styles.sectionLabel}>WEEKLY FREQUENCY (DAYS)</Text>
        <View style={styles.numberPills}>
          {[2, 3, 4, 5, 6].map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.numberPill, daysPerWeek === day && styles.numberPillActive]}
              onPress={() => setDaysPerWeek(day)}
            >
              <Text style={[styles.numberText, daysPerWeek === day && styles.numberTextActive]}>
                {day}
              </Text>
              <Text style={[styles.numberSub, daysPerWeek === day && styles.numberSubActive]}>
                days/wk
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>SESSION DURATION</Text>
        <View style={styles.durationRow}>
          {[45, 60, 75, 90].map((dur) => (
            <TouchableOpacity
              key={dur}
              style={[styles.durationPill, sessionDurationMin === dur && styles.durationPillActive]}
              onPress={() => setSessionDurationMin(dur)}
            >
              <Text style={[styles.durationText, sessionDurationMin === dur && styles.durationTextActive]}>
                {dur}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Equipment */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>EQUIPMENT ENVIRONMENT</Text>
        <View style={styles.equipList}>
          {EQUIPMENT_OPTIONS.map((item) => {
            const isSelected = equipment === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.equipCard, isSelected && styles.equipCardActive]}
                onPress={() => setEquipment(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.equipHeader}>
                  <Text style={[styles.equipLabel, isSelected && styles.equipLabelActive]}>
                    {item.label}
                  </Text>
                  <View style={[styles.radio, isSelected && styles.radioActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={styles.equipSub}>{item.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Split preference */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>PROGRAM SPLIT</Text>
        <View style={styles.splitList}>
          {SPLIT_OPTIONS.map((split) => {
            const isSelected = splitPreference === split.id;
            return (
              <TouchableOpacity
                key={split.id}
                style={[styles.splitCard, isSelected && styles.splitCardActive]}
                onPress={() => setSplitPreference(split.id)}
              >
                <Text style={[styles.splitLabel, isSelected && styles.splitLabelActive]}>
                  {split.label}
                </Text>
                <View style={[styles.splitTag, isSelected && styles.splitTagActive]}>
                  <Text style={[styles.splitTagText, isSelected && styles.splitTagTextActive]}>
                    {split.tag}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Finalize Calibration" onPress={handleFinish} />
      </View>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  leadText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 10,
  },
  numberPills: {
    flexDirection: 'row',
    gap: 8,
  },
  numberPill: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  numberPillActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  numberText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Theme.typography.display.fontFamily,
    color: Theme.colors.textPrimary,
  },
  numberTextActive: {
    color: Theme.colors.cyanGlow,
  },
  numberSub: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  numberSubActive: {
    color: Theme.colors.cyanGlow,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  durationPillActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  durationTextActive: {
    color: Theme.colors.cyanGlow,
  },
  equipList: {
    gap: 10,
  },
  equipCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
  },
  equipCardActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  equipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  equipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  equipLabelActive: {
    color: Theme.colors.cyanGlow,
  },
  equipSub: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Theme.colors.cyanGlow,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.cyanGlow,
  },
  splitList: {
    gap: 8,
  },
  splitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  splitCardActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  splitLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  splitLabelActive: {
    color: Theme.colors.cyanGlow,
  },
  splitTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  splitTagActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  splitTagText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  splitTagTextActive: {
    color: Theme.colors.cyanGlow,
  },
  footer: {
    paddingTop: 16,
  },
});
