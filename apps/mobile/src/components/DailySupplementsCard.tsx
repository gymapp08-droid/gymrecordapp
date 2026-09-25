import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../theme/tokens';
import { SupplementService, DailySupplementsState } from '../services/supplementService';

interface DailySupplementsCardProps {
  compact?: boolean;
}

export const DailySupplementsCard: React.FC<DailySupplementsCardProps> = ({ compact = false }) => {
  const [state, setState] = useState<DailySupplementsState>({
    multivitamin: false,
    calcium: false,
  });

  useEffect(() => {
    SupplementService.loadTodaySupplements().then(setState);
  }, []);

  const handleToggleMulti = async () => {
    const updated = await SupplementService.toggleMultivitamin();
    setState(updated);
  };

  const handleToggleCalcium = async () => {
    const updated = await SupplementService.toggleCalcium();
    setState(updated);
  };

  const completedCount = (state.multivitamin ? 1 : 0) + (state.calcium ? 1 : 0);
  const isAllCompleted = completedCount === 2;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.iconTag}>💊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>DAILY SUPPLEMENTS</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>Micronutrient & Skeletal Protocol</Text>
          </View>
        </View>
        <View
          style={[
            styles.badge,
            isAllCompleted ? styles.badgeComplete : styles.badgePending,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isAllCompleted ? styles.badgeTextComplete : styles.badgeTextPending,
            ]}
            numberOfLines={1}
          >
            {completedCount}/2 TAKEN
          </Text>
        </View>
      </View>

      {/* Supplement Items Grid */}
      <View style={styles.itemsGrid}>
        {/* Multivitamin */}
        <TouchableOpacity
          style={[styles.itemCard, state.multivitamin && styles.itemCardActive]}
          activeOpacity={0.8}
          onPress={handleToggleMulti}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemEmoji}>💊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>Multivitamin</Text>
                <Text style={styles.itemTiming} numberOfLines={1}>1 Tab · Morning</Text>
              </View>
            </View>
            <View style={[styles.checkCircle, state.multivitamin && styles.checkCircleActive]}>
              <Text style={[styles.checkCheckmark, state.multivitamin && styles.checkCheckmarkActive]}>
                {state.multivitamin ? '✓' : ''}
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.statusText, state.multivitamin ? styles.statusTextActive : styles.statusTextPending]}
          >
            {state.multivitamin ? `✓ Taken ${state.multivitaminTime || 'Today'}` : '○ Tap to log'}
          </Text>
        </TouchableOpacity>

        {/* Calcium */}
        <TouchableOpacity
          style={[styles.itemCard, state.calcium && styles.itemCardActive]}
          activeOpacity={0.8}
          onPress={handleToggleCalcium}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemEmoji}>🦴</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>Calcium + D3</Text>
                <Text style={styles.itemTiming} numberOfLines={1}>500mg · Evening</Text>
              </View>
            </View>
            <View style={[styles.checkCircle, state.calcium && styles.checkCircleActive]}>
              <Text style={[styles.checkCheckmark, state.calcium && styles.checkCheckmarkActive]}>
                {state.calcium ? '✓' : ''}
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.statusText, state.calcium ? styles.statusTextActive : styles.statusTextPending]}
          >
            {state.calcium ? `✓ Taken ${state.calciumTime || 'Today'}` : '○ Tap to log'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    marginVertical: 10,
    gap: 12,
  },
  cardCompact: {
    padding: 12,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconTag: {
    fontSize: 20,
  },
  cardTitle: {
    color: Theme.colors.cyanGlow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Theme.typography.fontMono,
  },
  cardSubtitle: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: Theme.typography.fontBody,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeComplete: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Theme.colors.emeraldSuccess,
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: Theme.typography.fontMono,
    letterSpacing: 0.8,
  },
  badgeTextComplete: {
    color: Theme.colors.emeraldSuccess,
  },
  badgeTextPending: {
    color: '#F59E0B',
  },
  itemsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  itemCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    gap: 8,
  },
  itemCardActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  itemEmoji: {
    fontSize: 16,
  },
  itemName: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  itemTiming: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontFamily: Theme.typography.fontBody,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkCircleActive: {
    backgroundColor: Theme.colors.emeraldSuccess,
    borderColor: Theme.colors.emeraldSuccess,
  },
  checkCheckmark: {
    color: '#05070B',
    fontSize: 12,
    fontWeight: '900',
  },
  checkCheckmarkActive: {
    color: '#05070B',
  },
  statusText: {
    fontSize: 9,
    fontFamily: Theme.typography.fontMono,
  },
  statusTextActive: {
    color: Theme.colors.emeraldSuccess,
    fontWeight: '700',
  },
  statusTextPending: {
    color: Theme.colors.textMuted,
  },
});
