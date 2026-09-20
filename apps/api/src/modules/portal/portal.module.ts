import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PortalService } from './portal.service';
import { OrganizationsController } from './organizations.controller';
import { ClientsController } from './clients.controller';
import { ProgramsController } from './programs.controller';
import { NutritionPlansController } from './nutrition-plans.controller';
import { PortalReportsController } from './reports.controller';
import { CalendarController } from './calendar.controller';
import { MessagesController } from './messages.controller';
import { CoachAiController } from './coach-ai.controller';
import { AuditController } from './audit.controller';
import { CoachClientGuard } from './guards/coach-client.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [
    OrganizationsController,
    ClientsController,
    ProgramsController,
    NutritionPlansController,
    PortalReportsController,
    CalendarController,
    MessagesController,
    CoachAiController,
    AuditController,
  ],
  providers: [PortalService, CoachClientGuard],
  exports: [PortalService, CoachClientGuard],
})
export class PortalModule {}
