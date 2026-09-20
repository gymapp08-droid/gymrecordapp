import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

import { Theme } from '../../theme/tokens';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import {
  HealthPlatform,
  IntegrationConnectionState,
  HealthPermissionState,
} from '@alpha/types';

export interface MobileIntegrationItem {
  platform: HealthPlatform;
  displayName: string;
  description: string;
  status: IntegrationConnectionState;
  permissionState: HealthPermissionState;
  grantedPermissions: string[];
  capabilities: string[];
  lastSyncAt?: string;
  requiresCredentials: boolean;
}

const INITIAL_INTEGRATIONS: MobileIntegrationItem[] = [
  {
    platform: HealthPlatform.APPLE_HEALTHKIT,
    displayName: 'Apple Health',
    description: 'On-device Apple HealthKit and Apple Watch biometric sync',
    status: IntegrationConnectionState.CONNECTED,
    permissionState: HealthPermissionState.GRANTED,
    grantedPermissions: ['STEPS', 'WORKOUTS', 'HEART_RATE', 'ACTIVE_CALORIES'],
    capabilities: ['STEPS', 'HEART_RATE', 'WORKOUTS', 'CALORIES', 'DISTANCE', 'SLEEP'],
    lastSyncAt: 'Just now',
    requiresCredentials: false,
  },
  {
    platform: HealthPlatform.ANDROID_HEALTH_CONNECT,
    displayName: 'Health Connect',
    description: 'Android Health Connect integration for Galaxy Watch & Wear OS',
    status: IntegrationConnectionState.AVAILABLE,
    permissionState: HealthPermissionState.NOT_REQUESTED,
    grantedPermissions: [],
    capabilities: ['STEPS', 'HEART_RATE', 'WORKOUTS', 'CALORIES', 'DISTANCE'],
    requiresCredentials: false,
  },
  {
    platform: HealthPlatform.OURA,
    displayName: 'Oura Ring',
    description: 'Sleep stages, readiness score, and continuous biometric tracking',
    status: IntegrationConnectionState.AVAILABLE,
    permissionState: HealthPermissionState.NOT_REQUESTED,
    grantedPermissions: [],
    capabilities: ['SLEEP', 'READINESS', 'HRV', 'RESTING_HR'],
    requiresCredentials: true,
  },
  {
    platform: HealthPlatform.WHOOP,
    displayName: 'WHOOP 4.0',
    description: 'Continuous strain, recovery scoring, and sleep cycles',
    status: IntegrationConnectionState.AVAILABLE,
    permissionState: HealthPermissionState.NOT_REQUESTED,
    grantedPermissions: [],
    capabilities: ['RECOVERY', 'HRV', 'STRAIN', 'SLEEP'],
    requiresCredentials: true,
  },
  {
    platform: HealthPlatform.GARMIN,
    displayName: 'Garmin Connect',
    description: 'GPS activities, training readiness, and VO2 Max metrics',
    status: IntegrationConnectionState.AVAILABLE,
    permissionState: HealthPermissionState.NOT_REQUESTED,
    grantedPermissions: [],
    capabilities: ['STEPS', 'WORKOUTS', 'ROUTE', 'VO2_MAX'],
    requiresCredentials: true,
  },
  {
    platform: HealthPlatform.FITBIT,
    displayName: 'Fitbit',
    description: 'Daily activity, resting heart rate, and weight tracking',
    status: IntegrationConnectionState.AVAILABLE,
    permissionState: HealthPermissionState.NOT_REQUESTED,
    grantedPermissions: [],
    capabilities: ['STEPS', 'HEART_RATE', 'SLEEP', 'WEIGHT'],
    requiresCredentials: true,
  },
];

interface IntegrationsScreenProps {
  isOffline?: boolean;
  onConnectProvider?: (platform: HealthPlatform) => void;
  onDisconnectProvider?: (platform: HealthPlatform) => void;
  onSyncNow?: (platform: HealthPlatform) => void;
}

