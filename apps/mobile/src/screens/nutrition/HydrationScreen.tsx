import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

interface HydrationScreenProps {
  onBack: () => void;
}

interface IntakeLog {
  id: string;
  time: string;
  amountMl: number;
}

export const HydrationScreen: React.FC<HydrationScreenProps> = ({ onBack }) => {
  const [targetMl] = useState(3500);
  const [consumedMl, setConsumedMl] = useState(2500);
  const [logs, setLogs] = useState<IntakeLog[]>([
    { id: '1', time: '07:30 AM', amountMl: 500 },
    { id: '2', time: '10:15 AM', amountMl: 500 },
    { id: '3', time: '01:00 PM', amountMl: 750 },
    { id: '4', time: '03:45 PM', amountMl: 750 },
  ]);

  const addWater = (ml: number) => {
    setConsumedMl((prev) => prev + ml);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setLogs((prev) => [{ id: Date.now().toString(), time: timeStr, amountMl: ml }, ...prev]);
  };

  const percent = Math.min(Math.round((consumedMl / targetMl) * 100), 100);
  const remainingMl = Math.max(targetMl - consumedMl, 0);

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Hydration OS"
        subtitle="CELLULAR FLUID TELEMETRY"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Visual Level HUD */}
        <View style={styles.hydrationHUD}>
          <View style={styles.flaskVisual}>
            <View style={[styles.flaskFill, { height: `${percent}%` }]} />
            <View style={styles.flaskOverlay}>
              <Text style={styles.percentText}>{percent}%</Text>
              <Text style={styles.percentSub}>OF TARGET</Text>
            </View>
          </View>

          <View style={styles.hudData}>
            <Text style={styles.hudLabel}>TOTAL INTAKE</Text>
            <Text style={styles.consumedNumber}>
              {(consumedMl / 1000).toFixed(2)} <Text style={styles.unitText}>L</Text>
            </Text>
            <Text style={styles.targetInfo}>Target: {(targetMl / 1000).toFixed(1)} L</Text>
            <View style={styles.badgeWrap}>
              <StatusBadge
                label={remainingMl === 0 ? 'TARGET MET' : `${remainingMl} ml left`}
                status={remainingMl === 0 ? 'success' : 'neutral'}
              />
            </View>
          </View>
        </View>

        {/* Quick Add Presets */}
        <Text style={styles.sectionHeader}>QUICK LOG INTAKE</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => addWater(250)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickIcon}>🥛</Text>
            <Text style={styles.quickAmount}>+250 ml</Text>
            <Text style={styles.quickLabel}>Glass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => addWater(500)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickIcon}>🥤</Text>
            <Text style={styles.quickAmount}>+500 ml</Text>
            <Text style={styles.quickLabel}>Shaker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => addWater(750)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickIcon}>🍶</Text>
            <Text style={styles.quickAmount}>+750 ml</Text>
            <Text style={styles.quickLabel}>Bottle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => addWater(1000)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickIcon}>🚰</Text>
            <Text style={styles.quickAmount}>+1.0 L</Text>
            <Text style={styles.quickLabel}>Flask</Text>
          </TouchableOpacity>
        </View>

        {/* Intake History */}
        <Text style={styles.sectionHeader}>TODAY'S INTAKE LOG</Text>
        <View style={styles.logsList}>
          {logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logLeft}>
                <Text style={styles.waterDrop}>💧</Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>
              <Text style={styles.logAmount}>+{log.amountMl} ml</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 28,
    gap: 16,
  },
  hydrationHUD: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 16,
    gap: 20,
  },
  flaskVisual: {
    width: 80,
    height: 120,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  flaskFill: {
    width: '100%',
    backgroundColor: '#00F0FF',
    opacity: 0.85,
  },
  flaskOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 18,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowRadius: 4,
  },
  percentSub: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hudData: {
    flex: 1,
  },
  hudLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  consumedNumber: {
    fontSize: 32,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  unitText: {
    fontSize: 16,
    color: Theme.colors.cyanGlow,
    fontWeight: '600',
  },
  targetInfo: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  badgeWrap: {
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
  },
  quickLabel: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  logsList: {
    gap: 8,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waterDrop: {
    fontSize: 14,
  },
  logTime: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  logAmount: {
    fontSize: 13,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
});
