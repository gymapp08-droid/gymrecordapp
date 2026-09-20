import { Test, TestingModule } from '@nestjs/testing';
import { NutritionService } from '../src/modules/nutrition/nutrition.service';
import {
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FoodCategory, MealStatus, MealType } from '@alpha/types';

describe('Nutrition & Meal Engine (Data + API Verification Suite)', () => {
  let service: NutritionService;

  const userAId = 'user_athlete_A_1111';
  const userBId = 'user_athlete_B_2222';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NutritionService],
    }).compile();

    service = module.get<NutritionService>(NutritionService);
  });

  describe('1. Deterministic Nutrition & Serving Calculations', () => {
    it('should calculate proportional nutrition without floating-point accumulation', async () => {
      const chicken = await service.getFoodById('food_chicken_breast');
      expect(chicken).toBeDefined();
      expect(chicken.servingSizeG).toBe(100);
      expect(chicken.calories).toBe(165);
      expect(chicken.proteinGrams).toBe(31.0);

      // Consume 150g -> 1.5x portion
      const portion = service.calculatePortionNutrition(chicken, 150, 'g');
      expect(portion.totalWeightG).toBe(150);
      expect(portion.calories).toBe(248); // 165 * 1.5 = 247.5 -> 248
      expect(portion.proteinGrams).toBe(46.5); // 31.0 * 1.5 = 46.5
      expect(portion.carbsGrams).toBe(0.0);
      expect(portion.fatGrams).toBe(5.4); // 3.6 * 1.5 = 5.4
    });

    it('should calculate serving-based nutrition correctly for pieces', async () => {
      const egg = await service.getFoodById('food_whole_egg');
      expect(egg.servingUnit).toBe('piece');

      // 2 eggs
      const portion = service.calculatePortionNutrition(egg, 2, 'piece');
      expect(portion.totalWeightG).toBe(100); // 50g * 2
      expect(portion.calories).toBe(144); // 72 * 2
      expect(portion.proteinGrams).toBe(12.6); // 6.3 * 2
      expect(portion.fatGrams).toBe(9.6); // 4.8 * 2
    });

    it('should reject zero or negative quantities', async () => {
      const chicken = await service.getFoodById('food_chicken_breast');
      expect(() =>
        service.calculatePortionNutrition(chicken, 0, 'g')
      ).toThrow(BadRequestException);
      expect(() =>
        service.calculatePortionNutrition(chicken, -50, 'g')
      ).toThrow(BadRequestException);
    });
  });

  describe('2. Food Database & Custom Foods', () => {
    it('should list built-in foods filtered by category', async () => {
      const proteins = await service.getFoods({ category: FoodCategory.PROTEIN });
      expect(proteins.length).toBeGreaterThanOrEqual(3);
      expect(proteins.every((f) => f.category === FoodCategory.PROTEIN)).toBe(true);
    });

    it('should search foods by query', async () => {
      const results = await service.getFoods({ search: 'oats' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]!.name.toLowerCase()).toContain('oats');
    });

    it('should allow user to create and retrieve private custom food', async () => {
      const custom = await service.createCustomFood(userAId, {
        name: 'Grandmas Protein Pancakes',
        category: FoodCategory.GRAINS,
        servingSizeG: 120,
        servingUnit: 'serving',
        calories: 320,
        proteinGrams: 28,
        carbsGrams: 42,
        fatGrams: 4.5,
        fiberGrams: 5,
      });

      expect(custom.id).toBeDefined();
      expect(custom.isCustom).toBe(true);
      expect(custom.userId).toBe(userAId);

      // User A can view their custom food
      const retrieved = await service.getFoodById(custom.id, userAId);
      expect(retrieved.name).toBe('Grandmas Protein Pancakes');
    });

    it('CRITICAL: User B CANNOT view User A custom food', async () => {
      const customA = await service.createCustomFood(userAId, {
        name: 'Private Macro Recipe',
        category: FoodCategory.PROTEIN,
        servingSizeG: 100,
        servingUnit: 'g',
        calories: 200,
        proteinGrams: 25,
        carbsGrams: 10,
        fatGrams: 5,
      });

      await expect(service.getFoodById(customA.id, userBId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('3. Daily Meal Logging & Adherence Lifecycle', () => {
    it('should log a meal with multiple items and calculate exact totals', async () => {
      // 100g oats + 30g whey protein
      const meal = await service.createMealLog(userAId, {
        name: 'Power Breakfast',
        mealType: MealType.BREAKFAST,
        scheduledTime: '08:00',
        items: [
          { foodItemId: 'food_rolled_oats', quantity: 100, servingUnit: 'g' },
          { foodItemId: 'food_whey_protein', quantity: 1, servingUnit: 'serving' },
        ],
      });

      expect(meal).toBeDefined();
      expect(meal.items).toHaveLength(2);
      expect(meal.status).toBe(MealStatus.IN_PROGRESS);

      // Oats (389 kcal, 16.9g P, 66.3g C, 6.9g F) + Whey (120 kcal, 24g P, 1.5g C, 1g F)
      // Total calories: 389 + 120 = 509 kcal
      expect(meal.totalCalories).toBe(509);
      expect(meal.totalProteinGrams).toBe(40.9); // 16.9 + 24.0
      expect(meal.totalCarbsGrams).toBe(67.8); // 66.3 + 1.5
      expect(meal.totalFatGrams).toBe(7.9); // 6.9 + 1.0
    });

    it('should dynamically add food to an existing meal and recalculate totals', async () => {
      const meal = await service.createMealLog(userAId, {
        name: 'Quick Snack',
        mealType: MealType.SNACK,
      });
      expect(meal.totalCalories).toBe(0);

      // Add 1 banana (105 kcal, 1.3g P, 27g C, 0.3g F)
      const updated = await service.addFoodToMeal(userAId, meal.id, {
        foodItemId: 'food_banana',
        quantity: 1,
        servingUnit: 'piece',
      });

      expect(updated.items).toHaveLength(1);
      expect(updated.totalCalories).toBe(105);
      expect(updated.totalProteinGrams).toBe(1.3);
      expect(updated.totalCarbsGrams).toBe(27.0);
    });

    it('should complete a meal and record completion timestamp', async () => {
      const meal = await service.createMealLog(userAId, {
        name: 'Lunch',
        mealType: MealType.LUNCH,
      });

      const completed = await service.completeMeal(userAId, meal.id);
      expect(completed.status).toBe(MealStatus.COMPLETED);
      expect(completed.completedAt).toBeDefined();
    });
  });

  describe('4. Hydration Engine', () => {
    it('should log hydration and accumulate daily total', async () => {
      await service.logHydration(userAId, { amountMl: 500 });
      await service.logHydration(userAId, { amountMl: 250 });

      const hydration = await service.getTodayHydration(userAId);
      expect(hydration.totalAmountMl).toBe(750);
      expect(hydration.logs).toHaveLength(2);
      expect(hydration.targetMl).toBe(3000);
    });

    it('should delete a hydration log', async () => {
      const log = await service.logHydration(userAId, { amountMl: 500 });
      let hydration = await service.getTodayHydration(userAId);
      expect(hydration.totalAmountMl).toBeGreaterThanOrEqual(500);

      await service.deleteHydrationLog(userAId, log.id);
      hydration = await service.getTodayHydration(userAId);
      expect(hydration.logs.find((l) => l.id === log.id)).toBeUndefined();
    });
  });

  describe('5. Nutrition Plans & Versioning', () => {
    it('should create and increment plan version while maintaining historical integrity', async () => {
      const planV1 = await service.createNutritionPlan(userAId, {
        name: 'Cutting Phase',
        dailyCalories: 2000,
        dailyProteinG: 180,
        dailyCarbsG: 180,
        dailyFatG: 60,
      });

      expect(planV1.version).toBe(1);
      expect(planV1.isActive).toBe(true);

      const planV2 = await service.createNutritionPlan(userAId, {
        name: 'Bulking Phase',
        dailyCalories: 2800,
        dailyProteinG: 200,
        dailyCarbsG: 340,
        dailyFatG: 75,
      });

      expect(planV2.version).toBe(2);
      expect(planV2.isActive).toBe(true);

      // Verify V1 is deactivated
      const allPlans = await service.getNutritionPlans(userAId);
      expect(allPlans).toHaveLength(2);
      const oldV1 = allPlans.find((p) => p.id === planV1.id);
      expect(oldV1?.isActive).toBe(false);
    });
  });

  describe('6. Daily Summary & Real Adherence (Zero Fake Data)', () => {
    it('should aggregate daily totals and calculate adherence only when data exists', async () => {
      // Set active plan: 2200 kcal
      await service.createNutritionPlan(userAId, {
        name: 'Maintenance',
        dailyCalories: 2200,
        dailyProteinG: 160,
        dailyCarbsG: 220,
        dailyFatG: 65,
      });

      // Log 1 meal with 509 kcal
      const meal = await service.createMealLog(userAId, {
        name: 'Breakfast',
        mealType: MealType.BREAKFAST,
        items: [
          { foodItemId: 'food_rolled_oats', quantity: 100, servingUnit: 'g' },
          { foodItemId: 'food_whey_protein', quantity: 1, servingUnit: 'serving' },
        ],
      });
      await service.completeMeal(userAId, meal.id);

      const summary = await service.getDailySummary(userAId);
      expect(summary.calorieTarget).toBe(2200);
      expect(summary.caloriesConsumed).toBe(509);
      expect(summary.caloriesRemaining).toBe(1691); // 2200 - 509
      expect(summary.mealsPlanned).toBe(1);
      expect(summary.mealsCompleted).toBe(1);
      expect(summary.mealAdherencePercent).toBe(100);
      expect(summary.calorieAdherencePercent).toBe(23); // 509 / 2200 = 23%
    });
  });

  describe('7. Strict Multi-Tenant User Isolation', () => {
    it('CRITICAL: User B CANNOT read User A meal log', async () => {
      const mealA = await service.createMealLog(userAId, {
        name: "User A's Secret Meal",
        mealType: MealType.LUNCH,
      });

      await expect(service.getMealLogById(userBId, mealA.id)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('CRITICAL: User B CANNOT add food or complete User A meal log', async () => {
      const mealA = await service.createMealLog(userAId, {
        name: "User A's Dinner",
        mealType: MealType.DINNER,
      });

      await expect(
        service.addFoodToMeal(userBId, mealA.id, {
          foodItemId: 'food_chicken_breast',
          quantity: 100,
          servingUnit: 'g',
        })
      ).rejects.toThrow(ForbiddenException);

      await expect(service.completeMeal(userBId, mealA.id)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('CRITICAL: User B CANNOT delete User A hydration log', async () => {
      const logA = await service.logHydration(userAId, { amountMl: 500 });

      await expect(
        service.deleteHydrationLog(userBId, logA.id)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
