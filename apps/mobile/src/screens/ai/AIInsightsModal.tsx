import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { IAIInsight } from '@alpha/types';

interface AIInsightsModalProps {
  visible: boolean;
  onClose: () => void;
  insights: IAIInsight[];
  onRefresh: () => void;
}

export const AIInsightsModal: React.FC<AIInsightsModalProps> = ({
  visible,
  onClose,
  insights,
  onRefresh,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Proactive AI Insights</Text>
              <Text style={styles.subtitle}>Derived from your verified training logs</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {insights.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Gathering Data...</Text>
                <Text style={styles.emptyText}>
                  Complete workouts and log nutrition to unlock personalized intelligence trends.
                </Text>
              </View>
            ) : (
              insights.map((ins) => (
                <View key={ins.id} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightType}>{ins.type.replace('_', ' ')}</Text>
                    <View style={[styles.confPill, ins.confidence === 'HIGH' ? styles.confHigh : styles.confMed]}>
                      <Text style={styles.confText}>{ins.confidence}</Text>
                    </View>
                  </View>
                  <Text style={styles.insightTitle}>{ins.title}</Text>
                  <Text style={styles.insightSummary}>{ins.summary}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Refresh Action */}
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>⚡ Refresh Insights</Text>
          </TouchableOpacity>
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
    maxHeight: '80%',
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
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  insightCard: {
    backgroundColor: 'rgba(11, 19, 36, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightType: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  confPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  confHigh: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  confMed: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  confText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  insightSummary: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  refreshBtn: {
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.4)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshBtnText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },
});
