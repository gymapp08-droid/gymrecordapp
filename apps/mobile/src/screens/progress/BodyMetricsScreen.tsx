import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton } from '../../components';
import { Theme } from '../../theme/tokens';

interface MetricEntry {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercent?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
}

interface BodyMetricsScreenProps {
  onBack: () => void;
  onOpenLogModal?: () => void;
}

export const BodyMetricsScreen: React.FC<BodyMetricsScreenProps> = ({ onBack, onOpenLogModal }) => {
  const [entries] = useState<MetricEntry[]>([
    { id: '1', date: 'Today, 07:15 AM', weightKg: 78.4, bodyFatPercent: 13.8, waistCm: 81.0, chestCm: 104.5, armCm: 39.2 },
    { id: '2', date: 'Sep 14, 2026', weightKg: 78.9, bodyFatPercent: 14.1, waistCm: 81.5, chestCm: 104.0, armCm: 39.0 },
    { id: '3', date: 'Sep 07, 2026', weightKg: 79.2, bodyFatPercent: 14.4, waistCm: 82.0, chestCm: 103.8, armCm: 38.8 },
  ]);

  const latest = entries[0]!;

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Body Metrics"
        subtitle="ANTHROPOMETRIC TELEMETRY"
        onBack={onBack}
        rightAction={
          onOpenLogModal ? (
            <TouchableOpacity style={styles.addBtn} onPress={onOpenLogModal}>
              <Text style={styles.addBtnText}>+ LOG</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Latest Snapshot Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>CURRENT SCALE MASS</Text>
              <View style={styles.massRow}>
                <Text style={styles.massNumber}>{latest.weightKg}</Text>
                <Text style={styles.massUnit}>kg</Text>
              </View>
            </View>
            <View style={styles.fatBox}>
              <Text style={styles.fatVal}>{latest.bodyFatPercent}%</Text>
              <Text style={styles.fatLabel}>BODY FAT EST.</Text>
            </View>
          </View>
          <Text style={styles.heroDelta}>-0.8 kg over past 14 days · Recomposition Phase</Text>
        </View>

        {/* Circumference Grid */}
        <Text style={styles.sectionHeader}>CIRCUMFERENCES (CM)</Text>
        <View style={styles.circGrid}>
          <View style={styles.circCard}>
            <Text style={styles.circLabel}>CHEST</Text>
            <Text style={styles.circValue}>{latest.chestCm} <Text style={styles.circUnit}>cm</Text></Text>
          </View>
          <View style={styles.circCard}>
            <Text style={styles.circLabel}>WAIST</Text>
            <Text style={styles.circValue}>{latest.waistCm} <Text style={styles.circUnit}>cm</Text></Text>
          </View>
          <View style={styles.circCard}>
            <Text style={styles.circLabel}>BICEP</Text>
            <Text style={styles.circValue}>{latest.armCm} <Text style={styles.circUnit}>cm</Text></Text>
          </View>
        </View>

        {/* Historical Logs */}
        <Text style={styles.sectionHeader}>MEASUREMENT HISTORY</Text>
        <View style={styles.historyList}>
          {entries.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyCircs}>
                  Waist: {item.waistCm}cm · Chest: {item.chestCm}cm · Arm: {item.armCm}cm
                </Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyWeight}>{item.weightKg} kg</Text>
                <Text style={styles.historyFat}>{item.bodyFatPercent}% BF</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {onOpenLogModal && (
        <View style={styles.footer}>
          <PrimaryButton title="Log New Measurement" onPress={onOpenLogModal} />
        </View>
      )}
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 28,
    gap: 16,
  },
  addBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
  },
  addBtnText: {
    color: Theme.colors.cyanGlow,
    fontSize: 11,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  massRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  massNumber: {
    fontSize: 36,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  massUnit: {
    fontSize: 16,
    color: Theme.colors.cyanGlow,
    fontWeight: '700',
    marginLeft: 4,
  },
  fatBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  fatVal: {
    fontSize: 18,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
  },
  fatLabel: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  heroDelta: {
    fontSize: 12,
    color: Theme.colors.emeraldSuccess,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 4,
  },
  circGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  circCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
    alignItems: 'center',
  },
  circLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  circValue: {
    fontSize: 18,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  circUnit: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  historyCircs: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyWeight: {
    fontSize: 15,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.cyanGlow,
  },
  historyFat: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  footer: {
    paddingTop: 12,
  },
});
