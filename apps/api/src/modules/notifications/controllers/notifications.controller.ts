import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IAuthUser, INotification, INotificationPreference } from '@alpha/types';
import {
  NotificationQueryDto,
  UpdateNotificationPreferencesDto,
  SendNotificationDto,
} from '@alpha/validation';
import { NotificationsService } from '../services/notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: IAuthUser,
    @Query() query: NotificationQueryDto,
  ): Promise<{
    data: INotification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.notificationsService.getNotifications(user.id, query);
  }

  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser() user: IAuthUser,
  ): Promise<{ unreadCount: number }> {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ): Promise<INotification> {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Post('read-all')
  async markAllAsRead(
    @CurrentUser() user: IAuthUser,
  ): Promise<{ count: number }> {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.notificationsService.deleteNotification(user.id, id);
  }

  @Get('preferences')
  async getPreferences(
    @CurrentUser() user: IAuthUser,
  ): Promise<INotificationPreference> {
    return this.notificationsService.getUserPreferences(user.id);
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: IAuthUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<INotificationPreference> {
    return this.notificationsService.updateUserPreferences(user.id, dto);
  }

  /**
   * Internal endpoint to trigger a notification
   */
  @Post('send')
  async send(
    @CurrentUser() user: IAuthUser,
    @Body() dto: SendNotificationDto,
  ): Promise<INotification> {
    return this.notificationsService.sendNotification({
      userId: dto.userId || user.id,
      title: dto.title,
      body: dto.body,
      category: dto.category as any,
      type: dto.type,
      data: dto.data,
      deepLinkUrl: dto.deepLinkUrl,
    });
  }
}
