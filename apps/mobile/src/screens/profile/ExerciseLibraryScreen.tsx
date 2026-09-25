import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { ExerciseDetailData } from '../workout/ExerciseDetailScreen';

interface ExerciseLibraryScreenProps {
  onBack: () => void;
  onSelectExercise: (exercise: ExerciseDetailData) => void;
}

export const LIBRARY_EXERCISES: ExerciseDetailData[] = [
  {
    id: 'ex-incline-db',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Anterior Deltoids', 'Triceps'],
    equipment: 'Incline Bench, Dumbbells',
    tempo: '3-1-1-0',
    instructions: [
      'Angle bench to 30 degrees.',
      'Retract scapula and drive through feet.',
      'Lower dumbbells under control to upper chest.',
      'Press upward in converging path.',
    ],
    cues: ['Keep elbows tucked at 45 degrees', 'Maintain arch in upper back'],
    prWeightKg: 42.5,
    prReps: 8,
  },
  {
    id: 'ex-barbell-squat',
    name: 'Barbell Back Squat',
    muscleGroup: 'Legs',
    secondaryMuscles: ['Glutes', 'Lower Back', 'Core'],
    equipment: 'Barbell, Power Rack',
    tempo: '3-1-1-0',
    instructions: [
      'Set bar on upper trapezius shelf.',
      'Brace core using Valsalva maneuver.',
      'Descend below parallel with knees tracking over toes.',
      'Drive hips up forcefully out of the hole.',
    ],
    cues: ['Root feet firmly into the platform', 'Maintain neutral cervical spine'],
    prWeightKg: 160.0,
    prReps: 5,
  },
  {
    id: 'ex-weighted-pullup',
    name: 'Weighted Pull-Up',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Brachialis', 'Rear Delts'],
    equipment: 'Pull-Up Bar, Dip Belt',
    tempo: '2-1-1-1',
    instructions: [
      'Grip bar slightly wider than shoulder-width with overhand grip.',
      'Initiate pull by depressing scapulae down and back.',
      'Drive elbows down towards hips until chin clears bar.',
      'Lower under 2s eccentric control to full dead hang.',
    ],
    cues: ['Chest to bar, avoid swinging or kipping', 'Engage core to stabilize hips'],
    prWeightKg: 32.5,
    prReps: 6,
  },
  {
    id: 'ex-overhead-press',
    name: 'Standing Overhead Barbell Press',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Trapezius', 'Core'],
    equipment: 'Barbell',
    tempo: '2-0-1-0',
    instructions: [
      'Clean or rack bar at anterior clavicle.',
      'Tighten glutes, quads, and abdominal wall.',
      'Press bar vertically overhead in straight bar path.',
      'Lock out with head pushing slightly forward through window.',
    ],
    cues: ['Squeeze glutes to prevent lumbar extension', 'Keep wrists stacked above forearms'],
    prWeightKg: 75.0,
    prReps: 5,
  },
  {
    id: 'ex-romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    muscleGroup: 'Legs',
    secondaryMuscles: ['Hamstrings', 'Glutes', 'Erectors'],
    equipment: 'Barbell / Dumbbells',
    tempo: '3-1-1-0',
    instructions: [
      'Hold bar at hip height with slight knee flexion.',
      'Hinge hips backward while keeping bar against thighs.',
      'Lower until maximum hamstring stretch before lower back rounds.',
      'Drive hips forward to return to standing lockout.',
    ],
    cues: ['Push hips back to wall behind you', 'Keep lats engaged and bar touching legs'],
    prWeightKg: 140.0,
    prReps: 8,
  },
  {
    id: 'ex-cable-lateral-raise',
    name: 'Cable Lateral Raise',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Lateral Deltoids', 'Supraspinatus'],
    equipment: 'Cable Tower',
    tempo: '2-1-1-1',
    instructions: [
      'Set pulley to hip or ankle height.',
      'Hold cable cross-body with slight forward torso lean.',
      'Raise arm out in scapular plane (~30° forward) to shoulder height.',
      'Hold 1s contraction at top and lower slowly.',
    ],
    cues: ['Lead with elbow, not hands', 'Keep shoulder depressed'],
    prWeightKg: 15.0,
    prReps: 14,
  },
];

const MUSCLE_FILTERS = ['ALL', 'CHEST', 'BACK', 'LEGS', 'SHOULDERS'];

export const ExerciseLibraryScreen: React.FC<ExerciseLibraryScreenProps> = ({
  onBack,
  onSelectExercise,
}) => {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = LIBRARY_EXERCISES.filter((ex) => {
    const matchesFilter = filter === 'ALL' || ex.muscleGroup.toUpperCase() === filter;
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Exercise Library"
        subtitle="BIOMECHANICS DATABASE"
        onBack={onBack}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movements or target muscles..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearchQuery => setSearch(setSearchQuery)}
        />
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {MUSCLE_FILTERS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterPill, filter === item && styles.filterPillActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => onSelectExercise(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.muscleTag}>{item.muscleGroup.toUpperCase()}</Text>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                </View>
                <StatusBadge label={`${item.prWeightKg}kg PR`} status="success" />
              </View>

              <Text style={styles.equipText}>Equipment: {item.equipment}</Text>
              <Text style={styles.cuePreview} numberOfLines={1}>
                Cue: {item.cues[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingVertical: 6,
  },
  searchInput: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Theme.colors.textPrimary,
    fontSize: 13,
  },
  filterRow: {
    paddingVertical: 6,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterPillActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: Theme.colors.cyanGlow,
  },
  content: {
    paddingVertical: 10,
    paddingBottom: 32,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  muscleTag: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  equipText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  cuePreview: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
  },
});
