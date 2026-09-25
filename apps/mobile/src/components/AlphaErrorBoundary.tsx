import { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Theme } from '../theme/tokens';
import { SecureStorage } from '../services/secureStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AlphaErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AlphaErrorBoundary] Caught unhandled exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = async () => {
    try {
      // Clear corrupt active workout draft to prevent repeat exception loops
      await SecureStorage.removeItem('active_workout_draft');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#05070B" />
          <View style={styles.card}>
            <View style={styles.badge}>
              <View style={styles.amberDot} />
              <Text style={styles.badgeText}>CORE STABILITY SYSTEM · EXCEPTION ISOLATED</Text>
            </View>

            <Text style={styles.title}>Session Recovered</Text>
            <Text style={styles.subtitle}>
              An isolated interface variance occurred. The system protected your active session,
              telemetry, and account credentials.
            </Text>

            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryLabel}>DIAGNOSTIC TRACE</Text>
              <Text style={styles.telemetryText} numberOfLines={3}>
                {this.state.error?.message || 'Unexpected view render exception'}
              </Text>
            </View>

            <TouchableOpacity style={styles.resumeButton} activeOpacity={0.8} onPress={this.handleReset}>
              <Text style={styles.resumeButtonText}>Resume Dashboard</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 24,
    gap: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  amberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#F59E0B',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 19,
  },
  telemetryBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  telemetryLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  telemetryText: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
  },
  resumeButton: {
    backgroundColor: Theme.colors.primaryBlue,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: Theme.colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
