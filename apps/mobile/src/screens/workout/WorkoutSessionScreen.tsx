import React, { useState, useEffect } from 'react';
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

interface ActiveSet {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  weightKg: number;
  isCompleted: boolean;
}

interface WorkoutSessionScreenProps {
  onBack?: () => void;
  onCompleteWorkout?: (totalVolumeKg: number) => void;
}

export const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({
  onBack,
  onCompleteWorkout,
}) => {
  // Main session elapsed timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3504); // 58:24
  // Rest timer
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [isRestActive, setIsRestActive] = useState<boolean>(true);

  const [currentExerciseIndex] = useState<number>(1);
  const totalExercises = 6;

  const [sets, setSets] = useState<ActiveSet[]>([
    { setNumber: 1, targetReps: 15, actualReps: 12, weightKg: 60, isCompleted: true },
    { setNumber: 2, targetReps: 15, actualReps: 11, weightKg: 60, isCompleted: true },
    { setNumber: 3, targetReps: 15, actualReps: 0, weightKg: 60, isCompleted: false },
  ]);

  // Main countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rest countdown timer
  useEffect(() => {
    let restTimer: any;
    if (isRestActive && restSeconds > 0) {
      restTimer = setInterval(() => {
        setRestSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(restTimer);
  }, [isRestActive, restSeconds]);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleSetCompleted = (index: number) => {
    setSets((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const nextCompleted = !item.isCompleted;
          return {
            ...item,
            isCompleted: nextCompleted,
            actualReps: nextCompleted && item.actualReps === 0 ? item.targetReps : item.actualReps,
          };
        }
        return item;
      })
    );
    // Restart rest interval upon set completion
    setRestSeconds(90);
    setIsRestActive(true);
  };

  const addSet = () => {
    setSets((prev) => [
      ...prev,
      {
        setNumber: prev.length + 1,
        targetReps: 12,
        actualReps: 0,
        weightKg: 60,
        isCompleted: false,
      },
    ]);
  };

  // Calculate accumulated session volume (weight * reps)
  const totalVolumeKg = sets
    .filter((s) => s.isCompleted)
    .reduce((acc, s) => acc + s.weightKg * s.actualReps, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />

      {/* Workout Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chest + Triceps</Text>
          <Text style={styles.headerSubtitle}>Total Volume: {totalVolumeKg} KG</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Main Countdown Timer HUD */}
      <View style={styles.timerHud}>
        <Text style={styles.timerDigital}>{formatTimer(secondsRemaining)}</Text>
        <Text style={styles.timerLabel}>WORKOUT TIME REMAINING</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Exercise Overview Card */}
        <GlassCard style={styles.exerciseCard}>
          <View style={styles.exerciseCardHeader}>
            <Text style={styles.exerciseTitle}>Barbell Bench Press</Text>
            <View style={styles.exercisePill}>
              <Text style={styles.exercisePillText}>
                0{currentExerciseIndex} / 0{totalExercises}
              </Text>
            </View>
          </View>
          <View style={styles.targetBadge}>
            <Text style={styles.targetPrefix}>Target</Text>
            <Text style={styles.targetDetails}>15 Reps • 60 KG</Text>
          </View>
        </GlassCard>

        {/* Set Tracking List */}
        <GlassCard style={styles.setTrackingCard}>
          <View style={styles.setsTableHeader}>
            <Text style={styles.setsTableCol}>SET</Text>
            <Text style={styles.setsTableCol}>REPS</Text>
            <Text style={styles.setsTableCol}>WEIGHT</Text>
            <Text style={[styles.setsTableCol, { textAlign: 'right' }]}>DONE</Text>
          </View>

          {sets.map((s, index) => (
            <View
              key={s.setNumber}
              style={[
                styles.setRow,
                s.isCompleted && styles.setRowCompleted,
              ]}
            >
              <Text style={styles.setNumberText}>Set {s.setNumber}</Text>
              <View style={styles.repsContainer}>
                <Text style={[styles.repsActual, s.isCompleted && styles.repsActualCompleted]}>
                  {s.actualReps}
                </Text>
                <Text style={styles.repsDivider}>/</Text>
                <Text style={styles.repsTarget}>{s.targetReps}</Text>
              </View>
              <Text style={styles.weightText}>{s.weightKg} kg</Text>
              <TouchableOpacity
                style={[styles.checkButton, s.isCompleted && styles.checkButtonCompleted]}
                onPress={() => toggleSetCompleted(index)}
                activeOpacity={0.7}
              >
                {s.isCompleted && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Set Button */}
          <TouchableOpacity style={styles.addSetButton} onPress={addSet} activeOpacity={0.7}>
            <Text style={styles.addSetText}>+ Add Set</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Rest Timer Widget */}
        <GlassCard style={styles.restTimerCard}>
          <View style={styles.restTimerLeft}>
            <View style={styles.pulsingRadar}>
              <View style={styles.radarDot} />
            </View>
            <View>
              <Text style={styles.restTimerLabel}>REST TIMER</Text>
              <Text style={styles.restTimerValue}>{formatTimer(restSeconds)}</Text>
            </View>
          </View>

          <View style={styles.restTimerControls}>
            <TouchableOpacity
              style={styles.restControlButton}
              onPress={() => setRestSeconds((prev) => prev + 30)}
            >
              <Text style={styles.restControlText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.restControlButton, isRestActive && styles.restControlButtonActive]}
              onPress={() => setIsRestActive(!isRestActive)}
            >
              <Text style={styles.restControlText}>{isRestActive ? '❚❚' : '▶'}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Bottom Exercise Controls */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.prevButton} activeOpacity={0.8}>
          <Text style={styles.prevButtonText}>‹ Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          activeOpacity={0.8}
          onPress={() => onCompleteWorkout && onCompleteWorkout(totalVolumeKg)}
        >
          <Text style={styles.nextButtonText}>Complete Workout ›</Text>
        </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.primaryBlue,
    marginTop: 2,
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
  backChevron: {
    fontSize: 22,
    color: Theme.colors.textPrimary,
    fontWeight: '300',
    marginTop: -2,
  },
  iconText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  timerHud: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  timerDigital: {
    fontSize: 44,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: Theme.colors.textPrimary,
    letterSpacing: 1,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
  },
  exerciseCard: {
    padding: 16,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  exercisePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderRadius: Theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.4)',
  },
  exercisePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primaryBlue,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  targetPrefix: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.primaryBlue,
  },
  targetDetails: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  setTrackingCard: {
    padding: 14,
  },
  setsTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  setsTableCol: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    width: 60,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  setRowCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    width: 50,
  },
  repsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 60,
  },
  repsActual: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: 'monospace',
  },
  repsActualCompleted: {
    color: Theme.colors.primaryBlue,
  },
  repsDivider: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  repsTarget: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  weightText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    fontFamily: 'monospace',
    width: 60,
  },
  checkButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Theme.colors.emeraldSuccess,
  },
  checkIcon: {
    color: Theme.colors.emeraldSuccess,
    fontSize: 14,
    fontWeight: '900',
  },
  addSetButton: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addSetText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  restTimerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderColor: 'rgba(56, 130, 246, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  restTimerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pulsingRadar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(56, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.primaryBlue,
  },
  restTimerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  restTimerValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: Theme.colors.textPrimary,
  },
  restTimerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  restControlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  restControlButtonActive: {
    backgroundColor: 'rgba(56, 130, 246, 0.25)',
    borderColor: Theme.colors.primaryBlue,
  },
  restControlText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(5, 7, 11, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  prevButton: {
    flex: 1,
    height: 50,
    borderRadius: Theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  nextButton: {
    flex: 1.5,
    height: 50,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primaryBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
