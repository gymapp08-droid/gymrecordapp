import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton } from '../../components';
import { Theme } from '../../theme/tokens';

export type TrainingEnvironment = 'COMMERCIAL_GYM' | 'HOME_GYM' | 'MINIMAL_EQUIPMENT';

export type ProgramSplit = 'PPL' | 'UPPER_LOWER' | 'FULL_BODY' | 'CLASSIC_SPLIT';

export interface TrainingPreferencesData {
  daysPerWeek?: number;
  sessionDurationMin: number;
  environment: TrainingEnvironment;
  splitPreference?: ProgramSplit;
  equipmentDetails?: string[];
}

interface TrainingPreferencesScreenProps {
  onBack: () => void;
  onNext?: (preferences: TrainingPreferencesData) => void;
  onFinish?: (preferences: TrainingPreferencesData) => void;
}

const ENVIRONMENT_OPTIONS = [
  {
    id: 'COMMERCIAL_GYM' as const,
    label: 'Commercial Gym',
    desc: 'Full gym setup: Barbells, Dumbbells, Machines, Cables & Benches',
  },
  {
    id: 'HOME_GYM' as const,
    label: 'Home Gym',
    desc: 'Barbell, weight plates, adjustable dumbbells, rack & bench',
  },
  {
    id: 'MINIMAL_EQUIPMENT' as const,
    label: 'Minimal Equipment & Bodyweight',
    desc: 'Dumbbells, resistance bands, pull-up bar, and calisthenics',
  },
];

export const TrainingPreferencesScreen: React.FC<TrainingPreferencesScreenProps> = ({
  onBack,
  onNext,
  onFinish,
}) => {
  const [sessionDurationMin, setSessionDurationMin] = useState<number>(60);
  const [environment, setEnvironment] = useState<TrainingEnvironment>('COMMERCIAL_GYM');

  const handleNext = () => {
    try {
      const data: TrainingPreferencesData = {
        daysPerWeek: 0,
        sessionDurationMin,
        environment,
      };
      const callback = onNext || onFinish;
      if (typeof callback === 'function') {
        callback(data);
      }
    } catch (err) {
      console.warn('[TrainingPreferences] Navigation error:', err);
    }
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Training Preferences"
        subtitle="Step 3 of 4 · Architecture"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.leadText}>
          Configure your training environment and session duration. Your weekly workout frequency and rest days are governed directly by your chosen GRAVITY program.
        </Text>

        {/* Training Environment */}
        <Text style={styles.sectionLabel}>TRAINING ENVIRONMENT</Text>
        <View style={styles.optionList}>
          {ENVIRONMENT_OPTIONS.map((item) => {
            const isSelected = environment === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.optionCard, isSelected && styles.optionCardActive]}
                onPress={() => setEnvironment(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                    {item.label}
                  </Text>
                  {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </View>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Session Duration */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>TARGET SESSION DURATION</Text>
        <View style={styles.durationRow}>
          {[45, 60, 75, 90].map((dur) => {
            const isSelected = sessionDurationMin === dur;
            return (
              <TouchableOpacity
                key={dur}
                style={[styles.durationPill, isSelected && styles.durationPillActive]}
                onPress={() => setSessionDurationMin(dur)}
                activeOpacity={0.8}
              >
                <Text style={[styles.durationText, isSelected && styles.durationTextActive]}>
                  {dur} min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton
          title="Browse Matching Programs"
          onPress={handleNext}
          style={styles.continueBtn}
        />
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  leadText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Theme.typography.fontBody,
  },
  sectionLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Theme.typography.fontMono,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  freqCardActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  freqNumber: {
    color: Theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Theme.typography.fontDisplay,
  },
  freqNumberActive: {
    color: Theme.colors.cyanGlow,
  },
  freqSub: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  freqSubActive: {
    color: Theme.colors.textSecondary,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    height: 42,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPillActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  durationText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  durationTextActive: {
    color: Theme.colors.cyanGlow,
  },
  optionList: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 6,
  },
  optionCardActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  cardTitleActive: {
    color: Theme.colors.cyanGlow,
  },
  pillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.pill,
  },
  pillBadgeText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  checkIcon: {
    color: Theme.colors.cyanGlow,
    fontSize: 16,
    fontWeight: '900',
  },
  cardDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Theme.typography.fontBody,
  },
  continueBtn: {
    marginTop: 8,
  },
});
