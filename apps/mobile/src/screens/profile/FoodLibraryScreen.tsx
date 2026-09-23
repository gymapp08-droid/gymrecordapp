import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader } from '../../components';
import { Theme } from '../../theme/tokens';
import { FoodItem } from '../nutrition/AddFoodScreen';

interface FoodLibraryScreenProps {
  onBack: () => void;
  onSelectFood?: (food: FoodItem) => void;
}

const EXTENDED_FOODS: FoodItem[] = [
  { id: 'f-1', name: 'Chicken Breast (Boneless)', brand: 'Raw Poultry', servingSizeG: 100, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: 'f-2', name: 'Sirloin Steak (Lean Trimmed)', brand: 'Grass-Fed Beef', servingSizeG: 100, caloriesPer100g: 212, proteinPer100g: 28, carbsPer100g: 0, fatPer100g: 11 },
  { id: 'f-3', name: 'Alaskan Salmon Fillet', brand: 'Wild Caught', servingSizeG: 100, caloriesPer100g: 208, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 13 },
  { id: 'f-4', name: 'Whey Protein Isolate', brand: 'Optimum Nutrition', servingSizeG: 30, caloriesPer100g: 380, proteinPer100g: 82, carbsPer100g: 4, fatPer100g: 1.5 },
  { id: 'f-5', name: 'Whole Liquid Eggs', brand: 'Organic Pastured', servingSizeG: 100, caloriesPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 0.7, fatPer100g: 9.5 },
  { id: 'f-6', name: 'Jasmine Rice (Dry Uncooked)', brand: 'Royal Fragrant', servingSizeG: 100, caloriesPer100g: 355, proteinPer100g: 7.1, carbsPer100g: 80, fatPer100g: 0.7 },
  { id: 'f-7', name: 'Rolled Oats (Old Fashioned)', brand: 'Quaker', servingSizeG: 100, caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9 },
  { id: 'f-8', name: 'Greek Yogurt 0%', brand: 'Fage Total', servingSizeG: 100, caloriesPer100g: 57, proteinPer100g: 10.3, carbsPer100g: 3.6, fatPer100g: 0 },
  { id: 'f-9', name: 'Hass Avocado', brand: 'Fresh Produce', servingSizeG: 100, caloriesPer100g: 160, proteinPer100g: 2.0, carbsPer100g: 8.5, fatPer100g: 14.7 },
  { id: 'f-10', name: 'Almond Butter (Pure)', brand: 'Artisana', servingSizeG: 100, caloriesPer100g: 614, proteinPer100g: 21, carbsPer100g: 19, fatPer100g: 56 },
];

export const FoodLibraryScreen: React.FC<FoodLibraryScreenProps> = ({
  onBack,
  onSelectFood,
}) => {
  const [search, setSearch] = useState('');

  const filtered = EXTENDED_FOODS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.brand && f.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Food Database"
        subtitle="VERIFIED NUTRITIONAL ARCHIVE"
        onBack={onBack}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods, brands, or ingredients..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.foodCard}
              onPress={() => onSelectFood?.(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodBrand}>{item.brand}</Text>
                </View>
                <Text style={styles.foodCals}>{item.caloriesPer100g} <Text style={styles.calUnit}>kcal/100g</Text></Text>
              </View>

              <View style={styles.macroPillsRow}>
                <View style={[styles.macroPill, { borderColor: '#00F0FF' }]}>
                  <Text style={styles.macroPillText}>P: {item.proteinPer100g}g</Text>
                </View>
                <View style={[styles.macroPill, { borderColor: '#3882F6' }]}>
                  <Text style={styles.macroPillText}>C: {item.carbsPer100g}g</Text>
                </View>
                <View style={[styles.macroPill, { borderColor: '#F59E0B' }]}>
                  <Text style={styles.macroPillText}>F: {item.fatPer100g}g</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  list: {
    gap: 12,
  },
  foodCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  foodBrand: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  foodCals: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  calUnit: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  macroPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  macroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
});
