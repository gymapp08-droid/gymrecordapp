import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IAuthUser, IReminder } from '@alpha/types';
import { CreateReminderDto, UpdateReminderDto } from '@alpha/validation';
import { RemindersService } from '../services/reminders.service';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  async list(@CurrentUser() user: IAuthUser): Promise<IReminder[]> {
    return this.remindersService.getUserReminders(user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: IAuthUser,
    @Body() dto: CreateReminderDto,
  ): Promise<IReminder> {
    return this.remindersService.createReminder(user.id, dto);
  }

  @Get(':id')
  async get(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ): Promise<IReminder> {
    return this.remindersService.getReminderById(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ): Promise<IReminder> {
    return this.remindersService.updateReminder(user.id, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.remindersService.deleteReminder(user.id, id);
  }

  @Post(':id/snooze')
  async snooze(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
    @Body('minutes') minutes?: number,
  ) {
    return this.remindersService.snoozeReminder(user.id, id, minutes);
  }

  @Get(':id/evaluate')
  async evaluate(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ) {
    return this.remindersService.shouldSuppressReminder(user.id, id);
  }
}

