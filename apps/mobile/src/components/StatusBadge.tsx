import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/tokens';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  status?: StatusVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant, status }) => {
  const activeVariant = variant || status || 'info';

  const getBadgeColors = () => {
    switch (activeVariant) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: Theme.colors.emeraldSuccess,
          dot: Theme.colors.emeraldSuccess,
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          text: Theme.colors.amberWarning,
          dot: Theme.colors.amberWarning,
        };
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: Theme.colors.roseError,
          dot: Theme.colors.roseError,
        };
      case 'neutral':
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: Theme.colors.border,
          text: Theme.colors.textSecondary,
          dot: Theme.colors.textMuted,
        };
      default:
        return {
          bg: 'rgba(0, 240, 255, 0.1)',
          border: 'rgba(0, 240, 255, 0.25)',
          text: Theme.colors.cyanGlow,
          dot: Theme.colors.cyanGlow,
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.pill,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
