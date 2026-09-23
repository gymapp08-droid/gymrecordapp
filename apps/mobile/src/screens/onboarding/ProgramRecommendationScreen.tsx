import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { UserProfileData } from './ProfileOnboardingScreen';
import { TrainingPreferencesData } from './TrainingPreferencesScreen';

export interface RecommendedProgram {
  id: string;
  name: string;
  tagline: string;
  matchScore: number;
  matchReason: string;
  weeklySchedule: { dayNumber: number; dayName: string; workoutTitle: string; focus: string }[];
  recommendedWeeks: number;
}

interface ProgramRecommendationScreenProps {
  goalId?: string;
  profileData?: UserProfileData;
  preferencesData?: TrainingPreferencesData;
  onBack: () => void;
  onSelectProgram: (program: RecommendedProgram) => void;
}

export const ProgramRecommendationScreen: React.FC<ProgramRecommendationScreenProps> = ({
  goalId = 'HYPERTROPHY',
  profileData,
  preferencesData,
  onBack,
  onSelectProgram,
}) => {
  // Deterministic transparent recommendation engine (Section 14)
  const candidatePrograms: RecommendedProgram[] = useMemo(() => {
    const days = preferencesData?.daysPerWeek || 4;
    const exp = profileData?.experienceLevel || 'INTERMEDIATE';
    const goal = goalId.toUpperCase();
    const env = preferencesData?.environment || 'COMMERCIAL_GYM';

    const programs: RecommendedProgram[] = [];

    // Option A: Push / Pull / Legs
    const pplScore =
      (goal.includes('HYPERTROPHY') || goal.includes('MUSCLE') ? 40 : 25) +
      (days >= 5 ? 35 : days === 4 ? 25 : 10) +
      (env === 'COMMERCIAL_GYM' ? 20 : 10) +
      (exp === 'INTERMEDIATE' || exp === 'ADVANCED' ? 5 : 0);

    programs.push({
      id: 'prog_ppl',
      name: 'Push / Pull / Legs (PPL)',
      tagline: 'High Hypertrophy Periodization Split',
      matchScore: Math.min(pplScore, 98),
      matchReason: 'Optimized for muscle hypertrophy and joint recovery with designated push, pull, and leg days.',
      recommendedWeeks: 12,
      weeklySchedule: [
        { dayNumber: 1, dayName: 'Monday', workoutTitle: 'Chest + Triceps', focus: 'Horizontal Push & Triceps' },
        { dayNumber: 2, dayName: 'Tuesday', workoutTitle: 'Back + Biceps', focus: 'Vertical / Horizontal Pull & Biceps' },
        { dayNumber: 3, dayName: 'Wednesday', workoutTitle: 'Shoulders + Abs', focus: 'Overhead Press & Core Stabilization' },
        { dayNumber: 4, dayName: 'Thursday', workoutTitle: 'Legs & Calves', focus: 'Squats, Quads, Hamstrings & Calves' },
        { dayNumber: 5, dayName: 'Friday', workoutTitle: 'Upper Body Power', focus: 'Compound Upper Volume' },
        { dayNumber: 6, dayName: 'Saturday', workoutTitle: 'Cardio / Active Recovery', focus: 'Zone 2 / Mobility' },
        { dayNumber: 7, dayName: 'Sunday', workoutTitle: 'Rest & Recovery', focus: 'Complete Rest' },
      ],
    });

    // Option B: Upper / Lower
    const ulScore =
      (days === 4 ? 45 : days === 3 ? 30 : 20) +
      (goal.includes('STRENGTH') ? 35 : 25) +
      (exp === 'INTERMEDIATE' || exp === 'BEGINNER' ? 18 : 10);

    programs.push({
      id: 'prog_upper_lower',
      name: 'Upper / Lower Split',
      tagline: 'Balanced Strength & Volume Distribution',
      matchScore: Math.min(ulScore, 95),
      matchReason: 'Balances systemic central nervous system fatigue with 2x weekly frequency per muscle group.',
      recommendedWeeks: 10,
      weeklySchedule: [
        { dayNumber: 1, dayName: 'Monday', workoutTitle: 'Upper Body A', focus: 'Chest, Back & Shoulders Heavy' },
        { dayNumber: 2, dayName: 'Tuesday', workoutTitle: 'Lower Body A', focus: 'Squats, Hamstrings & Calves' },
        { dayNumber: 3, dayName: 'Wednesday', workoutTitle: 'Rest Day', focus: 'Cardio & Recovery' },
        { dayNumber: 4, dayName: 'Thursday', workoutTitle: 'Upper Body B', focus: 'Hypertrophy Press & Pull Volume' },
        { dayNumber: 5, dayName: 'Friday', workoutTitle: 'Lower Body B', focus: 'Deadlifts & Leg Hypertrophy' },
        { dayNumber: 6, dayName: 'Saturday', workoutTitle: 'Rest Day', focus: 'Active Recovery' },
        { dayNumber: 7, dayName: 'Sunday', workoutTitle: 'Rest & Recovery', focus: 'Complete Rest' },
      ],
    });

    // Option C: Full Body Density
    const fbScore =
      (days === 3 ? 50 : days <= 3 ? 35 : 15) +
      (goal.includes('FAT_LOSS') || goal.includes('FITNESS') ? 35 : 20) +
      (exp === 'BEGINNER' ? 15 : 5);

    programs.push({
      id: 'prog_full_body',
      name: 'Full Body Density',
      tagline: 'Maximum Efficiency & Caloric Burn',
      matchScore: Math.min(fbScore, 92),
      matchReason: 'Hits every major compound movement pattern with high energy expenditure per session.',
      recommendedWeeks: 8,
      weeklySchedule: [
        { dayNumber: 1, dayName: 'Monday', workoutTitle: 'Full Body A', focus: 'Squat & Bench Press Compound' },
        { dayNumber: 2, dayName: 'Tuesday', workoutTitle: 'Rest Day', focus: 'Active Recovery' },
        { dayNumber: 3, dayName: 'Wednesday', workoutTitle: 'Full Body B', focus: 'Deadlift & Overhead Press Compound' },
        { dayNumber: 4, dayName: 'Thursday', workoutTitle: 'Rest Day', focus: 'Active Recovery' },
        { dayNumber: 5, dayName: 'Friday', workoutTitle: 'Full Body C', focus: 'Pull-up & Lunge Density' },
        { dayNumber: 6, dayName: 'Saturday', workoutTitle: 'Rest Day', focus: 'Cardio & Mobility' },
        { dayNumber: 7, dayName: 'Sunday', workoutTitle: 'Rest & Recovery', focus: 'Complete Rest' },
      ],
    });

    // Sort by match score descending
    return programs.sort((a, b) => b.matchScore - a.matchScore);
  }, [goalId, profileData, preferencesData]);

  const [selectedId, setSelectedId] = useState<string>(candidatePrograms[0]?.id || 'prog_ppl');
  const activeProgram = candidatePrograms.find((p) => p.id === selectedId) || candidatePrograms[0]!;

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Recommended Protocol"
        subtitle="Step 4 of 4 · Program Selection"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.leadText}>
          Based on your biometrics, target goal, and weekly availability, the system has structured the optimal program.
        </Text>

        {/* Candidate Program Selector Cards */}
        <View style={styles.candidateList}>
          {candidatePrograms.map((prog, idx) => {
            const isSelected = prog.id === selectedId;
            const isTopMatch = idx === 0;
            return (
              <TouchableOpacity
                key={prog.id}
                style={[styles.programCard, isSelected && styles.programCardActive]}
                onPress={() => setSelectedId(prog.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={styles.titleCol}>
                    <View style={styles.badgeRow}>
                      {isTopMatch && <StatusBadge label="TOP RECOMMENDATION" status="success" />}
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreText}>{prog.matchScore}% MATCH</Text>
                      </View>
                    </View>
                    <Text style={[styles.programTitle, isSelected && styles.programTitleActive]}>
                      {prog.name}
                    </Text>
                    <Text style={styles.tagline}>{prog.tagline}</Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>

                <Text style={styles.reasonText}>{prog.matchReason}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Program Weekly Schedule Preview */}
        <View style={styles.schedulePreviewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>WEEKLY TRAINING SCHEDULE</Text>
            <StatusBadge label={`${activeProgram.recommendedWeeks} WEEKS`} status="neutral" />
          </View>

          <View style={styles.daysList}>
            {activeProgram.weeklySchedule.map((d) => {
              const isRest = d.workoutTitle.toLowerCase().includes('rest');
              return (
                <View key={d.dayNumber} style={styles.dayRow}>
                  <View style={styles.dayNameCol}>
                    <Text style={styles.dayName}>{d.dayName}</Text>
                    <Text style={styles.dayNumberText}>Day {d.dayNumber}</Text>
                  </View>
                  <View style={styles.workoutCol}>
                    <Text style={[styles.workoutTitle, isRest && styles.restTitle]}>
                      {d.workoutTitle}
                    </Text>
                    <Text style={styles.focusText}>{d.focus}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <PrimaryButton
          title={`Select ${activeProgram.name} & Continue`}
          onPress={() => onSelectProgram(activeProgram)}
          style={styles.selectBtn}
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
  candidateList: {
    gap: 12,
  },
  programCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 10,
  },
  programCardActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scoreBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.pill,
  },
  scoreText: {
    color: Theme.colors.cyanGlow,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Theme.typography.fontMono,
  },
  programTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Theme.typography.fontDisplay,
  },
  programTitleActive: {
    color: Theme.colors.cyanGlow,
  },
  tagline: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: Theme.typography.fontBody,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 4,
  },
  radioCircleActive: {
    borderColor: Theme.colors.cyanGlow,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.cyanGlow,
  },
  reasonText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Theme.typography.fontBody,
  },
  schedulePreviewCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Theme.typography.fontMono,
  },
  daysList: {
    gap: 10,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 10,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dayNameCol: {
    width: 90,
  },
  dayName: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  dayNumberText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: Theme.typography.fontMono,
  },
  workoutCol: {
    flex: 1,
  },
  workoutTitle: {
    color: Theme.colors.cyanGlow,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  restTitle: {
    color: Theme.colors.textMuted,
  },
  focusText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontFamily: Theme.typography.fontBody,
  },
  selectBtn: {
    marginTop: 8,
  },
});
