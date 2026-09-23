import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Theme } from '../theme/tokens';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  isPositive?: boolean;
  style?: StyleProp<ViewStyle>;
  highlightColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  delta,
  deltaType,
  isPositive,
  style,
  highlightColor,
}) => {
  const resolvedDeltaType = deltaType || (isPositive !== undefined ? (isPositive ? 'positive' : 'negative') : 'positive');

  const getDeltaColor = () => {
    switch (resolvedDeltaType) {
      case 'positive':
        return Theme.colors.emeraldSuccess;
      case 'negative':
        return Theme.colors.roseError;
      default:
        return Theme.colors.textMuted;
    }
  };

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, highlightColor ? { color: highlightColor } : null]}>
          {value}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {delta && (
        <Text style={[styles.delta, { color: getDeltaColor() }]}>
          {delta}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    gap: 4,
  },
  label: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unit: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  delta: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
});
