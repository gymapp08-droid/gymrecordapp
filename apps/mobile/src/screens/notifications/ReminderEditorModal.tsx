import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Theme } from '../../theme/tokens';
import { ApiClient } from '../../services/api';
import { IReminder } from '@alpha/types';

interface ReminderEditorModalProps {
  visible: boolean;
  reminder: IReminder | null;
  onClose: () => void;
  onSave: (reminder: IReminder) => void;
  onDelete?: (reminderId: string) => void;
}

const CATEGORIES = ['WORKOUT', 'NUTRITION', 'HYDRATION', 'RECOVERY', 'CUSTOM'];

const DAYS: { label: string; value: number }[] = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 7 },
];

export const ReminderEditorModal: React.FC<ReminderEditorModalProps> = ({
  visible,
  reminder,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [category, setCategory] = useState('WORKOUT');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setTimeOfDay(reminder.timeOfDay);
      setDaysOfWeek(reminder.daysOfWeek || []);
      setCategory(reminder.category);
      setIsEnabled(reminder.isEnabled);
    } else {
      setTitle('');
      setTimeOfDay('08:00');
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setCategory('WORKOUT');
      setIsEnabled(true);
    }
  }, [reminder, visible]);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a reminder title');
      return;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeOfDay)) {
      Alert.alert('Invalid Time', 'Time must be in HH:mm format (e.g. 08:30)');
      return;
    }

    if (daysOfWeek.length === 0) {
      Alert.alert('Days Required', 'Please select at least one day of the week');
      return;
    }

    setIsSubmitting(true);
    try {
      if (reminder) {
        // Update
        const res = await ApiClient.patch<IReminder>(`/reminders/${reminder.id}`, {
          title,
          timeOfDay,
          daysOfWeek,
          category,
          isEnabled,
        });

        if (res.success && res.data) {
          onSave(res.data);
          onClose();
        } else {
          Alert.alert('Error', res.error?.message || 'Failed to update reminder');
        }
      } else {
        // Create
        const res = await ApiClient.post<IReminder>('/reminders', {
          title,
          timeOfDay,
          daysOfWeek,
          category,
          isEnabled,
        });

        if (res.success && res.data) {
          onSave(res.data);
          onClose();
        } else {
          Alert.alert('Error', res.error?.message || 'Failed to create reminder');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!reminder || !onDelete) return;

    Alert.alert('Delete Reminder', 'Are you sure you want to remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsSubmitting(true);
          try {
            await ApiClient.delete(`/reminders/${reminder.id}`);
            onDelete(reminder.id);
            onClose();
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{reminder ? 'Edit Reminder' : 'New Reminder'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            {/* Title */}
            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning Conditioning"
              placeholderTextColor={Theme.colors.textMuted}
            />

            {/* Category */}
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.catChip, isSelected && styles.catChipActive]}
                  >
                    <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time of Day */}
            <Text style={styles.fieldLabel}>TIME (24-HOUR FORMAT)</Text>
            <TextInput
              style={styles.timeInput}
              value={timeOfDay}
              onChangeText={setTimeOfDay}
              placeholder="08:00"
              placeholderTextColor={Theme.colors.textMuted}
              maxLength={5}
            />

            {/* Days of Week */}
            <Text style={styles.fieldLabel}>REPEAT DAYS</Text>
            <View style={styles.daysRow}>
              {DAYS.map((d, index) => {
                const isSelected = daysOfWeek.includes(d.value);
                return (
                  <TouchableOpacity
                    key={`${d.label}-${index}`}
                    onPress={() => toggleDay(d.value)}
                    style={[styles.dayCircle, isSelected && styles.dayCircleActive]}
                  >
                    <Text style={[styles.dayCircleText, isSelected && styles.dayCircleTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Active Toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enabled</Text>
              <Switch
                value={isEnabled}
                onValueChange={setIsEnabled}
                trackColor={{ false: '#1E293B', true: Theme.colors.primaryBlue }}
                thumbColor={isEnabled ? Theme.colors.cyanGlow : '#64748B'}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                disabled={isSubmitting}
                onPress={handleSave}
                style={styles.saveBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Theme.colors.textPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {reminder ? 'Update Reminder' : 'Save Reminder'}
                  </Text>
                )}
              </TouchableOpacity>

              {reminder && onDelete && (
                <TouchableOpacity
                  disabled={isSubmitting}
                  onPress={handleDelete}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>Delete Reminder</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 11, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0C101A',
    borderTopLeftRadius: Theme.borderRadius.lg,
    borderTopRightRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontDisplay,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: Theme.colors.textMuted,
  },
  formContent: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Theme.colors.textPrimary,
    fontSize: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  catChipActive: {
    backgroundColor: 'rgba(56, 130, 246, 0.2)',
    borderColor: Theme.colors.primaryBlue,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  catChipTextActive: {
    color: Theme.colors.primaryBlue,
    fontWeight: '700',
  },
  timeInput: {
    width: 120,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Theme.colors.cyanGlow,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: Theme.colors.primaryBlue,
    borderColor: Theme.colors.cyanGlow,
  },
  dayCircleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  dayCircleTextActive: {
    color: Theme.colors.textPrimary,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primaryBlue,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: Theme.colors.roseError,
    fontSize: 14,
    fontWeight: '600',
  },
});
