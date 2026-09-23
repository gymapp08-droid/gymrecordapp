import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/tokens';

export const OfflineBanner: React.FC<{ isOffline?: boolean }> = ({ isOffline = false }) => {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.dot}>●</Text>
      <Text style={styles.text}>OFFLINE MODE — Telemetry cached locally. Will sync upon reconnection.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    color: Theme.colors.amberWarning,
    fontSize: 8,
  },
  text: {
    color: Theme.colors.amberWarning,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
    textAlign: 'center',
  },
});
