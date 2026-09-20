import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';

interface LogPhotoModalProps {
  visible: boolean;
  onClose: () => void;
  onSavePhoto: (photoUrl: string, s3Key: string, viewAngle: string, notes?: string) => Promise<void>;
}

export const LogPhotoModal: React.FC<LogPhotoModalProps> = ({
  visible,
  onClose,
  onSavePhoto,
}) => {
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop');
  const [viewAngle, setViewAngle] = useState<'FRONT' | 'SIDE' | 'BACK'>('FRONT');
  const [notes, setNotes] = useState('Weekly physique check-in');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!photoUrl.trim()) return;
    setIsSubmitting(true);
    try {
      const s3Key = `photos/user_${Date.now()}_${viewAngle.toLowerCase()}.jpg`;
      await onSavePhoto(photoUrl, s3Key, viewAngle, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Progress Photo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Photo URL Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Photo URL / S3 Asset</Text>
            <TextInput
              value={photoUrl}
              onChangeText={setPhotoUrl}
              placeholder="https://..."
              placeholderTextColor="#64748B"
              style={styles.textInput}
            />
          </View>

          {/* View Angle Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>View Angle</Text>
            <View style={styles.angleRow}>
              {(['FRONT', 'SIDE', 'BACK'] as const).map((angle) => {
                const isSelected = viewAngle === angle;
                return (
                  <TouchableOpacity
                    key={angle}
                    onPress={() => setViewAngle(angle)}
                    style={[styles.angleBtn, isSelected && styles.angleBtnActive]}
                  >
                    <Text style={[styles.angleText, isSelected && styles.angleTextActive]}>
                      {angle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes or conditions..."
              placeholderTextColor="#64748B"
              style={[styles.textInput, { height: 60 }]}
              multiline
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Uploading...' : 'Save Photo'}
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
    fontSize: 14,
    color: '#FFFFFF',
  },
  angleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  angleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  angleBtnActive: {
    backgroundColor: '#3882F6',
    borderColor: '#60A5FA',
  },
  angleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  angleTextActive: {
    color: '#FFFFFF',
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
