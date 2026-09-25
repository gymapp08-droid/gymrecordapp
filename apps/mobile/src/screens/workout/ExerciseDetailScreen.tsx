import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

export interface ExerciseDetailData {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  targetArea?: string;
  movementPattern?: string;
  exerciseType?: 'COMPOUND' | 'ISOLATION';
  equipment: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tempo: string;
  prescription?: {
    sets: number;
    reps: string;
    targetWeightKg?: number;
    restSeconds: number;
  };
  instructions: string[];
  cues: string[];
  commonMistakes?: string[];
  prWeightKg: number;
  prReps: number;
}

interface ExerciseDetailScreenProps {
  exercise?: ExerciseDetailData;
  onBack: () => void;
  onAddToSession?: () => void;
}

const DEFAULT_EXERCISE: ExerciseDetailData = {
  id: 'ex-barbell-bench-press',
  name: 'Barbell Bench Press',
  muscleGroup: 'Chest (Pectoralis Major)',
  secondaryMuscles: ['Triceps Brachii', 'Anterior Deltoids (Front Shoulder)'],
  targetArea: 'Sternal & Mid-Chest — Horizontal Adduction & Extension',
  movementPattern: 'Horizontal Push',
  exerciseType: 'COMPOUND',
  equipment: 'Flat Bench, Olympic Barbell, Plates',
  difficulty: 'INTERMEDIATE',
  tempo: '3-1-1-0 (3s eccentric, 1s pause on chest, explosive drive)',
  prescription: {
    sets: 4,
    reps: '8–12 reps',
    targetWeightKg: 60,
    restSeconds: 90,
  },
  instructions: [
    'Lie flat with eyes aligned directly beneath the racked barbell.',
    'Retract and depress scapulae firmly into the bench pad; plant heels aggressively into the floor.',
    'Grip bar slightly wider than shoulder-width with wrists stacked directly above forearms.',
    'Unrack smoothly and establish bar control directly over mid-sternum.',
    'Lower the bar under strict 3-second control until it lightly touches lower-mid sternum.',
    'Press bar upward in a slight natural diagonal arc back over shoulders without losing shoulder pack.',
  ],
  cues: [
    'Tuck elbows at ~45° to 75° angle to protect the anterior rotator cuff.',
    'Maintain continuous leg drive through heels into hips throughout the press.',
    'Bend the bar — mentally twist wrists outward to maximally engage lats.',
  ],
  commonMistakes: [
    'Flaring elbows out to 90 degrees (strains anterior shoulder capsule).',
    'Bouncing bar violently off sternum (eliminates eccentric muscle tension).',
    'Lifting glutes off the bench or sliding feet during concentric drive.',
  ],
  prWeightKg: 85.0,
  prReps: 8,
};

