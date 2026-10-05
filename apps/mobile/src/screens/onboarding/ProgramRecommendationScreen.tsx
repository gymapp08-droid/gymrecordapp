import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { usePerformance } from '../../context/PerformanceContext';
import programCatalogData from '../../data/program-catalog.json';
import { UserProfileData } from './ProfileOnboardingScreen';
import { TrainingPreferencesData } from './TrainingPreferencesScreen';

export interface RecommendedProgram {
  id: string;
  categoryId?: string;
  name: string;
  tagline: string;
  matchScore: number;
  matchReason: string;
  duration?: string;
  workoutDaysPerWeek?: number;
  restDaysPerWeek?: number;
  weeklySchedule: { dayNumber: number; dayName: string; workoutTitle: string; focus: string }[];
  recommendedWeeks: number;
  nutritionOverview?: string;
}

interface ProgramRecommendationScreenProps {
  goalId?: string;
  goal?: string;
  profileData?: UserProfileData | null;
  profile?: UserProfileData | null;
  preferencesData?: TrainingPreferencesData | null;
  preferences?: TrainingPreferencesData | null;
  onBack: () => void;
  onSelectProgram: (program: RecommendedProgram | any) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  'cat-fat-loss': 'Fat Loss',
  'cat-muscle-building': 'Muscle Building',
  'cat-single-muscle': 'Single Muscle',
  'cat-bodyweight': 'Bodyweight',
  'cat-medical': 'Clinical & Health',
  'cat-family': 'Family & Kids',
  'cat-specialized-nutrition': 'Specialized Diet',
};

