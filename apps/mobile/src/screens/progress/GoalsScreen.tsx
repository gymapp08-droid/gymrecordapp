import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { usePerformance } from '../../context/PerformanceContext';
import programCatalogData from '../../data/program-catalog.json';

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
  onOpenProgramCatalog?: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ onBack, onOpenProgramCatalog }) => {
  const { activeProgramId, activeProgramTitle } = usePerformance();

  const activeProgram = useMemo(() => {
    const list = (programCatalogData.programs || []) as any[];
    return list.find((p) => p.id === activeProgramId || p.slug === activeProgramId) || list[0];
  }, [activeProgramId]);

  const categoryName = activeProgram?.categoryName || 'Fat Loss Protocol';
  const programGoal = activeProgram?.goal || 'Fat Loss & High Definition Conditioning';

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
        title="Goals & Protocols"
        subtitle="TRAINING FOCUS & TARGET BENCHMARKS"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Primary Target Goal & Program Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadgeRow}>
              <Text style={styles.heroSub}>ACTIVE TRAINING GOAL</Text>
              <StatusBadge label={categoryName.toUpperCase()} status="info" />
            </View>
            <StatusBadge label="IN PROGRESS" status="success" />
          </View>

          <Text style={styles.heroTitle}>{activeProgramTitle || activeProgram?.name || '6 Week Shredded'}</Text>
          <Text style={styles.heroGoalDesc}>{programGoal}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaCol}>
              <Text style={styles.metaSub}>DURATION</Text>
              <Text style={styles.metaVal}>{activeProgram?.duration || '12 Weeks'}</Text>
            </View>
            <View style={styles.heroMetaCol}>
              <Text style={styles.metaSub}>TRAINING DAYS</Text>
              <Text style={styles.metaVal}>{activeProgram?.workoutDaysPerWeek || 6} Days/Wk</Text>
            </View>
            <View style={styles.heroMetaCol}>
              <Text style={styles.metaSub}>TOTAL EXERCISES</Text>
              <Text style={styles.metaVal}>
                {(activeProgram?.days || []).reduce((acc: number, d: any) => acc + (d.exercises?.length || 0), 0) || 102}
              </Text>
            </View>
          </View>

          {onOpenProgramCatalog && (
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={onOpenProgramCatalog}
              activeOpacity={0.8}
            >
              <Text style={styles.switchBtnText}>⚡ SWITCH GOAL OR PROGRAM (52 PROTOCOLS) →</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionHeading}>BIOMETRIC & STRENGTH BENCHMARKS</Text>

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
  heroCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 16,
    gap: 12,
    shadowColor: Theme.colors.cyanGlow,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroSub: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  heroGoalDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
  },
  heroMetaCol: {
    gap: 2,
  },
  metaSub: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  metaVal: {
    fontSize: 14,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  switchBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  switchBtnText: {
    color: Theme.colors.cyanGlow,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.telemetry.fontFamily,
    letterSpacing: 0.8,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '800',
    marginTop: 8,
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
