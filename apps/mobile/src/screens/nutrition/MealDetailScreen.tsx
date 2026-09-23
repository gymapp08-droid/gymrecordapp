import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton, SecondaryButton } from '../../components';
import { Theme } from '../../theme/tokens';

export type MealCompletionState =
  | 'COMPLETED_PLANNED'
  | 'COMPLETED_MODIFIED'
  | 'PARTIAL'
  | 'SKIPPED'
  | 'PENDING';

export interface PlannedMealItem {
  id: string;
  name: string;
  category: string;
  plannedGrams: number;
  actualGrams: number;
  baseCaloriesPer100g: number;
  baseProteinPer100g: number;
  baseCarbsPer100g: number;
  baseFatPer100g: number;
  isSubstituted?: boolean;
  originalName?: string;
}

interface MealDetailScreenProps {
  mealType?: string;
  onBack: () => void;
  onAddMoreFood: (mealType: string) => void;
}

const COMMON_SUBSTITUTES: Record<string, { name: string; cal100: number; p100: number; c100: number; f100: number }[]> = {
  'Chicken': [
    { name: 'Wild Alaskan Salmon', cal100: 208, p100: 22.0, c100: 0, f100: 12.5 },
    { name: 'Lean Ground Turkey 93/7', cal100: 152, p100: 19.5, c100: 0, f100: 8.3 },
    { name: 'Organic Extra Firm Tofu', cal100: 83, p100: 10.0, c100: 1.5, f100: 5.0 },
    { name: 'Boiled Egg Whites (6 large)', cal100: 52, p100: 11.0, c100: 0.7, f100: 0.2 },
  ],
  'Rice': [
    { name: 'Steamed Sweet Potato', cal100: 86, p100: 1.6, c100: 20.1, f100: 0.1 },
    { name: 'Cooked Quinoa', cal100: 120, p100: 4.4, c100: 21.3, f100: 1.9 },
    { name: 'Rolled Oats (Dry)', cal100: 389, p100: 16.9, c100: 66.3, f100: 6.9 },
    { name: 'Sprouted Brown Rice', cal100: 123, p100: 2.7, c100: 25.6, f100: 1.0 },
  ],
};

