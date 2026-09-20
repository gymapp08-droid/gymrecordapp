import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiContextBuilderService } from './ai-context-builder.service';
import { AiToolsService } from './ai-tools.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { MockAiProvider } from './providers/mock-ai.provider';
import { UsersModule } from '../users/users.module';
import { WorkoutsModule } from '../workouts/workouts.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { ActivityModule } from '../activity/activity.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    UsersModule,
    WorkoutsModule,
    NutritionModule,
    ActivityModule,
    ProgressModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiContextBuilderService,
    AiToolsService,
    AiRateLimiterService,
    MockAiProvider,
  ],
  exports: [AiService, AiToolsService, AiContextBuilderService],
})
export class AiModule {}
