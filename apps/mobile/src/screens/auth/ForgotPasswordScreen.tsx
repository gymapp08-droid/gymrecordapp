import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton } from '../../components';
import { GlassInput } from '../../components/GlassInput';
import { Theme } from '../../theme/tokens';
import { ApiClient } from '../../services/api';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await ApiClient.post('/auth/forgot-password', { email: email.trim() });
      if (res.success) {
        setSent(true);
      } else {
        setError(res.error?.message || 'Unable to process reset request. Please check the email entered.');
      }
    } catch {
      setError('Network error. Unable to reach ALPHA services.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Account Recovery"
        subtitle="Password Reset"
        onBack={onBackToLogin}
      />

      <View style={styles.content}>
        {sent ? (
          <View style={styles.sentContainer}>
            <View style={styles.sentRing}>
              <Text style={styles.sentIcon}>✉️</Text>
            </View>
            <Text style={styles.sentTitle}>PASSWORD RESET SENT</Text>
            <Text style={styles.sentDesc}>
              A secure password reset link has been sent to{' '}
              <Text style={styles.emailHighlight}>{email}</Text>. Please check your inbox or spam folder to complete your password update.
            </Text>
            <PrimaryButton
              title="Return to Sign In"
              onPress={onBackToLogin}
              style={{ marginTop: 24, width: '100%' }}
            />
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.leadText}>
              Enter your registered email address. We will send you a secure verification link to reset your password.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <GlassInput
              label="Email Address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="athlete@alpha.os"
            />

            <View style={styles.actions}>
              <PrimaryButton
                title={loading ? 'Sending Link...' : 'Send Reset Link'}
                onPress={handleSendReset}
                loading={loading}
              />

              <TouchableOpacity style={styles.backBtn} onPress={onBackToLogin}>
                <Text style={styles.backBtnText}>Cancel and return to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: 'center',
  },
  formContainer: {
    gap: 16,
  },
  leadText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Theme.typography.fontBody,
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Theme.typography.fontBody,
  },
  actions: {
    marginTop: 12,
    gap: 14,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtnText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Theme.typography.fontBody,
  },
  sentContainer: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
  },
  sentRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sentIcon: {
    fontSize: 28,
  },
  sentTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Theme.typography.fontDisplay,
    textAlign: 'center',
  },
  sentDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: Theme.typography.fontBody,
  },
  emailHighlight: {
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
});
