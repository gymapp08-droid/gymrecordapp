import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

interface MoreMenuScreenProps {
  onNavigate: (route: string) => void;
  onBack?: () => void;
}

export const MoreMenuScreen: React.FC<MoreMenuScreenProps> = ({ onNavigate, onBack }) => {
  const sections = [
    {
      title: 'BIOMETRICS & TELEMETRY',
      items: [
        { id: 'PROFILE', label: 'Athlete Identity & Tier', icon: '👤', badge: 'PRO' },
        { id: 'BODY_METRICS', label: 'Body Mass & Circumferences', icon: '⚖️' },
        { id: 'GOALS', label: 'Protocol Objectives & Deadlines', icon: '🎯' },
        { id: 'MILESTONES', label: 'Achievements & Protocol Medals', icon: '🏆', badge: '3 UNLOCKED' },
      ],
    },
    {
      title: 'KNOWLEDGE & LIBRARIES',
      items: [
        { id: 'EXERCISE_LIBRARY', label: 'Exercise Biomechanics & Cues', icon: '📖' },
        { id: 'FOOD_LIBRARY', label: 'Nutritional Food Database', icon: '🥗' },
        { id: 'CALENDAR', label: 'Training History & Consistency', icon: '📅' },
      ],
    },
    {
      title: 'HARDWARE & SYSTEM',
      items: [
        { id: 'INTEGRATIONS', label: 'Wearables & Health Connections', icon: '⌚', badge: 'ACTIVE' },
        { id: 'REMINDERS', label: 'Hydration & Workout Schedules', icon: '⏰' },
        { id: 'NOTIFICATIONS', label: 'Protocol Alerts & Signals', icon: '🔔' },
        { id: 'SETTINGS', label: 'App Settings & Display Theme', icon: '⚙️' },
      ],
    },
  ];

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Command Hub"
        subtitle="ALPHA PERFORMANCE PLATFORM"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((sec, sIdx) => (
          <View key={sIdx} style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>{sec.title}</Text>
            <View style={styles.menuGroup}>
              {sec.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuRow}
                  onPress={() => onNavigate(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRight}>
                    {item.badge && <StatusBadge label={item.badge} status="neutral" />}
                    <Text style={styles.menuChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 10,
    paddingBottom: 32,
    gap: 18,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.2,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  menuGroup: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuChevron: {
    fontSize: 18,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
});
