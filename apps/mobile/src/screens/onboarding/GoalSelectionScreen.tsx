import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton } from '../../components';
import { Theme } from '../../theme/tokens';

interface GoalSelectionScreenProps {
  onBack: () => void;
  onNext: (selectedGoal: string) => void;
}

const CANONICAL_CATEGORIES = [
  { id: 'cat-muscle-building', title: '1. MUSCLE BUILDING PROGRAMS', desc: 'Hypertrophy, muscle mass, strength, and periodized volume splits' },
  { id: 'cat-fat-loss', title: '2. FAT LOSS PROGRAMS', desc: 'High-metabolic conditioning, shredded body composition, and giant set protocols' },
  { id: 'cat-single-muscle', title: '3. SINGLE MUSCLE PROGRAMS', desc: 'Targeted specialization programs for arms, chest, and priority muscle groups' },
  { id: 'cat-bodyweight', title: '4. BODY WEIGHT WORKOUT PROGRAMS', desc: 'Calisthenics, functional bodyweight routines, and home fitness systems' },
  { id: 'cat-medical', title: '5. MEDICAL CONDITION PROGRAMS', desc: 'Tailored nutritional regimens for cholesterol, diabetes, hypertension, and thyroid' },
  { id: 'cat-family', title: '6. KIDS & FAMILY PROGRAMS', desc: 'Nutritional wellness blueprints for children and family health fundamentals' },
];

export const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({ onBack, onNext }) => {
  const categories = CANONICAL_CATEGORIES;

  const [selectedGoal, setSelectedGoal] = useState<string>(categories[1]?.id || 'cat-fat-loss');

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Program Category"
        subtitle="Step 1 of 4 · Choose Target Category"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.leadText}>
          Select your target program category from the GRAVITY catalog. Your selection directly determines available training programs.
        </Text>

        <View style={styles.optionsList}>
          {categories.map((item: any) => {
            const isSelected = selectedGoal === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.goalPill, isSelected && styles.goalPillSelected]}
                onPress={() => setSelectedGoal(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.pillHeader}>
                  <Text style={[styles.goalTitle, isSelected && styles.goalTitleSelected]}>
                    {item.title}
                  </Text>
                  <View style={[styles.radioDot, isSelected && styles.radioDotSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>
                <Text style={styles.goalDesc}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continue to Programs"
          onPress={() => onNext(selectedGoal)}
        />
      </View>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  leadText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  goalPill: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    padding: 16,
    gap: 6,
  },
  goalPillSelected: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    shadowColor: Theme.colors.cyanGlow,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Theme.typography.fontDisplay,
  },
  goalTitleSelected: {
    color: Theme.colors.cyanGlow,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Theme.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotSelected: {
    borderColor: Theme.colors.cyanGlow,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.cyanGlow,
  },
  goalDesc: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
});
