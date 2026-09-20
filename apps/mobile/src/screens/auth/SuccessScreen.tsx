import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme/tokens';
import { NeonButton } from '../../components/NeonButton';

export const SuccessScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.checkRing}>
        <Text style={styles.checkGlyph}>✓</Text>
      </View>
      <Text style={styles.title}>PROTOCOL ACTIVATED</Text>
      <Text style={styles.subtitle}>Your account and biological telemetry baseline are verified.</Text>
      <NeonButton
        title="Launch Protocol"
        onPress={onContinue}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: Theme.colors.emeraldSuccess,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Theme.colors.emeraldSuccess,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  checkGlyph: {
    color: Theme.colors.emeraldSuccess,
    fontSize: 44,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    width: '100%',
  },
});
