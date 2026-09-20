import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import {
  CreateMealPlanDto,
  AssignMealPlanDto,
} from '@alpha/validation';

@Controller('nutrition-plans')
@UseGuards(JwtAuthGuard)
export class NutritionPlansController {
  constructor(private readonly portalService: PortalService) {}

  @Post()
  async createMealPlan(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateMealPlanDto,
  ) {
    return this.portalService.createMealPlan(user.id, user.role, dto);
  }

  @Post('assign')
  async assignMealPlan(
    @CurrentUser() user: IAuthUser,
    @Body() dto: AssignMealPlanDto,
  ) {
    return this.portalService.assignMealPlan(user.id, user.role, dto);
  }
}
