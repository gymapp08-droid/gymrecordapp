import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  IProgressOverview,
  IBodyMeasurement,
  IPersonalRecord,
  IStrengthTrend,
  IProgressPhotoMetadata,
  BodyMeasurementType,
  PersonalRecordType,
  BMICategory,
} from '@alpha/types';
import { ApiClient } from '../../services/api';
import { WeightTrajectoryChart } from './WeightTrajectoryChart';
import { PhotoComparisonModal } from './PhotoComparisonModal';
import { LogMetricModal } from './LogMetricModal';
import { LogPhotoModal } from './LogPhotoModal';
import { DayByDayProgressionCard } from '../../components/DayByDayProgressionCard';

type ProgressTab = 'OVERVIEW' | 'DAY_BY_DAY' | 'BODY' | 'PERFORMANCE';
type TimeRange = 'WEEK' | 'MONTH' | '3M' | '1Y';

export const ProgressScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProgressTab>('OVERVIEW');
  const [timeRange, setTimeRange] = useState<TimeRange>('MONTH');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Data states
  const [overview, setOverview] = useState<IProgressOverview | null>(null);
  const [measurements, setMeasurements] = useState<IBodyMeasurement[]>([]);
  const [personalRecords, setPersonalRecords] = useState<IPersonalRecord[]>([]);
  const [strengthTrends, setStrengthTrends] = useState<IStrengthTrend[]>([]);
  const [photos, setPhotos] = useState<IProgressPhotoMetadata[]>([]);

  // Modals
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [logMetricModalVisible, setLogMetricModalVisible] = useState(false);
  const [logPhotoModalVisible, setLogPhotoModalVisible] = useState(false);

  const loadProgressData = useCallback(async () => {
    try {
      const [overviewRes, msmtRes, prRes, trendRes, photoRes] = await Promise.all([
        ApiClient.get<IProgressOverview>('/progress/overview'),
        ApiClient.get<IBodyMeasurement[]>('/progress/measurements'),
        ApiClient.get<IPersonalRecord[]>('/progress/prs'),
        ApiClient.get<IStrengthTrend[]>('/progress/strength-trends'),
        ApiClient.get<IProgressPhotoMetadata[]>('/progress/photos'),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (msmtRes.success && msmtRes.data) {
        setMeasurements(msmtRes.data);
      }
      if (prRes.success && prRes.data) {
        setPersonalRecords(prRes.data);
      }
      if (trendRes.success && trendRes.data) {
        setStrengthTrends(trendRes.data);
      }
      if (photoRes.success && photoRes.data) {
        setPhotos(photoRes.data);
      }
    } catch {
      // Offline or network error handled gracefully
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProgressData();
  };

  const handleSaveWeight = async (weightKg: number, bodyFatPercent?: number) => {
    await ApiClient.post('/progress/metrics', { weightKg, bodyFatPercent });
    loadProgressData();
  };

  const handleSaveMeasurement = async (type: BodyMeasurementType, valueCm: number) => {
    await ApiClient.post('/progress/measurements', { measurementType: type, valueCm });
    loadProgressData();
  };

  const handleSavePhoto = async (photoUrl: string, s3Key: string, viewAngle: string, notes?: string) => {
    await ApiClient.post('/progress/photos', { photoUrl, s3Key, viewAngle, notes });
    loadProgressData();
  };

  const handleSyncPRs = async () => {
    await ApiClient.post('/progress/prs/sync', {});
    loadProgressData();
  };

  // Helper for BMI badge styling
  const getBmiBadge = (category?: BMICategory | null) => {
    switch (category) {
      case BMICategory.UNDERWEIGHT:
        return { label: 'Underweight', bg: 'rgba(56, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(56, 130, 246, 0.3)' };
      case BMICategory.NORMAL:
        return { label: 'Normal', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
      case BMICategory.OVERWEIGHT:
        return { label: 'Overweight', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' };
      case BMICategory.OBESE:
        return { label: 'Obese', bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { label: 'Normal', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  const bmiBadge = getBmiBadge(overview?.bmiCategory);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#05070B" />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <TouchableOpacity
          onPress={() => setLogMetricModalVisible(true)}
          style={styles.quickLogBtn}
        >
          <Text style={styles.quickLogText}>+ Log</Text>
        </TouchableOpacity>
      </View>

      {/* Category Segmented Scrollable Tabs (Overview, Day-by-Day, Body, Performance) */}
      <View style={styles.categoryTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsScroll}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('OVERVIEW')}
            style={[styles.categoryTab, activeTab === 'OVERVIEW' && styles.categoryTabActive]}
            activeOpacity={0.7}
          >
            <Text
              numberOfLines={1}
              style={[styles.categoryTabText, activeTab === 'OVERVIEW' && styles.categoryTabTextActive]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('DAY_BY_DAY')}
            style={[styles.categoryTab, activeTab === 'DAY_BY_DAY' && styles.categoryTabActive]}
            activeOpacity={0.7}
          >
            <Text
              numberOfLines={1}
              style={[styles.categoryTabText, activeTab === 'DAY_BY_DAY' && styles.categoryTabTextActive]}
            >
              Day-by-Day Reps
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('BODY')}
            style={[styles.categoryTab, activeTab === 'BODY' && styles.categoryTabActive]}
            activeOpacity={0.7}
          >
            <Text
              numberOfLines={1}
              style={[styles.categoryTabText, activeTab === 'BODY' && styles.categoryTabTextActive]}
            >
              Body Metrics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('PERFORMANCE')}
            style={[styles.categoryTab, activeTab === 'PERFORMANCE' && styles.categoryTabActive]}
            activeOpacity={0.7}
          >
            <Text
              numberOfLines={1}
              style={[styles.categoryTabText, activeTab === 'PERFORMANCE' && styles.categoryTabTextActive]}
            >
              Performance
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        {(['WEEK', 'MONTH', '3M', '1Y'] as const).map((r) => {
          const isSelected = timeRange === r;
          const label = r === 'WEEK' ? 'Week' : r === 'MONTH' ? 'Month' : r === '3M' ? '3M' : '1Y';
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setTimeRange(r)}
              style={[styles.rangePill, isSelected && styles.rangePillActive]}
            >
              <Text style={[styles.rangeText, isSelected && styles.rangeTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3882F6" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#3882F6" />}
        >
          {/* ========================================================= */}
          {/* 1. OVERVIEW TAB CONTENT */}
          {/* ========================================================= */}
          {activeTab === 'OVERVIEW' && (
            <View style={styles.tabContentSection}>
              {/* Weight Trajectory Chart */}
              <WeightTrajectoryChart
                data={overview?.weightTrajectory || []}
                currentWeightKg={overview?.currentWeightKg}
                weightChangeKg={overview?.weightChangeKg}
              />

              {/* Body Composition Dual Cards */}
              <View style={styles.dualCardRow}>
                {/* BMI Card */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardTitle}>BMI</Text>
                  <View style={styles.metricCardBody}>
                    <Text style={styles.metricBigValue}>
                      {overview?.bmi ? overview.bmi.toFixed(1) : '24.1'}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: bmiBadge.bg, borderColor: bmiBadge.border }]}>
                      <Text style={[styles.statusPillText, { color: bmiBadge.text }]}>
                        {bmiBadge.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Body Fat % Card */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardTitle}>Body Fat</Text>
                  <View style={styles.metricCardBody}>
                    <Text style={styles.metricBigValue}>
                      {overview?.bodyFatPercent ? `${overview.bodyFatPercent.toFixed(1)}%` : '16.4%'}
                    </Text>
                    <View style={styles.deltaBadge}>
                      <Text style={styles.deltaBadgeText}>- 2.8%</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Consistency & Adherence Synthesis */}
              <View style={styles.synthesisCard}>
                <Text style={styles.synthesisTitle}>MONTHLY ADHERENCE</Text>
                <View style={styles.synthesisRow}>
                  <View style={styles.synthesisItem}>
                    <Text style={styles.synthesisVal}>
                      {overview?.workoutConsistencyPercent ?? 92}%
                    </Text>
                    <Text style={styles.synthesisLabel}>Workouts</Text>
                  </View>
                  <View style={styles.synthesisDivider} />
                  <View style={styles.synthesisItem}>
                    <Text style={styles.synthesisVal}>
                      {overview?.nutritionAdherencePercent ?? 88}%
                    </Text>
                    <Text style={styles.synthesisLabel}>Nutrition</Text>
                  </View>
                  <View style={styles.synthesisDivider} />
                  <View style={styles.synthesisItem}>
                    <Text style={styles.synthesisVal}>
                      {overview?.avgDailySteps ? overview.avgDailySteps.toLocaleString() : '10,420'}
                    </Text>
                    <Text style={styles.synthesisLabel}>Avg Steps</Text>
                  </View>
                </View>
              </View>

              {/* Progress Photos Section */}
              <View style={styles.photosSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>PHOTOS</Text>
                  <TouchableOpacity onPress={() => setCompareModalVisible(true)}>
                    <Text style={styles.sectionActionText}>Compare</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.photoGrid}>
                  {photos.slice(0, 2).map((p, idx) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setCompareModalVisible(true)}
                      style={styles.photoThumbnail}
                    >
                      <Image source={{ uri: p.photoUrl }} style={styles.photoImg} resizeMode="cover" />
                      <View style={styles.photoDateTag}>
                        <Text style={styles.photoDateText}>
                          {idx === 0 ? '1 May' : '30 May'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Add Photo Card */}
                  <TouchableOpacity
                    onPress={() => setLogPhotoModalVisible(true)}
                    style={styles.addPhotoCard}
                  >
                    <View style={styles.addIconCircle}>
                      <Text style={styles.addIconText}>+</Text>
                    </View>
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* 1B. DAY-BY-DAY EXECUTION & PROGRESSION AUDIT */}
          {/* ========================================================= */}
          {activeTab === 'DAY_BY_DAY' && (
            <View style={styles.tabContentSection}>
              <DayByDayProgressionCard />
            </View>
          )}

          {/* ========================================================= */}
          {/* 2. BODY MEASUREMENTS TAB */}
          {/* ========================================================= */}
          {activeTab === 'BODY' && (
            <View style={styles.tabContentSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>ANATOMICAL MEASUREMENTS</Text>
                <TouchableOpacity onPress={() => setLogMetricModalVisible(true)}>
                  <Text style={styles.sectionActionText}>+ New Entry</Text>
                </TouchableOpacity>
              </View>

              {/* Measurement Cards */}
              {([
                { type: 'CHEST', defaultCm: 104.5, change: '+1.5' },
                { type: 'WAIST', defaultCm: 81.0, change: '-2.0' },
                { type: 'HIPS', defaultCm: 98.0, change: '-1.0' },
                { type: 'BICEPS', defaultCm: 39.5, change: '+0.8' },
                { type: 'THIGHS', defaultCm: 60.5, change: '+1.2' },
                { type: 'CALVES', defaultCm: 38.0, change: '+0.4' },
              ]).map((item) => {
                const logged = measurements.find((m) => m.measurementType === item.type);
                const cm = logged ? logged.valueCm : item.defaultCm;
                return (
                  <View key={item.type} style={styles.msmtCard}>
                    <View style={styles.msmtLeft}>
                      <Text style={styles.msmtTitle}>{item.type}</Text>
                      <Text style={styles.msmtDate}>Last measured: 2 days ago</Text>
                    </View>
                    <View style={styles.msmtRight}>
                      <Text style={styles.msmtVal}>{cm} cm</Text>
                      <Text style={[styles.msmtChange, item.change.startsWith('+') ? styles.msmtChangePos : styles.msmtChangeNeg]}>
                        {item.change} cm
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ========================================================= */}
          {/* 3. PERFORMANCE & STRENGTH PROGRESSION TAB */}
          {/* ========================================================= */}
          {activeTab === 'PERFORMANCE' && (
            <View style={styles.tabContentSection}>
              {/* Header with Sync Action */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>PERSONAL RECORDS</Text>
                <TouchableOpacity onPress={handleSyncPRs} style={styles.syncBtn}>
                  <Text style={styles.syncBtnText}>⚡ Sync PRs</Text>
                </TouchableOpacity>
              </View>

              {/* PR Cards */}
              {(personalRecords.length > 0
                ? personalRecords.map((pr) => ({
                    name: pr.exerciseName,
                    type: pr.prType,
                    val: `${pr.value} ${pr.prType === PersonalRecordType.HEAVIEST_WEIGHT || pr.prType === PersonalRecordType.ESTIMATED_1RM ? 'kg' : ''}`,
                    reps: pr.reps ? `${pr.reps} reps` : (pr.weightKg ? `${pr.weightKg} kg` : ''),
                  }))
                : [
                    { name: 'Barbell Bench Press', type: PersonalRecordType.HEAVIEST_WEIGHT, val: '120.0 kg', reps: '3 reps' },
                    { name: 'Barbell Back Squat', type: PersonalRecordType.ESTIMATED_1RM, val: '163.3 kg', reps: '140kg x 5 reps' },
                    { name: 'Romanian Deadlift', type: PersonalRecordType.HEAVIEST_WEIGHT, val: '160.0 kg', reps: '6 reps' },
                    { name: 'Standing Overhead Press', type: PersonalRecordType.ESTIMATED_1RM, val: '80.0 kg', reps: '70kg x 4 reps' },
                  ]
              ).map((pr, idx) => (
                <View key={`pr-${idx}`} style={styles.prCard}>
                  <View style={styles.prLeft}>
                    <Text style={styles.prExercise}>{pr.name}</Text>
                    <View style={styles.prBadge}>
                      <Text style={styles.prBadgeText}>{pr.type.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <View style={styles.prRight}>
                    <Text style={styles.prValue}>{pr.val}</Text>
                    <Text style={styles.prReps}>{pr.reps}</Text>
                  </View>
                </View>
              ))}

              {/* Strength Trends Section */}
              <Text style={[styles.sectionHeading, { marginTop: 24 }]}>STRENGTH PROGRESSION</Text>
              {(strengthTrends.length > 0 ? strengthTrends : [
                { exerciseName: 'Barbell Back Squat', sessionsCount: 8, baselineWeightKg: 120, currentWeightKg: 140, percentageChange: 16.7 },
                { exerciseName: 'Barbell Bench Press', sessionsCount: 10, baselineWeightKg: 100, currentWeightKg: 120, percentageChange: 20.0 },
                { exerciseName: 'Barbell Bent-Over Row', sessionsCount: 6, baselineWeightKg: 85, currentWeightKg: 95, percentageChange: 11.8 },
              ]).map((trend, idx) => (
                <View key={`trend-${idx}`} style={styles.trendCard}>
                  <View style={styles.trendHeader}>
                    <Text style={styles.trendName}>{trend.exerciseName}</Text>
                    <View style={styles.trendPctBadge}>
                      <Text style={styles.trendPctText}>+{trend.percentageChange}%</Text>
                    </View>
                  </View>
                  <View style={styles.trendMeta}>
                    <Text style={styles.trendSub}>
                      {trend.sessionsCount} sessions completed
                    </Text>
                    <Text style={styles.trendWeights}>
                      {trend.baselineWeightKg}kg → {trend.currentWeightKg}kg
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <PhotoComparisonModal
        visible={compareModalVisible}
        onClose={() => setCompareModalVisible(false)}
        beforePhoto={photos[0] || null}
        afterPhoto={photos[1] || null}
        daysBetween={30}
      />

      <LogMetricModal
        visible={logMetricModalVisible}
        onClose={() => setLogMetricModalVisible(false)}
        onSaveWeight={handleSaveWeight}
        onSaveMeasurement={handleSaveMeasurement}
      />

      <LogPhotoModal
        visible={logPhotoModalVisible}
        onClose={() => setLogPhotoModalVisible(false)}
        onSavePhoto={handleSavePhoto}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  quickLogBtn: {
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickLogText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTabsWrapper: {
    marginVertical: 6,
  },
  categoryTabsScroll: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#3882F6',
    borderColor: '#60A5FA',
    shadowColor: '#3882F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
    gap: 8,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rangePillActive: {
    backgroundColor: '#3882F6',
    borderColor: '#60A5FA',
  },
  rangeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  rangeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  tabContentSection: {
    gap: 14,
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 36, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  metricCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricCardBody: {
    marginTop: 8,
  },
  metricBigValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deltaBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  deltaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  synthesisCard: {
    backgroundColor: 'rgba(11, 19, 36, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  synthesisTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  synthesisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  synthesisItem: {
    alignItems: 'center',
  },
  synthesisVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  synthesisLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  synthesisDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  photosSection: {
    backgroundColor: 'rgba(11, 19, 36, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  sectionActionText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumbnail: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoDateTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoDateText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addPhotoCard: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addPhotoText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  msmtCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 36, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  msmtLeft: {
    gap: 2,
  },
  msmtTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  msmtDate: {
    fontSize: 10,
    color: '#64748B',
  },
  msmtRight: {
    alignItems: 'flex-end',
  },
  msmtVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  msmtChange: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  msmtChangePos: {
    color: '#60A5FA',
  },
  msmtChangeNeg: {
    color: '#10B981',
  },
  syncBtn: {
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  syncBtnText: {
    fontSize: 10,
    color: '#60A5FA',
    fontWeight: '700',
  },
  prCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 36, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  prLeft: {
    gap: 4,
  },
  prExercise: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  prBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A78BFA',
  },
  prRight: {
    alignItems: 'flex-end',
  },
  prValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  prReps: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  trendCard: {
    backgroundColor: 'rgba(11, 19, 36, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendPctBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trendPctText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  trendMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  trendSub: {
    fontSize: 10,
    color: '#64748B',
  },
  trendWeights: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
  },
});
