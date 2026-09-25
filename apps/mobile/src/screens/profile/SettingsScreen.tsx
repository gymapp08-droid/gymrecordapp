import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AlphaScreen, AlphaHeader } from '../../components';
import { Theme } from '../../theme/tokens';
import { useUpdate } from '../../context/UpdateContext';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [metricUnits, setMetricUnits] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [keepScreenAwake, setKeepScreenAwake] = useState(true);
  const [autoStartRestTimer, setAutoStartRestTimer] = useState(true);

  const { updateInfo, checkForUpdate, applyUpdate } = useUpdate();
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  const handleManualCheck = async () => {
    setIsCheckingUpdates(true);
    await checkForUpdate(true);
    setIsCheckingUpdates(false);
  };

  const handleClearCache = () => {
    Alert.alert('Cache Cleared', 'Local offline telemetry caches have been purged.');
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Settings"
        subtitle="SYSTEM & HARDWARE PREFERENCES"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Units */}
        <Text style={styles.sectionHeader}>MEASUREMENT CONVENTIONS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Metric Units (KG / CM / KM)</Text>
              <Text style={styles.rowSub}>Disable for Imperial (LBS / IN / MI)</Text>
            </View>
            <Switch
              value={metricUnits}
              onValueChange={setMetricUnits}
              thumbColor={metricUnits ? Theme.colors.cyanGlow : '#64748B'}
              trackColor={{ true: 'rgba(0, 240, 255, 0.3)', false: 'rgba(255, 255, 255, 0.1)' }}
            />
          </View>
        </View>

        {/* Training Engine Behavior */}
        <Text style={styles.sectionHeader}>WORKOUT ENGINE CONTROLS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Auto-Start Rest Timer</Text>
              <Text style={styles.rowSub}>Triggers timer immediately upon set completion</Text>
            </View>
            <Switch
              value={autoStartRestTimer}
              onValueChange={setAutoStartRestTimer}
              thumbColor={autoStartRestTimer ? Theme.colors.cyanGlow : '#64748B'}
              trackColor={{ true: 'rgba(0, 240, 255, 0.3)', false: 'rgba(255, 255, 255, 0.1)' }}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Keep Screen Awake During Sets</Text>
              <Text style={styles.rowSub}>Prevents display lock during active workout</Text>
            </View>
            <Switch
              value={keepScreenAwake}
              onValueChange={setKeepScreenAwake}
              thumbColor={keepScreenAwake ? Theme.colors.cyanGlow : '#64748B'}
              trackColor={{ true: 'rgba(0, 240, 255, 0.3)', false: 'rgba(255, 255, 255, 0.1)' }}
            />
          </View>
        </View>

        {/* Audio & Haptics */}
        <Text style={styles.sectionHeader}>AUDIO & HAPTIC FEEDBACK</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Rest Interval Chimes</Text>
              <Text style={styles.rowSub}>Beeps on 3-2-1 timer countdown completion</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              thumbColor={soundEnabled ? Theme.colors.cyanGlow : '#64748B'}
              trackColor={{ true: 'rgba(0, 240, 255, 0.3)', false: 'rgba(255, 255, 255, 0.1)' }}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Tactile Haptic Pulsing</Text>
              <Text style={styles.rowSub}>Vibrate upon rep threshold & PRs</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              thumbColor={hapticsEnabled ? Theme.colors.cyanGlow : '#64748B'}
              trackColor={{ true: 'rgba(0, 240, 255, 0.3)', false: 'rgba(255, 255, 255, 0.1)' }}
            />
          </View>
        </View>

        {/* System Updates */}
        <Text style={styles.sectionHeader}>SYSTEM UPDATES (OTA)</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Runtime Channel</Text>
              <Text style={styles.rowSub}>Target: {(updateInfo.channel || 'production').toUpperCase()}</Text>
            </View>
            <View style={styles.runtimeBadge}>
              <Text style={styles.runtimeBadgeText}>v{updateInfo.runtimeVersion || '1.0.0'}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowTitle}>Update Status</Text>
              <Text
                style={[
                  styles.rowSub,
                  updateInfo.status === 'READY_TO_RESTART'
                    ? { color: Theme.colors.cyanGlow, fontWeight: '700' }
                    : updateInfo.status === 'ERROR'
                    ? { color: '#F87171' }
                    : null,
                ]}
              >
                {updateInfo.status === 'CHECKING'
                  ? 'Checking for updates...'
                  : updateInfo.status === 'DOWNLOADING'
                  ? 'Downloading update package...'
                  : updateInfo.status === 'READY_TO_RESTART'
                  ? 'Update downloaded · Ready to apply'
                  : updateInfo.status === 'ERROR'
                  ? `Offline (${updateInfo.error || 'Check failed'})`
                  : 'Up to date'}
              </Text>
            </View>

            {updateInfo.status === 'READY_TO_RESTART' ? (
              <TouchableOpacity
                onPress={() => applyUpdate()}
                style={styles.actionBtnSmall}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnSmallText}>Restart</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleManualCheck}
                disabled={isCheckingUpdates}
                style={[styles.actionBtnSmall, isCheckingUpdates && { opacity: 0.6 }]}
                activeOpacity={0.8}
              >
                {isCheckingUpdates ? (
                  <ActivityIndicator size="small" color="#05070B" />
                ) : (
                  <Text style={styles.actionBtnSmallText}>Check Now</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Storage & Diagnostics */}
        <Text style={styles.sectionHeader}>STORAGE & DIAGNOSTICS</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.touchRow} onPress={handleClearCache}>
            <Text style={styles.rowTitle}>Purge Offline Telemetry Cache</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Version Build Footer */}
        <View style={styles.versionFooter}>
          <Text style={styles.versionTitle}>ALPHA PERFORMANCE OS</Text>
          <Text style={styles.versionSub}>Client v2.4.0 · Native Kernel Build 4208</Text>
          <Text style={styles.versionSub}>Stitch Architecture Release</Text>
        </View>
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 10,
    paddingBottom: 32,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.2,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  rowSub: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  touchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  chevron: {
    fontSize: 18,
    color: Theme.colors.textMuted,
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: 16,
    gap: 2,
  },
  versionTitle: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  versionSub: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
  },
  runtimeBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  runtimeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
  actionBtnSmall: {
    backgroundColor: Theme.colors.cyanGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  actionBtnSmallText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#05070B',
    fontFamily: Theme.typography.telemetry.fontFamily,
  },
});
