import { Injectable } from '@nestjs/common';
import { IAIProvider } from './ai-provider.interface';
import {
  IAIContext,
  IAIChatResponse,
  IAIInsight,
  IAIMessage,
  AIActionType,
  AIInsightType,
  IAIActionProposal,
} from '@alpha/types';
import { HashUtil } from '@alpha/utils';

@Injectable()
export class MockAiProvider implements IAIProvider {
  public readonly name = 'MockAiProvider';
  public static readonly PROMPT_VERSION = 'v1.0';

  async generateResponse(
    query: string,
    context: IAIContext,
    _history?: IAIMessage[],
  ): Promise<IAIChatResponse> {
    const q = query.toLowerCase();

    // 1. Check for Heart Rate questions (Strict zero-hallucination test from Sec. 58)
    if (q.includes('heart rate') || q.includes('heart-rate') || q.includes('hr')) {
      if (context.dataAvailability.hasHeartRate && context.todayActivity?.heartRateAvg) {
        return {
          message: `Based on your recorded activity data, your average heart rate today was ${context.todayActivity.heartRateAvg} bpm.`,
          tokenUsage: { promptTokens: 42, completionTokens: 25, totalTokens: 67 },
          model: 'alpha-intelligence-v1',
          promptVersion: MockAiProvider.PROMPT_VERSION,
          citations: ['ActivityRecord'],
        };
      } else {
        return {
          message: "I don't have recorded heart-rate data for yesterday.",
          tokenUsage: { promptTokens: 30, completionTokens: 12, totalTokens: 42 },
          model: 'alpha-intelligence-v1',
          promptVersion: MockAiProvider.PROMPT_VERSION,
        };
      }
    }

    // 2. Check for Calories burned questions (Strict zero-hallucination test from Sec. 58)
    if (q.includes('calories') && (q.includes('burn') || q.includes('burned') || q.includes('active'))) {
      if (context.todayActivity && context.todayActivity.activeCalories > 0) {
        return {
          message: `Based on your recorded activity data, you burned ${context.todayActivity.activeCalories} active calories today.`,
          tokenUsage: { promptTokens: 38, completionTokens: 20, totalTokens: 58 },
          model: 'alpha-intelligence-v1',
          promptVersion: MockAiProvider.PROMPT_VERSION,
          citations: ['ActivityRecord'],
        };
      } else {
        return {
          message: 'Calories are unavailable from your recorded activity data.',
          tokenUsage: { promptTokens: 32, completionTokens: 10, totalTokens: 42 },
          model: 'alpha-intelligence-v1',
          promptVersion: MockAiProvider.PROMPT_VERSION,
        };
      }
    }

    // 2b. Check for Body Fat percentage (Gate C zero-fabrication)
    if (q.includes('body fat') || q.includes('body-fat')) {
      if (context.dataAvailability.hasBodyFat && context.progress?.bodyFatPercent != null) {
        return {
          message: `Based on your recorded body metrics, your latest body-fat percentage is ${context.progress.bodyFatPercent}%.`,
          tokenUsage: { promptTokens: 36, completionTokens: 18, totalTokens: 54 },
          model: 'alpha-intelligence-v1',
          promptVersion: MockAiProvider.PROMPT_VERSION,
          citations: ['BodyMetric'],
        };
      } else {
        return {
          message: 'Body-fat percentage is unavailable from your recorded metrics.',
          tokenUsage: { promptTokens: 30, completionTokens: 10, totalTokens: 40 },
          model: 'alpha-intelligence-v1',
          promptVersion: MockAiProvider.PROMPT_VERSION,
        };
      }
    }

    // 2c. Check for Sleep data (Gate C zero-fabrication)
    if (q.includes('sleep')) {
      return {
        message: "I don't have recorded sleep data available.",
        tokenUsage: { promptTokens: 28, completionTokens: 9, totalTokens: 37 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
      };
    }

    // 2d. Cross-Module Goal & Progress Synthesis (Gate C)
    if (q.includes('progress towards my goal') || q.includes('am i on track') || q.includes('goal progress')) {
      const weightUnit = context.unitSystem === 'IMPERIAL' ? 'lbs' : 'kg';
      const weightMultiplier = context.unitSystem === 'IMPERIAL' ? 2.20462 : 1.0;
      const currentWt = context.currentWeightKg ? (context.currentWeightKg * weightMultiplier).toFixed(1) : '79.8';
      const targetWt = context.goals?.targetWeightKg ? (context.goals.targetWeightKg * weightMultiplier).toFixed(1) : '82.0';

      const calConsumed = context.todayNutrition?.caloriesConsumed ?? 0;
      const calTarget = context.goals?.dailyCalorieTarget ?? 2600;
      const steps = context.todayActivity?.stepCount ?? 0;
      const stepTarget = context.goals?.dailyStepTarget ?? 10000;

      return {
        message: `Goal Synthesis for ${context.userName || 'Athlete'}: Your primary goal is ${context.goals?.primaryGoal || context.primaryGoal}. Current weight is ${currentWt} ${weightUnit} towards your target of ${targetWt} ${weightUnit}. Training consistency is at ${context.workoutConsistencyPercent}% across ${context.goals?.weeklyWorkoutDays || 4} target weekly sessions. Today's nutrition is ${calConsumed}/${calTarget} kcal and activity is ${steps}/${stepTarget} steps in your timezone (${context.timezone}). You are on track.`,
        tokenUsage: { promptTokens: 85, completionTokens: 60, totalTokens: 145 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['UserProfile', 'UserGoal', 'WorkoutSession', 'DailyMealLog', 'ActivityRecord', 'ProgressOverview'],
      };
    }

    // 2e. Deterministic Weight Trajectory / Weight Change (Gate C)
    if (q.includes('weight change') || q.includes('how much weight have i')) {
      const weightUnit = context.unitSystem === 'IMPERIAL' ? 'lbs' : 'kg';
      const weightMultiplier = context.unitSystem === 'IMPERIAL' ? 2.20462 : 1.0;
      const changeVal = context.progress?.weightChangeKg != null
        ? (context.progress.weightChangeKg * weightMultiplier).toFixed(1)
        : '0.0';
      const changeSign = parseFloat(changeVal) >= 0 ? `+${changeVal}` : changeVal;

      return {
        message: `According to your authoritative progress logs, your net weight change is ${changeSign} ${weightUnit}.`,
        tokenUsage: { promptTokens: 40, completionTokens: 18, totalTokens: 58 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['ProgressOverview'],
      };
    }

    // 2f. Timezone & Date Range Awareness (Gate C)
    if (q.includes('what is my timezone') || q.includes('date range for today')) {
      return {
        message: `Your configured timezone is ${context.timezone}. Bounded date window for today is from ${context.dateRange.start} to ${context.dateRange.end}.`,
        tokenUsage: { promptTokens: 35, completionTokens: 22, totalTokens: 57 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['UserPreference'],
      };
    }

    // 2g. Medical & Symptom Safety Guard (Section 37) - Prioritized before fitness logic
    if (q.includes('chest pain') || q.includes('doctor') || q.includes('diagnose') || q.includes('medication') || q.includes('heart pain') || q.includes('medical condition')) {
      return {
        message: 'ALPHA AI Coach is a fitness and performance assistant, not a medical diagnostic system. I cannot diagnose conditions, prescribe medications, or provide emergency medical advice. Please consult a qualified physician or healthcare provider immediately for medical concerns.',
        tokenUsage: { promptTokens: 40, completionTokens: 45, totalTokens: 85 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['SafetyGuidelines'],
      };
    }

    // 2h. Reckless Workout Progression Safety Guard (Section 39) - Prioritized before fitness logic
    if (q.includes('double my weight') || q.includes('increase bench by 50') || q.includes('reckless')) {
      return {
        message: 'Sudden, drastic load increases significantly increase the risk of tendonitis, muscle tears, and acute injury. Progressive overload must be incremental (typically 2.5% to 5% per week). Reckless progression is strongly advised against.',
        tokenUsage: { promptTokens: 45, completionTokens: 42, totalTokens: 87 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['WorkoutSafetyGuidelines'],
      };
    }

    // 2i. Dangerous Crash Dieting Safety Guard (Section 38) - Prioritized before fitness logic
    if (q.includes('crash diet') || q.includes('eat 500 calories') || q.includes('starve')) {
      return {
        message: 'Severe caloric restriction below safe biological minimums induces lean muscle loss, metabolic suppression, and hormonal dysfunction. Safe fat loss protocols recommend a modest deficit of 300–500 kcal below maintenance.',
        tokenUsage: { promptTokens: 42, completionTokens: 40, totalTokens: 82 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['NutritionSafetyGuidelines'],
      };
    }

    // 3. Check for Bench Press / Strength Progression questions
    if (q.includes('bench') || q.includes('progressing on bench') || q.includes('why did my bench')) {
      const benchPR = context.recentPRs.find((pr) => pr.exerciseName.toLowerCase().includes('bench'));
      const benchVal = benchPR ? `${benchPR.value} kg` : '120.0 kg';
      return {
        message: `Based on your last logged sessions, your training volume on the Barbell Bench Press has steadily progressed. Your current recorded personal record is ${benchVal}, supported by a ${context.workoutConsistencyPercent}% overall workout consistency.`,
        tokenUsage: { promptTokens: 65, completionTokens: 40, totalTokens: 105 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['WorkoutHistory', 'PersonalRecords'],
      };
    }

    // 4. Check for Workout Suggestions (Produces structured Action Proposal)
    if (q.includes('suggest a workout') || q.includes('workout for today') || q.includes('suggest workout')) {
      const proposal: IAIActionProposal = {
        id: 'prop_' + HashUtil.generateUuid(),
        type: AIActionType.SUGGEST_WORKOUT_CHANGE,
        title: 'Upper Body Hypertrophy Push Session',
        summary: 'Targeted chest, shoulder, and tricep stimulus aligned with your hypertrophy goal.',
        payload: {
          title: 'Upper Body Hypertrophy Push Session',
          exercises: [
            { name: 'Barbell Bench Press', sets: 4, reps: 10, rpe: 8 },
            { name: 'Incline Dumbbell Press', sets: 3, reps: 12, rpe: 8 },
            { name: 'Standing Overhead Press', sets: 3, reps: 10, rpe: 7.5 },
            { name: 'Cable Tricep Pushdown', sets: 4, reps: 12, rpe: 9 },
          ],
        },
        requiresConfirmation: true,
        status: 'PENDING_CONFIRMATION',
        createdAt: new Date(),
      };

      return {
        message: 'I have prepared a customized Upper Body Hypertrophy session based on your primary goal and recent recovery. Please review the proposed workout plan below.',
        actionProposals: [proposal],
        tokenUsage: { promptTokens: 80, completionTokens: 55, totalTokens: 135 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['UserGoals', 'WorkoutTemplates'],
      };
    }

    // 4b. Check for Meal / Nutrition Suggestions (Gate D Action Proposal)
    if (q.includes('suggest a meal') || q.includes('suggest meal') || q.includes('recommend a meal') || q.includes('suggest nutrition change')) {
      const proposal: IAIActionProposal = {
        id: 'prop_' + HashUtil.generateUuid(),
        type: AIActionType.SUGGEST_MEAL_CHANGE,
        title: 'High-Protein Post-Workout Fuel',
        summary: 'Balanced recovery meal tailored for muscle protein synthesis and glycogen replenishment.',
        payload: {
          mealType: 'LUNCH',
          name: 'Grilled Salmon Bowl with Quinoa & Steamed Greens',
          calories: 680,
          proteinG: 52,
          carbsG: 65,
          fatG: 18,
        },
        requiresConfirmation: true,
        status: 'PENDING_CONFIRMATION',
        createdAt: new Date(),
      };

      return {
        message: 'I have prepared a high-protein recovery meal proposal aligned with your macro targets. Please review the proposed meal below before applying it to your nutrition logs.',
        actionProposals: [proposal],
        tokenUsage: { promptTokens: 75, completionTokens: 48, totalTokens: 123 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['DailyMealLog', 'UserGoals'],
      };
    }

    // 4c. Check for Goal Suggestions / Adjustments (Gate D Action Proposal)
    if (q.includes('adjust my goal') || q.includes('suggest goal') || q.includes('update goal') || q.includes('suggest goal adjustment')) {
      const proposal: IAIActionProposal = {
        id: 'prop_' + HashUtil.generateUuid(),
        type: AIActionType.SUGGEST_GOAL_ADJUSTMENT,
        title: 'Progressive Hypertrophy Goal Calibration',
        summary: 'Recalibrated targets reflecting your 85% workout consistency and steady strength progression.',
        payload: {
          primaryGoal: 'HYPERTROPHY',
          targetWeightKg: 83.0,
          targetDailyCalories: 2800,
          targetDailySteps: 12000,
          targetWeeklyWorkouts: 5,
        },
        requiresConfirmation: true,
        status: 'PENDING_CONFIRMATION',
        createdAt: new Date(),
      };

      return {
        message: 'Based on your recent consistency and training volume, I have prepared a calibrated goal adjustment proposal. Review the suggested targets below.',
        actionProposals: [proposal],
        tokenUsage: { promptTokens: 78, completionTokens: 50, totalTokens: 128 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
        citations: ['UserProfile', 'UserGoal', 'ProgressOverview'],
      };
    }

    // 5. Check for Nutrition Analysis
    if (q.includes('nutrition') || q.includes('diet') || q.includes('macros')) {
      if (context.todayNutrition && context.dataAvailability.hasNutrition) {
        return {
          message: `From your logged nutrition data today, you have consumed ${context.todayNutrition.caloriesConsumed} kcal out of your ${context.todayNutrition.calorieTarget} kcal target, with ${context.todayNutrition.proteinConsumedG}g of protein. Your meal adherence is currently ${context.todayNutrition.adherencePercent ?? 85}%.`,
          tokenUsage: { promptTokens: 55, completionTokens: 35, totalTokens: 90 },
          model: 'alpha-intelligence-v1',
          promptVersion: MockAiProvider.PROMPT_VERSION,
          citations: ['DailyMealLog', 'HydrationLog'],
        };
      } else {
        return {
          message: "I don't have enough recorded nutrition data for today to analyze your intake reliably.",
          tokenUsage: { promptTokens: 35, completionTokens: 16, totalTokens: 51 },
          model: 'alpha-intelligence-v1',
          promptVersion: MockAiProvider.PROMPT_VERSION,
        };
      }
    }

    // 6. Check for Motivation / Weekly Summary
    if (q.includes('motivation') || q.includes('inspire') || q.includes('focus')) {
      return {
        message: `Stay relentless, ${context.userName || 'Athlete'}. You have completed your scheduled training sessions with a ${context.workoutConsistencyPercent}% monthly consistency rate. Discipline builds momentum—focus on executing your next session with perfect form.`,
        tokenUsage: { promptTokens: 50, completionTokens: 35, totalTokens: 85 },
        model: 'alpha-intelligence-v1',
        promptVersion: MockAiProvider.PROMPT_VERSION,
      };
    }

    // Default Contextual Synthesis
    return {
      message: `Hello ${context.userName || 'Athlete'}, I am your ALPHA AI Coach. Based on your current profile, your primary goal is ${context.primaryGoal} and your 30-day training consistency is ${context.workoutConsistencyPercent}%. How can I assist your training or nutrition today?`,
      tokenUsage: { promptTokens: 45, completionTokens: 35, totalTokens: 80 },
      model: 'alpha-intelligence-v1',
      promptVersion: MockAiProvider.PROMPT_VERSION,
      citations: ['UserProfile', 'WorkoutConsistency'],
    };
  }

  async generateInsights(context: IAIContext): Promise<IAIInsight[]> {
    const insights: IAIInsight[] = [];
    const now = new Date();

    // 1. Workout consistency insight
    if (context.workoutConsistencyPercent >= 80) {
      insights.push({
        id: 'ins_' + HashUtil.generateUuid(),
        userId: context.userId,
        type: AIInsightType.WORKOUT_CONSISTENCY,
        title: 'High Training Consistency',
        summary: `You maintained a ${context.workoutConsistencyPercent}% workout completion rate over the last 30 days. Excellent adherence.`,
        sourceData: { consistencyPercent: context.workoutConsistencyPercent },
        confidence: 'HIGH',
        createdAt: now,
      });
    }

    // 2. Strength progress insight
    if (context.recentPRs.length > 0) {
      const topPR = context.recentPRs[0]!;
      insights.push({
        id: 'ins_' + HashUtil.generateUuid(),
        userId: context.userId,
        type: AIInsightType.STRENGTH_PROGRESS,
        title: 'Strength Milestone Detected',
        summary: `New personal record recorded for ${topPR.exerciseName} (${topPR.value} kg). Progression curve is positive.`,
        sourceData: { pr: topPR },
        confidence: 'HIGH',
        createdAt: now,
      });
    }

    // 3. Nutrition insight
    if (context.todayNutrition) {
      insights.push({
        id: 'ins_' + HashUtil.generateUuid(),
        userId: context.userId,
        type: AIInsightType.NUTRITION_ADHERENCE,
        title: 'Daily Nutrition On Track',
        summary: `Calories consumed (${context.todayNutrition.caloriesConsumed} kcal) align with target (${context.todayNutrition.calorieTarget} kcal).`,
        sourceData: { nutrition: context.todayNutrition },
        confidence: 'MEDIUM',
        createdAt: now,
      });
    }

    return insights;
  }
}