const INITIAL_MEALS: Record<string, PlannedMealItem[]> = {
  BREAKFAST: [
    {
      id: 'b-1',
      name: 'Whole Large Eggs',
      category: 'Protein / Fats',
      plannedGrams: 200,
      actualGrams: 200,
      baseCaloriesPer100g: 143,
      baseProteinPer100g: 12.6,
      baseCarbsPer100g: 0.7,
      baseFatPer100g: 9.5,
    },
    {
      id: 'b-2',
      name: 'Rolled Oats',
      category: 'Complex Carbs',
      plannedGrams: 80,
      actualGrams: 80,
      baseCaloriesPer100g: 389,
      baseProteinPer100g: 16.9,
      baseCarbsPer100g: 66.3,
      baseFatPer100g: 6.9,
    },
    {
      id: 'b-3',
      name: 'Whey Protein Isolate',
      category: 'Pure Protein',
      plannedGrams: 30,
      actualGrams: 30,
      baseCaloriesPer100g: 380,
      baseProteinPer100g: 82.0,
      baseCarbsPer100g: 4.0,
      baseFatPer100g: 1.5,
    },
  ],
  LUNCH: [
    {
      id: 'l-1',
      name: 'Grilled Chicken Breast',
      category: 'Lean Protein',
      plannedGrams: 200,
      actualGrams: 180,
      baseCaloriesPer100g: 165,
      baseProteinPer100g: 31.0,
      baseCarbsPer100g: 0,
      baseFatPer100g: 3.6,
    },
    {
      id: 'l-2',
      name: 'Steamed Jasmine Rice',
      category: 'Complex Carbs',
      plannedGrams: 150,
      actualGrams: 160,
      baseCaloriesPer100g: 130,
      baseProteinPer100g: 2.7,
      baseCarbsPer100g: 28.2,
      baseFatPer100g: 0.3,
    },
    {
      id: 'l-3',
      name: 'Broccoli & Extra Virgin Olive Oil',
      category: 'Micros & Lipids',
      plannedGrams: 120,
      actualGrams: 120,
      baseCaloriesPer100g: 116,
      baseProteinPer100g: 2.9,
      baseCarbsPer100g: 6.6,
      baseFatPer100g: 8.3,
    },
  ],
  SNACK: [
    {
      id: 's-1',
      name: 'Greek Yogurt 0% Fat',
      category: 'Slow-Release Protein',
      plannedGrams: 170,
      actualGrams: 170,
      baseCaloriesPer100g: 57,
      baseProteinPer100g: 10.3,
      baseCarbsPer100g: 3.6,
      baseFatPer100g: 0.1,
    },
    {
      id: 's-2',
      name: 'Organic Blueberries',
      category: 'Antioxidants / Carbs',
      plannedGrams: 80,
      actualGrams: 80,
      baseCaloriesPer100g: 57,
      baseProteinPer100g: 0.7,
      baseCarbsPer100g: 14.5,
      baseFatPer100g: 0.3,
    },
  ],
  DINNER: [
    {
      id: 'd-1',
      name: 'Wild Alaskan Salmon',
      category: 'Omega-3 Protein',
      plannedGrams: 180,
      actualGrams: 180,
      baseCaloriesPer100g: 208,
      baseProteinPer100g: 22.0,
      baseCarbsPer100g: 0,
      baseFatPer100g: 12.5,
    },
    {
      id: 'd-2',
      name: 'Baked Sweet Potato',
      category: 'Complex Carbs',
      plannedGrams: 150,
      actualGrams: 150,
      baseCaloriesPer100g: 86,
      baseProteinPer100g: 1.6,
      baseCarbsPer100g: 20.1,
      baseFatPer100g: 0.1,
    },
    {
      id: 'd-3',
      name: 'Roasted Asparagus Spears',
      category: 'Micronutrients',
      plannedGrams: 100,
      actualGrams: 100,
      baseCaloriesPer100g: 20,
      baseProteinPer100g: 2.2,
      baseCarbsPer100g: 3.9,
      baseFatPer100g: 0.1,
    },
  ],
};

