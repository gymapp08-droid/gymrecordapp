import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Theme } from '../../theme/tokens';
import { ApiClient } from '../../services/api';
import { ReminderEditorModal } from './ReminderEditorModal';
import { IReminder } from '@alpha/types';

interface RemindersScreenProps {
  onNavigateBack?: () => void;
}

export const RemindersScreen: React.FC<RemindersScreenProps> = ({ onNavigateBack }) => {
  const [reminders, setReminders] = useState<IReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<IReminder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await ApiClient.get<IReminder[]>('/reminders');
      if (res.success && res.data) {
        setReminders(res.data);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleEnabled = async (reminder: IReminder, val: boolean) => {
    // Optimistic update
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, isEnabled: val } : r)),
    );

    await ApiClient.patch(`/reminders/${reminder.id}`, { isEnabled: val });
  };

  const handleOpenCreate = () => {
    setSelectedReminder(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (reminder: IReminder) => {
    setSelectedReminder(reminder);
    setModalVisible(true);
  };

  const handleSavedReminder = (saved: IReminder) => {
    setReminders((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      if (exists) {
        return prev.map((r) => (r.id === saved.id ? saved : r));
      } else {
        return [...prev, saved].sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
      }
    });
  };

  const handleDeletedReminder = (reminderId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
  };

  const formatDays = (days: number[] = []) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(6) && !days.includes(7)) return 'Weekdays';
    if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Weekends';

    return days
      .sort((a, b) => a - b)
      .map((d) => dayNames[d - 1])
      .filter(Boolean)
      .join(', ');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onNavigateBack && (
            <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Reminders</Text>
        </View>
        <TouchableOpacity onPress={handleOpenCreate} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primaryBlue} />
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchReminders();
              }}
              tintColor={Theme.colors.cyanGlow}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>⏰</Text>
              <Text style={styles.emptyTitle}>No Reminders Set</Text>
              <Text style={styles.emptySubtitle}>
                Schedule personalized reminders for workouts, meals, and hydration check-ins.
              </Text>
              <TouchableOpacity onPress={handleOpenCreate} style={styles.emptyAddBtn}>
                <Text style={styles.emptyAddBtnText}>Create Reminder</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenEdit(item)}
              style={[styles.reminderCard, !item.isEnabled && styles.reminderCardDisabled]}
            >
              <View style={styles.reminderInfo}>
                <View style={styles.timeRow}>
                  <Text style={[styles.reminderTime, !item.isEnabled && styles.textDisabled]}>
                    {item.timeOfDay}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                </View>

                <Text style={[styles.reminderTitle, !item.isEnabled && styles.textDisabled]}>
                  {item.title}
                </Text>
                <Text style={styles.reminderDays}>{formatDays(item.daysOfWeek)}</Text>
              </View>

              <Switch
                value={item.isEnabled}
                onValueChange={(val) => handleToggleEnabled(item, val)}
                trackColor={{ false: '#1E293B', true: Theme.colors.primaryBlue }}
                thumbColor={item.isEnabled ? Theme.colors.cyanGlow : '#64748B'}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Editor Modal */}
      <ReminderEditorModal
        visible={modalVisible}
        reminder={selectedReminder}
        onClose={() => setModalVisible(false)}
        onSave={handleSavedReminder}
        onDelete={handleDeletedReminder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 24,
    color: Theme.colors.textPrimary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontDisplay,
  },
  addBtn: {
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.primaryBlue,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.pill,
  },
  addBtnText: {
    color: Theme.colors.primaryBlue,
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  reminderCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderCardDisabled: {
    opacity: 0.5,
  },
  reminderInfo: {
    flex: 1,
    paddingRight: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontDisplay,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.cyanGlow,
    letterSpacing: 0.5,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  reminderDays: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  textDisabled: {
    color: Theme.colors.textDisabled,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: 20,
  },
  emptyAddBtn: {
    backgroundColor: Theme.colors.primaryBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
  },
  emptyAddBtnText: {
    color: Theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
