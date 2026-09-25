import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { useUpdate } from '../context/UpdateContext';
import { Theme } from '../theme/tokens';

export const AlphaUpdateModal: React.FC = () => {
  const { updateInfo, applyUpdate, dismissUpdateBanner, isWorkoutInProgress } = useUpdate();
  const [fadeAnim] = useState(new Animated.Value(0));

  // Determine visibility:
  // If status is READY_TO_RESTART and user has not dismissed it, show modal (UNLESS workout is in progress, then keep non-blocking)
  const isReady = updateInfo.status === 'READY_TO_RESTART' && updateInfo.isUpdatePending;
  const isDownloading = updateInfo.status === 'DOWNLOADING';

  useEffect(() => {
    if (isReady || isDownloading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isReady, isDownloading]);

  // If downloading, show a discrete top/bottom non-blocking badge
  if (isDownloading) {
    return (
      <View pointerEvents="none" style={styles.downloadingPill}>
        <ActivityIndicator size="small" color={Theme.colors.cyanGlow} style={{ marginRight: 8 }} />
        <View>
          <Text style={styles.downloadingTitle}>ALPHA OS UPDATE</Text>
          <Text style={styles.downloadingSubtitle}>Downloading verified bundle in background...</Text>
        </View>
      </View>
    );
  }

  // If ready to restart and workout is active:
  // Show non-intrusive banner instead of blocking modal!
  if (isReady && isWorkoutInProgress) {
    return (
      <View style={styles.workoutSafeBanner}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.amberDot} />
            <Text style={styles.amberBadgeText}>UPDATE READY · SAFE WORKOUT MODE</Text>
          </View>
          <Text style={styles.workoutBannerTitle}>
            New update downloaded. Stored safely until your session completes.
          </Text>
        </View>
        <TouchableOpacity
          onPress={dismissUpdateBanner}
          style={styles.dismissSmallBtn}
          accessibilityLabel="Dismiss update notification"
        >
          <Text style={styles.dismissSmallText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If ready to restart and no workout in progress:
  // Show full polished ALPHA modal
  if (isReady) {
    return (
      <Modal transparent visible={isReady} animationType="fade" onRequestClose={dismissUpdateBanner}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header Badge */}
            <View style={styles.headerBadge}>
              <View style={styles.cyanDot} />
              <Text style={styles.headerBadgeText}>SYSTEM UPDATE AVAILABLE</Text>
            </View>

            {/* Title & Description */}
            <Text style={styles.modalTitle}>ALPHA Performance OS</Text>
            <Text style={styles.modalDescription}>
              A certified over-the-air update has been downloaded. Restart the application to apply
              the latest performance improvements and enhancements immediately.
            </Text>

            {/* Metadata telemetry card */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>RUNTIME VERSION</Text>
                <Text style={styles.telemetryValue}>{updateInfo.runtimeVersion || '1.0.0'}</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>UPDATE CHANNEL</Text>
                <Text style={styles.telemetryValue}>{(updateInfo.channel || 'production').toUpperCase()}</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>STATUS</Text>
                <Text style={[styles.telemetryValue, { color: Theme.colors.cyanGlow }]}>READY TO RESTART</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={() => applyUpdate()}
                style={styles.applyButton}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Restart & Apply Update</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={dismissUpdateBanner}
                style={styles.laterButton}
                activeOpacity={0.7}
              >
                <Text style={styles.laterButtonText}>Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  downloadingPill: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#07090E',
    borderColor: 'rgba(0, 240, 255, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  downloadingTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
    letterSpacing: 1,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  downloadingSubtitle: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  workoutSafeBanner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  amberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  amberBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  workoutBannerTitle: {
    fontSize: 11,
    color: Theme.colors.textPrimary,
  },
  dismissSmallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 8,
  },
  dismissSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 11, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.cyanGlow,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
    letterSpacing: 1,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  modalDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
  },
  telemetryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  buttonGroup: {
    gap: 10,
  },
  applyButton: {
    backgroundColor: Theme.colors.cyanGlow,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#05070B',
    letterSpacing: 0.5,
  },
  laterButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
});
