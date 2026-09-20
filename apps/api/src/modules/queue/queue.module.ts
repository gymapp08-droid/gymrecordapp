import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueueService } from './services/queue.service';
import { WorkerService } from './services/worker.service';
import { ReminderSchedulerService } from './services/reminder-scheduler.service';
import { AutomationsService } from './services/automations.service';
import { QueueController } from './controllers/queue.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [QueueController],
  providers: [
    QueueService,
    WorkerService,
    ReminderSchedulerService,
    AutomationsService,
  ],
  exports: [
    QueueService,
    WorkerService,
    ReminderSchedulerService,
    AutomationsService,
  ],
})
export class QueueModule {}
