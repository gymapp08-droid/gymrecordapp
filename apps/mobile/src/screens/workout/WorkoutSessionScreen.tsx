import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { AlphaScreen, PrimaryButton, SecondaryButton } from '../../components';
import { Theme } from '../../theme/tokens';
import { usePerformance, WorkoutExerciseSummary } from '../../context/PerformanceContext';
import { SecureStorage } from '../../services/secureStorage';

export type SetType = 'WARMUP' | 'WORKING' | 'TOP_SET' | 'BACKOFF' | 'DROP_SET' | 'FAILURE';

export interface RecordedSet {
  id: string;
  setNumber: number;
  setType: SetType;
  targetWeightKg: number;
  targetReps: number;
  actualWeightKg: number;
  actualReps: number;
  rpe?: number;
  rir?: number;
  notes?: string;
  isCompleted: boolean;
}

export interface WorkoutExerciseState {
  id: string;
  name: string;
  muscleGroup: string;
  targetArea: string;
  equipment: string;
  isSkipped: boolean;
  skipReason?: string;
  previousPerformance: {
    sets: { weightKg: number; reps: number }[];
    totalVolumeKg: number;
  };
  sets: RecordedSet[];
}

export interface WorkoutSummaryResult {
  sessionTitle: string;
  durationSeconds: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  totalRepsCompleted: number;
  exercisesCompletedCount: number;
  totalExercisesCount: number;
  isPartial: boolean;
  prsAchieved: string[];
  skippedExercises: { name: string; reason: string }[];
  sessionNotes: string;
}

interface WorkoutSessionScreenProps {
  onBack?: () => void;
  onCompleteWorkout?: (summary: WorkoutSummaryResult) => void;
  onOpenExerciseDetail?: (exerciseId: string) => void;
}

function buildSessionExercises(workoutExercises?: WorkoutExerciseSummary[]): WorkoutExerciseState[] {
  if (!workoutExercises || !Array.isArray(workoutExercises) || workoutExercises.length === 0) {
    return [
      {
        id: 'ex-1',
        name: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        targetArea: 'Mid & Sternal Pectoralis',
        equipment: 'Barbell, Flat Bench',
        isSkipped: false,
        previousPerformance: { sets: [{ weightKg: 60, reps: 10 }], totalVolumeKg: 600 },
        sets: [
          { id: 's-1-1', setNumber: 1, setType: 'WORKING', targetWeightKg: 60, targetReps: 10, actualWeightKg: 60, actualReps: 0, isCompleted: false },
          { id: 's-1-2', setNumber: 2, setType: 'WORKING', targetWeightKg: 60, targetReps: 10, actualWeightKg: 60, actualReps: 0, isCompleted: false },
          { id: 's-1-3', setNumber: 3, setType: 'WORKING', targetWeightKg: 60, targetReps: 10, actualWeightKg: 60, actualReps: 0, isCompleted: false },
        ],
      },
    ];
  }

  return workoutExercises.map((ex, idx) => {
    let setCount = 3;
    let repCount = 10;
    let weightKg = 40;

    const presc = ex?.prescription || '';
    const setMatch = presc.match(/(\d+)\s*sets?/i);
    if (setMatch && setMatch[1]) setCount = parseInt(setMatch[1], 10);

    const repMatch = presc.match(/(\d+)\s*reps?/i);
    if (repMatch && repMatch[1]) repCount = parseInt(repMatch[1], 10);

    const weightMatch = presc.match(/@\s*(\d+(\.\d+)?)\s*kg/i);
    if (weightMatch && weightMatch[1]) weightKg = parseFloat(weightMatch[1]);

    const sets: RecordedSet[] = Array.from({ length: Math.max(1, setCount) }, (_, sIdx) => ({
      id: `s-${idx + 1}-${sIdx + 1}`,
      setNumber: sIdx + 1,
      setType: 'WORKING',
      targetWeightKg: weightKg,
      targetReps: repCount,
      actualWeightKg: weightKg,
      actualReps: 0,
      isCompleted: false,
    }));

    const exName = ex?.name || `Exercise ${idx + 1}`;

    return {
      id: `ex-${idx + 1}`,
      name: exName,
      muscleGroup: 'Prescribed Movement',
      targetArea: exName,
      equipment: 'Standard Gym Equipment',
      isSkipped: false,
      previousPerformance: {
        sets: [{ weightKg, reps: repCount }],
        totalVolumeKg: weightKg * repCount,
      },
      sets,
    };
  });
}

