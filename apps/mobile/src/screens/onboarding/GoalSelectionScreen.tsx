import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton } from '../../components';
import { Theme } from '../../theme/tokens';

import programCatalogData from '../../data/program-catalog.json';

interface GoalSelectionScreenProps {
  onBack: () => void;
  onNext: (selectedGoal: string) => void;
}

export const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({ onBack, onNext }) => {
  const categories = (programCatalogData.categories || []).map((c: any) => ({
    id: c.id,
    title: c.name,
    desc: c.description || 'Verified GRAVITY performance protocol',
  }));

  const [selectedGoal, setSelectedGoal] = useState<string>(categories[0]?.id || 'cat-fat-loss');

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
