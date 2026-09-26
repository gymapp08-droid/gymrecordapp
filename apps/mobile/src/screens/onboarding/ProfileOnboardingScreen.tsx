import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { AlphaScreen, AlphaHeader, PrimaryButton, StatusBadge } from '../../components';
import { Theme } from '../../theme/tokens';
import { calculateBmi, determineTrainingMaturity, calculateMetabolicMacros } from '../../utils/timezone';

export interface UserProfileData {
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
  heightCm: number;
  weightKg: number;
  unitSystem: 'METRIC' | 'IMPERIAL';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  bmi?: number | null;
  trainingYears?: number;
}

interface ProfileOnboardingScreenProps {
  onBack: () => void;
  onNext: (profile: UserProfileData) => void;
}

const EXPERIENCE_LEVELS = [
  { id: 'BEGINNER', label: 'Beginner', years: 0.5, desc: '< 1 year regular training' },
  { id: 'INTERMEDIATE', label: 'Intermediate', years: 2, desc: '1–3 years disciplined training' },
  { id: 'ADVANCED', label: 'Advanced', years: 4, desc: '3–5 years periodized training' },
  { id: 'ELITE', label: 'Elite', years: 6, desc: '5+ years competitive training' },
] as const;

export const ProfileOnboardingScreen: React.FC<ProfileOnboardingScreenProps> = ({ onBack, onNext }) => {
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  // Section 8: Empty initial state — no hardcoded fake numbers masquerading as real user data
  const [age, setAge] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [unitSystem, setUnitSystem] = useState<'METRIC' | 'IMPERIAL'>('METRIC');
  const [experienceLevel, setExperienceLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE'>('INTERMEDIATE');
  const [validationError, setValidationError] = useState<string | null>(null);

  const numWeight = parseFloat(weightInput);
  const numHeight = parseFloat(heightInput);
  const numAge = parseInt(age, 10);

  // Section 9: Dynamic BMI computation
  const bmiResult = useMemo(() => {
    return calculateBmi(numWeight, numHeight, unitSystem);
  }, [numWeight, numHeight, unitSystem]);

  // Dynamic Metabolic Macronutrient Demands (Protein, Fats, Carbs, Calories)
  const weightKgStandard = unitSystem === 'IMPERIAL' ? (numWeight ? numWeight / 2.20462 : null) : numWeight;
  const heightCmStandard = unitSystem === 'IMPERIAL' ? (numHeight ? numHeight * 2.54 : null) : numHeight;

  const macroDemand = useMemo(() => {
    return calculateMetabolicMacros(weightKgStandard, heightCmStandard, numAge, gender);
  }, [weightKgStandard, heightCmStandard, numAge, gender]);

  // Section 10: Dynamic Training Maturity
  const selectedExp = EXPERIENCE_LEVELS.find((e) => e.id === experienceLevel);
  const trainingMaturity = useMemo(() => {
    return determineTrainingMaturity(experienceLevel, selectedExp?.years);
  }, [experienceLevel, selectedExp]);

  const handleNext = () => {
    if (!numAge || numAge < 14 || numAge > 100) {
      setValidationError('Please enter a valid age (14–100 years).');
      return;
    }

    if (!numHeight || numHeight < 50 || numHeight > 250) {
      setValidationError(
        unitSystem === 'METRIC'
          ? 'Please enter a valid height (50–250 cm).'
          : 'Please enter a valid height (20–100 inches).'
      );
      return;
    }

    if (!numWeight || numWeight < 30 || numWeight > 350) {
      setValidationError(
        unitSystem === 'METRIC'
          ? 'Please enter a valid body weight (30–350 kg).'
          : 'Please enter a valid body weight (65–750 lbs).'
      );
      return;
    }

    setValidationError(null);

    // Convert to metric standard for backend storage
    const finalHeightCm = unitSystem === 'IMPERIAL' ? Math.round(numHeight * 2.54) : Math.round(numHeight);
    const finalWeightKg = unitSystem === 'IMPERIAL' ? Math.round((numWeight / 2.20462) * 10) / 10 : numWeight;

    onNext({
      gender,
      age: numAge,
      heightCm: finalHeightCm,
      weightKg: finalWeightKg,
      unitSystem,
      experienceLevel,
      bmi: bmiResult.value,
      trainingYears: selectedExp?.years,
    });
  };

  return (
    <AlphaScreen>
      <AlphaHeader
        title="Biometric Baseline"
        subtitle="Step 2 of 4 · Calibration"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.leadText}>
          Your biometric baseline calibrates accurate progressive overload, caloric maintenance, and training volume.
        </Text>

        {validationError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {validationError}</Text>
          </View>
        )}

        {/* Biological Sex */}
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
              <Text style={[styles.miniToggleText, unitSystem === 'METRIC' && styles.miniToggleTextActive]}>
                KG / CM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.miniToggleBtn, unitSystem === 'IMPERIAL' && styles.miniToggleBtnActive]}
              onPress={() => setUnitSystem('IMPERIAL')}
            >
              <Text style={[styles.miniToggleText, unitSystem === 'IMPERIAL' && styles.miniToggleTextActive]}>
                LBS / IN
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Numerical Metrics Input */}
        <View style={styles.metricsRow}>
          {/* Age */}
          <View style={styles.metricInputCard}>
            <Text style={styles.inputLabel}>AGE</Text>
            <TextInput
              style={styles.numericInput}
              value={age}
              onChangeText={(t) => {
                setAge(t);
                if (validationError) setValidationError(null);
              }}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="25"
              placeholderTextColor={Theme.colors.textMuted}
            />
            <Text style={styles.unitTag}>years</Text>
          </View>

          {/* Height */}
          <View style={styles.metricInputCard}>
            <Text style={styles.inputLabel}>HEIGHT</Text>
            <TextInput
              style={styles.numericInput}
              value={heightInput}
              onChangeText={(t) => {
                setHeightInput(t);
                if (validationError) setValidationError(null);
              }}
              keyboardType="numeric"
              maxLength={5}
              placeholder={unitSystem === 'METRIC' ? '175' : '69'}
              placeholderTextColor={Theme.colors.textMuted}
            />
            <Text style={styles.unitTag}>{unitSystem === 'METRIC' ? 'cm' : 'in'}</Text>
          </View>

          {/* Weight */}
          <View style={styles.metricInputCard}>
            <Text style={styles.inputLabel}>WEIGHT</Text>
            <TextInput
              style={styles.numericInput}
              value={weightInput}
              onChangeText={(t) => {
                setWeightInput(t);
                if (validationError) setValidationError(null);
              }}
              keyboardType="numeric"
              maxLength={5}
              placeholder={unitSystem === 'METRIC' ? '75' : '165'}
              placeholderTextColor={Theme.colors.textMuted}
            />
            <Text style={styles.unitTag}>{unitSystem === 'METRIC' ? 'kg' : 'lbs'}</Text>
          </View>
        </View>

        {/* Dynamic BMI Calculation Card (Section 9) */}
        <View style={styles.bmiCard}>
          <View style={styles.bmiHeader}>
            <Text style={styles.bmiTitle} numberOfLines={1}>
              BODY MASS INDEX (BMI)
            </Text>
            <View style={styles.badgeWrapper}>
              <StatusBadge
                label={bmiResult.categoryLabel}
                status={
                  bmiResult.category === 'HEALTHY_RANGE'
                    ? 'success'
                    : bmiResult.category === 'OVERWEIGHT'
                    ? 'warning'
                    : 'neutral'
                }
              />
            </View>
          </View>

          <View style={styles.bmiDisplayRow}>
            <Text style={styles.bmiNumber}>
              {bmiResult.value !== null ? bmiResult.value.toFixed(1) : '--.-'}
            </Text>
            <Text style={styles.bmiScaleText}>
              {bmiResult.value !== null ? 'kg/m²' : 'BMI'}
            </Text>
          </View>

          {bmiResult.value === null && (
            <Text style={styles.bmiSubHelper}>
              Enter height and weight above to compute BMI.
            </Text>
          )}

          <Text style={styles.bmiDisclaimer}>{bmiResult.disclaimer}</Text>

          {/* Dynamic Macro Demand Section (Protein, Fats, Carbs, Calories) */}
          {macroDemand ? (
            <View style={styles.macroDemandBox}>
              <View style={styles.macroDemandDivider} />
              <View style={styles.macroDemandHeader}>
                <View>
                  <Text style={styles.macroDemandTitle}>DAILY MACRONUTRIENT DEMAND</Text>
                  <Text style={styles.macroDemandSub}>Calibrated to your Biometrics & Activity</Text>
                </View>
                <View style={styles.calsTargetBadge}>
                  <Text style={styles.calsTargetVal}>{macroDemand.recommendedDailyCals}</Text>
                  <Text style={styles.calsTargetUnit}>kcal/day</Text>
                </View>
              </View>

              <View style={styles.macroGrid}>
                {/* Protein Demand */}
                <View style={[styles.macroCard, { borderColor: '#00F0FF', backgroundColor: 'rgba(0, 240, 255, 0.08)' }]}>
                  <Text style={[styles.macroCardTag, { color: '#00F0FF' }]}>PROTEIN</Text>
                  <Text style={styles.macroCardGrams}>{macroDemand.proteinGrams}g</Text>
                  <Text style={styles.macroCardSub}>2.0g/kg · {macroDemand.proteinCals} kcal</Text>
                </View>

                {/* Fats Demand */}
                <View style={[styles.macroCard, { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
                  <Text style={[styles.macroCardTag, { color: '#F59E0B' }]}>FATS</Text>
                  <Text style={styles.macroCardGrams}>{macroDemand.fatGrams}g</Text>
                  <Text style={styles.macroCardSub}>0.9g/kg · {macroDemand.fatCals} kcal</Text>
                </View>

                {/* Carbs Demand */}
                <View style={[styles.macroCard, { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.08)' }]}>
                  <Text style={[styles.macroCardTag, { color: '#38BDF8' }]}>CARBS</Text>
                  <Text style={styles.macroCardGrams}>{macroDemand.carbsGrams}g</Text>
                  <Text style={styles.macroCardSub}>Fuel · {macroDemand.carbsCals} kcal</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.macroDemandPlaceholder}>
              <Text style={styles.macroPlaceholderText}>
                ⚡ Enter Height, Weight & Age to calculate your exact Protein, Fat & Carb demand.
              </Text>
            </View>
          )}
        </View>

        {/* Dynamic Training Maturity (Section 10) */}
        <View style={styles.maturityCard}>
          <View style={styles.maturityHeader}>
            <Text style={styles.maturityTitle}>TRAINING MATURITY</Text>
            <StatusBadge label={trainingMaturity.label} status="info" />
          </View>
          <Text style={styles.maturityDesc}>{trainingMaturity.description}</Text>
        </View>

        {/* Experience Level Selection */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>TRAINING EXPERIENCE</Text>
        <View style={styles.expList}>
          {EXPERIENCE_LEVELS.map((item) => {
            const isSelected = experienceLevel === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.expCard, isSelected && styles.expCardActive]}
                onPress={() => setExperienceLevel(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.expRow}>
                  <Text style={[styles.expLabel, isSelected && styles.expLabelActive]}>
                    {item.label}
                  </Text>
                  {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </View>
                <Text style={styles.expDesc}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton
          title="Continue to Training Preferences"
          onPress={handleNext}
          style={styles.continueBtn}
        />
      </ScrollView>
    </AlphaScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  leadText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Theme.typography.fontBody,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Theme.typography.fontBody,
  },
  sectionLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Theme.typography.fontMono,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  toggleBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  toggleBtnTextActive: {
    color: Theme.colors.cyanGlow,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  miniToggle: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 2,
  },
  miniToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.pill,
  },
  miniToggleBtnActive: {
    backgroundColor: Theme.colors.cyanGlow,
  },
  miniToggleText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
  },
  miniToggleTextActive: {
    color: '#05070B',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricInputCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 12,
    alignItems: 'center',
  },
  inputLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Theme.typography.fontMono,
    marginBottom: 4,
  },
  numericInput: {
    color: Theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Theme.typography.fontDisplay,
    textAlign: 'center',
    height: 36,
    width: '100%',
  },
  unitTag: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontFamily: Theme.typography.fontBody,
  },
  bmiCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 8,
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  bmiTitle: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Theme.typography.fontMono,
    flexShrink: 1,
  },
  badgeWrapper: {
    flexShrink: 0,
  },
  bmiDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  bmiNumber: {
    color: Theme.colors.cyanGlow,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Theme.typography.fontDisplay,
  },
  bmiScaleText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontFamily: Theme.typography.fontBody,
  },
  bmiSubHelper: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: Theme.typography.fontBody,
    marginTop: -2,
    marginBottom: 4,
    lineHeight: 16,
  },
  bmiDisclaimer: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Theme.typography.fontBody,
  },
  macroDemandBox: {
    marginTop: 12,
  },
  macroDemandDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  macroDemandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  macroDemandTitle: {
    color: Theme.colors.cyanGlow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Theme.typography.fontMono,
  },
  macroDemandSub: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: Theme.typography.fontBody,
    marginTop: 1,
  },
  calsTargetBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  calsTargetVal: {
    color: Theme.colors.cyanGlow,
    fontSize: 13,
    fontWeight: '900',
    fontFamily: Theme.typography.fontDisplay,
  },
  calsTargetUnit: {
    color: Theme.colors.textSecondary,
    fontSize: 9,
    fontFamily: Theme.typography.fontBody,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
  },
  macroCardTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontMono,
    marginBottom: 3,
  },
  macroCardGrams: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontDisplay,
  },
  macroCardSub: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    fontFamily: Theme.typography.fontBody,
    marginTop: 2,
  },
  macroDemandPlaceholder: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  macroPlaceholderText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontFamily: Theme.typography.fontBody,
    textAlign: 'center',
  },
  maturityCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 6,
  },
  maturityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maturityTitle: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Theme.typography.fontMono,
  },
  maturityDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Theme.typography.fontBody,
  },
  expList: {
    gap: 8,
  },
  expCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    gap: 4,
  },
  expCardActive: {
    borderColor: Theme.colors.cyanGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expLabel: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Theme.typography.fontBody,
  },
  expLabelActive: {
    color: Theme.colors.cyanGlow,
  },
  checkIcon: {
    color: Theme.colors.cyanGlow,
    fontSize: 16,
    fontWeight: '900',
  },
  expDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: Theme.typography.fontBody,
  },
  continueBtn: {
    marginTop: 8,
  },
});
