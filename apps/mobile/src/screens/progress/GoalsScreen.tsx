import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

interface TargetGoal {
  id: string;
  category: 'STRENGTH' | 'COMPOSITION' | 'ENDURANCE';
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  targetDate: string;
}

interface GoalsScreenProps {
  onBack: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ onBack }) => {
  const [goals] = useState<TargetGoal[]>([
    {
      id: 'g-1',
      category: 'STRENGTH',
      title: 'Barbell Bench Press (1RM)',
      currentValue: 120,
      targetValue: 140,
      unit: 'kg',
      targetDate: 'Dec 31, 2026',
    },
    {
      id: 'g-2',
      category: 'STRENGTH',
      title: 'Conventional Deadlift (1RM)',
      currentValue: 190,
      targetValue: 220,
      unit: 'kg',
      targetDate: 'Dec 31, 2026',
    },
    {
      id: 'g-3',
      category: 'COMPOSITION',
      title: 'Target Body Fat Percentage',
      currentValue: 13.8,
      targetValue: 10.5,
      unit: '%',
      targetDate: 'Nov 15, 2026',
    },
    {
      id: 'g-4',
      category: 'ENDURANCE',
      title: '5,000m Time Trial',
      currentValue: 24.2,
      targetValue: 21.0,
      unit: 'min',
      targetDate: 'Oct 30, 2026',
    },
  ]);

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Protocol Targets"
        subtitle="MACRO GOALS & TIMELINES"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.leadText}>
          Target benchmarks driving training periodization and nutritional macro allocation.
        </Text>

        <View style={styles.goalList}>
          {goals.map((goal) => {
            const isReverse = goal.category === 'COMPOSITION' || goal.category === 'ENDURANCE';
            let pct = 0;
            if (isReverse) {
              pct = Math.min(Math.round((goal.targetValue / goal.currentValue) * 100), 100);
            } else {
              pct = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
            }

            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalCardTop}>
                  <View>
                    <Text style={styles.categoryTag}>{goal.category}</Text>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                  </View>
                  <StatusBadge label={goal.targetDate} status="neutral" />
                </View>

                <View style={styles.metricRow}>
                  <View>
                    <Text style={styles.metricSub}>CURRENT</Text>
                    <Text style={styles.metricVal}>
                      {goal.currentValue} {goal.unit}
                    </Text>
                  </View>
                  <Text style={styles.arrowGlyph}>→</Text>
                  <View>
                    <Text style={styles.metricSub}>TARGET</Text>
                    <Text style={[styles.metricVal, { color: Theme.colors.cyanGlow }]}>
                      {goal.targetValue} {goal.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.pctText}>{pct}% of objective achieved</Text>
                </View>
              </View>
            );
          })}
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
  leadText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  goalList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 10,
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryTag: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
  },
  metricSub: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  metricVal: {
    fontSize: 16,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  arrowGlyph: {
    color: Theme.colors.textMuted,
    fontSize: 16,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.cyanGlow,
    borderRadius: 3,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pctText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
});
