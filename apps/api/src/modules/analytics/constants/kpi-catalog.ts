import { IKPIDefinition } from '@alpha/types';

/**
 * ALPHA Centralized KPI Definition Catalog
 * 
 * Every metric has an explicit, versioned, and documented definition.
 * Analytics are DERIVED DATA and must always be deterministic and rebuildable
 * from authoritative source records.
 */
export const KPI_CATALOG: Record<string, IKPIDefinition> = {
  // -------------------------------------------------------------
  // 1. ATHLETE / CLIENT KPIS (LEVEL 1)
  // -------------------------------------------------------------
  WORKOUT_ADHERENCE: {
    code: 'WORKOUT_ADHERENCE',
    name: 'Workout Adherence',
    category: 'WORKOUT',
    description:
      'Percentage of planned or scheduled workouts completed within the measurement window.',
    calculationFormula:
      '(completed_planned_workouts / eligible_planned_workouts) * 100',
    unit: 'PERCENTAGE',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Only scheduled/assigned workouts in the active period with status COMPLETED are counted in numerator. Eligible workouts include COMPLETED and SKIPPED/MISSED. If eligible count is 0, returns null (insufficient data).',
    sourceTables: ['workout_sessions', 'program_assignments', 'coach_calendar_events'],
  },

  WORKOUT_VOLUME: {
    code: 'WORKOUT_VOLUME',
    name: 'Workout Volume',
    category: 'WORKOUT',
    description:
      'Total accumulated load lifted across all completed workout sets (weight_kg * reps).',
    calculationFormula:
      'SUM(workout_sets.weight_kg * workout_sets.reps) for all completed sets',
    unit: 'KG',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Only sets where isCompleted is true and status is COMPLETED are included.',
    sourceTables: ['workout_sets', 'workout_session_exercises', 'workout_sessions'],
  },

  PRS_ACHIEVED: {
    code: 'PRS_ACHIEVED',
    name: 'Personal Records Count',
    category: 'PROGRESS',
    description: 'Total number of personal records set during the reporting period.',
    calculationFormula: 'COUNT(personal_records.id)',
    unit: 'COUNT',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Personal record verified against previous maximal weight lifted for the exercise.',
    sourceTables: ['personal_records'],
  },

  NUTRITION_ADHERENCE: {
    code: 'NUTRITION_ADHERENCE',
    name: 'Nutrition Adherence',
    category: 'NUTRITION',
    description:
      'Average adherence to daily caloric and macronutrient targets across logged days in the measurement window.',
    calculationFormula:
      'AVG(daily_adherence_score) where daily_score = 100 - (|calories_consumed - target| / target * 100), bounded to [0, 100]',
    unit: 'PERCENTAGE',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Only days where at least 1 meal was logged are evaluated. Days with no target defined return null.',
    sourceTables: ['daily_meal_logs', 'meals', 'user_goals', 'meal_plan_assignments'],
  },

  HYDRATION_ADHERENCE: {
    code: 'HYDRATION_ADHERENCE',
    name: 'Hydration Adherence',
    category: 'NUTRITION',
    description:
      'Percentage of days where athlete met or exceeded their daily hydration target.',
    calculationFormula:
      '(days_target_met / total_logged_days) * 100',
    unit: 'PERCENTAGE',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Target met when SUM(hydration_logs.amount_ml) >= user_goal.daily_water_ml.',
    sourceTables: ['hydration_logs', 'user_goals'],
  },

  AVERAGE_STEPS: {
    code: 'AVERAGE_STEPS',
    name: 'Average Daily Steps',
    category: 'ACTIVITY',
    description: 'Mean daily step count across logged activity days in period.',
    calculationFormula: 'SUM(activity_records.steps) / COUNT(activity_records.id)',
    unit: 'STEPS',
    version: 1,
    isActive: true,
    qualifyingCriteria: 'Requires at least 1 recorded day of activity data.',
    sourceTables: ['activity_records'],
  },

  ACTIVE_DAYS: {
    code: 'ACTIVE_DAYS',
    name: 'Active Days Count',
    category: 'ACTIVITY',
    description:
      'Number of distinct calendar days in user-local timezone with qualifying activity (completed workout, logged meal, >= 5000 steps, or cardio session).',
    calculationFormula: 'COUNT(DISTINCT calendar_date_with_qualifying_event)',
    unit: 'DAYS',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Qualifying event: workout completed OR meal logged OR steps >= 5000 OR cardio session logged.',
    sourceTables: ['workout_sessions', 'daily_meal_logs', 'activity_records', 'cardio_sessions'],
  },

  WEIGHT_TREND: {
    code: 'WEIGHT_TREND',
    name: 'Body Weight Trend',
    category: 'PROGRESS',
    description:
      'Directional trend and absolute change in body weight over measurement window.',
    calculationFormula: 'latest_weight_kg - baseline_period_weight_kg',
    unit: 'KG',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Requires at least 2 distinct body weight entries separated by at least 72 hours. Fewer than 2 entries returns INSUFFICIENT_DATA.',
    sourceTables: ['body_metrics'],
  },

  // -------------------------------------------------------------
  // 2. COACHING KPIS (LEVEL 2)
  // -------------------------------------------------------------
  ASSIGNED_CLIENTS: {
    code: 'ASSIGNED_CLIENTS',
    name: 'Assigned Clients',
    category: 'COACH',
    description: 'Total number of clients with an active relationship to the coach.',
    calculationFormula:
      'COUNT(coach_client_relationships) WHERE status = ACTIVE AND is_active = true',
    unit: 'COUNT',
    version: 1,
    isActive: true,
    qualifyingCriteria: 'Explicit coach-client relationship with active status.',
    sourceTables: ['coach_client_relationships'],
  },

  ACTIVE_CLIENTS: {
    code: 'ACTIVE_CLIENTS',
    name: 'Active Clients',
    category: 'COACH',
    description:
      'Number of assigned clients who performed at least one qualifying activity event within the measurement period.',
    calculationFormula:
      'COUNT(DISTINCT client_id) with qualifying event in measurement window',
    unit: 'COUNT',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Qualifying event within window: completed workout, logged meal, logged activity, weight entry, or sent message to coach.',
    sourceTables: [
      'coach_client_relationships',
      'workout_sessions',
      'daily_meal_logs',
      'activity_records',
      'body_metrics',
      'coach_messages',
    ],
  },

  COACH_WORKLOAD: {
    code: 'COACH_WORKLOAD',
    name: 'Coach Workload',
    category: 'COACH',
    description:
      'Descriptive operational workload metric tallying active clients, active program assignments, and pending reviews.',
    calculationFormula:
      'active_clients + active_program_assignments + pending_calendar_checkins',
    unit: 'COUNT',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Descriptive operational data only; never used for subjective automated competence judgments.',
    sourceTables: [
      'coach_client_relationships',
      'program_assignments',
      'coach_calendar_events',
      'coach_messages',
    ],
  },

  CLIENT_AT_RISK_COUNT: {
    code: 'CLIENT_AT_RISK_COUNT',
    name: 'Clients Requiring Attention (At-Risk)',
    category: 'COACH',
    description:
      'Number of assigned clients with no qualifying engagement within the last 7 calendar days.',
    calculationFormula:
      'COUNT(clients WHERE MAX(last_activity_date) < NOW() - INTERVAL 7 DAYS)',
    unit: 'COUNT',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Deterministic operational signal based strictly on elapsed time since last logged activity. No psychological labels.',
    sourceTables: [
      'coach_client_relationships',
      'workout_sessions',
      'daily_meal_logs',
      'activity_records',
    ],
  },

  // -------------------------------------------------------------
  // 3. ORGANIZATION & EXECUTIVE KPIS (LEVEL 3)
  // -------------------------------------------------------------
  ORG_TOTAL_CLIENTS: {
    code: 'ORG_TOTAL_CLIENTS',
    name: 'Total Organization Clients',
    category: 'ORGANIZATION',
    description:
      'Total number of client accounts enrolled under the organization tenant.',
    calculationFormula:
      'COUNT(users) WHERE organization_id = :orgId AND role = ATHLETE AND status = ACTIVE',
    unit: 'COUNT',
    version: 1,
    isActive: true,
    qualifyingCriteria: 'Scoped strictly to organizationId with role ATHLETE.',
    sourceTables: ['users'],
  },

  ORG_ACTIVE_CLIENTS: {
    code: 'ORG_ACTIVE_CLIENTS',
    name: 'Organization Active Clients',
    category: 'ORGANIZATION',
    description:
      'Total organization clients with qualifying activity in the measurement window.',
    calculationFormula:
      'COUNT(DISTINCT users.id) WHERE user has qualifying event in period AND organization_id = :orgId',
    unit: 'COUNT',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Client with at least 1 completed workout, logged meal, or activity in period.',
    sourceTables: ['users', 'workout_sessions', 'daily_meal_logs', 'activity_records'],
  },

  ORG_RETENTION_RATE_30D: {
    code: 'ORG_RETENTION_RATE_30D',
    name: '30-Day Cohort Retention Rate',
    category: 'ORGANIZATION',
    description:
      'Percentage of clients who were activated in cohort month and performed a qualifying event 30 days later.',
    calculationFormula:
      '(retained_clients_day_30 / activated_cohort_clients) * 100',
    unit: 'PERCENTAGE',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Cohort defined by activation month. Retained = at least 1 qualifying event between day 25 and day 35. If cohort size < 5, flags INSUFFICIENT_DATA.',
    sourceTables: ['users', 'workout_sessions', 'daily_meal_logs', 'activity_records'],
  },

  ORG_WORKOUT_ADHERENCE: {
    code: 'ORG_WORKOUT_ADHERENCE',
    name: 'Organization Workout Adherence',
    category: 'ORGANIZATION',
    description:
      'Aggregate workout adherence across all enrolled clients in the organization.',
    calculationFormula:
      '(SUM(org_completed_planned_workouts) / SUM(org_eligible_planned_workouts)) * 100',
    unit: 'PERCENTAGE',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Calculated across all organization clients. Excludes clients with zero planned workouts.',
    sourceTables: ['users', 'workout_sessions', 'program_assignments'],
  },

  ORG_NUTRITION_ADHERENCE: {
    code: 'ORG_NUTRITION_ADHERENCE',
    name: 'Organization Nutrition Adherence',
    category: 'ORGANIZATION',
    description:
      'Aggregate nutrition adherence across all organization clients logging meals.',
    calculationFormula:
      'AVG(client_nutrition_adherence_scores)',
    unit: 'PERCENTAGE',
    version: 1,
    isActive: true,
    qualifyingCriteria: 'Bounded strictly between 0% and 100%.',
    sourceTables: ['users', 'daily_meal_logs'],
  },

  ORG_COACH_WORKLOAD_AVG: {
    code: 'ORG_COACH_WORKLOAD_AVG',
    name: 'Average Clients per Coach',
    category: 'ORGANIZATION',
    description:
      'Mean active client load per active coach in the organization.',
    calculationFormula:
      'total_active_clients / total_active_coaches',
    unit: 'RATIO',
    version: 1,
    isActive: true,
    qualifyingCriteria:
      'Only coaches with ACTIVE account status in the organization are included in denominator.',
    sourceTables: ['users', 'coach_client_relationships'],
  },
};