export const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({
  exercise: incomingExercise,
  onBack,
  onAddToSession,
}) => {
  const exercise = {
    ...DEFAULT_EXERCISE,
    ...(incomingExercise || {}),
    prescription: {
      ...DEFAULT_EXERCISE.prescription,
      ...(incomingExercise?.prescription || {}),
    },
    commonMistakes: incomingExercise?.commonMistakes || DEFAULT_EXERCISE.commonMistakes,
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title={exercise.name}
        subtitle={`${exercise.exerciseType} · ${(exercise.movementPattern || 'COMPOUND MOVEMENT').toUpperCase()}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Planned Prescription Banner (Plan vs Actual) */}
        <View style={styles.prescriptionCard}>
          <View style={styles.prescHeader}>
            <Text style={styles.prescTag}>TARGET PRESCRIPTION (PLANNED)</Text>
            <StatusBadge label="PRESCRIBED PLAN" status="neutral" />
          </View>
          <View style={styles.prescGrid}>
            <View style={styles.prescCol}>
              <Text style={styles.prescVal}>{exercise.prescription.sets}</Text>
              <Text style={styles.prescLabel}>TARGET SETS</Text>
            </View>
            <View style={styles.prescCol}>
              <Text style={styles.prescVal}>{exercise.prescription.reps}</Text>
              <Text style={styles.prescLabel}>TARGET REPS</Text>
            </View>
            {exercise.prescription.targetWeightKg && (
              <View style={styles.prescCol}>
                <Text style={styles.prescVal}>{exercise.prescription.targetWeightKg} kg</Text>
                <Text style={styles.prescLabel}>TARGET LOAD</Text>
              </View>
            )}
            <View style={styles.prescCol}>
              <Text style={styles.prescVal}>{exercise.prescription.restSeconds}s</Text>
              <Text style={styles.prescLabel}>REST INTERVAL</Text>
            </View>
          </View>
        </View>

        {/* Anatomy & Muscle Targeting ("Ye exercise body mein kahan lagti hai?") */}
        <View style={styles.anatomyCard}>
          <View style={styles.anatomyHeader}>
            <Text style={styles.anatomyTag}>MUSCLE TARGET · WHERE DOES THIS HIT?</Text>
            <StatusBadge label="BIOMECHANICS" status="info" />
          </View>

          <Text style={styles.targetAreaHighlight}>{exercise.targetArea}</Text>

          <View style={styles.muscleSplit}>
            <View style={styles.muscleBlock}>
              <Text style={styles.muscleRoleLabel}>PRIMARY DRIVER</Text>
              <View style={styles.primaryMuscleBadge}>
                <Text style={styles.primaryMuscleText}>{exercise.muscleGroup.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.muscleBlock}>
              <Text style={styles.muscleRoleLabel}>SECONDARY & STABILIZERS</Text>
              <View style={styles.secondaryRow}>
                {(exercise.secondaryMuscles || []).map((sec, i) => (
                  <View key={i} style={styles.secondaryMuscleChip}>
                    <Text style={styles.secondaryMuscleText}>{sec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* All-Time PR Snapshot */}
        <View style={styles.prCard}>
          <View>
            <Text style={styles.prTag}>YOUR PERSONAL BEST RECORD</Text>
            <View style={styles.prRow}>
              <Text style={styles.prWeight}>{exercise.prWeightKg} kg</Text>
              <Text style={styles.prReps}>× {exercise.prReps} reps</Text>
            </View>
          </View>
          <StatusBadge label="VERIFIED PR" status="success" />
        </View>

        {/* Specifications Grid */}
        <View style={styles.specGrid}>
          <View style={styles.specCard}>
            <Text style={styles.specKey}>EQUIPMENT</Text>
            <Text style={styles.specVal}>{exercise.equipment}</Text>
          </View>
          <View style={styles.specCard}>
            <Text style={styles.specKey}>TEMPO CADENCE</Text>
            <Text style={styles.specVal}>{exercise.tempo}</Text>
          </View>
        </View>

        {/* Execution Protocol */}
        <Text style={styles.sectionHeader}>STEP-BY-STEP EXECUTION</Text>
        <View style={styles.instructionList}>
          {(exercise.instructions || []).map((step, idx) => (
            <View key={idx} style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Technique Cues */}
        <Text style={styles.sectionHeader}>COACHING CUES</Text>
        <View style={styles.cueBox}>
          {(exercise.cues || []).map((cue, idx) => (
            <View key={idx} style={styles.cueRow}>
              <Text style={styles.cueBullet}>⚡</Text>
              <Text style={styles.cueText}>{cue}</Text>
            </View>
          ))}
        </View>

        {/* Common Mistakes */}
        {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>COMMON MISTAKES TO AVOID</Text>
            <View style={styles.mistakeBox}>
              {(exercise.commonMistakes || []).map((mistake, idx) => (
                <View key={idx} style={styles.mistakeRow}>
                  <Text style={styles.mistakeBullet}>⚠️</Text>
                  <Text style={styles.mistakeText}>{mistake}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {onAddToSession && (
        <View style={styles.footer}>
          <PrimaryButton title="Add to Active Session" onPress={onAddToSession} />
        </View>
      )}
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 12,
    paddingBottom: 32,
    gap: 16,
  },
  prescriptionCard: {
    backgroundColor: 'rgba(56, 130, 246, 0.08)',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.35)',
    padding: 16,
    gap: 12,
  },
  prescHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescTag: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#3882F6',
    fontWeight: '800',
    letterSpacing: 1,
  },
  prescGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prescCol: {
    alignItems: 'center',
  },
  prescVal: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  prescLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  anatomyCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 16,
    gap: 12,
  },
  anatomyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anatomyTag: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  targetAreaHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    lineHeight: 20,
  },
  muscleSplit: {
    gap: 10,
  },
  muscleBlock: {
    gap: 6,
  },
  muscleRoleLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  primaryMuscleBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  primaryMuscleText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
    letterSpacing: 0.5,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  secondaryMuscleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  secondaryMuscleText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  prCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: Theme.borderRadius.lg,
    padding: 16,
  },
  prTag: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.emeraldSuccess,
    fontWeight: '700',
    letterSpacing: 1,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 8,
  },
  prWeight: {
    fontSize: 24,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  prReps: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  specGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  specCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
  },
  specKey: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  specVal: {
    fontSize: 12,
    color: Theme.colors.textPrimary,
    lineHeight: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginTop: 4,
  },
  instructionList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: Theme.colors.cyanGlow,
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 12.5,
    color: Theme.colors.textPrimary,
    lineHeight: 18,
  },
  cueBox: {
    backgroundColor: 'rgba(56, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.25)',
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    gap: 10,
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cueBullet: {
    fontSize: 12,
  },
  cueText: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.textPrimary,
    lineHeight: 17,
  },
  mistakeBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    gap: 10,
  },
  mistakeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mistakeBullet: {
    fontSize: 12,
  },
  mistakeText: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.textPrimary,
    lineHeight: 17,
  },
  footer: {
    paddingTop: 12,
  },
});
