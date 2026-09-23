import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlphaScreen, PrimaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

interface ActiveCardioScreenProps {
  modality?: string;
  onFinishCardio: (stats: {
    durationSeconds: number;
    distanceKm: number;
    avgPace: string;
    calories: number;
    avgHr: number;
  }) => void;
  onCancel: () => void;
}

export const ActiveCardioScreen: React.FC<ActiveCardioScreenProps> = ({
  modality = 'OUTDOOR_RUN',
  onFinishCardio,
  onCancel,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [distanceKm, setDistanceKm] = useState(0.0);
  const [heartRate] = useState(144);
  const [calories, setCalories] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
        setDistanceKm((prev) => +(prev + 0.003).toFixed(3));
        setCalories((prev) => prev + 0.2);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getPaceString = () => {
    if (distanceKm === 0) return '0:00';
    const paceMinutes = seconds / 60 / distanceKm;
    const paceM = Math.floor(paceMinutes);
    const paceS = Math.floor((paceMinutes - paceM) * 60);
    return `${paceM}:${paceS < 10 ? '0' : ''}${paceS} /km`;
  };

  const handleFinish = () => {
    onFinishCardio({
      durationSeconds: seconds,
      distanceKm: +distanceKm.toFixed(2),
      avgPace: getPaceString(),
      calories: Math.round(calories),
      avgHr: heartRate,
    });
  };

  return (
    <AlphaScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTag}>{modality} PROTOCOL</Text>
          <StatusBadge label={isRunning ? 'LIVE RECORDING' : 'PAUSED'} status={isRunning ? 'success' : 'neutral'} />
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        {/* Large Timer Display */}
        <View style={styles.timerBlock}>
          <Text style={styles.timerLabel}>ELAPSED DURATION</Text>
          <Text style={styles.timerDigits}>{formatTimer(seconds)}</Text>
        </View>

        {/* Primary Distance Readout */}
        <View style={styles.distanceBlock}>
          <Text style={styles.distanceValue}>{distanceKm.toFixed(2)}</Text>
          <Text style={styles.distanceUnit}>KILOMETERS</Text>
        </View>

        {/* Secondary Telemetry Grid */}
        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryCard}>
            <Text style={styles.telemetryKey}>PACE</Text>
            <Text style={styles.telemetryVal}>{getPaceString()}</Text>
          </View>

          <View style={styles.telemetryCard}>
            <Text style={styles.telemetryKey}>HEART RATE</Text>
            <Text style={[styles.telemetryVal, { color: '#EF4444' }]}>
              {heartRate} <Text style={styles.bpmUnit}>bpm</Text>
            </Text>
            <Text style={styles.zoneText}>ZONE 2 AEROBIC</Text>
          </View>

          <View style={styles.telemetryCard}>
            <Text style={styles.telemetryKey}>EST. BURN</Text>
            <Text style={[styles.telemetryVal, { color: '#F59E0B' }]}>
              {Math.round(calories)} <Text style={styles.bpmUnit}>kcal</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.footer}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.pauseBtn, isRunning && styles.pauseBtnActive]}
            onPress={() => setIsRunning((prev) => !prev)}
          >
            <Text style={styles.pauseBtnText}>{isRunning ? 'PAUSE' : 'RESUME'}</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Complete Session"
            onPress={handleFinish}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  headerTag: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  timerBlock: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  timerDigits: {
    fontSize: 48,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: 2,
  },
  distanceBlock: {
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 72,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
    lineHeight: 76,
  },
  distanceUnit: {
    fontSize: 12,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 4,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingHorizontal: 8,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
    alignItems: 'center',
  },
  telemetryKey: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  telemetryVal: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  bpmUnit: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  zoneText: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#EF4444',
    marginTop: 2,
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 24,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  pauseBtnActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  pauseBtnText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
