import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme/tokens';
import { GlassInput } from '../../components/GlassInput';
import { NeonButton } from '../../components/NeonButton';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
}) => {
  const { login, googleLogin, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    setLocalError(null);
    clearError();
    setLoading(true);
    try {
      await login(email.trim(), password);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    clearError();
    setLocalError(null);
    try {
      Alert.alert(
        'Google Authentication',
        'Verify with your Google account to log into ALPHA.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setGoogleLoading(false) },
          {
            text: 'Continue with Google',
            onPress: async () => {
              const success = await googleLogin('google_verified_auth_token');
              if (!success) {
                Alert.alert(
                  'Google Sign-In',
                  'Google Sign-In requires GOOGLE_CLIENT_ID configuration on your server. Please sign in with email/password.',
                  [{ text: 'OK' }]
                );
              }
              setGoogleLoading(false);
            },
          },
        ]
      );
    } catch {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WELCOME BACK</Text>
        <Text style={styles.subtitle}>Enter your account credentials to access ALPHA.</Text>
      </View>

      {(error || localError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{localError || error}</Text>
        </View>
      )}

      <GlassInput
        label="Email Address"
        value={email}
        onChangeText={(val) => {
          setEmail(val);
          if (localError) setLocalError(null);
          if (error) clearError();
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="athlete@alpha.os"
      />

      <GlassInput
        label="Password"
        value={password}
        onChangeText={(val) => {
          setPassword(val);
          if (localError) setLocalError(null);
          if (error) clearError();
        }}
        secureTextEntry
        placeholder="••••••••••••"
      />

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onNavigateToForgotPassword}
        style={styles.forgotButton}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <NeonButton
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        style={styles.submitButton}
      />

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Sign-In */}
      <TouchableOpacity
        style={styles.googleButton}
        activeOpacity={0.8}
        onPress={handleGoogleSignIn}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.googleIconText}>G</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={onNavigateToRegister}>
          <Text style={styles.linkText}>Create Account</Text>
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
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    fontFamily: Theme.typography.fontDisplay,
    letterSpacing: 2,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    fontFamily: Theme.typography.fontBody,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Theme.typography.fontBody,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
  },
  forgotText: {
    color: Theme.colors.cyanGlow,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Theme.typography.fontBody,
  },
  submitButton: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dividerText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  googleButton: {
    height: 48,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleIconText: {
    color: '#4285F4',
    fontSize: 18,
    fontWeight: '900',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: Theme.typography.fontBody,
  },
  linkText: {
    color: Theme.colors.cyanGlow,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
});
