import React, { useState } from 'react';
import { UserRole } from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';

interface NutritionPlanBuilderProps {
  currentRole: UserRole;
  onSaveMealPlan: (planData: any) => void;
  onClose: () => void;
}

export const NutritionPlanBuilder: React.FC<NutritionPlanBuilderProps> = ({
  currentRole,
  onSaveMealPlan,
  onClose,
}) => {
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [meals, setMeals] = useState([
    {
      name: 'Breakfast',
      orderIndex: 0,
      items: [
        { foodItemId: 'egg_whole', foodName: 'Whole Eggs', quantity: 3, totalWeightG: 150, calories: 210, proteinGrams: 18, carbsGrams: 2, fatGrams: 15 },
        { foodItemId: 'oats_rolled', foodName: 'Rolled Oats', quantity: 1, totalWeightG: 80, calories: 300, proteinGrams: 10, carbsGrams: 54, fatGrams: 5 },
      ],
    },
    {
      name: 'Lunch',
      orderIndex: 1,
      items: [
        { foodItemId: 'chicken_breast', foodName: 'Chicken Breast (Grilled)', quantity: 1, totalWeightG: 200, calories: 330, proteinGrams: 62, carbsGrams: 0, fatGrams: 7 },
        { foodItemId: 'rice_jasmine', foodName: 'Jasmine Rice (Cooked)', quantity: 1, totalWeightG: 150, calories: 195, proteinGrams: 4, carbsGrams: 43, fatGrams: 0.5 },
      ],
    },
  ]);

  const isTrainer = currentRole === UserRole.TRAINER;

  // Calculate totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  meals.forEach((m) => {
    m.items.forEach((it) => {
      totalCalories += it.calories;
      totalProtein += it.proteinGrams;
      totalCarbs += it.carbsGrams;
      totalFat += it.fatGrams;
    });
  });

  const handleAddMeal = () => {
    setMeals([
      ...meals,
      {
        name: `Meal ${meals.length + 1}`,
        orderIndex: meals.length,
        items: [
          { foodItemId: 'whey_iso', foodName: 'Whey Isolate Shake', quantity: 1, totalWeightG: 30, calories: 120, proteinGrams: 25, carbsGrams: 2, fatGrams: 1 },
        ],
      },
    ]);
  };

  const handleSubmit = () => {
    if (!planName.trim()) {
      alert('Please enter a nutrition plan name');
      return;
    }
    onSaveMealPlan({
      name: planName,
      description,
      meals,
    });
  };

  return (
    <div style={{ ...STITCH_THEME.styles.glassCardElevated, padding: '28px', maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
            Nutrition Plan Builder
          </div>
          <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
            Design individualized macronutrient and meal schedule protocols
          </div>
        </div>
        <button onClick={onClose} style={{ ...STITCH_THEME.styles.secondaryButton, padding: '4px 10px' }}>
          ✕ Close
        </button>
      </div>

      {/* Role Restriction Banner if Trainer */}
      {isTrainer && (
        <div
          style={{
            padding: '14px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: STITCH_THEME.colors.accentCrimson,
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          ⚠️ Access Denied: Trainer role cannot create or assign nutrition plans. Switch role to Nutritionist or Coach to proceed.
        </div>
      )}

      {/* Macro Totals Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '16px',
          borderRadius: '10px',
          border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
            Daily Calories
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
            {Math.round(totalCalories)} <span style={{ fontSize: '12px', fontWeight: 500 }}>kcal</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.accentCyan, textTransform: 'uppercase' }}>
            Protein
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.accentCyan, marginTop: '2px' }}>
            {Math.round(totalProtein)}g
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.accentAmber, textTransform: 'uppercase' }}>
            Carbohydrates
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.accentAmber, marginTop: '2px' }}>
            {Math.round(totalCarbs)}g
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: STITCH_THEME.colors.accentEmerald, textTransform: 'uppercase' }}>
            Fats
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: STITCH_THEME.colors.accentEmerald, marginTop: '2px' }}>
            {Math.round(totalFat)}g
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: isTrainer ? 0.4 : 1 }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
            Plan Protocol Name *
          </label>
          <input
            type="text"
            disabled={isTrainer}
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. Lean Mass Optimization 2,600 kcal"
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              borderRadius: '8px',
              color: STITCH_THEME.colors.textPrimary,
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: STITCH_THEME.colors.textMuted, textTransform: 'uppercase' }}>
            Protocol Description / Coaching Notes
          </label>
          <input
            type="text"
            disabled={isTrainer}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Prioritize carbohydrate intake around workout windows."
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              borderRadius: '8px',
              color: STITCH_THEME.colors.textPrimary,
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Meals Schedule */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>
              MEAL SCHEDULE ({meals.length} Meals)
            </span>
            <button
              disabled={isTrainer}
              onClick={handleAddMeal}
              style={{ ...STITCH_THEME.styles.secondaryButton, fontSize: '11px', padding: '5px 10px' }}
            >
              + Add Meal
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {meals.map((meal, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: STITCH_THEME.colors.accentEmerald, marginBottom: '8px' }}>
                  {meal.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {meal.items.map((it, itIdx) => (
                    <div
                      key={itIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        padding: '6px 10px',
                        borderRadius: '4px',
                      }}
                    >
                      <span style={{ color: '#F8FAFC' }}>
                        {it.foodName} ({it.totalWeightG}g)
                      </span>
                      <span style={{ color: STITCH_THEME.colors.textSecondary }}>
                        {it.calories} kcal • {it.proteinGrams}g P • {it.carbsGrams}g C • {it.fatGrams}g F
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button disabled={isTrainer} onClick={onClose} style={STITCH_THEME.styles.secondaryButton}>
            Cancel
          </button>
          <button
            disabled={isTrainer}
            onClick={handleSubmit}
            style={{
              ...STITCH_THEME.styles.primaryButton,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            }}
          >
            Publish Nutrition Plan
          </button>
        </div>
      </div>
    </div>
  );
};
