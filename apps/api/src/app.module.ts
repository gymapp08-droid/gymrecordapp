import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ProgressModule } from './modules/progress/progress.module';
import { AiModule } from './modules/ai/ai.module';
import { PortalModule } from './modules/portal/portal.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QueueModule } from './modules/queue/queue.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    HealthModule,
    WorkoutsModule,
    NutritionModule,
    ActivityModule,
    ProgressModule,
    AiModule,
    PortalModule,
    NotificationsModule,
    QueueModule,
    AnalyticsModule,
    EnterpriseModule,
    PrivacyModule,
    IntegrationsModule,
    AdminModule,
  ],
})
export class AppModule {}

