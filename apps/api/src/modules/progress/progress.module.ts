import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { UsersModule } from '../users/users.module';
import { WorkoutsModule } from '../workouts/workouts.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    UsersModule,
    WorkoutsModule,
    NutritionModule,
    ActivityModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