export const MealDetailScreen: React.FC<MealDetailScreenProps> = ({
  mealType = 'LUNCH',
  onBack,
  onAddMoreFood,
}) => {
  const [items, setItems] = useState<PlannedMealItem[]>(
    INITIAL_MEALS[mealType] || INITIAL_MEALS['LUNCH']!
  );
  const [completionState, setCompletionState] = useState<MealCompletionState>('COMPLETED_MODIFIED');
  const [mealNotes, setMealNotes] = useState<string>('Slightly scaled chicken to 180g due to portion availability. Added extra jasmine rice for carb load.');
  const [editingSubstituteItem, setEditingSubstituteItem] = useState<PlannedMealItem | null>(null);

  // Calculate planned vs actual totals
  const plannedTotals = items.reduce(
    (acc, it) => {
      const cals = (it.plannedGrams / 100) * it.baseCaloriesPer100g;
      const p = (it.plannedGrams / 100) * it.baseProteinPer100g;
      const c = (it.plannedGrams / 100) * it.baseCarbsPer100g;
      const f = (it.plannedGrams / 100) * it.baseFatPer100g;
      return {
        cals: acc.cals + cals,
        protein: acc.protein + p,
        carbs: acc.carbs + c,
        fat: acc.fat + f,
      };
    },
    { cals: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const actualTotals = items.reduce(
    (acc, it) => {
      const cals = (it.actualGrams / 100) * it.baseCaloriesPer100g;
      const p = (it.actualGrams / 100) * it.baseProteinPer100g;
      const c = (it.actualGrams / 100) * it.baseCarbsPer100g;
      const f = (it.actualGrams / 100) * it.baseFatPer100g;
      return {
        cals: acc.cals + cals,
        protein: acc.protein + p,
        carbs: acc.carbs + c,
        fat: acc.fat + f,
      };
    },
    { cals: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const updateActualGrams = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const newGrams = Math.max(0, it.actualGrams + delta);
          return { ...it, actualGrams: newGrams };
        }
        return it;
      })
    );
  };

  const setDirectGrams = (id: string, text: string) => {
    const val = parseInt(text, 10);
    const grams = isNaN(val) ? 0 : Math.max(0, val);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, actualGrams: grams } : it))
    );
  };

  const handleApplySubstitute = (sub: { name: string; cal100: number; p100: number; c100: number; f100: number }) => {
    if (!editingSubstituteItem) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === editingSubstituteItem.id) {
          return {
            ...it,
            originalName: it.originalName || it.name,
            name: sub.name,
            baseCaloriesPer100g: sub.cal100,
            baseProteinPer100g: sub.p100,
            baseCarbsPer100g: sub.c100,
            baseFatPer100g: sub.f100,
            isSubstituted: true,
          };
        }
        return it;
      })
    );
    setEditingSubstituteItem(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const calsDelta = Math.round(actualTotals.cals - plannedTotals.cals);

  return (
    <AlphaScreen>
      <AlphaHeader
        title={`${mealType} LOG`}
        subtitle="PLANNED VS ACTUAL INGESTION"
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAddMoreFood(mealType)}
            activeOpacity={0.7}
          >
            <Text style={styles.addBtnText}>+ ADD FOOD</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Completion Status Selector */}
        <View style={styles.stateSelectorCard}>
          <Text style={styles.sectionLabel}>MEAL COMPLETION STATE</Text>
          <View style={styles.stateButtonsRow}>
            <TouchableOpacity
              style={[
                styles.stateBtn,
                completionState === 'COMPLETED_PLANNED' && styles.stateBtnActive,
              ]}
              onPress={() => setCompletionState('COMPLETED_PLANNED')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.stateBtnText,
                  completionState === 'COMPLETED_PLANNED' && styles.stateBtnTextActive,
                ]}
              >
                AS PLANNED
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.stateBtn,
                completionState === 'COMPLETED_MODIFIED' && styles.stateBtnActive,
              ]}
              onPress={() => setCompletionState('COMPLETED_MODIFIED')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.stateBtnText,
                  completionState === 'COMPLETED_MODIFIED' && styles.stateBtnTextActive,
                ]}
              >
                MODIFIED
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.stateBtn,
                completionState === 'PARTIAL' && styles.stateBtnActive,
              ]}
              onPress={() => setCompletionState('PARTIAL')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.stateBtnText,
                  completionState === 'PARTIAL' && styles.stateBtnTextActive,
                ]}
              >
                PARTIAL
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.stateBtn,
                completionState === 'SKIPPED' && styles.stateBtnActive,
              ]}
              onPress={() => setCompletionState('SKIPPED')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.stateBtnText,
                  completionState === 'SKIPPED' && styles.stateBtnTextActive,
                ]}
              >
                SKIPPED
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Planned vs Actual Macro Delta Card */}
        <View style={styles.deltaCard}>
          <View style={styles.deltaHeader}>
            <View>
              <Text style={styles.deltaLabel}>ENERGY DELTA</Text>
              <View style={styles.deltaRow}>
                <Text style={styles.deltaBig}>{Math.round(actualTotals.cals)}</Text>
                <Text style={styles.deltaTarget}>/ {Math.round(plannedTotals.cals)} kcal planned</Text>
              </View>
            </View>
            <View
              style={[
                styles.deltaBadge,
                calsDelta === 0
                  ? styles.deltaNeutral
                  : calsDelta > 0
                  ? styles.deltaSurplus
                  : styles.deltaDeficit,
              ]}
            >
              <Text style={styles.deltaBadgeText}>
                {calsDelta > 0 ? `+${calsDelta}` : `${calsDelta}`} kcal
              </Text>
            </View>
          </View>

          {/* Macro Breakdown Comparators */}
          <View style={styles.macroComparators}>
            <View style={styles.compCol}>
              <Text style={styles.compLabel}>PROTEIN</Text>
              <Text style={styles.compVal}>{actualTotals.protein.toFixed(1)}g</Text>
              <Text style={styles.compSub}>Planned: {plannedTotals.protein.toFixed(1)}g</Text>
            </View>

            <View style={styles.compCol}>
              <Text style={styles.compLabel}>CARBS</Text>
              <Text style={styles.compVal}>{actualTotals.carbs.toFixed(1)}g</Text>
              <Text style={styles.compSub}>Planned: {plannedTotals.carbs.toFixed(1)}g</Text>
            </View>

            <View style={styles.compCol}>
              <Text style={styles.compLabel}>FATS</Text>
              <Text style={styles.compVal}>{actualTotals.fat.toFixed(1)}g</Text>
              <Text style={styles.compSub}>Planned: {plannedTotals.fat.toFixed(1)}g</Text>
            </View>
          </View>
        </View>

        {/* Itemized Food List with Planned vs Actual Ingestion */}
        <Text style={styles.sectionLabel}>FOOD INVENTORY & PORTIONS</Text>
        <View style={styles.itemsList}>
          {items.map((item) => {
            const itemActualCals = Math.round((item.actualGrams / 100) * item.baseCaloriesPer100g);
            const itemActualP = ((item.actualGrams / 100) * item.baseProteinPer100g).toFixed(1);
            const itemActualC = ((item.actualGrams / 100) * item.baseCarbsPer100g).toFixed(1);
            const itemActualF = ((item.actualGrams / 100) * item.baseFatPer100g).toFixed(1);
            const gramDiff = item.actualGrams - item.plannedGrams;

            return (
              <View key={item.id} style={styles.foodItemCard}>
                <View style={styles.foodItemTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.foodNameRow}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      {item.isSubstituted && (
                        <View style={styles.subPill}>
                          <Text style={styles.subPillText}>SUBSTITUTED</Text>
                        </View>
                      )}
                    </View>
                    {item.originalName && (
                      <Text style={styles.originalFoodText}>Replaced: {item.originalName}</Text>
                    )}
                    <Text style={styles.foodCategory}>{item.category}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleRemoveItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Portion Adjuster */}
                <View style={styles.portionRow}>
                  <View style={styles.portionInfo}>
                    <Text style={styles.portionLabel}>ACTUAL WEIGHT CONSUMED</Text>
                    <View style={styles.inputSteppers}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateActualGrams(item.id, -10)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepBtnText}>-10</Text>
                      </TouchableOpacity>

                      <View style={styles.gramInputWrap}>
                        <TextInput
                          style={styles.gramInput}
                          keyboardType="numeric"
                          value={item.actualGrams.toString()}
                          onChangeText={(txt) => setDirectGrams(item.id, txt)}
                        />
                        <Text style={styles.gramUnit}>g</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateActualGrams(item.id, +10)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepBtnText}>+10</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.diffBadgeWrap}>
                    <Text style={styles.portionLabel}>PLAN: {item.plannedGrams}g</Text>
                    <View
                      style={[
                        styles.gramDiffBadge,
                        gramDiff === 0
                          ? styles.diffNeutral
                          : gramDiff > 0
                          ? styles.diffHigher
                          : styles.diffLower,
                      ]}
                    >
                      <Text style={styles.gramDiffText}>
                        {gramDiff > 0 ? `+${gramDiff}g` : gramDiff === 0 ? 'MATCH' : `${gramDiff}g`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Recalculated Macros for this item */}
                <View style={styles.itemMacroBar}>
                  <Text style={styles.itemMacroVal}>{itemActualCals} kcal</Text>
                  <Text style={styles.itemMacroDivider}>·</Text>
                  <Text style={styles.itemMacroVal}>{itemActualP}g P</Text>
                  <Text style={styles.itemMacroDivider}>·</Text>
                  <Text style={styles.itemMacroVal}>{itemActualC}g C</Text>
                  <Text style={styles.itemMacroDivider}>·</Text>
                  <Text style={styles.itemMacroVal}>{itemActualF}g F</Text>
                </View>

                {/* Substitute Food CTA */}
                <TouchableOpacity
                  style={styles.substituteTrigger}
                  onPress={() => setEditingSubstituteItem(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.substituteTriggerText}>⇄ Substitute / Replace Food</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Meal Notes & Justification (Section 47) */}
        <View style={styles.notesCard}>
          <Text style={styles.sectionLabel}>MEAL JOURNAL & CONTEXT</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            placeholder="Record any modifications, dining out context, satiety notes..."
            placeholderTextColor={Theme.colors.textMuted}
            value={mealNotes}
            onChangeText={setMealNotes}
          />
        </View>
      </ScrollView>

      {/* Save Meal CTA */}
      <View style={styles.footer}>
        <PrimaryButton
          title="COMMIT MEAL RECORD"
          onPress={onBack}
        />
      </View>

      {/* Food Substitution Modal */}
      <Modal visible={editingSubstituteItem !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.substituteModal}>
            <View style={styles.subHeader}>
              <Text style={styles.subTitle}>REPLACE FOOD</Text>
              <Text style={styles.subTarget}>Original: {editingSubstituteItem?.name}</Text>
            </View>

            <Text style={styles.subPrompt}>Select calibrated equivalent substitute:</Text>
            <View style={styles.subList}>
              {(COMMON_SUBSTITUTES['Chicken'] || []).map((sub, sIdx) => (
                <TouchableOpacity
                  key={sIdx}
                  style={styles.subOptionRow}
                  onPress={() => handleApplySubstitute(sub)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subOptionName}>{sub.name}</Text>
                    <Text style={styles.subOptionMacros}>
                      {sub.cal100} kcal · {sub.p100}g P · {sub.c100}g C · {sub.f100}g F per 100g
                    </Text>
                  </View>
                  <Text style={styles.subOptionChevron}>Select ›</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SecondaryButton
              title="Cancel"
              onPress={() => setEditingSubstituteItem(null)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 12,
    paddingBottom: 28,
    gap: 16,
  },
  addBtn: {
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
  sectionLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 4,
  },
  stateSelectorCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 8,
  },
  stateButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stateBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: Theme.colors.cyanGlow,
  },
  stateBtnText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stateBtnTextActive: {
    color: Theme.colors.cyanGlow,
  },
  deltaCard: {
    backgroundColor: '#0A0E17',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    gap: 12,
  },
  deltaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deltaLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  deltaBig: {
    fontSize: 28,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  deltaTarget: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
  },
  deltaNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Theme.colors.border,
  },
  deltaSurplus: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  deltaDeficit: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  deltaBadgeText: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  macroComparators: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  compCol: {
    flex: 1,
    gap: 2,
  },
  compLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  compVal: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
  },
  compSub: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  itemsList: {
    gap: 12,
  },
  foodItemCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 10,
  },
  foodItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  subPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subPillText: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#C084FC',
    fontWeight: '800',
  },
  originalFoodText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  foodCategory: {
    fontSize: 10,
    color: Theme.colors.cyanGlow,
    marginTop: 2,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 14,
    color: Theme.colors.textMuted,
  },
  portionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
  },
  portionInfo: {
    gap: 4,
  },
  portionLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  inputSteppers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textPrimary,
    fontWeight: '800',
  },
  gramInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 32,
  },
  gramInput: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 14,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    width: 44,
    textAlign: 'center',
    padding: 0,
  },
  gramUnit: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginLeft: 2,
  },
  diffBadgeWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  gramDiffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  diffNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: Theme.colors.border,
  },
  diffHigher: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  diffLower: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  gramDiffText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  itemMacroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  itemMacroVal: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textSecondary,
  },
  itemMacroDivider: {
    color: Theme.colors.textMuted,
  },
  substituteTrigger: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  substituteTriggerText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  notesCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 8,
  },
  notesInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 10,
    color: Theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  footer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  substituteModal: {
    width: '100%',
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    padding: 18,
    gap: 12,
  },
  subHeader: {
    gap: 2,
  },
  subTitle: {
    fontSize: 14,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
    letterSpacing: 1,
  },
  subTarget: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  subPrompt: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  subList: {
    gap: 8,
  },
  subOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  subOptionName: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  subOptionMacros: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  subOptionChevron: {
    fontSize: 12,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
});
