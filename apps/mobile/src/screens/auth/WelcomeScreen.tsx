import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlphaScreen, PrimaryButton, SecondaryButton, AlphaLogo } from '../../components';
import { Theme } from '../../theme/tokens';

interface WelcomeScreenProps {
  onContinue: () => void;
  onLogin: () => void;
  onRegister?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onContinue,
  onLogin,
  onRegister,
}) => {
  return (
    <AlphaScreen noPadding>
      <View style={styles.container}>
        {/* Top Visual Brand */}
        <View style={styles.visualContainer}>
          <View style={styles.glowBackdrop} />
          <View style={styles.logoWrapper}>
            <AlphaLogo size={84} glow />
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
              Unified workout periodization, precision macro adherence, and biometric progression.
            </Text>
          </View>

          {/* Indicators */}
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* Only 2 Clear Options on Front Screen */}
          <View style={styles.actions}>
            {/* 1. Get Started / Create Account */}
            <PrimaryButton
              title="Get Started"
              onPress={onRegister || onContinue}
              style={styles.ctaButton}
            />

            {/* 2. Already have an account? Sign In */}
            <SecondaryButton
              title="Already have an account? Sign In"
              onPress={onLogin}
              style={styles.loginButton}
            />
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
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    paddingTop: 28,
    paddingBottom: 36,
    gap: 16,
  },
  heroTextGroup: {
    gap: 8,
  },
  heroHeadline: {
    color: Theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    fontFamily: Theme.typography.fontDisplay,
  },
  heroHighlight: {
    color: Theme.colors.cyanGlow,
  },
  heroDescription: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Theme.typography.fontBody,
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
    width: 22,
    backgroundColor: Theme.colors.cyanGlow,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
  ctaButton: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
  },
});
