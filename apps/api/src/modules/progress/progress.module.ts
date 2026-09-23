import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { CheckInsController } from './check-ins.controller';
import { CheckInsService } from './check-ins.service';
import { UsersModule } from '../users/users.module';
import { WorkoutsModule } from '../workouts/workouts.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { ActivityModule } from '../activity/activity.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    WorkoutsModule,
    NutritionModule,
    ActivityModule,
  ],
  controllers: [ProgressController, CheckInsController],
  providers: [ProgressService, CheckInsService],
  exports: [ProgressService, CheckInsService],
})
export class ProgressModule {}
