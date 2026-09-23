import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSizeG: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

const DATABASE_FOODS: FoodItem[] = [
  {
    id: 'f-chicken-breast',
    name: 'Skinless Chicken Breast',
    brand: 'Raw / USDA',
    servingSizeG: 100,
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
  },
  {
    id: 'f-jasmine-rice',
    name: 'Jasmine Rice (Cooked)',
    brand: 'Standard Grain',
    servingSizeG: 100,
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.2,
    fatPer100g: 0.3,
  },
  {
    id: 'f-whey-isolate',
    name: 'Whey Protein Isolate',
    brand: 'Optimum Nutrition',
    servingSizeG: 30,
    caloriesPer100g: 380,
    proteinPer100g: 82,
    carbsPer100g: 4,
    fatPer100g: 1.5,
  },
  {
    id: 'f-whole-egg',
    name: 'Large Whole Egg',
    brand: 'Grade A',
    servingSizeG: 50,
    caloriesPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fatPer100g: 9.5,
  },
  {
    id: 'f-rolled-oats',
    name: 'Rolled Oats',
    brand: 'Quaker',
    servingSizeG: 100,
    caloriesPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
  },
  {
    id: 'f-greek-yogurt',
    name: 'Greek Yogurt 0%',
    brand: 'Fage Total',
    servingSizeG: 100,
    caloriesPer100g: 57,
    proteinPer100g: 10.3,
    carbsPer100g: 3.6,
    fatPer100g: 0,
  },
];

interface AddFoodScreenProps {
  mealType?: string;
  onBack: () => void;
  onAddFood: (item: {
    name: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: string;
  }) => void;
}

export const AddFoodScreen: React.FC<AddFoodScreenProps> = ({
  mealType = 'LUNCH',
  onBack,
  onAddFood,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem>(DATABASE_FOODS[0]!);
  const [servingGrams, setServingGrams] = useState('150');

  const grams = parseFloat(servingGrams) || 100;
  const factor = grams / 100;

  const totalCals = Math.round(selectedFood.caloriesPer100g * factor);
  const totalProtein = (selectedFood.proteinPer100g * factor).toFixed(1);
  const totalCarbs = (selectedFood.carbsPer100g * factor).toFixed(1);
  const totalFat = (selectedFood.fatPer100g * factor).toFixed(1);

  const filteredFoods = DATABASE_FOODS.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCommit = () => {
    onAddFood({
      name: selectedFood.name,
      grams,
      calories: totalCals,
      protein: parseFloat(totalProtein),
      carbs: parseFloat(totalCarbs),
      fat: parseFloat(totalFat),
      mealType,
    });
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Log Food"
        subtitle={`TARGET: ${mealType}`}
        onBack={onBack}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search verified food database..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Food Dynamic Macro Calculator */}
        <View style={styles.calculatorCard}>
          <View style={styles.calcHeader}>
            <View>
              <Text style={styles.calcName}>{selectedFood.name}</Text>
              <Text style={styles.calcBrand}>{selectedFood.brand}</Text>
            </View>
            <StatusBadge label="VERIFIED" status="success" />
          </View>

          <View style={styles.portionRow}>
            <Text style={styles.portionLabel}>SERVING SIZE (GRAMS):</Text>
            <TextInput
              style={styles.portionInput}
              keyboardType="number-pad"
              value={servingGrams}
              onChangeText={setServingGrams}
              maxLength={5}
            />
          </View>

          {/* Preset Buttons */}
          <View style={styles.presetRow}>
            {[50, 100, 150, 200, 250].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetBtn,
                  servingGrams === preset.toString() && styles.presetBtnActive,
                ]}
                onPress={() => setServingGrams(preset.toString())}
              >
                <Text
                  style={[
                    styles.presetText,
                    servingGrams === preset.toString() && styles.presetTextActive,
                  ]}
                >
                  {preset}g
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Computed Output */}
          <View style={styles.macroRow}>
            <View style={styles.macroBox}>
              <Text style={styles.macroBoxVal}>{totalCals}</Text>
              <Text style={styles.macroBoxLabel}>CALORIES</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={[styles.macroBoxVal, { color: '#00F0FF' }]}>{totalProtein}g</Text>
              <Text style={styles.macroBoxLabel}>PROTEIN</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={[styles.macroBoxVal, { color: '#3882F6' }]}>{totalCarbs}g</Text>
              <Text style={styles.macroBoxLabel}>CARBS</Text>
            </View>
            <View style={styles.macroBox}>
              <Text style={[styles.macroBoxVal, { color: '#F59E0B' }]}>{totalFat}g</Text>
              <Text style={styles.macroBoxLabel}>FAT</Text>
            </View>
          </View>
        </View>

        {/* Database Matches */}
        <Text style={styles.sectionHeader}>RECENT & VERIFIED ITEMS</Text>
        <View style={styles.foodList}>
          {filteredFoods.map((item) => {
            const isSelected = selectedFood.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.foodItemCard, isSelected && styles.foodItemCardActive]}
                onPress={() => setSelectedFood(item)}
              >
                <View style={styles.foodItemInfo}>
                  <Text style={[styles.foodItemName, isSelected && styles.foodItemNameActive]}>
                    {item.name}
                  </Text>
                  <Text style={styles.foodItemSub}>
                    {item.caloriesPer100g} kcal · {item.proteinPer100g}g P / 100g
                  </Text>
                </View>
                <Text style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
                  {isSelected ? 'SELECTED' : 'SELECT'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={`Commit to ${mealType}`}
          onPress={handleCommit}
        />
      </View>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingVertical: 8,
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
  content: {
    paddingVertical: 8,
    paddingBottom: 28,
    gap: 16,
  },
  calculatorCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 16,
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  calcName: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  calcBrand: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  portionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  portionLabel: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  portionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: Theme.colors.cyanGlow,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 70,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  presetBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: Theme.colors.cyanGlow,
  },
  presetText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: {
    color: Theme.colors.cyanGlow,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Theme.borderRadius.md,
    padding: 10,
  },
  macroBox: {
    alignItems: 'center',
  },
  macroBoxVal: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  macroBoxLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 4,
  },
  foodList: {
    gap: 8,
  },
  foodItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
  },
  foodItemCardActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  foodItemNameActive: {
    color: Theme.colors.cyanGlow,
  },
  foodItemSub: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  selectIndicator: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  selectIndicatorActive: {
    color: Theme.colors.cyanGlow,
  },
  footer: {
    paddingTop: 12,
  },
});
