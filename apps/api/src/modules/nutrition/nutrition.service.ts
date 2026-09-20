import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HashUtil } from '@alpha/utils';
import {
  FoodCategory,
  MealStatus,
  IFoodItem,
  IMealLog,
  IMealItem,
  IHydrationLog,
  INutritionDailySummary,
} from '@alpha/types';
import {
  CreateMealLogDto,
  UpdateMealLogDto,
  AddFoodToMealDto,
  CreateCustomFoodDto,
  LogHydrationDto,
  CreateNutritionPlanDto,
} from '@alpha/validation';

export interface StoredNutritionPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  version: number;
  dailyCalories: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  dailyWaterMl: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  // In-memory persistent stores with strict multi-tenant partition
  private readonly foods = new Map<string, IFoodItem>();
  private readonly mealLogs = new Map<string, IMealLog>();
  private readonly hydrationLogs = new Map<string, IHydrationLog>();
  private readonly nutritionPlans = new Map<string, StoredNutritionPlan>();

  constructor() {
    this.seedDefaultFoodDatabase();
  }

  // -------------------------------------------------------------
  // 1. DETERMINISTIC NUTRITION CALCULATION ENGINE
  // -------------------------------------------------------------

  /**
   * Deterministically calculates calories and macronutrients for a food item portion.
   * Ratio = quantity / servingSizeG.
   * Uses decimal precision rounding to prevent floating-point accumulation.
   */
  public calculatePortionNutrition(
    food: IFoodItem,
    quantity: number,
    servingUnit: string
  ): {
    totalWeightG: number;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
  } {
    if (quantity <= 0) {
      throw new BadRequestException({
        code: 'INVALID_QUANTITY',
        message: 'Quantity must be greater than zero',
      });
    }

    // Determine weight in grams based on serving definition
    let totalWeightG = quantity;
    if (servingUnit.toLowerCase() === 'serving' || servingUnit.toLowerCase() === 'piece') {
      totalWeightG = quantity * food.servingSizeG;
    }

    const ratio = totalWeightG / food.servingSizeG;

    return {
      totalWeightG: Math.round(totalWeightG * 10) / 10,
      calories: Math.round(food.calories * ratio),
      proteinGrams: Math.round(food.proteinGrams * ratio * 10) / 10,
      carbsGrams: Math.round(food.carbsGrams * ratio * 10) / 10,
      fatGrams: Math.round(food.fatGrams * ratio * 10) / 10,
      fiberGrams: Math.round((food.fiberGrams || 0) * ratio * 10) / 10,
    };
  }

  private recalculateMealTotals(meal: IMealLog): void {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const item of meal.items) {
      calories += item.calories;
      protein += item.proteinGrams;
      carbs += item.carbsGrams;
      fat += item.fatGrams;
    }

    meal.totalCalories = Math.round(calories);
    meal.totalProteinGrams = Math.round(protein * 10) / 10;
    meal.totalCarbsGrams = Math.round(carbs * 10) / 10;
    meal.totalFatGrams = Math.round(fat * 10) / 10;
    meal.updatedAt = new Date();
  }

  // -------------------------------------------------------------
  // 2. FOOD DATABASE & CUSTOM FOODS
  // -------------------------------------------------------------

  async getFoods(filter?: {
    search?: string;
    category?: FoodCategory;
    userId?: string;
  }): Promise<IFoodItem[]> {
    let list = Array.from(this.foods.values());

    // Filter by category
    if (filter?.category) {
      list = list.filter((f) => f.category === filter.category);
    }

    // Filter by name search
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.brand && f.brand.toLowerCase().includes(q))
      );
    }

    // User visibility: built-in foods OR custom foods owned by this user
    if (filter?.userId) {
      list = list.filter((f) => !f.isCustom || f.userId === filter.userId);
    } else {
      list = list.filter((f) => !f.isCustom);
    }

    return list;
  }

  async getFoodById(id: string, userId?: string): Promise<IFoodItem> {
    const food = this.foods.get(id);
    if (!food) {
      throw new NotFoundException({
        code: 'FOOD_NOT_FOUND',
        message: 'Food item not found',
      });
    }

    // If custom food, verify ownership
    if (food.isCustom && food.userId && userId && food.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied to this custom food record',
      });
    }

    return food;
  }

  async createCustomFood(userId: string, dto: CreateCustomFoodDto): Promise<IFoodItem> {
    const id = 'food_custom_' + HashUtil.generateUuid();
    const now = new Date();

    const customFood: IFoodItem = {
      id,
      name: dto.name,
      brand: dto.brand,
      barcode: dto.barcode,
      category: dto.category,
      servingSizeG: dto.servingSizeG,
      servingUnit: dto.servingUnit,
      calories: dto.calories,
      proteinGrams: dto.proteinGrams,
      carbsGrams: dto.carbsGrams,
      fatGrams: dto.fatGrams,
      fiberGrams: dto.fiberGrams || 0,
      sugarGrams: dto.sugarGrams || 0,
      sodiumMg: dto.sodiumMg || 0,
      isCustom: true,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    this.foods.set(id, customFood);
    this.logger.log(`Created custom food [${id}] for user [${userId}]`);
    return customFood;
  }

  // -------------------------------------------------------------
  // 3. MEALS & DAILY MEAL LOGGING
  // -------------------------------------------------------------

  async getMealsByDate(userId: string, dateStr?: string): Promise<IMealLog[]> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0]!;

    return Array.from(this.mealLogs.values())
      .filter((m) => m.userId === userId && m.logDate === targetDate)
      .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
  }

  async createMealLog(userId: string, dto: CreateMealLogDto): Promise<IMealLog> {
    const id = 'meal_' + HashUtil.generateUuid();
    const now = new Date();
    const logDate = dto.logDate || now.toISOString().split('T')[0]!;

    const meal: IMealLog = {
      id,
      userId,
      logDate,
      mealType: dto.mealType,
      name: dto.name,
      status: MealStatus.IN_PROGRESS,
      scheduledTime: dto.scheduledTime,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    // Add initial food items if provided
    if (dto.items && dto.items.length > 0) {
      for (const itemDto of dto.items) {
        const food = await this.getFoodById(itemDto.foodItemId, userId);
        const calculated = this.calculatePortionNutrition(
          food,
          itemDto.quantity,
          itemDto.servingUnit
        );

        const mealItem: IMealItem = {
          id: 'item_' + HashUtil.generateUuid(),
          mealLogId: id,
          foodItemId: food.id,
          foodName: food.name,
          quantity: itemDto.quantity,
          servingUnit: itemDto.servingUnit,
          totalWeightG: calculated.totalWeightG,
          calories: calculated.calories,
          proteinGrams: calculated.proteinGrams,
          carbsGrams: calculated.carbsGrams,
          fatGrams: calculated.fatGrams,
          fiberGrams: calculated.fiberGrams,
          createdAt: now,
        };

        meal.items.push(mealItem);
      }
    }

    this.recalculateMealTotals(meal);
    this.mealLogs.set(id, meal);
    this.logger.log(`Created meal log [${id}] for user [${userId}]`);
    return meal;
  }

  async addFoodToMeal(
    userId: string,
    mealLogId: string,
    dto: AddFoodToMealDto
  ): Promise<IMealLog> {
    const meal = await this.getMealLogById(userId, mealLogId);

    const food = await this.getFoodById(dto.foodItemId, userId);
    const calculated = this.calculatePortionNutrition(
      food,
      dto.quantity,
      dto.servingUnit
    );

    const mealItem: IMealItem = {
      id: 'item_' + HashUtil.generateUuid(),
      mealLogId,
      foodItemId: food.id,
      foodName: food.name,
      quantity: dto.quantity,
      servingUnit: dto.servingUnit,
      totalWeightG: calculated.totalWeightG,
      calories: calculated.calories,
      proteinGrams: calculated.proteinGrams,
      carbsGrams: calculated.carbsGrams,
      fatGrams: calculated.fatGrams,
      fiberGrams: calculated.fiberGrams,
      createdAt: new Date(),
    };

    meal.items.push(mealItem);
    this.recalculateMealTotals(meal);
    return meal;
  }

  async updateMealLog(
    userId: string,
    mealLogId: string,
    dto: UpdateMealLogDto
  ): Promise<IMealLog> {
    const meal = await this.getMealLogById(userId, mealLogId);

    if (dto.status !== undefined) meal.status = dto.status;
    if (dto.name !== undefined) meal.name = dto.name;
    if (dto.scheduledTime !== undefined) meal.scheduledTime = dto.scheduledTime;

    meal.updatedAt = new Date();
    return meal;
  }

  async completeMeal(userId: string, mealLogId: string): Promise<IMealLog> {
    const meal = await this.getMealLogById(userId, mealLogId);

    meal.status = MealStatus.COMPLETED;
    meal.completedAt = new Date();
    meal.updatedAt = new Date();

    this.logger.log(`Meal [${mealLogId}] marked COMPLETED for user [${userId}]`);
    return meal;
  }

  async deleteMealLog(userId: string, mealLogId: string): Promise<void> {
    await this.getMealLogById(userId, mealLogId);
    this.mealLogs.delete(mealLogId);
    this.logger.log(`Deleted meal log [${mealLogId}] for user [${userId}]`);
  }

  async getMealLogById(userId: string, mealLogId: string): Promise<IMealLog> {
    const meal = this.mealLogs.get(mealLogId);
    if (!meal) {
      throw new NotFoundException({
        code: 'MEAL_NOT_FOUND',
        message: 'Meal log not found',
      });
    }

    // Strict User Isolation
    if (meal.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied: You are not authorized to access this meal log',
      });
    }

    return meal;
  }

  // -------------------------------------------------------------
  // 4. HYDRATION ENGINE
  // -------------------------------------------------------------

  async getTodayHydration(userId: string, dateStr?: string): Promise<{
    date: string;
    totalAmountMl: number;
    targetMl: number;
    logs: IHydrationLog[];
  }> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0]!;
    const logs = Array.from(this.hydrationLogs.values())
      .filter((h) => h.userId === userId && h.logDate === targetDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalAmountMl = logs.reduce((acc, curr) => acc + curr.amountMl, 0);

    // Retrieve water target from plan or default 3000 ml
    const activePlan = await this.getActiveNutritionPlan(userId);
    const targetMl = activePlan ? activePlan.dailyWaterMl : 3000;

    return {
      date: targetDate,
      totalAmountMl,
      targetMl,
      logs,
    };
  }

  async logHydration(userId: string, dto: LogHydrationDto): Promise<IHydrationLog> {
    const id = 'hyd_' + HashUtil.generateUuid();
    const logDate = dto.logDate || new Date().toISOString().split('T')[0]!;

    const log: IHydrationLog = {
      id,
      userId,
      logDate,
      amountMl: dto.amountMl,
      createdAt: new Date(),
    };

    this.hydrationLogs.set(id, log);
    this.logger.log(`Logged ${dto.amountMl}ml hydration for user [${userId}]`);
    return log;
  }

  async deleteHydrationLog(userId: string, logId: string): Promise<void> {
    const log = this.hydrationLogs.get(logId);
    if (!log) {
      throw new NotFoundException({
        code: 'HYDRATION_LOG_NOT_FOUND',
        message: 'Hydration log not found',
      });
    }

    if (log.userId !== userId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied to this hydration log',
      });
    }

    this.hydrationLogs.delete(logId);
  }

  // -------------------------------------------------------------
  // 5. NUTRITION PLANS & VERSIONING
  // -------------------------------------------------------------

  async getNutritionPlans(userId: string): Promise<StoredNutritionPlan[]> {
    return Array.from(this.nutritionPlans.values()).filter((p) => p.userId === userId);
  }

  async getActiveNutritionPlan(userId: string): Promise<StoredNutritionPlan | null> {
    const plans = Array.from(this.nutritionPlans.values()).filter(
      (p) => p.userId === userId && p.isActive
    );
    return plans.length > 0 ? plans[0]! : null;
  }

  async createNutritionPlan(
    userId: string,
    dto: CreateNutritionPlanDto
  ): Promise<StoredNutritionPlan> {
    // Check if an existing plan exists to handle versioning
    const existing = await this.getActiveNutritionPlan(userId);
    const version = existing ? existing.version + 1 : 1;

    // Deactivate previous active plans
    if (existing) {
      existing.isActive = false;
    }

    const id = 'nplan_' + HashUtil.generateUuid();
    const now = new Date();

    const plan: StoredNutritionPlan = {
      id,
      userId,
      name: dto.name,
      description: dto.description,
      version,
      dailyCalories: dto.dailyCalories,
      dailyProteinG: dto.dailyProteinG,
      dailyCarbsG: dto.dailyCarbsG,
      dailyFatG: dto.dailyFatG,
      dailyWaterMl: dto.dailyWaterMl || 3000,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.nutritionPlans.set(id, plan);
    this.logger.log(`Created nutrition plan [${id}] v${version} for user [${userId}]`);
    return plan;
  }

  // -------------------------------------------------------------
  // 6. DAILY NUTRITION SUMMARY & ADHERENCE
  // -------------------------------------------------------------

  async getDailySummary(
    userId: string,
    dateStr?: string
  ): Promise<INutritionDailySummary> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0]!;
    const meals = await this.getMealsByDate(userId, targetDate);
    const hydration = await this.getTodayHydration(userId, targetDate);
    const plan = await this.getActiveNutritionPlan(userId);

    // Target defaults from active plan, or standard baseline
    const calorieTarget = plan ? plan.dailyCalories : 2200;
    const proteinTargetG = plan ? plan.dailyProteinG : 160;
    const carbsTargetG = plan ? plan.dailyCarbsG : 220;
    const fatTargetG = plan ? plan.dailyFatG : 65;
    const hydrationTargetMl = plan ? plan.dailyWaterMl : 3000;

    let caloriesConsumed = 0;
    let proteinConsumedG = 0;
    let carbsConsumedG = 0;
    let fatConsumedG = 0;
    let mealsCompleted = 0;

    for (const m of meals) {
      caloriesConsumed += m.totalCalories;
      proteinConsumedG += m.totalProteinGrams;
      carbsConsumedG += m.totalCarbsGrams;
      fatConsumedG += m.totalFatGrams;
      if (m.status === MealStatus.COMPLETED) {
        mealsCompleted++;
      }
    }

    caloriesConsumed = Math.round(caloriesConsumed);
    proteinConsumedG = Math.round(proteinConsumedG * 10) / 10;
    carbsConsumedG = Math.round(carbsConsumedG * 10) / 10;
    fatConsumedG = Math.round(fatConsumedG * 10) / 10;

    const caloriesRemaining = Math.max(0, calorieTarget - caloriesConsumed);

    // Adherence calculations: real data only, null if no target or no planned meals
    const calorieAdherencePercent =
      calorieTarget > 0
        ? Math.round((caloriesConsumed / calorieTarget) * 100)
        : null;

    const mealAdherencePercent =
      meals.length > 0
        ? Math.round((mealsCompleted / meals.length) * 100)
        : null;

    return {
      date: targetDate,
      calorieTarget,
      caloriesConsumed,
      caloriesRemaining,
      proteinTargetG,
      proteinConsumedG,
      carbsTargetG,
      carbsConsumedG,
      fatTargetG,
      fatConsumedG,
      hydrationTargetMl,
      hydrationConsumedMl: hydration.totalAmountMl,
      mealsPlanned: meals.length,
      mealsCompleted,
      calorieAdherencePercent,
      mealAdherencePercent,
    };
  }

  // -------------------------------------------------------------
  // 7. SEED FOOD DATABASE
  // -------------------------------------------------------------

  private seedDefaultFoodDatabase() {
    const defaults: Omit<IFoodItem, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'food_chicken_breast',
        name: 'Chicken Breast (Cooked)',
        category: FoodCategory.PROTEIN,
        servingSizeG: 100,
        servingUnit: 'g',
        calories: 165,
        proteinGrams: 31.0,
        carbsGrams: 0.0,
        fatGrams: 3.6,
        fiberGrams: 0.0,
        isCustom: false,
      },
      {
        id: 'food_whole_egg',
        name: 'Whole Large Egg',
        category: FoodCategory.PROTEIN,
        servingSizeG: 50,
        servingUnit: 'piece',
        calories: 72,
        proteinGrams: 6.3,
        carbsGrams: 0.4,
        fatGrams: 4.8,
        fiberGrams: 0.0,
        isCustom: false,
      },
      {
        id: 'food_egg_white',
        name: 'Egg Whites',
        category: FoodCategory.PROTEIN,
        servingSizeG: 100,
        servingUnit: 'g',
        calories: 52,
        proteinGrams: 11.0,
        carbsGrams: 0.7,
        fatGrams: 0.2,
        fiberGrams: 0.0,
        isCustom: false,
      },
      {
        id: 'food_rolled_oats',
        name: 'Rolled Oats (Dry)',
        category: FoodCategory.GRAINS,
        servingSizeG: 100,
        servingUnit: 'g',
        calories: 389,
        proteinGrams: 16.9,
        carbsGrams: 66.3,
        fatGrams: 6.9,
        fiberGrams: 10.6,
        isCustom: false,
      },
      {
        id: 'food_basmati_rice',
        name: 'White Basmati Rice (Cooked)',
        category: FoodCategory.GRAINS,
        servingSizeG: 100,
        servingUnit: 'g',
        calories: 130,
        proteinGrams: 2.7,
        carbsGrams: 28.2,
        fatGrams: 0.3,
        fiberGrams: 0.4,
        isCustom: false,
      },
      {
        id: 'food_salmon',
        name: 'Atlantic Salmon (Cooked)',
        category: FoodCategory.PROTEIN,
        servingSizeG: 100,
        servingUnit: 'g',
        calories: 206,
        proteinGrams: 22.1,
        carbsGrams: 0.0,
        fatGrams: 12.3,
        fiberGrams: 0.0,
        isCustom: false,
      },
      {
        id: 'food_whey_protein',
        name: 'Whey Protein Isolate',
        brand: 'Gold Standard',
        category: FoodCategory.SUPPLEMENTS,
        servingSizeG: 30,
        servingUnit: 'serving',
        calories: 120,
        proteinGrams: 24.0,
        carbsGrams: 1.5,
        fatGrams: 1.0,
        fiberGrams: 0.0,
        isCustom: false,
      },
      {
        id: 'food_greek_yogurt',
        name: 'Greek Yogurt (0% Fat)',
        category: FoodCategory.DAIRY,
        servingSizeG: 100,
        servingUnit: 'g',
        calories: 59,
        proteinGrams: 10.3,
        carbsGrams: 3.6,
        fatGrams: 0.4,
        fiberGrams: 0.0,
        isCustom: false,
      },
      {
        id: 'food_banana',
        name: 'Banana (Raw)',
        category: FoodCategory.FRUITS,
        servingSizeG: 118,
        servingUnit: 'piece',
        calories: 105,
        proteinGrams: 1.3,
        carbsGrams: 27.0,
        fatGrams: 0.3,
        fiberGrams: 3.1,
        isCustom: false,
      },
      {
        id: 'food_peanut_butter',
        name: 'Natural Peanut Butter',
        category: FoodCategory.NUTS_SEEDS,
        servingSizeG: 32,
        servingUnit: 'serving',
        calories: 190,
        proteinGrams: 8.0,
        carbsGrams: 7.0,
        fatGrams: 16.0,
        fiberGrams: 2.0,
        isCustom: false,
      },
      {
        id: 'food_olive_oil',
        name: 'Extra Virgin Olive Oil',
        category: FoodCategory.OILS,
        servingSizeG: 14,
        servingUnit: 'serving',
        calories: 119,
        proteinGrams: 0.0,
        carbsGrams: 0.0,
        fatGrams: 13.5,
        fiberGrams: 0.0,
        isCustom: false,
      },
      {
        id: 'food_broccoli',
        name: 'Broccoli (Steamed)',
        category: FoodCategory.VEGETABLES,
        servingSizeG: 100,
        servingUnit: 'g',
        calories: 35,
        proteinGrams: 2.4,
        carbsGrams: 7.2,
        fatGrams: 0.4,
        fiberGrams: 3.3,
        isCustom: false,
      },
    ];

    const now = new Date();
    defaults.forEach((d) => {
      this.foods.set(d.id, {
        ...d,
        createdAt: now,
        updatedAt: now,
      });
    });
  }
}
