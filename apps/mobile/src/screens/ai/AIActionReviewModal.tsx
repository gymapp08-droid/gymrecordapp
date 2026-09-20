import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { IAIActionProposal } from '@alpha/types';

interface AIActionReviewModalProps {
  visible: boolean;
  onClose: () => void;
  proposal: IAIActionProposal | null;
  onConfirm: (proposalId: string, confirmed: boolean) => Promise<void>;
}

export const AIActionReviewModal: React.FC<AIActionReviewModalProps> = ({
  visible,
  onClose,
  proposal,
  onConfirm,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!proposal) return null;

  const handleAction = async (confirmed: boolean) => {
    setIsProcessing(true);
    try {
      await onConfirm(proposal.id, confirmed);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const exercises = (proposal.payload?.exercises as any[]) || [
    { name: 'Barbell Bench Press', sets: 4, reps: 10, rpe: 8 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 12, rpe: 8 },
    { name: 'Standing Overhead Press', sets: 3, reps: 10, rpe: 7.5 },
    { name: 'Cable Tricep Pushdown', sets: 4, reps: 12, rpe: 9 },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badgeText}>PROPOSED ACTION</Text>
              <Text style={styles.headerTitle}>{proposal.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>COACH RATIONALE</Text>
              <Text style={styles.summaryText}>{proposal.summary}</Text>
            </View>

            {/* Structured Changes */}
            <Text style={styles.sectionHeading}>RECOMMENDED EXERCISES</Text>
            <View style={styles.exercisesList}>
              {exercises.map((ex, idx) => (
                <View key={`ex-${idx}`} style={styles.exerciseRow}>
                  <View style={styles.exerciseLeft}>
                    <Text style={styles.exerciseIndex}>{idx + 1}</Text>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                  </View>
                  <View style={styles.exerciseRight}>
                    <Text style={styles.exerciseTarget}>
                      {ex.sets} sets × {ex.reps} reps
                    </Text>
                    {ex.rpe && (
                      <Text style={styles.exerciseRpe}>RPE {ex.rpe}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Non-authoritative guard notice */}
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>
                ⚠️ AI recommendations are non-authoritative drafts. Applying this change will queue the revision for your upcoming training session.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => handleAction(false)}
              disabled={isProcessing}
              style={[styles.actionBtn, styles.cancelBtn]}
            >
              <Text style={styles.cancelBtnText}>Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAction(true)}
              disabled={isProcessing}
              style={[styles.actionBtn, styles.confirmBtn]}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Apply Change</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#080D1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(56, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  exercisesList: {
    gap: 8,
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 16,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseRight: {
    alignItems: 'flex-end',
  },
  exerciseTarget: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
  },
  exerciseRpe: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  noticeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 11,
    color: '#F59E0B',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#3882F6',
    shadowColor: '#3882F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
