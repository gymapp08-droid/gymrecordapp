import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { IProgressPhotoMetadata } from '@alpha/types';

interface PhotoComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  beforePhoto: IProgressPhotoMetadata | null;
  afterPhoto: IProgressPhotoMetadata | null;
  daysBetween?: number;
}

const { width } = Dimensions.get('window');

export const PhotoComparisonModal: React.FC<PhotoComparisonModalProps> = ({
  visible,
  onClose,
  beforePhoto,
  afterPhoto,
  daysBetween,
}) => {
  const days = daysBetween ?? (beforePhoto && afterPhoto
    ? Math.round(Math.abs(new Date(afterPhoto.takenAt).getTime() - new Date(beforePhoto.takenAt).getTime()) / (1000 * 60 * 60 * 24))
    : 30);

  const defaultBeforeUrl = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop';
  const defaultAfterUrl = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Physique Comparison</Text>
              <Text style={styles.headerSubtitle}>
                {days} days transformation timeline
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Side by side comparison */}
          <View style={styles.comparisonRow}>
            {/* Before */}
            <View style={styles.photoCol}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeLabel}>BEFORE</Text>
              </View>
              <Image
                source={{ uri: beforePhoto?.photoUrl || defaultBeforeUrl }}
                style={styles.photoImg}
                resizeMode="cover"
              />
              <View style={styles.photoMeta}>
                <Text style={styles.photoDate}>
                  {beforePhoto ? new Date(beforePhoto.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '1 May'}
                </Text>
                <Text style={styles.photoAngle}>{beforePhoto?.viewAngle || 'FRONT'}</Text>
              </View>
            </View>

            {/* Divider with Days pill */}
            <View style={styles.dividerCol}>
              <View style={styles.daysPill}>
                <Text style={styles.daysNumber}>+{days}</Text>
                <Text style={styles.daysUnit}>DAYS</Text>
              </View>
            </View>

            {/* After */}
            <View style={styles.photoCol}>
              <View style={[styles.badgeContainer, styles.badgeAfter]}>
                <Text style={[styles.badgeLabel, styles.badgeLabelAfter]}>CURRENT</Text>
              </View>
              <Image
                source={{ uri: afterPhoto?.photoUrl || defaultAfterUrl }}
                style={styles.photoImg}
                resizeMode="cover"
              />
              <View style={styles.photoMeta}>
                <Text style={styles.photoDate}>
                  {afterPhoto ? new Date(afterPhoto.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '30 May'}
                </Text>
                <Text style={styles.photoAngle}>{afterPhoto?.viewAngle || 'FRONT'}</Text>
              </View>
            </View>
          </View>

          {/* Notes summary */}
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Transformation Insights</Text>
            <Text style={styles.notesBody}>
              {afterPhoto?.notes || 'Consistent caloric deficit maintained. Visibly improved abdominal definition and shoulder separation.'}
            </Text>
          </View>

          {/* Close Action */}
          <TouchableOpacity onPress={onClose} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
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
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#60A5FA',
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
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoCol: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  badgeAfter: {
    backgroundColor: 'rgba(56, 130, 246, 0.85)',
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  badgeLabelAfter: {
    color: '#FFFFFF',
  },
  photoImg: {
    width: '100%',
    height: width * 0.55,
    backgroundColor: '#1E293B',
  },
  photoMeta: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 36, 0.95)',
  },
  photoDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  photoAngle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dividerCol: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  daysPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  daysNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  daysUnit: {
    fontSize: 8,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  notesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    marginTop: 16,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  notesBody: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#3882F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#3882F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
