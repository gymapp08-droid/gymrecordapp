import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme/tokens';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.glowRing}>
        <Text style={styles.brandTitle}>ALPHA</Text>
      </View>
      <Text style={styles.brandSubtitle}>YOUR HIGHER SELF</Text>
      <Text style={styles.telemetryText}>SYSTEM INITIALIZATION // 100%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: Theme.colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primaryBlue,
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 12,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandSubtitle: {
    color: Theme.colors.cyanGlow,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 24,
  },
  telemetryText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 40,
  },
});
