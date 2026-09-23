import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlphaScreen, PrimaryButton, SecondaryButton } from '../../components';
import { Theme } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';

interface WelcomeScreenProps {
  onContinue: () => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue, onLogin }) => {
  const { login } = useAuth();
  return (
    <AlphaScreen noPadding>
      <View style={styles.container}>
        {/* Top Visual Brand */}
        <View style={styles.visualContainer}>
          <View style={styles.glowBackdrop} />
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.brandTitle}>ALPHA</Text>
          <Text style={styles.brandSubtitle}>PERSONAL PERFORMANCE OS</Text>
        </View>

        {/* Content Card with Glass Overlay */}
        <View style={styles.bottomSheet}>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroHeadline}>
              A Healthier{'\n'}
              <Text style={styles.heroHighlight}>Stronger You</Text>
            </Text>
            <Text style={styles.heroDescription}>
              Track · Improve · Evolve.{'\n'}
              Unified workout periodization, macro adherence, and biometric AI coaching.
            </Text>
          </View>

          {/* Indicators */}
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <PrimaryButton
              title="Continue"
              onPress={onContinue}
              style={styles.ctaButton}
            />
            <SecondaryButton
              title="I already have an account"
              onPress={onLogin}
              style={styles.loginButton}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.demoButton}
              onPress={() => login('demo@alpha.os', 'alpha123')}
            >
              <Text style={styles.demoButtonText}>⚡ Instant Demo Protocol Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'space-between',
  },
  visualContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowBackdrop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 130, 246, 0.12)',
    shadowColor: Theme.colors.cyanGlow,
    shadowOpacity: 0.4,
    shadowRadius: 50,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Theme.typography.fontDisplay,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    fontFamily: Theme.typography.fontDisplay,
  },
  brandSubtitle: {
    color: Theme.colors.cyanGlow,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Theme.typography.fontMono,
    marginTop: 4,
  },
  bottomSheet: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderTopWidth: 1,
    borderColor: Theme.colors.border,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 20,
  },
  heroTextGroup: {
    gap: 10,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    fontFamily: Theme.typography.fontDisplay,
    letterSpacing: -0.5,
  },
  heroHighlight: {
    color: Theme.colors.cyanGlow,
  },
  heroDescription: {
    color: Theme.colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    width: 20,
    backgroundColor: Theme.colors.cyanGlow,
  },
  actions: {
    gap: 12,
  },
  ctaButton: {
    height: 52,
  },
  loginButton: {
    height: 48,
  },
  demoButton: {
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  demoButtonText: {
    fontSize: 12,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