export const IntegrationsScreen: React.FC<IntegrationsScreenProps> = ({
  isOffline = false,
  onConnectProvider,
  onDisconnectProvider,
  onSyncNow,
}) => {
  const [integrations, setIntegrations] = useState<MobileIntegrationItem[]>(INITIAL_INTEGRATIONS);
  const [syncingPlatform, setSyncingPlatform] = useState<HealthPlatform | null>(null);

  const connectedList = integrations.filter(
    (item) => item.status === IntegrationConnectionState.CONNECTED || item.status === IntegrationConnectionState.SYNCING,
  );
  const availableList = integrations.filter(
    (item) => item.status !== IntegrationConnectionState.CONNECTED && item.status !== IntegrationConnectionState.SYNCING,
  );

  const handleSync = (platform: HealthPlatform) => {
    setSyncingPlatform(platform);
    if (onSyncNow) onSyncNow(platform);
    setTimeout(() => {
      setSyncingPlatform(null);
      setIntegrations((prev) =>
        prev.map((item) =>
          item.platform === platform ? { ...item, lastSyncAt: 'Just now' } : item,
        ),
      );
    }, 1200);
  };

  const handleDisconnect = (platform: HealthPlatform) => {
    if (onDisconnectProvider) onDisconnectProvider(platform);
    setIntegrations((prev) =>
      prev.map((item) =>
        item.platform === platform
          ? {
              ...item,
              status: IntegrationConnectionState.DISCONNECTED,
              permissionState: HealthPermissionState.REVOKED,
              grantedPermissions: [],
            }
          : item,
      ),
    );
  };

  const handleConnect = (platform: HealthPlatform) => {
    if (onConnectProvider) onConnectProvider(platform);
    setIntegrations((prev) =>
      prev.map((item) =>
        item.platform === platform
          ? {
              ...item,
              status: IntegrationConnectionState.CONNECTED,
              permissionState: HealthPermissionState.GRANTED,
              grantedPermissions: item.capabilities.slice(0, 3),
              lastSyncAt: 'Just now',
            }
          : item,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />

      {/* Offline Notice Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            DEVICE OFFLINE — Displaying cached health connection telemetry
          </Text>
        </View>
      )}

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Integrations & Wearables</Text>
        <Text style={styles.headerSubtitle}>
          Connect official health platforms and smart devices. ALPHA never fabricates telemetry.
        </Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {/* SECTION: CONNECTED PLATFORMS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CONNECTED PLATFORMS</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{connectedList.length}</Text>
          </View>
        </View>

        {connectedList.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Devices Connected</Text>
            <Text style={styles.emptyDescription}>
              Connect Apple Health or Android Health Connect to automatically import your daily steps,
              cardio, and biometrics into ALPHA.
            </Text>
          </GlassCard>
        ) : (
          connectedList.map((item) => (
            <GlassCard key={item.platform} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{item.displayName}</Text>
                  <Text style={styles.lastSyncText}>
                    Last synced: {item.lastSyncAt || 'Never'}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.providerDescription}>{item.description}</Text>

              {/* Granted Permissions Chips */}
              <View style={styles.permissionsContainer}>
                <Text style={styles.permissionsLabel}>Active Scopes:</Text>
                <View style={styles.chipsRow}>
                  {item.grantedPermissions.map((scope) => (
                    <View key={scope} style={styles.scopeChip}>
                      <Text style={styles.scopeChipText}>{scope}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <NeonButton
                  title={syncingPlatform === item.platform ? 'Syncing...' : 'Sync Now'}
                  onPress={() => handleSync(item.platform)}
                  variant="primary"
                  style={styles.syncButton}
                />
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => handleDisconnect(item.platform)}
                >
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}

        {/* SECTION: AVAILABLE INTEGRATIONS */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>AVAILABLE INTEGRATIONS</Text>
        </View>

        {availableList.map((item) => (
          <GlassCard key={item.platform} style={styles.availableCard}>
            <View style={styles.cardHeader}>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{item.displayName}</Text>
                <Text style={styles.authTypeText}>
                  {item.requiresCredentials ? 'OAuth 2.0 Cloud' : 'Mobile SDK'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => handleConnect(item.platform)}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.providerDescription}>{item.description}</Text>

            {/* Capability tags */}
            <View style={styles.chipsRow}>
              {item.capabilities.map((cap) => (
                <View key={cap} style={styles.capabilityChip}>
                  <Text style={styles.capabilityChipText}>{cap}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  offlineBanner: {
    backgroundColor: Theme.colors.amberWarning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontDisplay,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontBody,
    marginTop: 4,
    lineHeight: 18,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Theme.colors.textMuted,
    fontFamily: Theme.typography.fontDisplay,
  },
  countBadge: {
    backgroundColor: 'rgba(56, 130, 246, 0.20)',
    borderRadius: Theme.borderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    color: Theme.colors.primaryBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    padding: 16,
    marginBottom: 14,
    borderRadius: Theme.borderRadius.md,
  },
  availableCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: Theme.borderRadius.md,
    opacity: 0.9,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  emptyTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDescription: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontDisplay,
  },
  lastSyncText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  authTypeText: {
    fontSize: 11,
    color: Theme.colors.cyanGlow,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.emeraldSuccess,
    marginRight: 6,
  },
  statusText: {
    color: Theme.colors.emeraldSuccess,
    fontSize: 11,
    fontWeight: '700',
  },
  providerDescription: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  permissionsContainer: {
    marginBottom: 14,
  },
  permissionsLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeChip: {
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderColor: 'rgba(56, 130, 246, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.sm,
  },
  scopeChipText: {
    color: Theme.colors.primaryBlue,
    fontSize: 10,
    fontWeight: '700',
  },
  capabilityChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.sm,
  },
  capabilityChipText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncButton: {
    flex: 1,
  },
  disconnectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.30)',
  },
  disconnectText: {
    color: Theme.colors.roseError,
    fontSize: 12,
    fontWeight: '700',
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.primaryBlue,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
