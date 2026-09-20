import { Injectable, ForbiddenException, Optional } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { ActivityService } from '../activity/activity.service';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class AiToolsService {
  constructor(
    @Optional() private readonly usersService?: UsersService,
    @Optional() private readonly workoutsService?: WorkoutsService,
    @Optional() private readonly nutritionService?: NutritionService,
    @Optional() private readonly activityService?: ActivityService,
    @Optional() private readonly progressService?: ProgressService,
  ) {}

  private verifyAuthorization(requestingUserId: string, targetUserId: string) {
    if (requestingUserId !== targetUserId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied: AI tools cannot access data belonging to another user',
      });
    }
  }

  async getUserProfile(requestingUserId: string, targetUserId: string) {
    this.verifyAuthorization(requestingUserId, targetUserId);
    if (!this.usersService) return null;
    return this.usersService.getProfile(targetUserId);
  }

  async getWorkoutHistory(requestingUserId: string, targetUserId: string, limit = 10) {
    this.verifyAuthorization(requestingUserId, targetUserId);
    if (!this.workoutsService) return [];
    return this.workoutsService.getUserSessions(targetUserId, limit);
  }

  async getNutritionSummary(requestingUserId: string, targetUserId: string, date?: string) {
    this.verifyAuthorization(requestingUserId, targetUserId);
    if (!this.nutritionService) return null;
    const d = date || new Date().toISOString().slice(0, 10);
    return this.nutritionService.getDailySummary(targetUserId, d);
  }

  async getActivitySummary(requestingUserId: string, targetUserId: string, date?: string) {
    this.verifyAuthorization(requestingUserId, targetUserId);
    if (!this.activityService) return null;
    return this.activityService.getDailySummary(targetUserId, date);
  }

  async getProgressSummary(requestingUserId: string, targetUserId: string) {
    this.verifyAuthorization(requestingUserId, targetUserId);
    if (!this.progressService) return null;
    return this.progressService.getOverview(targetUserId);
  }

  async getPersonalRecords(requestingUserId: string, targetUserId: string) {
    this.verifyAuthorization(requestingUserId, targetUserId);
    if (!this.progressService) return [];
    return this.progressService.getPersonalRecords(targetUserId);
  }
}