export const ProgramRecommendationScreen: React.FC<ProgramRecommendationScreenProps> = ({
  goalId,
  goal,
  onBack,
  onSelectProgram,
}) => {
  const { setActiveProgramId } = usePerformance();

  // Selected Category filter
  const initialCategory = useMemo(() => {
    const g = (goalId || goal || '').toLowerCase();
    if (g.includes('muscle') || g.includes('hypertrophy')) return 'cat-muscle-building';
    if (g.includes('single') || g.includes('arms') || g.includes('chest')) return 'cat-single-muscle';
    if (g.includes('bodyweight') || g.includes('home')) return 'cat-bodyweight';
    if (g.includes('medical') || g.includes('health')) return 'cat-medical';
    if (g.includes('family') || g.includes('kids')) return 'cat-family';
    if (g.includes('specialized') || g.includes('nutrition') || g.includes('keto')) return 'cat-specialized-nutrition';
    return 'cat-fat-loss';
  }, [goalId, goal]);

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  const categories = useMemo(() => {
    return (programCatalogData.categories || []).map((c: any) => ({
      id: c.id,
      name: CATEGORY_NAMES[c.id] || c.name,
    }));
  }, []);

  const catalogPrograms = useMemo(() => {
    const list = (programCatalogData.programs || []) as any[];
    return list.filter((p) => p.categoryId === activeCategory);
  }, [activeCategory]);

  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    if (activeCategory === 'cat-fat-loss') return 'prog_6_week_shredded_12w';
    return catalogPrograms[0]?.id || 'prog_6_week_shredded_12w';
  });

  // When switching category, pick first program
  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    const inCat = (programCatalogData.programs || []).filter((p: any) => p.categoryId === catId);
    if (inCat.length > 0 && inCat[0]) {
      setSelectedProgramId(inCat[0].id);
    }
  };

  const selectedProgram = useMemo(() => {
    const prog = (programCatalogData.programs || []).find((p: any) => p.id === selectedProgramId);
    return prog || catalogPrograms[0] || (programCatalogData.programs || [])[0];
  }, [selectedProgramId, catalogPrograms]);

  const handleConfirmSelection = () => {
    if (selectedProgram) {
      setActiveProgramId(selectedProgram.id);
      onSelectProgram(selectedProgram);
    }
  };

  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <AlphaScreen>
      <AlphaHeader
        title="GRAVITY Catalog"
        subtitle="Step 4 of 4 · Program Selection"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.leadText}>
          Select a verified program from the GRAVITY catalog. The program directly establishes your weekly training frequency, rest periods, exercise split, and meal architecture.
        </Text>

        {/* Category Horizontal Selector */}
        <Text style={styles.sectionLabel}>PROGRAM CATEGORIES</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = cat.id === activeCategory;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => handleSelectCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Programs in Category */}
        <Text style={styles.sectionLabel}>AVAILABLE PROGRAMS ({catalogPrograms.length})</Text>
        <View style={styles.candidateList}>
          {catalogPrograms.map((prog: any, idx: number) => {
            const isSelected = prog.id === selectedProgramId;
            const isFirst = idx === 0;
            return (
              <TouchableOpacity
                key={prog.id}
                style={[styles.programCard, isSelected && styles.programCardActive]}
                onPress={() => setSelectedProgramId(prog.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={styles.titleCol}>
                    <View style={styles.badgeRow}>
                      <View style={styles.fittedBadge}>
                        <Text style={styles.fittedBadgeText}>Program fitted by Gravity</Text>
                      </View>
                      {isFirst && <StatusBadge label="POPULAR" status="success" />}
                    </View>
                    <Text style={[styles.programTitle, isSelected && styles.programTitleActive]}>
                      {prog.name}
                    </Text>
                    <Text style={styles.tagline} numberOfLines={2}>
                      {prog.description || prog.goal || 'Structured training and nutrition protocol.'}
                    </Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>

                {/* Protocol Metrics */}
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaLabel}>DURATION</Text>
                    <Text style={styles.metaValue}>{prog.duration || '6-12 Weeks'}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaLabel}>WORKOUT DAYS</Text>
                    <Text style={styles.metaValue}>{prog.workoutDaysPerWeek || 6} Days/Wk</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaLabel}>REST DAYS</Text>
                    <Text style={styles.metaValue}>{prog.restDaysPerWeek || 1} Days/Wk</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Program Deep Dive Preview */}
        {selectedProgram && (
          <View style={styles.schedulePreviewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewTitle}>WEEKLY SCHEDULE PREVIEW</Text>
                <Text style={styles.previewSubName}>{selectedProgram.name}</Text>
              </View>
              <StatusBadge label={selectedProgram.duration || '12 WEEKS'} status="neutral" />
            </View>

            {/* Nutrition highlight */}
            {selectedProgram.nutritionPlans && selectedProgram.nutritionPlans.length > 0 && (
              <View style={styles.nutritionBox}>
                <Text style={styles.nutritionBoxTitle}>INTEGRATED NUTRITION PLAN</Text>
                <Text style={styles.nutritionBoxText}>
                  Includes {selectedProgram.nutritionPlans[0]?.meals?.length || 5} scheduled meals per day with exact macronutrient prescriptions.
                </Text>
              </View>
            )}

            <View style={styles.daysList}>
              {(selectedProgram.days || []).map((d: any) => {
                const isRest = (d?.title || '').toLowerCase().includes('rest') || (d?.exercises || []).length === 0;
                return (
                  <View key={d.dayOfWeek} style={styles.dayRow}>
                    <View style={styles.dayNameCol}>
                      <Text style={styles.dayName}>{dayNames[d.dayOfWeek] || `Day ${d.dayOfWeek}`}</Text>
                      <Text style={styles.dayNumberText}>Day {d.dayOfWeek}</Text>
                    </View>
                    <View style={styles.workoutCol}>
                      <Text style={[styles.workoutTitle, isRest && styles.restTitle]}>
                        {d.title || (isRest ? 'Rest & Recovery' : 'Scheduled Training')}
                      </Text>
                      <Text style={styles.focusText}>
                        {isRest ? 'Active recovery & hydration' : `${(d.exercises || []).length} prescribed exercises`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <PrimaryButton
          title={`Activate ${selectedProgram?.name || 'Program'} & Begin`}
          onPress={handleConfirmSelection}
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
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Theme.typography.fontBody,
  },
  sectionLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: Theme.typography.fontMono,
    marginTop: 4,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: Theme.colors.cyanGlow,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  categoryPillTextActive: {
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
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
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
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
    flexWrap: 'wrap',
  },
  fittedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  fittedBadgeText: {
    color: Theme.colors.emeraldSuccess,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: Theme.typography.fontMono,
    letterSpacing: 0.5,
  },
  programTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Theme.typography.fontDisplay,
  },
  programTitleActive: {
    color: Theme.colors.cyanGlow,
  },
  tagline: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Theme.typography.fontBody,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    fontFamily: Theme.typography.fontMono,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Theme.typography.fontMono,
  },
  previewSubName: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  nutritionBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 10,
    gap: 2,
  },
  nutritionBoxTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
    fontFamily: Theme.typography.fontMono,
    letterSpacing: 0.5,
  },
  nutritionBoxText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 15,
  },
  daysList: {
    gap: 8,
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
    width: 85,
  },
  dayName: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  dayNumberText: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontFamily: Theme.typography.fontMono,
  },
  workoutCol: {
    flex: 1,
  },
  workoutTitle: {
    color: Theme.colors.cyanGlow,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  restTitle: {
    color: Theme.colors.textMuted,
  },
  focusText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: Theme.typography.fontBody,
  },
  selectBtn: {
    marginTop: 8,
  },
});
