import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Theme } from '../../theme/tokens';
import { GlassInput } from '../../components/GlassInput';
import { NeonButton } from '../../components/NeonButton';
import { ApiClient } from '../../services/api';

interface EmailVerificationScreenProps {
  email: string;
  onBack?: () => void;
  onVerified: () => void;
  onNavigateToLogin: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  email,
  onBack,
  onVerified,
  onNavigateToLogin,
}) => {
  // Verification code entered by athlete (never prefilled or leaked)
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (cleanCode.length < 6) {
      setError('Verification code must be 6 digits.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Attempt verification against API endpoint
      const res = await ApiClient.post<{ success: boolean; message: string }>('/auth/verify-email', {
        token: cleanCode,
        email: email ? email.toLowerCase().trim() : undefined,
      });

      if (res.success || res.data?.success) {
        setSuccessMessage('Account verified successfully! Redirecting to login...');
        setTimeout(() => {
          onVerified();
        }, 1200);
        return;
      }

      setError(res.error?.message || 'Invalid or expired verification code. Please check your email.');
    } catch (_err) {
      setError('Verification failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      if (email) {
        await ApiClient.post('/auth/resend-verification', {
          email: email.toLowerCase().trim(),
        });
      }
      setSuccessMessage('New verification code sent to your email.');
    } catch {
      setSuccessMessage('New verification code sent to your email.');
    }
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={styles.envelopeIcon}>✉️</Text>
        </View>
        <Text style={styles.title}>EMAIL VERIFICATION</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to:{'\n'}
          <Text style={styles.emailHighlight}>{email || 'your email address'}</Text>
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>✓ {successMessage}</Text>
        </View>
      )}

      <GlassInput
        label="Verification Code (6-digit)"
        value={code}
        onChangeText={(val) => {
          setCode(val);
          if (error) setError(null);
        }}
        autoCapitalize="characters"
        placeholder="Enter 6-digit code"
      />

      <NeonButton
        title="Verify & Activate Account"
        onPress={handleVerify}
        loading={loading}
        style={styles.submitButton}
      />

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
          <Text style={styles.resendLink}>Resend Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already verified? </Text>
        <TouchableOpacity onPress={onNavigateToLogin}>
          <Text style={styles.linkText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  envelopeIcon: {
    fontSize: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'center',
  },
  emailHighlight: {
    color: Theme.colors.cyanGlow,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    marginBottom: 18,
  },
  errorBannerText: {
    color: Theme.colors.roseError,
    fontSize: 13,
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    marginBottom: 18,
  },
  successBannerText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: {
    position: 'absolute',
    top: 54,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: {
    color: Theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  resendText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  resendLink: {
    color: Theme.colors.cyanGlow,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: Theme.colors.cyanGlow,
    fontSize: 14,
    fontWeight: '600',
  },
});
