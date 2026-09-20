import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Theme } from '../theme/tokens';

interface GlassInputProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  ...props
}) => {
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
          style={styles.input}
          allowFontScaling={true}
          maxFontSizeMultiplier={Theme.a11y.maxFontSizeMultiplier}
          accessibilityLabel={label}
          {...props}
        />
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
});
