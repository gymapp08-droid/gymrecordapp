import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser, UserRole, IWeeklyCheckInSubmission } from '@alpha/types';

@Controller('progress/check-ins')
@UseGuards(JwtAuthGuard)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  async submitCheckIn(
    @CurrentUser() user: IAuthUser,
    @Body() dto: IWeeklyCheckInSubmission,
  ) {
    return this.checkInsService.submitWeeklyCheckIn(user.id, dto);
  }

  @Get('latest')
  async getLatestCheckIn(@CurrentUser() user: IAuthUser) {
    return this.checkInsService.getLatestCheckIn(user.id);
  }

  @Get('history')
  async getCheckInHistory(@CurrentUser() user: IAuthUser) {
    return this.checkInsService.getCheckInHistory(user.id);
  }

  @Get(':id')
  async getCheckInById(
    @CurrentUser() user: IAuthUser,
    @Param('id') checkInId: string,
  ) {
    return this.checkInsService.getCheckInById(user, checkInId);
  }

  @Post(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.COACH, UserRole.ADMIN)
  async reviewCheckIn(
    @CurrentUser() reviewer: IAuthUser,
    @Param('id') checkInId: string,
    @Body('reviewNotes') reviewNotes: string,
  ) {
    return this.checkInsService.reviewCheckIn(reviewer, checkInId, reviewNotes);
  }
}
