import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { AlphaScreen, PrimaryButton } from '../../components';
import { Theme } from '../../theme/tokens';
import { NotificationService, IReminderConfig, DEFAULT_REMINDER_CONFIG } from '../../services/notificationService';

interface ReminderSettingsScreenProps {
  onBack: () => void;
}

export const ReminderSettingsScreen: React.FC<ReminderSettingsScreenProps> = ({ onBack }) => {
  const [config, setConfig] = useState<IReminderConfig>(DEFAULT_REMINDER_CONFIG);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await NotificationService.loadConfig();
    setConfig(loaded);
    setIsPermissionGranted(NotificationService.isPermissionGranted());
  };

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestNotificationPermissions();
    setIsPermissionGranted(granted);
    if (granted) {
      Alert.alert('Permissions Activated', 'Smart reminders and alarms are now enabled.');
    }
  };

  const handleSave = async () => {
    await NotificationService.saveConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <AlphaScreen>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>SMART REMINDERS</Text>
          <Text style={styles.headerSubtitle}>Alarm Engine & Notification Rules</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Permission Banner */}
        <View style={[styles.card, !isPermissionGranted && styles.cardWarning]}>
          <View style={styles.bannerRow}>
            <Text style={styles.bannerIcon}>{isPermissionGranted ? '🔔' : '⚠️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>
                {isPermissionGranted ? 'ALARM ENGINE ACTIVE' : 'PERMISSIONS REQUIRED'}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {isPermissionGranted
                  ? 'Notifications & alarms configured for Asia/Kolkata (IST).'
                  : 'Grant system alarm permissions to ensure workouts and meals fire on time.'}
              </Text>
            </View>
          </View>
          {!isPermissionGranted && (
            <TouchableOpacity
              style={styles.permissionActionBtn}
              onPress={handleRequestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionActionText}>ENABLE ALARM PERMISSIONS</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section 1: Morning Workout Alarm */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>WORKOUT ALARM</Text>
              <Text style={styles.sectionDescription}>
                Prominent morning alarm reminder for resistance training.
              </Text>
            </View>
            <Switch
              value={config.workoutReminderEnabled}
              onValueChange={(val) => setConfig({ ...config, workoutReminderEnabled: val })}
              trackColor={{ false: '#334155', true: Theme.colors.cyanGlow }}
              thumbColor={config.workoutReminderEnabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {config.workoutReminderEnabled && (
            <View style={{ gap: 8, marginTop: 10 }}>
              <View style={styles.timeSettingRow}>
                <Text style={styles.timeLabel}>Alarm Time (24h IST):</Text>
                <TextInput
                  style={styles.timeInput}
                  value={config.workoutReminderTime}
                  onChangeText={(val) => setConfig({ ...config, workoutReminderTime: val })}
                  placeholder="18:00"
                  placeholderTextColor={Theme.colors.textMuted}
                  maxLength={5}
                />
              </View>

              {/* Quick Time Preset Buttons */}
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  style={[
                    styles.timePresetChip,
                    config.workoutReminderTime === '18:00' && styles.timePresetChipActive,
                  ]}
                  onPress={() => setConfig({ ...config, workoutReminderTime: '18:00' })}
                >
                  <Text style={[styles.timePresetText, config.workoutReminderTime === '18:00' && styles.timePresetTextActive]}>
                    Evening 06:00 PM (18:00)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.timePresetChip,
                    config.workoutReminderTime === '06:00' && styles.timePresetChipActive,
                  ]}
                  onPress={() => setConfig({ ...config, workoutReminderTime: '06:00' })}
                >
                  <Text style={[styles.timePresetText, config.workoutReminderTime === '06:00' && styles.timePresetTextActive]}>
                    Morning 06:00 AM (06:00)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.timePresetChip,
                    config.workoutReminderTime === '19:00' && styles.timePresetChipActive,
                  ]}
                  onPress={() => setConfig({ ...config, workoutReminderTime: '19:00' })}
                >
                  <Text style={[styles.timePresetText, config.workoutReminderTime === '19:00' && styles.timePresetTextActive]}>
                    Evening 07:00 PM (19:00)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Resolved IST Banner */}
              <View style={styles.resolvedTimeBox}>
                <Text style={styles.resolvedTimeText}>
                  🔔 Scheduled for:{' '}
                  <Text style={{ color: Theme.colors.cyanGlow, fontWeight: '800' }}>
                    {config.workoutReminderTime}{' '}
                    {parseInt(config.workoutReminderTime?.split(':')[0] || '0', 10) >= 12
                      ? `(${parseInt(config.workoutReminderTime?.split(':')[0] || '0', 10) === 12 ? 12 : parseInt(config.workoutReminderTime?.split(':')[0] || '0', 10) - 12}:${config.workoutReminderTime?.split(':')[1] || '00'} PM IST)`
                      : `(${config.workoutReminderTime} AM IST)`}
                  </Text>
                </Text>
              </View>
            </View>
          )}

          <View style={styles.smartNoticeBox}>
            <Text style={styles.smartNoticeText}>
              ⚡ <strong>Smart Suppression:</strong> Automatically silenced on scheduled Rest Days and once today's workout session is completed.
            </Text>
          </View>
        </View>

        {/* Section 2: 5-Meal Schedule Alarms */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>5-MEAL SCHEDULE REMINDERS</Text>
              <Text style={styles.sectionDescription}>
                Timely hydration & metabolic fueling reminders throughout the day.
              </Text>
            </View>
            <Switch
              value={config.mealRemindersEnabled}
              onValueChange={(val) => setConfig({ ...config, mealRemindersEnabled: val })}
              trackColor={{ false: '#334155', true: Theme.colors.emeraldSuccess }}
              thumbColor={config.mealRemindersEnabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {config.mealRemindersEnabled && (
            <View style={styles.mealSlotsGrid}>
              {[
                { label: 'Meal 1 (Breakfast)', key: 'breakfast' as const },
                { label: 'Meal 2 (Mid-Morning)', key: 'midMorning' as const },
                { label: 'Meal 3 (Lunch)', key: 'lunch' as const },
                { label: 'Meal 4 (Afternoon Snack)', key: 'snack' as const },
                { label: 'Meal 5 (Dinner)', key: 'dinner' as const },
              ].map(({ label, key }) => (
                <View key={key} style={styles.mealSlotRow}>
                  <Text style={styles.mealSlotLabel}>{label}</Text>
                  <TextInput
                    style={styles.timeInputSmall}
                    value={config.mealReminderTimes[key]}
                    onChangeText={(val) =>
                      setConfig({
                        ...config,
                        mealReminderTimes: { ...config.mealReminderTimes, [key]: val },
                      })
                    }
                    placeholder="00:00"
                    placeholderTextColor={Theme.colors.textMuted}
                    maxLength={5}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={styles.smartNoticeBox}>
            <Text style={styles.smartNoticeText}>
              🥗 <strong>Smart Suppression:</strong> Silenced once the corresponding meal is logged in your nutrition tracker.
            </Text>
          </View>
        </View>

        {/* Section 3: Weekly Progress Check-In */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>WEEKLY CHECK-IN PROMPT</Text>
              <Text style={styles.sectionDescription}>
                Sunday weigh-in, body measurement, and coach review prompt.
              </Text>
            </View>
            <Switch
              value={config.weeklyCheckInEnabled}
              onValueChange={(val) => setConfig({ ...config, weeklyCheckInEnabled: val })}
              trackColor={{ false: '#334155', true: Theme.colors.violetAi }}
              thumbColor={config.weeklyCheckInEnabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {config.weeklyCheckInEnabled && (
            <View style={styles.timeSettingRow}>
              <Text style={styles.timeLabel}>Sunday Check-In Time:</Text>
              <TextInput
                style={styles.timeInput}
                value={config.weeklyCheckInTime}
                onChangeText={(val) => setConfig({ ...config, weeklyCheckInTime: val })}
                placeholder="09:00"
                placeholderTextColor={Theme.colors.textMuted}
                maxLength={5}
              />
            </View>
          )}
        </View>

        {/* Section 4: Snooze Options */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>ALARM SNOOZE INTERVAL</Text>
          <Text style={styles.sectionDescription}>
            Duration before alarm re-triggers if not dismissed or completed.
          </Text>

          <View style={styles.snoozeRow}>
            {[10, 30, 60].map((mins) => {
              const isSelected = config.snoozeMinutes === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  style={[styles.snoozeBtn, isSelected && styles.snoozeBtnSelected]}
                  onPress={() => setConfig({ ...config, snoozeMinutes: mins })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.snoozeText, isSelected && styles.snoozeTextSelected]}>
                    {mins === 60 ? '1 Hour' : `${mins} min`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save CTA */}
        <PrimaryButton
          title={isSaved ? 'PREFERENCES SAVED ✓' : 'SAVE REMINDER PREFERENCES'}
          onPress={handleSave}
          style={{ marginTop: 8, marginBottom: 32 }}
        />
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSubtle,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 16,
  },
  cardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    fontSize: 24,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  permissionActionBtn: {
    marginTop: 12,
    backgroundColor: Theme.colors.primaryBlue,
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  permissionActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  timeSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderSubtle,
  },
  timeLabel: {
    fontSize: 13,
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  timeInput: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    color: Theme.colors.cyanGlow,
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: 84,
    textAlign: 'center',
  },
  timePresetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Theme.borderRadius.xs,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timePresetChipActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: Theme.colors.cyanGlow,
  },
  timePresetText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontFamily: Theme.typography.fontBody,
  },
  timePresetTextActive: {
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
  resolvedTimeBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: Theme.borderRadius.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  resolvedTimeText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontMono,
  },
  smartNoticeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.xs,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  smartNoticeText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    lineHeight: 16,
  },
  mealSlotsGrid: {
    marginTop: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderSubtle,
    paddingTop: 12,
  },
  mealSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealSlotLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  timeInputSmall: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.xs,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 70,
    textAlign: 'center',
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  snoozeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  snoozeBtnSelected: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  snoozeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  snoozeTextSelected: {
    color: Theme.colors.cyanGlow,
  },
});
