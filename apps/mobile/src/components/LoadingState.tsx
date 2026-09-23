import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Theme } from '../theme/tokens';

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Syncing ALPHA telemetry...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Theme.colors.cyanGlow} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontFamily: Theme.typography.fontMono,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
