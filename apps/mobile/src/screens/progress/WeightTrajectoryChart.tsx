import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

export interface TrajectoryPoint {
  date: string;
  weightKg: number;
}

interface WeightTrajectoryChartProps {
  data: TrajectoryPoint[];
  currentWeightKg?: number | null;
  weightChangeKg?: number | null;
  onSelectPoint?: (point: TrajectoryPoint) => void;
}

export const WeightTrajectoryChart: React.FC<WeightTrajectoryChartProps> = ({
  data,
  currentWeightKg,
  weightChangeKg,
  onSelectPoint,
}) => {
  const points = data.length > 0 ? data : [
    { date: '1 May', weightKg: 82.0 },
    { date: '8 May', weightKg: 81.5 },
    { date: '15 May', weightKg: 80.8 },
    { date: '22 May', weightKg: 80.2 },
    { date: '30 May', weightKg: 79.8 },
  ];

  const [selectedIndex, setSelectedIndex] = useState<number>(points.length - 1);

  const chartWidth = 280;
  const chartHeight = 80;

  const weights = points.map((p) => p.weightKg);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((p.weightKg - minW) / range) * chartHeight;
    return { x, y, point: p };
  });

  // Build SVG path
  let pathD = '';
  if (coords.length > 0 && coords[0]) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1]!;
      const curr = coords[i]!;
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
  }

  const lastCoord = coords[coords.length - 1];
  const areaD = coords.length > 0 && lastCoord
    ? `${pathD} L ${lastCoord.x} ${chartHeight} L 0 ${chartHeight} Z`
    : '';

  const activePoint = points[selectedIndex] || points[points.length - 1];

  const displayWeight = currentWeightKg ?? (activePoint ? activePoint.weightKg : 79.8);
  const displayChange = weightChangeKg ?? -2.2;
  const isLoss = displayChange <= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titleLabel}>WEIGHT</Text>
          {activePoint && (
            <Text style={styles.activeDateLabel}>{activePoint.date}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.weightRow}>
            <Text style={styles.weightValue}>{displayWeight.toFixed(1)}</Text>
            <Text style={styles.weightUnit}>kg</Text>
          </View>
          <View
            style={[
              styles.changeBadge,
              isLoss ? styles.badgeSuccess : styles.badgeAmber,
            ]}
          >
            <Text
              style={[
                styles.changeBadgeText,
                isLoss ? styles.badgeTextSuccess : styles.badgeTextAmber,
              ]}
            >
              {displayChange > 0 ? `+${displayChange.toFixed(1)}` : `${displayChange.toFixed(1)}`} kg
            </Text>
          </View>
        </View>
      </View>

      {/* Chart Canvas */}
      <View style={styles.chartWrapper}>
        {/* Y-Axis scale labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{Math.round(maxW)}</Text>
          <Text style={styles.axisLabel}>{Math.round(minW + range * 0.66)}</Text>
          <Text style={styles.axisLabel}>{Math.round(minW + range * 0.33)}</Text>
          <Text style={styles.axisLabel}>{Math.round(minW)}</Text>
        </View>

        {/* SVG Drawing */}
        <View style={styles.svgContainer}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#3882F6" stopOpacity="0.35" />
                <Stop offset="100%" stopColor="#3882F6" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Horizontal Grid Guidelines */}
            <Line x1="0" y1="0" x2={chartWidth} y2="0" stroke="rgba(255,255,255,0.06)" strokeDasharray="4,4" />
            <Line x1="0" y1={chartHeight * 0.33} x2={chartWidth} y2={chartHeight * 0.33} stroke="rgba(255,255,255,0.06)" strokeDasharray="4,4" />
            <Line x1="0" y1={chartHeight * 0.66} x2={chartWidth} y2={chartHeight * 0.66} stroke="rgba(255,255,255,0.06)" strokeDasharray="4,4" />
            <Line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(255,255,255,0.06)" strokeDasharray="4,4" />

            {/* Shaded Area */}
            {areaD ? <Path d={areaD} fill="url(#chartGrad)" /> : null}

            {/* Main Progress Curve */}
            {pathD ? (
              <Path
                d={pathD}
                fill="none"
                stroke="#3882F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Data Nodes */}
            {coords.map((c, i) => {
              const isSelected = i === selectedIndex;
              return (
                <Circle
                  key={`pt-${i}`}
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? 4.5 : 2.5}
                  fill={isSelected ? '#FFFFFF' : '#3882F6'}
                  stroke={isSelected ? '#10B981' : '#1D4ED8'}
                  strokeWidth={isSelected ? 2 : 1}
                />
              );
            })}
          </Svg>
        </View>
      </View>

      {/* Interactive Timeline Ticks */}
      <View style={styles.timelineRow}>
        {points.map((p, i) => {
          const isSelected = i === selectedIndex;
          return (
            <TouchableOpacity
              key={`tick-${i}`}
              onPress={() => {
                setSelectedIndex(i);
                if (onSelectPoint) onSelectPoint(p);
              }}
              style={[styles.tickButton, isSelected && styles.tickButtonActive]}
            >
              <Text style={[styles.tickText, isSelected && styles.tickTextActive]}>
                {p.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(11, 19, 36, 0.75)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.37,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  activeDateLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  weightUnit: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
    fontWeight: '500',
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextSuccess: {
    color: '#10B981',
  },
  badgeTextAmber: {
    color: '#F59E0B',
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 90,
    marginTop: 6,
  },
  yAxis: {
    width: 24,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  axisLabel: {
    fontSize: 9,
    color: '#475569',
    fontFamily: 'Courier',
  },
  svgContainer: {
    flex: 1,
    marginLeft: 6,
    justifyContent: 'center',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
    marginTop: 4,
  },
  tickButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  tickButtonActive: {
    backgroundColor: 'rgba(56, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 130, 246, 0.5)',
  },
  tickText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  tickTextActive: {
    color: '#60A5FA',
    fontWeight: '700',
  },
});
