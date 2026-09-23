import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { usePerformance } from '../../context/PerformanceContext';

export interface MacroTarget {
  current: number;
  target: number;
  unit: string;
}

interface NutritionDashboardScreenProps {
  onOpenAddFood: (mealType: string) => void;
  onOpenMealDetail: (mealType: string) => void;
  onOpenHydration: () => void;
}

export const NutritionDashboardScreen: React.FC<NutritionDashboardScreenProps> = ({
  onOpenAddFood,
  onOpenMealDetail,
  onOpenHydration,
}) => {
  const { nutrition, activity, addWater } = usePerformance();

  const caloriesConsumed = nutrition.caloriesConsumed;
  const caloriesTarget = nutrition.caloriesTarget;
  const protein = { current: nutrition.proteinConsumed, target: nutrition.proteinTarget, unit: 'g' };
  const carbs = { current: nutrition.carbsConsumed, target: nutrition.carbsTarget, unit: 'g' };
  const fats = { current: nutrition.fatConsumed, target: nutrition.fatTarget, unit: 'g' };
  const waterLiters = activity.waterLiters;
  const waterTarget = activity.waterTarget;

  const meals = nutrition.meals.map((m) => {
    let statusType: 'success' | 'warning' | 'neutral' = 'neutral';
    if (m.status === 'COMPLETED_PLANNED') statusType = 'success';
    else if (m.status === 'COMPLETED_MODIFIED' || m.status === 'PARTIAL') statusType = 'warning';

    return {
      type: m.type,
      title: m.title,
      plannedCals: m.plannedCals,
      actualCals: m.actualCals,
      protein: m.proteinGrams,
      status: m.statusLabel,
      statusType,
      items: m.itemsSummary,
    };
  });

  const calPercent = Math.min(Math.round((caloriesConsumed / (caloriesTarget || 1)) * 100), 100);
  const remainingCals = Math.max(caloriesTarget - caloriesConsumed, 0);
  const completedMealsCount = nutrition.meals.filter((m) => m.status.startsWith('COMPLETED')).length;

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Nutrition OS"
        subtitle="METABOLIC TELEMETRY & MACROS"
        rightAction={
          <TouchableOpacity
            style={styles.addBtnHeader}
            onPress={() => onOpenAddFood('SNACK')}
            activeOpacity={0.7}
          >
            <Text style={styles.addBtnText}>+ LOG FOOD</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Caloric Energy Balance Card */}
        <View style={styles.energyCard}>
          <View style={styles.energyHeader}>
            <View>
              <Text style={styles.energyLabel}>DAILY ENERGY INTAKE · PLANNED VS ACTUAL</Text>
              <View style={styles.calsRow}>
                <Text style={styles.calsConsumed}>{caloriesConsumed}</Text>
                <Text style={styles.calsTarget}>/ {caloriesTarget} kcal</Text>
              </View>
            </View>
            <View style={styles.remainingPill}>
              <Text style={styles.remainingVal}>{remainingCals}</Text>
              <Text style={styles.remainingLabel}>kcal left</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${calPercent}%` }]} />
          </View>

          {/* Macro Breakdown Rows */}
          <View style={styles.macroSplitRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroName}>PROTEIN</Text>
              <Text style={styles.macroValue}>
                {protein.current} / {protein.target}g
              </Text>
              <Text style={styles.macroSub}>86% Target</Text>
              <View style={[styles.macroMiniBar, { width: '86%', backgroundColor: Theme.colors.cyanGlow }]} />
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroName}>CARBS</Text>
              <Text style={styles.macroValue}>
                {carbs.current} / {carbs.target}g
              </Text>
              <Text style={styles.macroSub}>68% Target</Text>
              <View style={[styles.macroMiniBar, { width: '68%', backgroundColor: '#3882F6' }]} />
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroName}>FATS</Text>
              <Text style={styles.macroValue}>
                {fats.current} / {fats.target}g
              </Text>
              <Text style={styles.macroSub}>82% Target</Text>
              <View style={[styles.macroMiniBar, { width: '82%', backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
        </View>

        {/* Adherence Overview */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceCol}>
            <Text style={styles.adherenceLabel}>MACRO ADHERENCE</Text>
            <Text style={styles.adherenceVal}>92%</Text>
            <Text style={styles.adherenceSub}>Within ±5% target</Text>
          </View>
          <View style={styles.adherenceDivider} />
          <View style={styles.adherenceCol}>
            <Text style={styles.adherenceLabel}>MEALS LOGGED</Text>
            <Text style={styles.adherenceVal}>{completedMealsCount} / {nutrition.meals.length}</Text>
            <Text style={styles.adherenceSub}>{nutrition.meals.length > 0 ? Math.round((completedMealsCount / nutrition.meals.length) * 100) : 0}% logged today</Text>
          </View>
          <View style={styles.adherenceDivider} />
          <View style={styles.adherenceCol}>
            <Text style={styles.adherenceLabel}>CALORIC DEFICIT</Text>
            <Text style={styles.adherenceVal}>
              {caloriesConsumed - caloriesTarget > 0 ? `+${caloriesConsumed - caloriesTarget}` : `${caloriesConsumed - caloriesTarget}`}
            </Text>
            <Text style={styles.adherenceSub}>Lean Recomp State</Text>
          </View>
        </View>

        {/* Hydration Fast-Track Card */}
        <TouchableOpacity
          style={styles.hydrationCard}
          onPress={onOpenHydration}
          activeOpacity={0.8}
        >
          <View style={styles.hydrationHeader}>
            <View>
              <Text style={styles.hydrationLabel}>HYDRATION PROTOCOL</Text>
              <Text style={styles.hydrationValue}>
                {waterLiters.toFixed(1)} <Text style={styles.hydrationUnit}>/ {waterTarget} L</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.waterQuickAdd}
              onPress={() => addWater(0.25)}
              activeOpacity={0.7}
            >
              <Text style={styles.waterQuickText}>+250ml</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.waterBarTrack}>
            <View
              style={[
                styles.waterBarFill,
                { width: `${Math.min((waterLiters / waterTarget) * 100, 100)}%` },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Meal Log Cards with Planned vs Actual Ingestion */}
        <Text style={styles.sectionHeader}>TODAY'S SCHEDULED MEALS</Text>
        <View style={styles.mealsList}>
          {meals.map((meal) => (
            <TouchableOpacity
              key={meal.type}
              style={styles.mealCard}
              onPress={() => onOpenMealDetail(meal.type)}
              activeOpacity={0.8}
            >
              <View style={styles.mealCardTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.mealTitleRow}>
                    <Text style={styles.mealTypeTag}>{meal.type}</Text>
                    <StatusBadge
                      label={meal.status}
                      status={meal.statusType}
                    />
                  </View>
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                </View>
                <View style={styles.mealMeta}>
                  <Text style={styles.mealCals}>
                    {meal.actualCals > 0 ? meal.actualCals : meal.plannedCals} kcal
                  </Text>
                  <Text style={styles.mealProtein}>{meal.protein}g protein</Text>
                </View>
              </View>

              <Text style={styles.mealItemsList} numberOfLines={2}>
                {meal.items}
              </Text>

              <View style={styles.mealActions}>
                <Text style={styles.mealTapHint}>Tap to view/modify portions →</Text>
                <TouchableOpacity
                  style={styles.addFoodMiniBtn}
                  onPress={() => onOpenAddFood(meal.type)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addFoodMiniText}>+ Add Food</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tactical Nutrition Brief */}
        <View style={styles.tacticalCard}>
          <Text style={styles.tacticalTag}>TACTICAL NUTRITION DIRECTIVE</Text>
          <Text style={styles.tacticalText}>
            "Protein is at 155g (86% of target) with 2 meals remaining. Allocate at least 25g protein during dinner to maintain full muscle protein synthesis threshold following today's pushing session."
          </Text>
        </View>
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 28,
    gap: 16,
  },
  addBtnHeader: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
  },
  addBtnText: {
    color: Theme.colors.cyanGlow,
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '800',
  },
  energyCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    shadowColor: Theme.colors.cyanGlow,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 3,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  energyLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  calsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  calsConsumed: {
    fontSize: 32,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  calsTarget: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  remainingPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  remainingVal: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
  },
  remainingLabel: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.cyanGlow,
    borderRadius: 4,
  },
  macroSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 8,
    gap: 3,
  },
  macroName: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  macroSub: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  macroMiniBar: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  adherenceCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
  },
  adherenceCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  adherenceLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adherenceVal: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
  },
  adherenceSub: {
    fontSize: 8,
    color: Theme.colors.textMuted,
  },
  adherenceDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  hydrationCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 10,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hydrationLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  hydrationValue: {
    fontSize: 20,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  hydrationUnit: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  waterQuickAdd: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
  },
  waterQuickText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  waterBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  waterBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.cyanGlow,
    borderRadius: 3,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginTop: 4,
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 10,
  },
  mealCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mealTypeTag: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  mealMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  mealCals: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  mealProtein: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  mealItemsList: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  mealTapHint: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  addFoodMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  addFoodMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.cyanGlow,
  },
  tacticalCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: Theme.borderRadius.lg,
    padding: 14,
    gap: 4,
  },
  tacticalTag: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#C084FC',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tacticalText: {
    fontSize: 11,
    color: Theme.colors.textPrimary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
