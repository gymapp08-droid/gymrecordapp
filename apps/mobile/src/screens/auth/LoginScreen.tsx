import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError('Please fill in both email and password');
      return;
    }
    setLocalError(null);
    setLoading(true);
    try {
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WELCOME BACK</Text>
        <Text style={styles.subtitle}>Enter your credentials to access your protocol.</Text>
      </View>

      {(error || localError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{localError || error}</Text>
        </View>
      )}

      <GlassInput
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="athlete@alpha.os"
      />

      <GlassInput
        label="Password"
        value={password}
        onChangeText={setPassword}
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

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.demoButton}
        onPress={async () => {
          setEmail('demo@alpha.os');
          setPassword('alpha123');
          setLoading(true);
          try {
            await login('demo@alpha.os', 'alpha123');
          } finally {
            setLoading(false);
          }
        }}
      >
        <Text style={styles.demoButtonText}>⚡ Instant Demo Protocol Login</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={onNavigateToRegister}>
          <Text style={styles.linkText}>Create Protocol</Text>
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: Theme.colors.primaryBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    width: '100%',
    marginBottom: 12,
  },
  demoButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    marginBottom: 24,
  },
  demoButtonText: {
    color: Theme.colors.cyanGlow,
    fontSize: 13,
    fontWeight: '800',
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
