import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from './queue.service';
import {
  IWorkoutCompletedEvent,
  IMissedWorkoutEvent,
  IPersonalRecordEvent,
  IMealLoggedEvent,
  ICoachAssignmentEvent,
  ICoachMessageEvent,
  IDispatchNotificationJobPayload,
} from '@alpha/types';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly queueService: QueueService,
  ) {}

  /**
   * Helper to dispatch an automation notification via the resilient queue
   */
  private async dispatchAutomationJob(
    jobName: string,
    payload: IDispatchNotificationJobPayload,
    idempotencyKey: string,
  ) {
    this.logger.log(`Dispatching automation job: ${jobName} [key=${idempotencyKey}]`);
    return this.queueService.addJob('NOTIFICATIONS_DISPATCH', jobName, payload, {
      idempotencyKey,
      maxAttempts: 3,
      backoffMs: 1000,
    });
  }

  // -------------------------------------------------------------
  // 1. WORKOUT AUTOMATIONS
  // -------------------------------------------------------------

  async handleWorkoutCompleted(event: IWorkoutCompletedEvent): Promise<void> {
    const idempotencyKey = `auto_workout_completed_${event.workoutId}`;

    const athletePayload: IDispatchNotificationJobPayload = {
      userId: event.userId,
      title: `Workout Completed: ${event.name}`,
      body: `Great effort! Total volume: ${event.volumeKg.toLocaleString()} kg${
        event.prCount ? ` with ${event.prCount} PRs!` : '.'
      }`,
      category: 'WORKOUT',
      type: 'WORKOUT_COMPLETED',
      deepLinkUrl: `alpha://workouts/session/${event.workoutId}`,
      data: { workoutId: event.workoutId, volumeKg: event.volumeKg },
    };

    await this.dispatchAutomationJob(
      `Workout Completed: ${event.name}`,
      athletePayload,
      idempotencyKey,
    );

    // Notify coach if assigned
    if (event.coachId) {
      const coachIdempotencyKey = `auto_coach_notif_workout_${event.workoutId}`;
      const coachPayload: IDispatchNotificationJobPayload = {
        userId: event.coachId,
        title: 'Client Completed Workout',
        body: `Athlete finished ${event.name} (${event.volumeKg.toLocaleString()} kg volume).`,
        category: 'COACH',
        type: 'CLIENT_WORKOUT_COMPLETED',
        deepLinkUrl: `alpha://portal/clients/${event.userId}`,
        data: { athleteId: event.userId, workoutId: event.workoutId },
      };

      await this.dispatchAutomationJob(
        `Coach Alert: Workout Completed`,
        coachPayload,
        coachIdempotencyKey,
      );
    }
  }

  async handleMissedWorkout(event: IMissedWorkoutEvent): Promise<void> {
    const idempotencyKey = `auto_missed_workout_${event.userId}_${event.scheduledDate}`;

    const payload: IDispatchNotificationJobPayload = {
      userId: event.userId,
      title: `Workout Missed: ${event.routineName}`,
      body: `You didn't log your workout for ${event.scheduledDate}. Would you like to reschedule or take a rest day?`,
      category: 'WORKOUT',
      type: 'MISSED_WORKOUT',
      deepLinkUrl: `alpha://workouts`,
      data: { routineName: event.routineName, scheduledDate: event.scheduledDate },
    };

    await this.dispatchAutomationJob(
      `Missed Workout: ${event.routineName}`,
      payload,
      idempotencyKey,
    );
  }

  async handlePersonalRecord(event: IPersonalRecordEvent): Promise<void> {
    const idempotencyKey = `auto_pr_${event.userId}_${event.exerciseName}_${event.weightKg}`;
    const deltaStr = event.previousMaxKg
      ? ` (+${(event.weightKg - event.previousMaxKg).toFixed(1)} kg)`
      : '';

    const payload: IDispatchNotificationJobPayload = {
      userId: event.userId,
      title: `🔥 New PR: ${event.exerciseName}!`,
      body: `You set a new personal record of ${event.weightKg} kg${deltaStr}! Keep ascending.`,
      category: 'PROGRESS',
      type: 'PR_ACHIEVED',
      deepLinkUrl: `alpha://progress/prs`,
      data: { exerciseName: event.exerciseName, weightKg: event.weightKg },
    };

    await this.dispatchAutomationJob(
      `PR: ${event.exerciseName}`,
      payload,
      idempotencyKey,
    );
  }

  // -------------------------------------------------------------
  // 2. NUTRITION AUTOMATIONS
  // -------------------------------------------------------------

  async handleMealLogged(event: IMealLoggedEvent): Promise<void> {
    const idempotencyKey = `auto_meal_${event.mealId}`;

    const payload: IDispatchNotificationJobPayload = {
      userId: event.userId,
      title: `Meal Logged: ${event.name}`,
      body: `Recorded ${event.calories} kcal (${event.proteinGrams}g protein). Fueling consistency.`,
      category: 'NUTRITION',
      type: 'MEAL_LOGGED',
      deepLinkUrl: `alpha://nutrition/meal/${event.mealId}`,
      data: { mealId: event.mealId, calories: event.calories, proteinGrams: event.proteinGrams },
    };

    await this.dispatchAutomationJob(
      `Meal Logged: ${event.name}`,
      payload,
      idempotencyKey,
    );
  }

  async handleDailyMacrosMet(
    userId: string,
    dateStr: string,
    stats: { calories: number; proteinGrams: number },
  ): Promise<void> {
    const idempotencyKey = `auto_macros_met_${userId}_${dateStr}`;

    const payload: IDispatchNotificationJobPayload = {
      userId,
      title: '🎯 Daily Targets Achieved!',
      body: `All nutrition targets met today (${stats.proteinGrams}g protein / ${stats.calories} kcal). Elite adherence!`,
      category: 'NUTRITION',
      type: 'DAILY_MACROS_MET',
      deepLinkUrl: 'alpha://nutrition',
      data: { date: dateStr, stats },
    };

    await this.dispatchAutomationJob(
      `Daily Targets Met: ${dateStr}`,
      payload,
      idempotencyKey,
    );
  }

  // -------------------------------------------------------------
  // 3. ACTIVITY & STREAK AUTOMATIONS
  // -------------------------------------------------------------

  async handleStepMilestone(userId: string, dateStr: string, steps: number): Promise<void> {
    const idempotencyKey = `auto_steps_${userId}_${dateStr}_${steps}`;

    const payload: IDispatchNotificationJobPayload = {
      userId,
      title: `👟 Step Milestone: ${steps.toLocaleString()} steps!`,
      body: `Daily movement target crushed. Active recovery on point.`,
      category: 'ACTIVITY',
      type: 'STEP_MILESTONE',
      deepLinkUrl: 'alpha://activity',
      data: { date: dateStr, steps },
    };

    await this.dispatchAutomationJob(
      `Step Milestone: ${steps}`,
      payload,
      idempotencyKey,
    );
  }

  async handleStreakPreserved(userId: string, streakDays: number): Promise<void> {
    const idempotencyKey = `auto_streak_${userId}_${streakDays}`;

    const payload: IDispatchNotificationJobPayload = {
      userId,
      title: `⚡ ${streakDays}-Day Consistency Streak!`,
      body: `Unstoppable momentum. Your discipline is compounding daily.`,
      category: 'ACTIVITY',
      type: 'STREAK_PRESERVED',
      deepLinkUrl: 'alpha://progress',
      data: { streakDays },
    };

    await this.dispatchAutomationJob(
      `Streak Milestone: ${streakDays} days`,
      payload,
      idempotencyKey,
    );
  }

  // -------------------------------------------------------------
  // 4. COACH PORTAL AUTOMATIONS
  // -------------------------------------------------------------

  async handleCoachAssignment(event: ICoachAssignmentEvent): Promise<void> {
    const idempotencyKey = `auto_coach_assign_${event.assignmentType}_${event.assignmentId}_${event.athleteId}`;
    const isProgram = event.assignmentType === 'PROGRAM';

    const payload: IDispatchNotificationJobPayload = {
      userId: event.athleteId,
      title: `Coach ${event.coachName} Assigned a ${isProgram ? 'Workout Program' : 'Meal Plan'}`,
      body: `"${event.assignmentName}" is now active in your ALPHA dashboard.`,
      category: isProgram ? 'WORKOUT' : 'NUTRITION',
      type: isProgram ? 'PROGRAM_ASSIGNED' : 'MEAL_PLAN_ASSIGNED',
      deepLinkUrl: isProgram
        ? `alpha://workouts/programs/${event.assignmentId}`
        : `alpha://nutrition/plans/${event.assignmentId}`,
      data: {
        coachId: event.coachId,
        assignmentId: event.assignmentId,
        assignmentType: event.assignmentType,
      },
    };

    await this.dispatchAutomationJob(
      `Coach Assignment: ${event.assignmentName}`,
      payload,
      idempotencyKey,
    );
  }

  async handleCoachMessage(event: ICoachMessageEvent): Promise<void> {
    const timestamp = Date.now();
    const idempotencyKey = `auto_msg_${event.senderId}_${event.recipientId}_${timestamp}`;

    const truncated =
      event.preview.length > 70 ? `${event.preview.substring(0, 70)}...` : event.preview;

    const payload: IDispatchNotificationJobPayload = {
      userId: event.recipientId,
      title: `Message from ${event.senderName}`,
      body: truncated,
      category: 'MESSAGES',
      type: 'COACH_MESSAGE_SENT',
      deepLinkUrl: 'alpha://portal/messages',
      data: {
        senderId: event.senderId,
        conversationId: event.conversationId,
      },
    };

    await this.dispatchAutomationJob(
      `Coach Message from ${event.senderName}`,
      payload,
      idempotencyKey,
    );
  }

  // -------------------------------------------------------------
  // 5. AI COACH INSIGHT AUTOMATIONS
  // -------------------------------------------------------------

  async handleAiInsight(
    userId: string,
    insightId: string,
    insight: { title: string; summary: string },
  ): Promise<void> {
    const idempotencyKey = `auto_ai_insight_${userId}_${insightId}`;

    const truncated =
      insight.summary.length > 80 ? `${insight.summary.substring(0, 80)}...` : insight.summary;

    const payload: IDispatchNotificationJobPayload = {
      userId,
      title: `💡 AI Coach Insight: ${insight.title}`,
      body: truncated,
      category: 'PROGRESS',
      type: 'AI_INSIGHT_AVAILABLE',
      deepLinkUrl: 'alpha://ai/insights',
      data: { insightId },
    };

    await this.dispatchAutomationJob(
      `AI Insight: ${insight.title}`,
      payload,
      idempotencyKey,
    );
  }
}
