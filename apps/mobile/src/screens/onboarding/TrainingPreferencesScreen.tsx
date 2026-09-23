import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton } from '../../components';
import { Theme } from '../../theme/tokens';

export type TrainingEnvironment = 'COMMERCIAL_GYM' | 'HOME_GYM' | 'MINIMAL_EQUIPMENT';

export type ProgramSplit = 'PPL' | 'UPPER_LOWER' | 'FULL_BODY' | 'CLASSIC_SPLIT';

export interface TrainingPreferencesData {
  daysPerWeek: number;
  sessionDurationMin: number;
  environment: TrainingEnvironment;
  splitPreference: ProgramSplit;
  equipmentDetails?: string[];
}

interface TrainingPreferencesScreenProps {
  onBack: () => void;
  onNext: (preferences: TrainingPreferencesData) => void;
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
    label: 'Minimal Equipment',
    desc: 'Dumbbells, resistance bands, pull-up bar, and bodyweight',
  },
];

const SPLIT_OPTIONS = [
  {
    id: 'PPL' as const,
    label: 'Push / Pull / Legs',
    days: '3–6 days/wk',
    desc: 'High hypertrophy frequency targeting muscle synergies together.',
  },
  {
    id: 'UPPER_LOWER' as const,
    label: 'Upper / Lower',
    days: '4 days/wk',
    desc: 'Balanced recovery and systemic volume distribution across upper and lower body.',
  },
  {
    id: 'FULL_BODY' as const,
    label: 'Full Body Density',
    days: '3 days/wk',
    desc: 'High training efficiency hitting every major movement pattern per session.',
  },
  {
    id: 'CLASSIC_SPLIT' as const,
    label: 'Classic Bodypart Split',
    days: '4–5 days/wk',
    desc: 'Direct muscle isolation focus with dedicated training days.',
  },
];

export const TrainingPreferencesScreen: React.FC<TrainingPreferencesScreenProps> = ({
  onBack,
  onNext,
}) => {
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [sessionDurationMin, setSessionDurationMin] = useState<number>(60);
  const [environment, setEnvironment] = useState<TrainingEnvironment>('COMMERCIAL_GYM');
  const [splitPreference, setSplitPreference] = useState<ProgramSplit>('PPL');

  const handleNext = () => {
    onNext({
      daysPerWeek,
      sessionDurationMin,
      environment,
      splitPreference,
    });
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
          Configure your training cadence and equipment access. The recommendation engine will select an optimal program structure.
        </Text>

        {/* Weekly Frequency */}
        <Text style={styles.sectionLabel}>WEEKLY FREQUENCY (DAYS)</Text>
        <View style={styles.frequencyRow}>
          {[3, 4, 5, 6].map((day) => {
            const isSelected = daysPerWeek === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.freqCard, isSelected && styles.freqCardActive]}
                onPress={() => setDaysPerWeek(day)}
                activeOpacity={0.8}
              >
                <Text style={[styles.freqNumber, isSelected && styles.freqNumberActive]}>
                  {day}
                </Text>
                <Text style={[styles.freqSub, isSelected && styles.freqSubActive]}>
                  days / wk
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Session Duration */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>SESSION DURATION</Text>
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

        {/* Training Environment (Section 12) */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>TRAINING ENVIRONMENT</Text>
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

        {/* Split Preference (Section 13) */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>PREFERRED PROGRAM SPLIT</Text>
        <View style={styles.optionList}>
          {SPLIT_OPTIONS.map((item) => {
            const isSelected = splitPreference === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.optionCard, isSelected && styles.optionCardActive]}
                onPress={() => setSplitPreference(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleWithBadge}>
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                      {item.label}
                    </Text>
                    <View style={styles.pillBadge}>
                      <Text style={styles.pillBadgeText}>{item.days}</Text>
                    </View>
                  </View>
                  {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </View>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton
          title="Analyze & Recommend Program"
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
