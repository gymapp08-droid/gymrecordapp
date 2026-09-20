import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../../theme/tokens';
import { GlassInput } from '../../components/GlassInput';
import { NeonButton } from '../../components/NeonButton';
import { useAuth } from '../../context/AuthContext';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onSuccess,
}) => {
  const { register, error } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setLocalError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long');
      return;
    }
    setLocalError(null);
    setLoading(true);
    try {
      const ok = await register(email, password, fullName);
      if (ok) {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
        onChangeText={setFullName}
        placeholder="Alex Stone"
      />

      <GlassInput
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="alex@alpha.os"
      />

      <GlassInput
        label="Password (min 8 chars, mixed case + number)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••••••"
      />

      <NeonButton
        title="Activate Protocol"
        onPress={handleRegister}
        loading={loading}
        style={styles.submitButton}
      />

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
    marginBottom: 24,
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
