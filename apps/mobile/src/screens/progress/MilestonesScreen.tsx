import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

interface MilestoneBadge {
  id: string;
  icon: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  progressText?: string;
}

interface MilestonesScreenProps {
  onBack: () => void;
}

const MILESTONES: MilestoneBadge[] = [
  {
    id: 'm-1',
    icon: '⚡',
    title: 'Protocol Genesis',
    description: 'First workout logged with 100% biometric baseline verification.',
    isUnlocked: true,
    unlockedDate: 'Unlocked Sep 01, 2026',
  },
  {
    id: 'm-2',
    icon: '🏋️‍♂️',
    title: '500,000 KG Volume',
    description: 'Accumulate over half a million kilograms of progressive mechanical tension.',
    isUnlocked: true,
    unlockedDate: 'Unlocked Sep 18, 2026',
  },
  {
    id: 'm-3',
    icon: '🔥',
    title: '30-Day Protocol Streak',
    description: 'Maintain strict nutritional logging and training adherence for 30 consecutive days.',
    isUnlocked: false,
    progressText: '24 / 30 days active',
  },
  {
    id: 'm-4',
    icon: '👑',
    title: 'Triple Century Deadlift',
    description: 'Pull 200kg for a verified 1RM in powerlifting discipline.',
    isUnlocked: false,
    progressText: 'Current PR: 190kg',
  },
  {
    id: 'm-5',
    icon: '💧',
    title: 'Hydro-Optima 100',
    description: 'Achieve daily 3.5L hydration target for 14 continuous days.',
    isUnlocked: true,
    unlockedDate: 'Unlocked Sep 12, 2026',
  },
];

export const MilestonesScreen: React.FC<MilestonesScreenProps> = ({ onBack }) => {
  const unlockedCount = MILESTONES.filter((m) => m.isUnlocked).length;

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Milestones & Medals"
        subtitle={`${unlockedCount} OF ${MILESTONES.length} UNLOCKED`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeGrid}>
          {MILESTONES.map((badge) => (
            <View
              key={badge.id}
              style={[styles.badgeCard, !badge.isUnlocked && styles.badgeCardLocked]}
            >
              <View style={[styles.iconCircle, !badge.isUnlocked && styles.iconCircleLocked]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
              </View>

              <View style={styles.badgeInfo}>
                <View style={styles.badgeHeader}>
                  <Text style={[styles.badgeTitle, !badge.isUnlocked && styles.badgeTitleLocked]}>
                    {badge.title}
                  </Text>
                  {badge.isUnlocked ? (
                    <StatusBadge label="EARNED" status="success" />
                  ) : (
                    <StatusBadge label="LOCKED" status="neutral" />
                  )}
                </View>

                <Text style={styles.badgeDesc}>{badge.description}</Text>

                <Text style={[styles.badgeMeta, badge.isUnlocked && styles.badgeMetaEarned]}>
                  {badge.isUnlocked ? badge.unlockedDate : badge.progressText}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 28,
  },
  badgeGrid: {
    gap: 12,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 14,
    gap: 14,
  },
  badgeCardLocked: {
    borderColor: Theme.colors.border,
    opacity: 0.65,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Theme.colors.border,
  },
  badgeIcon: {
    fontSize: 22,
  },
  badgeInfo: {
    flex: 1,
    gap: 4,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  badgeTitleLocked: {
    color: Theme.colors.textSecondary,
  },
  badgeDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 15,
  },
  badgeMeta: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  badgeMetaEarned: {
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
});
