import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Theme } from '../../theme/tokens';
import { GlassInput } from '../../components/GlassInput';
import { NeonButton } from '../../components/NeonButton';
import { useAuth } from '../../context/AuthContext';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
  onRegistrationSuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onBack,
  onSuccess,
  onRegistrationSuccess,
}) => {
  const { register, error, clearError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setLocalError('Please fill in your name, email, and password.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    // Validate Gmail requirement
    if (!normalizedEmail.endsWith('@gmail.com') && !normalizedEmail.endsWith('@googlemail.com')) {
      setLocalError('Please enter a valid Gmail address ending with @gmail.com.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    setLocalError(null);
    clearError();
    setLoading(true);
    try {
      const ok = await register(normalizedEmail, password, fullName.trim());
      if (ok) {
        if (onRegistrationSuccess) onRegistrationSuccess();
        if (onSuccess) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    clearError();
    setLocalError(null);
    try {
      const googleOAuthUrl = 'https://gymrecordapp.onrender.com/api/v1/auth/google';
      await Linking.openURL(googleOAuthUrl);
    } catch (err: any) {
      Alert.alert(
        'Google Sign-In Error',
        err?.message || 'Unable to open Google Sign-In. Please check your network connection.',
        [{ text: 'OK' }]
      );
    } finally {
      setGoogleLoading(false);
    }
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
        <Text style={styles.title}>INITIALIZE ACCOUNT</Text>
        <Text style={styles.subtitle}>Begin your high-performance transformation protocol.</Text>
      </View>

      {(error || localError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{localError || error}</Text>
        </View>
      )}

      <GlassInput
        label="Full Name"
        value={fullName}
        onChangeText={(val) => {
          setFullName(val);
          if (localError) setLocalError(null);
          if (error) clearError();
        }}
        placeholder="Alex Stone"
      />

      <GlassInput
        label="Gmail Address"
        value={email}
        onChangeText={(val) => {
          setEmail(val);
          if (localError) setLocalError(null);
          if (error) clearError();
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="athlete@gmail.com"
      />

      <GlassInput
        label="Password (min 8 chars, mixed case + number)"
        value={password}
        onChangeText={(val) => {
          setPassword(val);
          if (localError) setLocalError(null);
          if (error) clearError();
        }}
        secureTextEntry
        placeholder="••••••••••••"
      />

      <NeonButton
        title="Activate Protocol"
        onPress={handleRegister}
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
        <Text style={styles.footerText}>Already registered? </Text>
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
    marginBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
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
  submitButton: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backIcon: {
    color: Theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dividerText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    letterSpacing: 1.5,
  },
  googleButton: {
    height: 52,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  googleIconText: {
    color: '#00F0FF',
    fontSize: 18,
    fontWeight: '900',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  linkText: {
    color: Theme.colors.primaryBlue,
    fontSize: 13,
    fontWeight: '700',
  },
});
