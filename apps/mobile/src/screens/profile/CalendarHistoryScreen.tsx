import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton, SecondaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';

export type DayProtocolStatus =
  | 'WORKOUT_COMPLETED'
  | 'WORKOUT_PARTIAL'
  | 'WORKOUT_SKIPPED'
  | 'REST_DAY'
  | 'MISSED'
  | 'SICK'
  | 'TRAVEL'
  | 'TIME_CONSTRAINT'
  | 'OTHER';

export interface CalendarDayRecord {
  dayNumber: number;
  weekday: string;
  status: DayProtocolStatus;
  workoutTitle?: string;
  volumeKg?: number;
  setsCount?: number;
  repsCount?: number;
  durationMinutes?: number;
  cardioMinutes?: number;
  nutritionAdherence?: number;
  missedReason?: string;
}

interface CalendarHistoryScreenProps {
  onBack: () => void;
}

type TimeHorizon = '3M' | '6M' | '1Y' | 'ALL_TIME';

export const CalendarHistoryScreen: React.FC<CalendarHistoryScreenProps> = ({ onBack }) => {
  const [selectedHorizon, setSelectedHorizon] = useState<TimeHorizon>('1Y');
  const [selectedDay, setSelectedDay] = useState<number>(20);
  const [editingJournal, setEditingJournal] = useState<CalendarDayRecord | null>(null);
  const [journalReasonInput, setJournalReasonInput] = useState<string>('');
  const [journalStatusInput, setJournalStatusInput] = useState<DayProtocolStatus>('MISSED');

  // 30 Days of September 2026 data
  const [days, setDays] = useState<CalendarDayRecord[]>(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i % 7]!;

      if (day === 18) {
        return {
          dayNumber: day,
          weekday,
          status: 'MISSED',
          workoutTitle: 'Pull Hypertrophy & Deadlifts',
          missedReason: 'Work project release deadline ran past midnight. Insufficient sleep.',
        };
      }

      if (day === 12) {
        return {
          dayNumber: day,
          weekday,
          status: 'WORKOUT_PARTIAL',
          workoutTitle: 'Leg Day & Calves',
          volumeKg: 5200,
          setsCount: 10,
          repsCount: 105,
          durationMinutes: 38,
          missedReason: 'Mild patellar discomfort during squats; cut leg press and calf work short.',
        };
      }

      const isRest = day % 4 === 0;
      if (isRest) {
        return {
          dayNumber: day,
          weekday,
          status: 'REST_DAY',
          workoutTitle: 'Active Recovery & Mobility',
          nutritionAdherence: 95,
        };
      }

      if (day <= 20) {
        return {
          dayNumber: day,
          weekday,
          status: 'WORKOUT_COMPLETED',
          workoutTitle: day % 2 === 0 ? 'Push Hypertrophy' : 'Pull & Posterior Chain',
          volumeKg: 8450 + (day * 40),
          setsCount: 18,
          repsCount: 190,
          durationMinutes: 56,
          cardioMinutes: day % 3 === 0 ? 25 : 0,
          nutritionAdherence: 92,
        };
      }

      // Future days
      return {
        dayNumber: day,
        weekday,
        status: isRest ? 'REST_DAY' : 'WORKOUT_COMPLETED',
        workoutTitle: 'Scheduled Protocol',
      };
    });
  });

  const selectedData = days.find((d) => d.dayNumber === selectedDay) || days[0]!;

  const openJournalModal = (record: CalendarDayRecord) => {
    setEditingJournal(record);
    setJournalStatusInput(record.status);
    setJournalReasonInput(record.missedReason || '');
  };

  const saveJournalEntry = () => {
    if (!editingJournal) return;
    setDays((prev) =>
      prev.map((d) =>
        d.dayNumber === editingJournal.dayNumber
          ? {
              ...d,
              status: journalStatusInput,
              missedReason: journalReasonInput,
            }
          : d
      )
    );
    setEditingJournal(null);
  };

  // Horizon aggregates
  const horizonStats = {
    '3M': { workouts: 62, missed: 4, rest: 24, volume: '486,000 kg', sets: 1116, prs: 14, adherence: '94%' },
    '6M': { workouts: 118, missed: 7, rest: 45, volume: '942,000 kg', sets: 2124, prs: 26, adherence: '93%' },
    '1Y': { workouts: 224, missed: 12, rest: 88, volume: '1,780,000 kg', sets: 4032, prs: 48, adherence: '92%' },
    'ALL_TIME': { workouts: 340, missed: 18, rest: 130, volume: '2,650,000 kg', sets: 6120, prs: 67, adherence: '92%' },
  }[selectedHorizon];

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Performance History"
        subtitle="SEPTEMBER 2026 · AUDIT & TIMELINE"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Horizon Tabs ("One Year of My Life") */}
        <View style={styles.horizonTabs}>
          {(['3M', '6M', '1Y', 'ALL_TIME'] as TimeHorizon[]).map((horiz) => (
            <TouchableOpacity
              key={horiz}
              style={[
                styles.horizTab,
                selectedHorizon === horiz && styles.horizTabActive,
              ]}
              onPress={() => setSelectedHorizon(horiz)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.horizTabText,
                  selectedHorizon === horiz && styles.horizTabTextActive,
                ]}
              >
                {horiz === 'ALL_TIME' ? 'ALL TIME' : horiz}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Aggregate Long-Term Stats ("One Year of My Life") */}
        <View style={styles.aggregateCard}>
          <View style={styles.aggregateHeader}>
            <Text style={styles.sectionLabel}>LIFETIME PROTOCOL AUDIT ({selectedHorizon})</Text>
            <StatusBadge label="DISCIPLINE RATIO: 95%" status="success" />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLab}>WORKOUTS COMPLETED</Text>
              <Text style={styles.statVal}>{horizonStats.workouts}</Text>
              <Text style={styles.statSub}>Sessions</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLab}>TOTAL VOLUME</Text>
              <Text style={styles.statVal}>{horizonStats.volume}</Text>
              <Text style={styles.statSub}>Tonnage Lifted</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLab}>SETS LOGGED</Text>
              <Text style={styles.statVal}>{horizonStats.sets}</Text>
              <Text style={styles.statSub}>Working Sets</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLab}>PRs BROKEN</Text>
              <Text style={styles.statVal}>{horizonStats.prs}</Text>
              <Text style={styles.statSub}>Records</Text>
            </View>
          </View>

          {/* Days Balance */}
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceNum}>{horizonStats.workouts}</Text>
              <Text style={styles.balanceLab}>Trained Days</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceNum}>{horizonStats.rest}</Text>
              <Text style={styles.balanceLab}>Rest Days</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceNum, { color: Theme.colors.crimsonError }]}>{horizonStats.missed}</Text>
              <Text style={styles.balanceLab}>Missed Days</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceNum, { color: Theme.colors.cyanGlow }]}>{horizonStats.adherence}</Text>
              <Text style={styles.balanceLab}>Adherence</Text>
            </View>
          </View>
        </View>

        {/* Heatmap & Calendar Matrix */}
        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <Text style={styles.sectionLabel}>SEPTEMBER 2026 CALENDAR HEATMAP</Text>
            <Text style={styles.calLegend}>Tap day to inspect/journal</Text>
          </View>

          <View style={styles.grid}>
            {days.map((item) => {
              const isSelected = selectedDay === item.dayNumber;
              const isCompleted = item.status === 'WORKOUT_COMPLETED';
              const isPartial = item.status === 'WORKOUT_PARTIAL';
              const isMissed = item.status === 'MISSED' || item.status === 'SICK' || item.status === 'WORKOUT_SKIPPED';
              const isRest = item.status === 'REST_DAY';

              return (
                <TouchableOpacity
                  key={item.dayNumber}
                  style={[
                    styles.dayBox,
                    isSelected && styles.dayBoxSelected,
                    isCompleted && styles.dayBoxCompleted,
                    isPartial && styles.dayBoxPartial,
                    isMissed && styles.dayBoxMissed,
                    isRest && styles.dayBoxRest,
                  ]}
                  onPress={() => setSelectedDay(item.dayNumber)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isSelected && styles.dayNumSelected,
                      isCompleted && { color: Theme.colors.textPrimary },
                      isMissed && { color: Theme.colors.crimsonError },
                    ]}
                  >
                    {item.dayNumber}
                  </Text>
                  <View style={styles.dotRow}>
                    {isCompleted && <View style={styles.completedDot} />}
                    {isPartial && <View style={styles.partialDot} />}
                    {isMissed && <View style={styles.missedDot} />}
                    {isRest && <View style={styles.restDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.completedDot} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.partialDot} />
              <Text style={styles.legendText}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.missedDot} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.restDot} />
              <Text style={styles.legendText}>Rest</Text>
            </View>
          </View>
        </View>

        {/* Selected Date Detailed Record & Missed Day Journaling */}
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <View>
              <Text style={styles.detailDate}>SEPTEMBER {selectedData.dayNumber}, 2026 · {selectedData.weekday.toUpperCase()}</Text>
              <Text style={styles.detailTitle}>{selectedData.workoutTitle || 'Scheduled Rest'}</Text>
            </View>
            <StatusBadge
              label={selectedData.status.replace('_', ' ')}
              status={
                selectedData.status === 'WORKOUT_COMPLETED'
                  ? 'success'
                  : selectedData.status === 'MISSED' || selectedData.status === 'WORKOUT_SKIPPED'
                  ? 'error'
                  : selectedData.status === 'WORKOUT_PARTIAL'
                  ? 'warning'
                  : 'neutral'
              }
            />
          </View>

          {/* Telemetry rows */}
          {selectedData.volumeKg && (
            <View style={styles.metricGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLab}>VOLUME LIFTED</Text>
                <Text style={styles.metricNum}>{selectedData.volumeKg.toLocaleString()} kg</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLab}>SETS RECORDED</Text>
                <Text style={styles.metricNum}>{selectedData.setsCount} sets</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLab}>DURATION</Text>
                <Text style={styles.metricNum}>{selectedData.durationMinutes} min</Text>
              </View>
            </View>
          )}

          {/* Missed Day Reason Journal Section */}
          <View style={styles.journalBlock}>
            <View style={styles.journalHeader}>
              <Text style={styles.journalTitle}>SESSION JOURNAL & AUDIT WHY?</Text>
              <TouchableOpacity
                style={styles.editJournalBtn}
                onPress={() => openJournalModal(selectedData)}
                activeOpacity={0.7}
              >
                <Text style={styles.editJournalText}>Edit Status / Note ✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.journalReasonText}>
              {selectedData.missedReason
                ? `"${selectedData.missedReason}"`
                : 'Session completed according to scheduled progressive overload parameters. No negative variances recorded.'}
            </Text>
          </View>
        </View>

        {/* My Performance Journey Milestones (Section 27) */}
        <View style={styles.milestonesCard}>
          <Text style={styles.sectionLabel}>MY PERFORMANCE JOURNEY · BADGES</Text>
          <View style={styles.milestoneList}>
            <View style={styles.milestoneItem}>
              <Text style={styles.badgeGlyph}>🎖️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTitle}>FIRST PROTOCOL LAUNCH</Text>
                <Text style={styles.badgeDesc}>Completed initial benchmark session with zero omissions</Text>
              </View>
              <StatusBadge label="EARNED" status="success" />
            </View>

            <View style={styles.milestoneItem}>
              <Text style={styles.badgeGlyph}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTitle}>TRIPLE DIGIT BENCH CLUB</Text>
                <Text style={styles.badgeDesc}>Logged 100.0 kg Barbell Bench Press for verified reps</Text>
              </View>
              <StatusBadge label="EARNED" status="success" />
            </View>

            <View style={styles.milestoneItem}>
              <Text style={styles.badgeGlyph}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTitle}>100 WORKOUTS CONSISTENCY</Text>
                <Text style={styles.badgeDesc}>Maintained 92% discipline ratio over 100 logged sessions</Text>
              </View>
              <StatusBadge label="EARNED" status="success" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Missed Day Journal Modal */}
      <Modal visible={editingJournal !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>LOG JOURNAL & VARIANCE REASON</Text>
            <Text style={styles.modalSubtitle}>
              September {editingJournal?.dayNumber}, 2026 Protocol
            </Text>

            <Text style={styles.inputLabel}>SELECT SESSION STATUS:</Text>
            <View style={styles.statusButtonsGrid}>
              {(
                [
                  'WORKOUT_COMPLETED',
                  'WORKOUT_PARTIAL',
                  'WORKOUT_SKIPPED',
                  'REST_DAY',
                  'MISSED',
                  'SICK',
                  'TRAVEL',
                  'TIME_CONSTRAINT',
                ] as DayProtocolStatus[]
              ).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChoiceBtn,
                    journalStatusInput === st && styles.statusChoiceActive,
                  ]}
                  onPress={() => setJournalStatusInput(st)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusChoiceText,
                      journalStatusInput === st && styles.statusChoiceTextActive,
                    ]}
                  >
                    {st.replace('WORKOUT_', '').replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>WHY WAS THIS DAY MISSED OR MODIFIED?</Text>
            <TextInput
              style={styles.journalTextInput}
              multiline
              numberOfLines={3}
              placeholder="E.g., Travel delay, high fatigue, work emergency, slight joint soreness..."
              placeholderTextColor={Theme.colors.textMuted}
              value={journalReasonInput}
              onChangeText={setJournalReasonInput}
            />

            <View style={styles.modalActionsRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setEditingJournal(null)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Save Record"
                onPress={saveJournalEntry}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 10,
    paddingBottom: 32,
    gap: 16,
  },
  horizonTabs: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  horizTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  horizTabActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  horizTabText: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  horizTabTextActive: {
    color: Theme.colors.cyanGlow,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  aggregateCard: {
    backgroundColor: '#0A0E17',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    gap: 14,
  },
  aggregateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 2,
  },
  statLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 18,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
  },
  statSub: {
    fontSize: 9,
    color: Theme.colors.textMuted,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  balanceCol: {
    alignItems: 'center',
    gap: 2,
  },
  balanceNum: {
    fontSize: 14,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  balanceLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calLegend: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayBox: {
    width: '13%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayBoxSelected: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  dayBoxCompleted: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  dayBoxPartial: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  dayBoxMissed: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  dayBoxRest: {
    opacity: 0.5,
  },
  dayNum: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textMuted,
  },
  dayNumSelected: {
    color: Theme.colors.cyanGlow,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  completedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.cyanGlow,
  },
  partialDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  missedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  restDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
  },
  detailCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  detailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailDate: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.sm,
    padding: 8,
    gap: 2,
  },
  metricLab: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  metricNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  journalBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalTitle: {
    fontSize: 8,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  editJournalBtn: {
    paddingVertical: 2,
  },
  editJournalText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    fontWeight: '800',
  },
  journalReasonText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  milestonesCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  milestoneList: {
    gap: 10,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  badgeGlyph: {
    fontSize: 20,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  badgeDesc: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0D1118',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cyanGlow,
    padding: 18,
    gap: 10,
  },
  modalTitle: {
    fontSize: 14,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '900',
    color: Theme.colors.cyanGlow,
    letterSpacing: 0.8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  inputLabel: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statusButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChoiceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusChoiceActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: Theme.colors.cyanGlow,
  },
  statusChoiceText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    fontWeight: '800',
  },
  statusChoiceTextActive: {
    color: Theme.colors.cyanGlow,
  },
  journalTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 10,
    color: Theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
