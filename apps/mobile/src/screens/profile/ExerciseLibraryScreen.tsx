import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { ExerciseDetailData } from '../workout/ExerciseDetailScreen';

import { SIX_WEEK_SHREDDED_EXERCISES } from '../../data/sixWeekShredded';

interface ExerciseLibraryScreenProps {
  onBack: () => void;
  onSelectExercise: (exercise: ExerciseDetailData) => void;
}

// Convert canonical Guru Mann exercises to ExerciseDetailData
const CANONICAL_EXERCISES: ExerciseDetailData[] = SIX_WEEK_SHREDDED_EXERCISES.map((ex) => {
  const instructions = ex.technique
    ? [ex.technique, ex.description || 'Perform with strict form and full range of motion.']
    : [ex.description || 'Perform with controlled eccentric and concentric tempo.'];

  const cues = ex.targetArea
    ? [`Target Area: ${ex.targetArea}`, `Tempo: ${ex.tempo || '2-0-1-0'}`]
    : [`Maintain steady cadence throughout set.`];

  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.primaryMuscle,
    secondaryMuscles: ex.secondaryMuscles || [],
    targetArea: ex.targetArea,
    movementPattern: ex.movementPattern,
    exerciseType: (ex.category?.toUpperCase() === 'COMPOUND' ? 'COMPOUND' : 'ISOLATION') as 'COMPOUND' | 'ISOLATION',
    equipment: ex.equipment,
    difficulty: (ex.difficulty?.toUpperCase() === 'ADVANCED' ? 'ADVANCED' : ex.difficulty?.toUpperCase() === 'BEGINNER' ? 'BEGINNER' : 'INTERMEDIATE') as any,
    tempo: ex.tempo || '2-0-1-0',
    instructions,
    cues,
    commonMistakes: ex.commonMistakes || ['Swinging the weights', 'Incomplete lockout / range of motion'],
    prWeightKg: 0,
    prReps: 10,
  };
});

export const LIBRARY_EXERCISES: ExerciseDetailData[] = CANONICAL_EXERCISES;

const MUSCLE_FILTERS = ['ALL', 'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'TRICEPS', 'BICEPS', 'ABS', 'CARDIO'];

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
                <StatusBadge
                  label={item.prWeightKg > 0 ? `${item.prWeightKg}kg PR` : (item.difficulty || item.movementPattern || 'CANONICAL')}
                  status={item.prWeightKg > 0 ? 'success' : 'info'}
                />
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
