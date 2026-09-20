import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Theme } from '../../theme/tokens';
import { ApiClient } from '../../services/api';
import { INotificationPreference } from '@alpha/types';

interface NotificationPreferencesScreenProps {
  onNavigateBack?: () => void;
}

export const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({
  onNavigateBack,
}) => {
  const [preferences, setPreferences] = useState<INotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get<INotificationPreference>('/notifications/preferences');
      if (res.success && res.data) {
        setPreferences(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferenceField = async (fields: Partial<INotificationPreference>) => {
    if (!preferences) return;

    // Optimistic update
    const updated = { ...preferences, ...fields };
    setPreferences(updated);

    try {
      setIsSaving(true);
      await ApiClient.patch<INotificationPreference>('/notifications/preferences', fields);
    } catch (e) {
      Alert.alert('Error', 'Unable to save preference changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !preferences) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={Theme.colors.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onNavigateBack && (
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Notification Settings</Text>
        {isSaving && <ActivityIndicator size="small" color={Theme.colors.cyanGlow} />}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* QUIET HOURS SECTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>🌙 Quiet Hours</Text>
              <Text style={styles.sectionSubtitle}>
                Silently queue lock-screen notifications during sleep
              </Text>
            </View>
            <Switch
              value={preferences.quietHoursEnabled}
              onValueChange={(val) => updatePreferenceField({ quietHoursEnabled: val })}
              trackColor={{ false: '#1E293B', true: Theme.colors.primaryBlue }}
              thumbColor={preferences.quietHoursEnabled ? Theme.colors.cyanGlow : '#64748B'}
            />
          </View>

          {preferences.quietHoursEnabled && (
            <View style={styles.quietHoursInputs}>
              <View style={styles.timeInputCol}>
                <Text style={styles.inputLabel}>Starts At</Text>
                <TextInput
                  style={styles.timeInput}
                  value={preferences.quietHoursStart}
                  placeholder="22:00"
                  placeholderTextColor={Theme.colors.textMuted}
                  maxLength={5}
                  onEndEditing={(e) => updatePreferenceField({ quietHoursStart: e.nativeEvent.text })}
                />
              </View>

              <Text style={styles.timeDivider}>→</Text>

              <View style={styles.timeInputCol}>
                <Text style={styles.inputLabel}>Ends At</Text>
                <TextInput
                  style={styles.timeInput}
                  value={preferences.quietHoursEnd}
                  placeholder="07:00"
                  placeholderTextColor={Theme.colors.textMuted}
                  maxLength={5}
                  onEndEditing={(e) => updatePreferenceField({ quietHoursEnd: e.nativeEvent.text })}
                />
              </View>
            </View>
          )}

          <View style={styles.timezoneRow}>
            <Text style={styles.timezoneLabel}>Timezone:</Text>
            <Text style={styles.timezoneValue}>{preferences.timezone || 'UTC'}</Text>
          </View>
        </View>

        {/* PUSH CATEGORIES */}
        <Text style={styles.groupHeader}>PUSH NOTIFICATION CHANNELS</Text>
        <View style={styles.sectionCard}>
          <PreferenceRow
            title="Workout & Training"
            subtitle="Session reminders, coach workout assignments"
            value={preferences.workoutPush}
            onToggle={(val) => updatePreferenceField({ workoutPush: val })}
          />
          <PreferenceRow
            title="Nutrition & Macros"
            subtitle="Meal logging reminders, protein adherence"
            value={preferences.nutritionPush}
            onToggle={(val) => updatePreferenceField({ nutritionPush: val })}
          />
          <PreferenceRow
            title="Hydration Alerts"
            subtitle="Daily water target check-ins"
            value={preferences.hydrationPush}
            onToggle={(val) => updatePreferenceField({ hydrationPush: val })}
          />
          <PreferenceRow
            title="Activity & Streaks"
            subtitle="Daily step milestones and streak preservation"
            value={preferences.activityPush}
            onToggle={(val) => updatePreferenceField({ activityPush: val })}
          />
          <PreferenceRow
            title="Progress & PRs"
            subtitle="Body measurement updates and personal records"
            value={preferences.progressPush}
            onToggle={(val) => updatePreferenceField({ progressPush: val })}
          />
          <PreferenceRow
            title="Goal Milestones"
            subtitle="Target weight and body composition goals"
            value={preferences.goalsPush}
            onToggle={(val) => updatePreferenceField({ goalsPush: val })}
          />
          <PreferenceRow
            title="Direct Messages"
            subtitle="Coach and athlete chat notifications"
            value={preferences.messagesPush}
            onToggle={(val) => updatePreferenceField({ messagesPush: val })}
          />
          <PreferenceRow
            title="System & Security"
            subtitle="Account, password, and security alerts"
            value={preferences.systemPush}
            onToggle={(val) => updatePreferenceField({ systemPush: val })}
            isLast
          />
        </View>

        {/* EMAIL CATEGORIES */}
        <Text style={styles.groupHeader}>EMAIL DIGESTS</Text>
        <View style={styles.sectionCard}>
          <PreferenceRow
            title="Weekly Performance Digest"
            subtitle="Comprehensive breakdown of workouts and progress"
            value={preferences.weeklyDigestEmail}
            onToggle={(val) => updatePreferenceField({ weeklyDigestEmail: val })}
          />
          <PreferenceRow
            title="Coach Messages by Email"
            subtitle="Receive email notifications for unread messages"
            value={preferences.messagesEmail}
            onToggle={(val) => updatePreferenceField({ messagesEmail: val })}
            isLast
          />
        </View>
      </ScrollView>
    </View>
  );
};

interface PreferenceRowProps {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  isLast?: boolean;
}

const PreferenceRow: React.FC<PreferenceRowProps> = ({
  title,
  subtitle,
  value,
  onToggle,
  isLast = false,
}) => (
  <View style={[styles.prefRow, !isLast && styles.prefRowBorder]}>
    <View style={styles.prefTextCol}>
      <Text style={styles.prefTitle}>{title}</Text>
      <Text style={styles.prefSubtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#1E293B', true: Theme.colors.primaryBlue }}
      thumbColor={value ? Theme.colors.cyanGlow : '#64748B'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: Theme.colors.textPrimary,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontDisplay,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    maxWidth: 240,
  },
  quietHoursInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeInputCol: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 6,
  },
  timeInput: {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    color: Theme.colors.cyanGlow,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 8,
  },
  timeDivider: {
    color: Theme.colors.textMuted,
    fontSize: 18,
    paddingHorizontal: 8,
  },
  timezoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 6,
  },
  timezoneLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  timezoneValue: {
    fontSize: 12,
    color: Theme.colors.primaryBlue,
    fontWeight: '600',
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  prefRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  prefTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  prefSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    lineHeight: 16,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
