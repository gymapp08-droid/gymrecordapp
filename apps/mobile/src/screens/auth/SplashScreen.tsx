import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Theme } from '../../theme/tokens';

export const SplashScreen: React.FC<{ onFinish?: () => void; onComplete?: () => void }> = ({
  onFinish,
  onComplete,
}) => {
  const [telemetryStep, setTelemetryStep] = useState('INITIALIZING KERNEL...');
  const [pulseAnim] = useState(new Animated.Value(0.8));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const doneFn = onComplete || onFinish;
    const t1 = setTimeout(() => setTelemetryStep('VERIFYING CRYPTOGRAPHIC VAULT...'), 500);
    const t2 = setTimeout(() => setTelemetryStep('LOADING BIOMETRIC ENGINE // 100%'), 1000);
    const t3 = setTimeout(() => doneFn && doneFn(), 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish, onComplete, pulseAnim, fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }], opacity: fadeAnim }]}>
        <View style={styles.innerHex}>
          <Text style={styles.brandTitle}>A</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textGroup, { opacity: fadeAnim }]}>
        <Text style={styles.brandMainTitle}>ALPHA</Text>
        <Text style={styles.brandSubtitle}>YOUR HIGHER SELF</Text>
        <View style={styles.mottoContainer}>
          <Text style={styles.brandMotto}>DISCIPLINE BUILDS FREEDOM</Text>
        </View>
      </Animated.View>

      <View style={styles.footerTelemetry}>
        <View style={styles.loadingBarTrack}>
          <View style={styles.loadingBarFill} />
        </View>
        <Text style={styles.telemetryText}>{telemetryStep}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  glowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(56, 130, 246, 0.1)',
    borderWidth: 1.5,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.cyanGlow,
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 10,
    marginBottom: 28,
  },
  innerHex: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    fontFamily: Theme.typography.fontDisplay,
  },
  textGroup: {
    alignItems: 'center',
  },
  brandMainTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    fontFamily: Theme.typography.fontDisplay,
  },
  brandSubtitle: {
    color: Theme.colors.cyanGlow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 4,
    fontFamily: Theme.typography.fontMono,
  },
  mottoContainer: {
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  brandMotto: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  footerTelemetry: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '100%',
  },
  loadingBarTrack: {
    width: 140,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  loadingBarFill: {
    width: '70%',
    height: '100%',
    backgroundColor: Theme.colors.cyanGlow,
  },
  telemetryText: {
    color: Theme.colors.textMuted,
    fontSize: 9.5,
    fontFamily: Theme.typography.fontMono,
    letterSpacing: 1.2,
  },
});
