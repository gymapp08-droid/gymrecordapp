import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MockPushNotificationProvider } from './providers/mock-push.provider';
import { DevicesService } from './services/devices.service';
import { RemindersService } from './services/reminders.service';
import { NotificationsService } from './services/notifications.service';
import { DevicesController } from './controllers/devices.controller';
import { RemindersController } from './controllers/reminders.controller';
import { NotificationsController } from './controllers/notifications.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    NotificationsController,
    DevicesController,
    RemindersController,
  ],
  providers: [
    MockPushNotificationProvider,
    DevicesService,
    RemindersService,
    NotificationsService,
  ],
  exports: [
    MockPushNotificationProvider,
    DevicesService,
    RemindersService,
    NotificationsService,
  ],
})
export class NotificationsModule {}
