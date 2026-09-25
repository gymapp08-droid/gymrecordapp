import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Theme } from '../theme/tokens';

interface GlassInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  isPassword?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  isPassword,
  secureTextEntry,
  style,
  ...props
}) => {
  const isPasswordField = isPassword || secureTextEntry !== undefined;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={label}
      accessibilityHint={error ? `Validation error: ${error}` : props.placeholder}
      style={styles.container}
    >
      <Text
        allowFontScaling={true}
        maxFontSizeMultiplier={Theme.a11y.maxFontSizeMultiplier}
        style={styles.label}
      >
        {label}
      </Text>
      <View style={[styles.inputWrapper, !!error && styles.errorBorder]}>
        <TextInput
          placeholderTextColor={Theme.colors.textMuted}
          style={[styles.input, isPasswordField && { paddingRight: 40 }, style]}
          allowFontScaling={true}
          maxFontSizeMultiplier={Theme.a11y.maxFontSizeMultiplier}
          accessibilityLabel={label}
          secureTextEntry={isPasswordField ? !showPassword : secureTextEntry}
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity
            style={styles.eyeBtn}
            activeOpacity={0.7}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Text style={[styles.eyeIcon, showPassword && styles.eyeIconActive]}>
              {showPassword ? '👁' : '👁‍🗨'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && (
        <Text
          allowFontScaling={true}
          maxFontSizeMultiplier={Theme.a11y.maxFontSizeMultiplier}
          accessibilityRole="alert"
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: 'rgba(18, 24, 38, 0.75)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    height: 50,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  errorBorder: {
    borderColor: Theme.colors.roseError,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: Theme.colors.roseError,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  eyeIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  eyeIconActive: {
    opacity: 1,
  },
});
