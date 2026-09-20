import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser, FoodCategory } from '@alpha/types';
import { NutritionService } from './nutrition.service';
import {
  CreateMealLogDto,
  UpdateMealLogDto,
  AddFoodToMealDto,
  CreateCustomFoodDto,
  LogHydrationDto,
  CreateNutritionPlanDto,
} from '@alpha/validation';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  // -------------------------------------------------------------
  // NUTRITION SUMMARY & DASHBOARD
  // -------------------------------------------------------------

  @Get('nutrition/today')
  async getTodayNutrition(
    @CurrentUser() user: IAuthUser,
    @Query('date') date?: string
  ) {
    return this.nutritionService.getDailySummary(user.id, date);
  }

  @Get('nutrition/history')
  async getNutritionHistory(
    @CurrentUser() user: IAuthUser,
    @Query('date') date?: string
  ) {
    return this.nutritionService.getMealsByDate(user.id, date);
  }

  // -------------------------------------------------------------
  // NUTRITION PLANS & VERSIONING
  // -------------------------------------------------------------

  @Get('nutrition/plans')
  async getNutritionPlans(@CurrentUser() user: IAuthUser) {
    return this.nutritionService.getNutritionPlans(user.id);
  }

  @Post('nutrition/plans')
  @HttpCode(HttpStatus.CREATED)
  async createNutritionPlan(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateNutritionPlanDto
  ) {
    return this.nutritionService.createNutritionPlan(user.id, dto);
  }

  // -------------------------------------------------------------
  // MEALS
  // -------------------------------------------------------------

  @Get('meals/today')
  async getTodayMeals(
    @CurrentUser() user: IAuthUser,
    @Query('date') date?: string
  ) {
    return this.nutritionService.getMealsByDate(user.id, date);
  }

  @Post('meals/logs')
  @HttpCode(HttpStatus.CREATED)
  async createMealLog(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateMealLogDto
  ) {
    return this.nutritionService.createMealLog(user.id, dto);
  }

  @Patch('meals/logs/:id')
  async updateMealLog(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMealLogDto
  ) {
    return this.nutritionService.updateMealLog(user.id, id, dto);
  }

  @Delete('meals/logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMealLog(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string
  ) {
    return this.nutritionService.deleteMealLog(user.id, id);
  }

  @Post('meals/logs/:id/items')
  @HttpCode(HttpStatus.CREATED)
  async addFoodToMeal(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
    @Body() dto: AddFoodToMealDto
  ) {
    return this.nutritionService.addFoodToMeal(user.id, id, dto);
  }

  @Post('meals/logs/:id/complete')
  async completeMeal(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string
  ) {
    return this.nutritionService.completeMeal(user.id, id);
  }

  // -------------------------------------------------------------
  // FOOD DATABASE
  // -------------------------------------------------------------

  @Get('foods')
  async getFoods(
    @CurrentUser() user: IAuthUser,
    @Query('search') search?: string,
    @Query('category') category?: FoodCategory
  ) {
    return this.nutritionService.getFoods({
      search,
      category,
      userId: user.id,
    });
  }

  @Get('foods/:id')
  async getFoodById(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string
  ) {
    return this.nutritionService.getFoodById(id, user.id);
  }

  @Post('foods/custom')
  @HttpCode(HttpStatus.CREATED)
  async createCustomFood(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateCustomFoodDto
  ) {
    return this.nutritionService.createCustomFood(user.id, dto);
  }

  // -------------------------------------------------------------
  // HYDRATION
  // -------------------------------------------------------------

  @Get('hydration/today')
  async getTodayHydration(
    @CurrentUser() user: IAuthUser,
    @Query('date') date?: string
  ) {
    return this.nutritionService.getTodayHydration(user.id, date);
  }

  @Post('hydration/logs')
  @HttpCode(HttpStatus.CREATED)
  async logHydration(
    @CurrentUser() user: IAuthUser,
    @Body() dto: LogHydrationDto
  ) {
    return this.nutritionService.logHydration(user.id, dto);
  }

  @Delete('hydration/logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHydrationLog(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string
  ) {
    return this.nutritionService.deleteHydrationLog(user.id, id);
  }
}
