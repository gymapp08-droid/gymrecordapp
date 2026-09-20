import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { BodyMeasurementType } from '@alpha/types';

interface LogMetricModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveWeight: (weightKg: number, bodyFatPercent?: number) => Promise<void>;
  onSaveMeasurement: (type: BodyMeasurementType, valueCm: number) => Promise<void>;
}

export const LogMetricModal: React.FC<LogMetricModalProps> = ({
  visible,
  onClose,
  onSaveWeight,
  onSaveMeasurement,
}) => {
  const [activeMode, setActiveMode] = useState<'WEIGHT' | 'MEASUREMENT'>('WEIGHT');

  // Weight fields
  const [weightInput, setWeightInput] = useState('80.0');
  const [bodyFatInput, setBodyFatInput] = useState('16.0');

  // Measurement fields
  const [selectedType, setSelectedType] = useState<BodyMeasurementType>(BodyMeasurementType.WAIST);
  const [measurementInput, setMeasurementInput] = useState('82.0');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (activeMode === 'WEIGHT') {
        const w = parseFloat(weightInput);
        const bf = bodyFatInput ? parseFloat(bodyFatInput) : undefined;
        if (!isNaN(w) && w > 0) {
          await onSaveWeight(w, !isNaN(bf as number) ? bf : undefined);
        }
      } else {
        const val = parseFloat(measurementInput);
        if (!isNaN(val) && val > 0) {
          await onSaveMeasurement(selectedType, val);
        }
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const measurementOptions: { type: BodyMeasurementType; label: string }[] = [
    { type: BodyMeasurementType.CHEST, label: 'Chest' },
    { type: BodyMeasurementType.WAIST, label: 'Waist' },
    { type: BodyMeasurementType.HIPS, label: 'Hips' },
    { type: BodyMeasurementType.BICEPS, label: 'Biceps' },
    { type: BodyMeasurementType.THIGHS, label: 'Thighs' },
    { type: BodyMeasurementType.CALVES, label: 'Calves' },
    { type: BodyMeasurementType.SHOULDERS, label: 'Shoulders' },
    { type: BodyMeasurementType.NECK, label: 'Neck' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log Biometrics</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              onPress={() => setActiveMode('WEIGHT')}
              style={[styles.segmentBtn, activeMode === 'WEIGHT' && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, activeMode === 'WEIGHT' && styles.segmentTextActive]}>
                Weight & Body Fat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveMode('MEASUREMENT')}
              style={[styles.segmentBtn, activeMode === 'MEASUREMENT' && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, activeMode === 'MEASUREMENT' && styles.segmentTextActive]}>
                Body Measurements
              </Text>
            </TouchableOpacity>
          </View>

          {activeMode === 'WEIGHT' ? (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Body Weight (kg)</Text>
                <TextInput
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="numeric"
                  placeholder="e.g. 79.5"
                  placeholderTextColor="#64748B"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Body Fat (%) - Optional</Text>
                <TextInput
                  value={bodyFatInput}
                  onChangeText={setBodyFatInput}
                  keyboardType="numeric"
                  placeholder="e.g. 15.8"
                  placeholderTextColor="#64748B"
                  style={styles.textInput}
                />
              </View>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Select Anatomical Zone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesRow}>
                {measurementOptions.map((opt) => {
                  const isSelected = opt.type === selectedType;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      onPress={() => setSelectedType(opt.type)}
                      style={[styles.typePill, isSelected && styles.typePillActive]}
                    >
                      <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{selectedType} (cm)</Text>
                <TextInput
                  value={measurementInput}
                  onChangeText={setMeasurementInput}
                  keyboardType="numeric"
                  placeholder="e.g. 84.5"
                  placeholderTextColor="#64748B"
                  style={styles.textInput}
                />
              </View>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Saving...' : 'Save Log'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#080D1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#3882F6',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  typesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
  },
  typePillActive: {
    backgroundColor: 'rgba(56, 130, 246, 0.2)',
    borderColor: '#3882F6',
  },
  typePillText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  typePillTextActive: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#3882F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