export const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({
  onBack,
  onCompleteWorkout,
  onOpenExerciseDetail,
}) => {
  const { workout } = usePerformance();

  // Session timer - starts fresh at 0 unless restored from an active draft
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [exercises, setExercises] = useState<WorkoutExerciseState[]>(() =>
    buildSessionExercises(workout.exercises)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Restore active draft if present
  useEffect(() => {
    SecureStorage.getItem('active_workout_draft')
      .then((draft) => {
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            if (Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
              const sanitized: WorkoutExerciseState[] = parsed.exercises.map((ex: any, idx: number) => ({
                id: ex?.id || `ex-${idx + 1}`,
                name: ex?.name || `Exercise ${idx + 1}`,
                muscleGroup: ex?.muscleGroup || 'Prescribed Movement',
                targetArea: ex?.targetArea || ex?.name || 'General Target',
                equipment: ex?.equipment || 'Standard Gym Equipment',
                isSkipped: !!ex?.isSkipped,
                skipReason: ex?.skipReason || '',
                previousPerformance: {
                  sets: Array.isArray(ex?.previousPerformance?.sets) ? ex.previousPerformance.sets : [{ weightKg: 40, reps: 10 }],
                  totalVolumeKg: typeof ex?.previousPerformance?.totalVolumeKg === 'number' ? ex.previousPerformance.totalVolumeKg : 400,
                },
                sets: Array.isArray(ex?.sets) && ex.sets.length > 0 ? ex.sets : [
                  { id: `s-${idx + 1}-1`, setNumber: 1, setType: 'WORKING', targetWeightKg: 40, targetReps: 10, actualWeightKg: 40, actualReps: 0, isCompleted: false },
                  { id: `s-${idx + 1}-2`, setNumber: 2, setType: 'WORKING', targetWeightKg: 40, targetReps: 10, actualWeightKg: 40, actualReps: 0, isCompleted: false },
                  { id: `s-${idx + 1}-3`, setNumber: 3, setType: 'WORKING', targetWeightKg: 40, targetReps: 10, actualWeightKg: 40, actualReps: 0, isCompleted: false },
                ],
              }));
              setExercises(sanitized);
              if (typeof parsed.elapsedSeconds === 'number') {
                setElapsedSeconds(parsed.elapsedSeconds);
              }
            }
          } catch {
            // Keep default fresh state
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save workout draft to storage
  useEffect(() => {
    if (exercises && exercises.length > 0) {
      SecureStorage.setItem(
        'active_workout_draft',
        JSON.stringify({ exercises, elapsedSeconds })
      ).catch(() => {});
    }
  }, [exercises, elapsedSeconds]);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [initialRestDuration] = useState<number>(90);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);

  // Skip modal
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [skipReason, setSkipReason] = useState('Equipment unavailable');

  // Session reflection note
  const [sessionNotes] = useState<string>('Standard progressive overload session recorded.');

  const safeExercises = exercises && exercises.length > 0 ? exercises : buildSessionExercises();
  const currentExercise = safeExercises[currentIndex] || safeExercises[0]!;
  const totalExercises = safeExercises.length;

  // Session clock
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rest countdown clock
  useEffect(() => {
    let restTimer: any;
    if (isRestActive && restSeconds > 0) {
      restTimer = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            setIsRestActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restTimer);
  }, [isRestActive, restSeconds]);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Deterministic Volume calculation: Σ (weight × reps) across all completed sets
  const calculateTotalVolume = () => {
    let vol = 0;
    (exercises || []).forEach((ex) => {
      if (!ex?.isSkipped && Array.isArray(ex?.sets)) {
        ex.sets.forEach((s) => {
          if (s?.isCompleted && (s?.actualReps || 0) > 0 && (s?.actualWeightKg || 0) > 0) {
            vol += s.actualWeightKg * s.actualReps;
          }
        });
      }
    });
    return vol;
  };

  // Completed sets count across all exercises
  const totalSetsCount = (exercises || []).reduce((acc, ex) => acc + (ex?.isSkipped || !Array.isArray(ex?.sets) ? 0 : ex.sets.length), 0);
  const completedSetsCount = (exercises || []).reduce(
    (acc, ex) => acc + (ex?.isSkipped || !Array.isArray(ex?.sets) ? 0 : ex.sets.filter((s) => s?.isCompleted).length),
    0
  );

  // Set toggle handler
  const handleToggleSet = (setId: string) => {
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            const nextCompleted = !s.isCompleted;
            // If checking off and actual reps is currently 0, pre-prompt user to keep or change target reps
            const nextActualReps = nextCompleted && s.actualReps === 0 ? s.targetReps : s.actualReps;
            return {
              ...s,
              isCompleted: nextCompleted,
              actualReps: nextActualReps,
            };
          }),
        };
      })
    );

    // Trigger rest timer on completing a set
    setRestSeconds(initialRestDuration);
    setIsRestActive(true);
  };

  // Update actual reps for a set (User Controlled)
  const handleUpdateReps = (setId: string, repsText: string) => {
    const num = parseInt(repsText, 10) || 0;
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, actualReps: num } : s)),
        };
      })
    );
  };

  // Update actual weight for a set (User Controlled)
  const handleUpdateWeight = (setId: string, weightText: string) => {
    const num = parseFloat(weightText) || 0;
    setExercises((prev) =>
      prev.map((ex, exIdx) => {
        if (exIdx !== currentIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, actualWeightKg: num } : s)),
        };
      })
    );
  };

  // Add Set dynamically
  const handleAddSet = () => {
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    const newSetNumber = currentExercise.sets.length + 1;
    const newSet: RecordedSet = {
      id: `s-${currentIndex + 1}-${newSetNumber}`,
      setNumber: newSetNumber,
      setType: 'WORKING',
      targetWeightKg: lastSet ? lastSet.targetWeightKg : 60,
      targetReps: lastSet ? lastSet.targetReps : 10,
      actualWeightKg: lastSet ? lastSet.actualWeightKg : 60,
      actualReps: 0,
      isCompleted: false,
    };

    setExercises((prev) =>
      prev.map((ex, exIdx) => (exIdx === currentIndex ? { ...ex, sets: [...ex.sets, newSet] } : ex))
    );
  };

  // Delete Set
  const handleDeleteSet = (setId: string) => {
    Alert.alert('Delete Set', 'Remove this set record from the workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setExercises((prev) =>
            prev.map((ex, exIdx) => {
              if (exIdx !== currentIndex) return ex;
              const filtered = ex.sets.filter((s) => s.id !== setId);
              // Re-number
              const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
              return { ...ex, sets: renumbered };
            })
          );
        },
      },
    ]);
  };

  // Skip current exercise with reason
  const handleConfirmSkip = () => {
    setExercises((prev) =>
      prev.map((ex, idx) =>
        idx === currentIndex ? { ...ex, isSkipped: true, skipReason } : ex
      )
    );
    setSkipModalVisible(false);
    // Advance to next if available
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Workout Completion & PR detection
  const handleFinishWorkout = () => {
    const totalVolume = calculateTotalVolume();
    const completedExCount = exercises.filter((ex) => !ex.isSkipped && ex.sets.some((s) => s.isCompleted)).length;
    const isPartial = completedExCount < totalExercises;

    const prs: string[] = [];
    // Check if any actual set broke previous record
    (exercises || []).forEach((ex) => {
      const prevSets = Array.isArray(ex?.previousPerformance?.sets) ? ex.previousPerformance.sets : [];
      const maxPrevWeight = prevSets.length > 0 ? Math.max(...prevSets.map((s) => s?.weightKg || 0), 0) : 0;
      (ex?.sets || []).forEach((s) => {
        if (s?.isCompleted && (s?.actualWeightKg || 0) > maxPrevWeight) {
          prs.push(`${ex.name}: ${s.actualWeightKg} kg × ${s.actualReps} (Overload PR)`);
        }
      });
    });

    let repsTotal = 0;
    (exercises || []).forEach((ex) => {
      (ex?.sets || []).forEach((s) => {
        if (s?.isCompleted) repsTotal += (s?.actualReps || 0);
      });
    });

    const skipped = (exercises || [])
      .filter((ex) => ex?.isSkipped)
      .map((ex) => ({ name: ex.name, reason: ex.skipReason || 'Skipped' }));

    SecureStorage.removeItem('active_workout_draft').catch(() => {});

    onCompleteWorkout?.({
      sessionTitle: workout?.name || 'Strength & Conditioning',
      durationSeconds: elapsedSeconds,
      totalVolumeKg: totalVolume,
      totalSetsCompleted: completedSetsCount,
      totalRepsCompleted: repsTotal,
      exercisesCompletedCount: completedExCount,
      totalExercisesCount: totalExercises,
      isPartial,
      prsAchieved: prs,
      skippedExercises: skipped,
      sessionNotes,
    });
  };

  return (
    <AlphaScreen>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.exitBtn}
          onPress={() => {
            Alert.alert(
              'Exit Workout Session',
              'Do you want to abandon or save partial progress?',
              [
                { text: 'Keep Training', style: 'cancel' },
                {
                  text: 'Save & Exit Partial',
                  style: 'default',
                  onPress: handleFinishWorkout,
                },
                {
                  text: 'Discard Workout',
                  style: 'destructive',
                  onPress: () => {
                    SecureStorage.removeItem('active_workout_draft').catch(() => {});
                    onBack?.();
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.exitIcon}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.sessionCategory}>{(workout?.name || 'WORKOUT').toUpperCase()} · SESSION</Text>
          <Text style={styles.elapsedTimer}>{formatTimer(elapsedSeconds)}</Text>
        </View>

        <TouchableOpacity style={styles.finishTopBtn} onPress={handleFinishWorkout}>
          <Text style={styles.finishTopText}>FINISH</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Progress Indicator (1 of 6 ... 6 of 6) */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.exerciseCounter}>
            EXERCISE {currentIndex + 1} OF {totalExercises}
          </Text>
          <Text style={styles.setsProgress}>
            {completedSetsCount}/{totalSetsCount} Sets Completed
          </Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / totalExercises) * 100}%` },
            ]}
          />
        </View>

        {/* Exercise Quick Selector Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
          {exercises.map((ex, idx) => {
            const isSelected = idx === currentIndex;
            const hasCompletedSets = ex.sets.some((s) => s.isCompleted);
            return (
              <TouchableOpacity
                key={ex.id}
                style={[
                  styles.selectorPill,
                  isSelected && styles.selectorPillActive,
                  ex.isSkipped && styles.selectorPillSkipped,
                ]}
                onPress={() => setCurrentIndex(idx)}
              >
                <Text style={[styles.selectorPillIndex, isSelected && styles.selectorPillIndexActive]}>
                  {idx + 1}
                </Text>
                <Text style={[styles.selectorPillText, isSelected && styles.selectorPillTextActive]} numberOfLines={1}>
                  {ex.name}
                </Text>
                {hasCompletedSets && !ex.isSkipped && <Text style={styles.doneCheck}>✓</Text>}
                {ex.isSkipped && <Text style={styles.skippedTag}>SKIPPED</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Exercise Title & Anatomical Target Area */}
        <View style={styles.exerciseHeroCard}>
          <View style={styles.exerciseHeroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.targetMuscleLabel}>
                {(currentExercise?.muscleGroup || 'TARGET').toUpperCase()} · {(currentExercise?.targetArea || 'GENERAL').toUpperCase()}
              </Text>
              <Text style={styles.currentExerciseName}>{currentExercise?.name || 'Exercise'}</Text>
              <Text style={styles.equipmentText}>Equipment: {currentExercise?.equipment || 'Gym Equipment'}</Text>
            </View>

            {onOpenExerciseDetail && (
              <TouchableOpacity
                style={styles.infoBtn}
                onPress={() => onOpenExerciseDetail(currentExercise?.id || 'ex-1')}
              >
                <Text style={styles.infoBtnText}>FORM & ANATOMY ›</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Last Session Historical Baseline (For Progressive Overload) */}
          <View style={styles.lastSessionBox}>
            <View style={styles.lastSessionHeader}>
              <Text style={styles.lastSessionTitle}>LAST SESSION PERFORMANCE</Text>
              <Text style={styles.lastSessionVol}>Vol: {currentExercise?.previousPerformance?.totalVolumeKg || 0} kg</Text>
            </View>
            <View style={styles.lastSessionSetsRow}>
              {(currentExercise?.previousPerformance?.sets || []).map((ps, pi) => (
                <View key={pi} style={styles.prevSetChip}>
                  <Text style={styles.prevSetText}>
                    Set {pi + 1}: <Text style={styles.prevSetBold}>{ps.weightKg}kg × {ps.reps}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Set Logging Matrix (Plan vs Actual) */}
        <View style={styles.setsCard}>
          <View style={styles.setHeaderRow}>
            <Text style={[styles.setTh, { width: 36 }]}>SET</Text>
            <Text style={[styles.setTh, { flex: 1 }]}>TARGET</Text>
            <Text style={[styles.setTh, { width: 72, textAlign: 'center' }]}>ACTUAL KG</Text>
            <Text style={[styles.setTh, { width: 64, textAlign: 'center' }]}>REPS</Text>
            <Text style={[styles.setTh, { width: 44, textAlign: 'center' }]}>DONE</Text>
          </View>

          {(currentExercise?.sets || []).map((set) => {
            const diff = set.actualReps - set.targetReps;
            return (
              <View
                key={set.id}
                style={[styles.setRow, set.isCompleted && styles.setRowCompleted]}
              >
                <View style={styles.setIndexWrap}>
                  <Text style={styles.setIndexText}>{set.setNumber}</Text>
                  <Text style={styles.setTypeSub}>{set.setType === 'WORKING' ? 'W' : 'T'}</Text>
                </View>

                {/* Plan Target */}
                <View style={styles.targetCol}>
                  <Text style={styles.targetPlanText}>
                    {set.targetWeightKg}kg × {set.targetReps}
                  </Text>
                  {set.isCompleted && diff !== 0 && (
                    <Text
                      style={[
                        styles.diffBadge,
                        diff > 0 ? styles.diffPositive : styles.diffNegative,
                      ]}
                    >
                      {diff > 0 ? `+${diff}` : `${diff}`} reps
                    </Text>
                  )}
                </View>

                {/* Actual Weight (User Controlled) */}
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.numericInput}
                    keyboardType="decimal-pad"
                    value={set.actualWeightKg.toString()}
                    onChangeText={(t) => handleUpdateWeight(set.id, t)}
                    selectTextOnFocus
                  />
                </View>

                {/* Actual Reps (User Controlled) */}
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.numericInput, set.actualReps > 0 && styles.numericInputActive]}
                    keyboardType="number-pad"
                    value={set.actualReps > 0 ? set.actualReps.toString() : ''}
                    placeholder="0"
                    placeholderTextColor="#64748B"
                    onChangeText={(t) => handleUpdateReps(set.id, t)}
                    selectTextOnFocus
                  />
                </View>

                {/* Completion Toggle */}
                <TouchableOpacity
                  style={[styles.checkBtn, set.isCompleted && styles.checkBtnActive]}
                  onPress={() => handleToggleSet(set.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.checkMark, set.isCompleted && styles.checkMarkActive]}>
                    ✓
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add Set & Set Controls */}
          <View style={styles.setActionRow}>
            <TouchableOpacity style={styles.addSetBtn} onPress={handleAddSet}>
              <Text style={styles.addSetText}>+ ADD SET</Text>
            </TouchableOpacity>

            {currentExercise.sets.length > 1 && (
              <TouchableOpacity
                style={styles.deleteSetBtn}
                onPress={() => handleDeleteSet(currentExercise.sets[currentExercise.sets.length - 1]!.id)}
              >
                <Text style={styles.deleteSetText}>- Remove Last Set</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Rest Timer Banner */}
        <View style={styles.restBanner}>
          <View style={styles.restLeft}>
            <Text style={styles.restIcon}>⏱️</Text>
            <View>
              <Text style={styles.restLabel}>REST INTERVAL COUNTDOWN</Text>
              <Text style={styles.restDigits}>{formatTimer(restSeconds)}</Text>
            </View>
          </View>

          <View style={styles.restControls}>
            <TouchableOpacity
              style={styles.restMiniBtn}
              onPress={() => setRestSeconds((prev) => prev + 30)}
            >
              <Text style={styles.restMiniBtnText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.restMiniBtn, isRestActive && styles.restMiniBtnActive]}
              onPress={() => setIsRestActive((prev) => !prev)}
            >
              <Text style={[styles.restMiniBtnText, isRestActive && styles.restMiniBtnTextActive]}>
                {isRestActive ? 'PAUSE' : 'START'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restMiniBtn}
              onPress={() => {
                setIsRestActive(false);
                setRestSeconds(0);
              }}
            >
              <Text style={styles.restMiniBtnText}>SKIP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exercise Flow Navigation Controls */}
        <View style={styles.exerciseNavRow}>
          <TouchableOpacity
            style={[styles.navExBtn, currentIndex === 0 && styles.navExBtnDisabled]}
            disabled={currentIndex === 0}
            onPress={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          >
            <Text style={styles.navExBtnText}>‹ Previous Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipExBtn}
            onPress={() => setSkipModalVisible(true)}
          >
            <Text style={styles.skipExBtnText}>Skip Exercise</Text>
          </TouchableOpacity>

          {currentIndex < totalExercises - 1 ? (
            <TouchableOpacity
              style={styles.navExBtnNext}
              onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, totalExercises - 1))}
            >
              <Text style={styles.navExBtnNextText}>Next Exercise ›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.navExBtnComplete} onPress={handleFinishWorkout}>
              <Text style={styles.navExBtnCompleteText}>Complete Workout</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live Session Telemetry Aggregator */}
        <View style={styles.volumeCard}>
          <View style={styles.volItem}>
            <Text style={styles.volKey}>TOTAL VOLUME</Text>
            <Text style={styles.volValue}>{calculateTotalVolume().toLocaleString()} <Text style={styles.volUnit}>kg</Text></Text>
          </View>
          <View style={styles.volItem}>
            <Text style={styles.volKey}>EXERCISES</Text>
            <Text style={styles.volValue}>
              {exercises.filter((ex) => !ex.isSkipped && ex.sets.some((s) => s.isCompleted)).length} / {totalExercises}
            </Text>
          </View>
          <View style={styles.volItem}>
            <Text style={styles.volKey}>COMPLETED SETS</Text>
            <Text style={styles.volValue}>{completedSetsCount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Skip Exercise Reason Modal */}
      <Modal visible={skipModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.skipModalBox}>
            <Text style={styles.skipModalTitle}>Skip {currentExercise.name}?</Text>
            <Text style={styles.skipModalSub}>Select the reason for omitting this exercise from today's performance record:</Text>

            {['Equipment unavailable', 'Time constraint', 'Fatigue / Recovery capacity', 'Joint discomfort / Injury precaution', 'Personal substitution'].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonPill, skipReason === reason && styles.reasonPillActive]}
                onPress={() => setSkipReason(reason)}
              >
                <Text style={[styles.reasonText, skipReason === reason && styles.reasonTextActive]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.skipModalActions}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setSkipModalVisible(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Confirm Skip"
                onPress={handleConfirmSkip}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 8,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitIcon: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
  },
  sessionCategory: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  elapsedTimer: {
    fontSize: 18,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  finishTopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.emeraldSuccess,
    borderRadius: Theme.borderRadius.sm,
  },
  finishTopText: {
    color: Theme.colors.emeraldSuccess,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressContainer: {
    paddingVertical: 6,
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseCounter: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  setsProgress: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.cyanGlow,
    borderRadius: 2,
  },
  selectorScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    maxWidth: 180,
  },
  selectorPillActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  selectorPillSkipped: {
    opacity: 0.5,
  },
  selectorPillIndex: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  selectorPillIndexActive: {
    color: Theme.colors.cyanGlow,
  },
  selectorPillText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  selectorPillTextActive: {
    color: Theme.colors.textPrimary,
    fontWeight: '700',
  },
  doneCheck: {
    color: Theme.colors.emeraldSuccess,
    fontSize: 11,
    fontWeight: '900',
  },
  skippedTag: {
    color: Theme.colors.crimsonError,
    fontSize: 8,
    fontWeight: '800',
  },
  content: {
    paddingVertical: 8,
    paddingBottom: 36,
    gap: 14,
  },
  exerciseHeroCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  exerciseHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  targetMuscleLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  currentExerciseName: {
    fontSize: 20,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  equipmentText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  infoBtn: {
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3882F6',
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  infoBtnText: {
    color: '#3882F6',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lastSessionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    gap: 6,
  },
  lastSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lastSessionTitle: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  lastSessionVol: {
    fontSize: 10,
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
  lastSessionSetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prevSetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  prevSetText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
  },
  prevSetBold: {
    color: Theme.colors.textPrimary,
    fontWeight: '700',
  },
  setsCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 8,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  setTh: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  setRowCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  setIndexWrap: {
    width: 36,
    alignItems: 'center',
  },
  setIndexText: {
    fontSize: 14,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  setTypeSub: {
    fontSize: 8,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  targetCol: {
    flex: 1,
  },
  targetPlanText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  diffBadge: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  diffPositive: {
    color: Theme.colors.emeraldSuccess,
  },
  diffNegative: {
    color: Theme.colors.crimsonError,
  },
  inputWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginHorizontal: 4,
    paddingHorizontal: 4,
  },
  numericInput: {
    fontSize: 14,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 4,
  },
  numericInputActive: {
    color: Theme.colors.cyanGlow,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginLeft: 6,
  },
  checkBtnActive: {
    backgroundColor: Theme.colors.emeraldSuccess,
    borderColor: Theme.colors.emeraldSuccess,
  },
  checkMark: {
    fontSize: 16,
    color: Theme.colors.textMuted,
    fontWeight: '900',
  },
  checkMarkActive: {
    color: '#05070B',
  },
  setActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  addSetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
  },
  addSetText: {
    color: Theme.colors.cyanGlow,
    fontSize: 11,
    fontWeight: '800',
  },
  deleteSetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  deleteSetText: {
    color: Theme.colors.crimsonError,
    fontSize: 11,
    fontWeight: '600',
  },
  restBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A101C',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 12,
  },
  restLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restIcon: {
    fontSize: 20,
  },
  restLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1,
    fontWeight: '800',
  },
  restDigits: {
    fontSize: 18,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  restControls: {
    flexDirection: 'row',
    gap: 6,
  },
  restMiniBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  restMiniBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Theme.colors.amberWarning,
  },
  restMiniBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },
  restMiniBtnTextActive: {
    color: Theme.colors.amberWarning,
  },
  exerciseNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  navExBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  navExBtnDisabled: {
    opacity: 0.35,
  },
  navExBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  skipExBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  skipExBtnText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  navExBtnNext: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
  },
  navExBtnNextText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
  },
  navExBtnComplete: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.emeraldSuccess,
  },
  navExBtnCompleteText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.emeraldSuccess,
  },
  volumeCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
  },
  volItem: {
    alignItems: 'center',
  },
  volKey: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  volValue: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  volUnit: {
    fontSize: 10,
    color: Theme.colors.cyanGlow,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  skipModalBox: {
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 20,
    gap: 12,
  },
  skipModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  skipModalSub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  reasonPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reasonPillActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  reasonText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  reasonTextActive: {
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
  skipModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
