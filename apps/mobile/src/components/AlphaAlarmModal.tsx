import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration,
  Animated,
} from 'react-native';
import { Theme } from '../theme/tokens';

export type AlarmType = 'WORKOUT' | 'MEAL_1' | 'MEAL_2' | 'MEAL_3' | 'MEAL_4' | 'MEAL_5';

interface AlphaAlarmModalProps {
  visible: boolean;
  alarmType: AlarmType;
  scheduledTime?: string;
  onDismiss: () => void;
  onStartWorkout?: () => void;
  onLogMeal?: (mealType: string) => void;
  onSnooze?: (minutes: number) => void;
}

export const AlphaAlarmModal: React.FC<AlphaAlarmModalProps> = ({
  visible,
  alarmType,
  scheduledTime,
  onDismiss,
  onStartWorkout,
  onLogMeal,
  onSnooze,
}) => {
  const [countdown, setCountdown] = useState<number>(10);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!visible) return;

    // Reset countdown
    setCountdown(10);

    // Haptic / Vibration rhythm for 10 seconds
    try {
      Vibration.vibrate([0, 400, 200, 400, 200, 400], false);
    } catch {}

    // Pulsing visual alarm loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 10-second countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-silence alarm sound/vibration after 10s, but keep modal or auto dismiss
          try {
            Vibration.cancel();
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      pulseLoop.stop();
      try {
        Vibration.cancel();
      } catch {}
    };
  }, [visible]);

  const handleStopAlarm = () => {
    try {
      Vibration.cancel();
    } catch {}
    onDismiss();
  };

  const getAlarmContent = () => {
    switch (alarmType) {
      case 'WORKOUT':
        return {
          badge: 'GYM PROTOCOL TIME · WORKOUT ALARM',
          badgeColor: '#00F0FF',
          icon: '⚡',
          title: 'Time for Gym!',
          subtitle:
            'Your scheduled resistance training session is ready. High performance requires consistency.',
          targetTime: scheduledTime || '06:00 AM',
          actionText: 'START WORKOUT NOW →',
          actionColor: Theme.colors.cyanGlow,
          isWorkout: true,
        };
      case 'MEAL_1':
        return {
          badge: 'NUTRITION ALARM · MEAL 1 (BREAKFAST)',
          badgeColor: '#10B981',
          icon: '🍳',
          title: 'Meal 1 Ready: Breakfast Fuel',
          subtitle:
            'Calibrate your metabolic rate with high biological value protein and clean micronutrients.',
          targetTime: scheduledTime || '08:00 AM',
          actionText: 'LOG MEAL 1 NOW',
          actionColor: '#10B981',
          mealKey: 'BREAKFAST',
          isWorkout: false,
        };
      case 'MEAL_2':
        return {
          badge: 'NUTRITION ALARM · MEAL 2 (PRE-WORKOUT)',
          badgeColor: '#F59E0B',
          icon: '⚡',
          title: 'Meal 2 Ready: Pre-Workout Fuel',
          subtitle:
            'Glycogen saturation and electrolyte hydration window. Consume 60–90 min prior to lifting.',
          targetTime: scheduledTime || '11:00 AM',
          actionText: 'LOG MEAL 2 NOW',
          actionColor: '#F59E0B',
          mealKey: 'PRE_WORKOUT',
          isWorkout: false,
        };
      case 'MEAL_3':
        return {
          badge: 'NUTRITION ALARM · MEAL 3 (LUNCH)',
          badgeColor: '#10B981',
          icon: '🥗',
          title: 'Meal 3 Ready: Lunch Time',
          subtitle:
            'Anabolic protein synthesis trigger. Hit your prescribed macro targets for lean mass accrual.',
          targetTime: scheduledTime || '02:00 PM',
          actionText: 'LOG MEAL 3 NOW',
          actionColor: '#10B981',
          mealKey: 'LUNCH',
          isWorkout: false,
        };
      case 'MEAL_4':
        return {
          badge: 'NUTRITION ALARM · MEAL 4 (RECOVERY SNACK)',
          badgeColor: '#8B5CF6',
          icon: '🥤',
          title: 'Meal 4 Ready: Post-Workout Recovery',
          subtitle:
            'Rapid amino acid replenishment and cellular rehydration for muscle fiber regeneration.',
          targetTime: scheduledTime || '05:00 PM',
          actionText: 'LOG MEAL 4 NOW',
          actionColor: '#8B5CF6',
          mealKey: 'SNACK',
          isWorkout: false,
        };
      case 'MEAL_5':
      default:
        return {
          badge: 'NUTRITION ALARM · MEAL 5 (DINNER & SLEEP)',
          badgeColor: '#38BDF8',
          icon: '🥩',
          title: 'Meal 5 Ready: Dinner & Night Repair',
          subtitle:
            'Slow-digesting protein and healthy lipids for prolonged overnight tissue restoration.',
          targetTime: scheduledTime || '08:00 PM',
          actionText: 'LOG MEAL 5 NOW',
          actionColor: '#38BDF8',
          mealKey: 'DINNER',
          isWorkout: false,
        };
    }
  };

  const content = getAlarmContent();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleStopAlarm}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={handleStopAlarm}
            accessibilityLabel="Close alarm"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Alarm Status Badge */}
          <View style={[styles.badge, { borderColor: content.badgeColor }]}>
            <View style={[styles.badgeDot, { backgroundColor: content.badgeColor }]} />
            <Text style={[styles.badgeText, { color: content.badgeColor }]}>
              {content.badge}
            </Text>
          </View>

          {/* Pulsing Visual Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.alarmEmoji}>{content.icon}</Text>
          </Animated.View>

          {/* Title & Time */}
          <Text style={styles.title}>{content.title}</Text>
          <View style={styles.timePill}>
            <Text style={styles.timePillLabel}>SCHEDULED TIME</Text>
            <Text style={styles.timePillVal}>{content.targetTime}</Text>
          </View>

          <Text style={styles.subtitle}>{content.subtitle}</Text>

          {/* Live 10s Alarm Sound / Vibration Indicator */}
          <View style={styles.timerBarBox}>
            <View style={styles.timerRow}>
              <Text style={styles.timerStatus}>
                {countdown > 0 ? '🔔 ALARM SOUNDING...' : '✓ ALARM SILENCED'}
              </Text>
              <Text style={styles.timerSeconds}>{countdown > 0 ? `${countdown}s` : '0s'}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(countdown / 10) * 100}%` }]} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionCol}>
            {content.isWorkout ? (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: Theme.colors.cyanGlow }]}
                activeOpacity={0.8}
                onPress={() => {
                  handleStopAlarm();
                  if (onStartWorkout) onStartWorkout();
                }}
              >
                <Text style={styles.primaryActionText}>{content.actionText}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: content.actionColor }]}
                activeOpacity={0.8}
                onPress={() => {
                  handleStopAlarm();
                  if (onLogMeal && (content as any).mealKey) {
                    onLogMeal((content as any).mealKey);
                  }
                }}
              >
                <Text style={styles.primaryActionText}>{content.actionText}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.subActionRow}>
              <TouchableOpacity
                style={styles.stopAlarmBtn}
                activeOpacity={0.7}
                onPress={handleStopAlarm}
              >
                <Text style={styles.stopAlarmText}>Stop Alarm / Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.snoozeBtn}
                activeOpacity={0.7}
                onPress={() => {
                  handleStopAlarm();
                  if (onSnooze) onSnooze(10);
                }}
              >
                <Text style={styles.snoozeText}>Snooze 10m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 11, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 20,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  alarmEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.pill,
    marginBottom: 12,
  },
  timePillLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  timePillVal: {
    fontSize: 12,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  timerBarBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timerStatus: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
  },
  timerSeconds: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Theme.colors.cyanGlow,
  },
  actionCol: {
    width: '100%',
    gap: 10,
  },
  primaryActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#05070B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subActionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  stopAlarmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopAlarmText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  snoozeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
});
