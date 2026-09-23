import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton } from '../../components';
import { Theme } from '../../theme/tokens';

export interface UserProfileData {
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
  heightCm: number;
  weightKg: number;
  unitSystem: 'METRIC' | 'IMPERIAL';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
}

interface ProfileOnboardingScreenProps {
  onBack: () => void;
  onNext: (profile: UserProfileData) => void;
}

const EXPERIENCE_LEVELS = [
  { id: 'BEGINNER', label: 'Beginner', desc: '< 1 year regular training' },
  { id: 'INTERMEDIATE', label: 'Intermediate', desc: '1–3 years disciplined training' },
  { id: 'ADVANCED', label: 'Advanced', desc: '3–5 years periodized training' },
  { id: 'ELITE', label: 'Elite', desc: '5+ years competitive / high volume' },
] as const;

export const ProfileOnboardingScreen: React.FC<ProfileOnboardingScreenProps> = ({ onBack, onNext }) => {
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [age, setAge] = useState('26');
  const [heightCm, setHeightCm] = useState('180');
  const [weightKg, setWeightKg] = useState('78');
  const [unitSystem, setUnitSystem] = useState<'METRIC' | 'IMPERIAL'>('METRIC');
  const [experienceLevel, setExperienceLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE'>('INTERMEDIATE');

  const handleNext = () => {
    onNext({
      gender,
      age: parseInt(age, 10) || 25,
      heightCm: parseInt(heightCm, 10) || 175,
      weightKg: parseFloat(weightKg) || 75,
      unitSystem,
      experienceLevel,
    });
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Biometric Baseline"
        subtitle="Step 2 of 3 · Calibration"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.leadText}>
          Precision telemetry enables accurate metabolic burn, caloric targets, and baseline recovery volume.
        </Text>

        {/* Gender Selection */}
        <Text style={styles.sectionLabel}>BIOLOGICAL SEX</Text>
        <View style={styles.toggleRow}>
          {(['MALE', 'FEMALE', 'OTHER'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.toggleBtn, gender === item && styles.toggleBtnActive]}
              onPress={() => setGender(item)}
            >
              <Text style={[styles.toggleBtnText, gender === item && styles.toggleBtnTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Units System Toggle */}
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>MEASUREMENT UNITS</Text>
          <View style={styles.miniToggle}>
            <TouchableOpacity
              style={[styles.miniToggleBtn, unitSystem === 'METRIC' && styles.miniToggleBtnActive]}
              onPress={() => setUnitSystem('METRIC')}
            >
              <Text style={[styles.miniToggleText, unitSystem === 'METRIC' && styles.miniToggleTextActive]}>KG / CM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.miniToggleBtn, unitSystem === 'IMPERIAL' && styles.miniToggleBtnActive]}
              onPress={() => setUnitSystem('IMPERIAL')}
            >
              <Text style={[styles.miniToggleText, unitSystem === 'IMPERIAL' && styles.miniToggleTextActive]}>LBS / IN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Numerical Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricInputCard}>
            <Text style={styles.inputLabel}>AGE</Text>
            <TextInput
              style={styles.numericInput}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholderTextColor="#64748B"
              maxLength={3}
            />
            <Text style={styles.unitLabel}>yrs</Text>
          </View>

          <View style={styles.metricInputCard}>
            <Text style={styles.inputLabel}>HEIGHT</Text>
            <TextInput
              style={styles.numericInput}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="number-pad"
              placeholderTextColor="#64748B"
              maxLength={3}
            />
            <Text style={styles.unitLabel}>{unitSystem === 'METRIC' ? 'cm' : 'in'}</Text>
          </View>

          <View style={styles.metricInputCard}>
            <Text style={styles.inputLabel}>WEIGHT</Text>
            <TextInput
              style={styles.numericInput}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              placeholderTextColor="#64748B"
              maxLength={4}
            />
            <Text style={styles.unitLabel}>{unitSystem === 'METRIC' ? 'kg' : 'lbs'}</Text>
          </View>
        </View>

        {/* Experience Level */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>TRAINING MATURITY</Text>
        <View style={styles.expList}>
          {EXPERIENCE_LEVELS.map((item) => {
            const isSelected = experienceLevel === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.expPill, isSelected && styles.expPillActive]}
                onPress={() => setExperienceLevel(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.expHeader}>
                  <Text style={[styles.expTitle, isSelected && styles.expTitleActive]}>
                    {item.label}
                  </Text>
                  <View style={[styles.radio, isSelected && styles.radioActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={styles.expDesc}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Continue to Preferences" onPress={handleNext} />
      </View>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  leadText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.cyanGlow,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  toggleBtnActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  toggleBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleBtnTextActive: {
    color: Theme.colors.cyanGlow,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  miniToggle: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  miniToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  miniToggleBtnActive: {
    backgroundColor: Theme.colors.cyanGlow,
  },
  miniToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  miniToggleTextActive: {
    color: '#05070B',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricInputCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.telemetry.fontFamily,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  numericInput: {
    fontSize: 24,
    fontFamily: Theme.typography.display.fontFamily,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 2,
    minWidth: 50,
  },
  unitLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  expList: {
    gap: 10,
  },
  expPill: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 14,
  },
  expPillActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  expTitleActive: {
    color: Theme.colors.cyanGlow,
  },
  expDesc: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Theme.colors.cyanGlow,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.cyanGlow,
  },
  footer: {
    paddingTop: 16,
  },
});
