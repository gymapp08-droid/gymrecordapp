import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AlphaScreen, AlphaHeader, SecondaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';

interface ProfileScreenProps {
  onBack?: () => void;
  onNavigateToSettings: () => void;
  onNavigateToIntegrations: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onNavigateToSettings,
  onNavigateToIntegrations,
}) => {
  const { user, logout } = useAuth();
  const displayName = (user as any)?.fullName || user?.email?.split('@')[0] || 'Protocol Athlete';

  const handleLogout = () => {
    Alert.alert(
      'Disconnect Protocol',
      'Are you sure you want to sign out of ALPHA OS on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Athlete Profile"
        subtitle="BIOMETRIC IDENTITY"
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={onNavigateToSettings}>
            <Text style={styles.settingsGlyph}>⚙️</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarGlyph}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email || 'athlete@alpha.os'}</Text>
          <View style={styles.tierPill}>
            <StatusBadge label="ALPHA ELITE MEMBER" status="success" />
          </View>
        </View>

        {/* Biometrics Summary */}
        <Text style={styles.sectionHeader}>BIOMETRIC BASELINE</Text>
        <View style={styles.bioGrid}>
          <View style={styles.bioCard}>
            <Text style={styles.bioKey}>GENDER</Text>
            <Text style={styles.bioVal}>MALE</Text>
          </View>
          <View style={styles.bioCard}>
            <Text style={styles.bioKey}>AGE</Text>
            <Text style={styles.bioVal}>26 yrs</Text>
          </View>
          <View style={styles.bioCard}>
            <Text style={styles.bioKey}>HEIGHT</Text>
            <Text style={styles.bioVal}>180 cm</Text>
          </View>
          <View style={styles.bioCard}>
            <Text style={styles.bioKey}>CURRENT MASS</Text>
            <Text style={styles.bioVal}>78.4 kg</Text>
          </View>
        </View>

        {/* Device Sync State */}
        <Text style={styles.sectionHeader}>TELEMETRY SENSORS</Text>
        <TouchableOpacity
          style={styles.sensorCard}
          onPress={onNavigateToIntegrations}
          activeOpacity={0.8}
        >
          <View style={styles.sensorLeft}>
            <Text style={styles.sensorIcon}>⌚</Text>
            <View>
              <Text style={styles.sensorTitle}>Wearable Health Connect</Text>
              <Text style={styles.sensorSub}>Apple Health & Garmin Synced</Text>
            </View>
          </View>
          <StatusBadge label="LIVE SYNC" status="success" />
        </TouchableOpacity>

        {/* Action Controls */}
        <View style={styles.actionGroup}>
          <SecondaryButton
            title="System Preferences & Units"
            onPress={onNavigateToSettings}
          />
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Disconnect Protocol (Sign Out)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 12,
    paddingBottom: 32,
    gap: 16,
  },
  settingsGlyph: {
    fontSize: 20,
  },
  identityCard: {
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 20,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 2,
    borderColor: Theme.colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarGlyph: {
    fontSize: 32,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
  },
  userName: {
    fontSize: 20,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  tierPill: {
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 4,
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bioCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
  },
  bioKey: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  bioVal: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sensorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
  },
  sensorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sensorIcon: {
    fontSize: 24,
  },
  sensorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  sensorSub: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  actionGroup: {
    marginTop: 8,
    gap: 12,
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
  },
  logoutText: {
    color: Theme.colors.crimsonError,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
