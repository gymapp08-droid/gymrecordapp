import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import { CreateCalendarEventDto } from '@alpha/validation';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly portalService: PortalService) {}

  @Post('events')
  async createEvent(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.portalService.createCalendarEvent(user.id, user.role, dto, user.organizationId);
  }

  @Get('events')
  async listEvents(
    @CurrentUser() user: IAuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.portalService.listCalendarEvents(user.id, user.role, from, to, user.organizationId);
  }
}
