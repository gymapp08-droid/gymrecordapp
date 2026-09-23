import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/tokens';
import { SecondaryButton } from './SecondaryButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Unable to load performance telemetry. Check connection.',
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.alertIcon}>
        <Text style={styles.iconText}>⚠</Text>
      </View>
      <Text style={styles.title}>System Telemetry Interrupted</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <SecondaryButton
          title="Retry Telemetry Sync"
          onPress={onRetry}
          style={styles.retryBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconText: {
    color: Theme.colors.roseError,
    fontSize: 22,
    fontWeight: '900',
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  message: {
    color: Theme.colors.textMuted,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 18,
    maxWidth: 280,
  },
  retryBtn: {
    paddingHorizontal: 20,
    height: 42,
  },
});
