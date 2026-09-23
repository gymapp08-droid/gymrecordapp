import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, StyleProp, ViewStyle } from 'react-native';
import { Theme } from '../theme/tokens';

interface AlphaScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export const AlphaScreen: React.FC<AlphaScreenProps> = ({ children, style, noPadding = false }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />
      <View style={[styles.container, !noPadding && styles.padding, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  padding: {
    paddingHorizontal: Theme.spacing.md,
  },
});
