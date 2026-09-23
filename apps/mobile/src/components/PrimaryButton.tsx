import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../theme/tokens';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const isActionDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isActionDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isActionDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isActionDisabled }}
    >
      {loading ? (
        <ActivityIndicator color="#05070B" size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    backgroundColor: Theme.colors.cyanGlow,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: Theme.colors.cyanGlow,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Theme.colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: '#05070B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
