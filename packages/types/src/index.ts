// Core Enums
export enum UserRole {
  ATHLETE = 'ATHLETE',
  COACH = 'COACH',
  TRAINER = 'TRAINER',
  NUTRITIONIST = 'NUTRITIONIST',
  ORG_ADMIN = 'ORG_ADMIN',
  ADMIN = 'ADMIN',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  DECLINED = 'DECLINED',
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ProgramStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ASSIGNED = 'ASSIGNED',
  ARCHIVED = 'ARCHIVED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum UnitSystem {
  METRIC = 'METRIC',
  IMPERIAL = 'IMPERIAL',
}

export enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ELITE = 'ELITE',
}

export enum PrimaryGoal {
  HYPERTROPHY = 'HYPERTROPHY',
  STRENGTH = 'STRENGTH',
  FAT_LOSS = 'FAT_LOSS',
  ENDURANCE = 'ENDURANCE',
  LONGEVITY = 'LONGEVITY',
  GENERAL_FITNESS = 'GENERAL_FITNESS',
}

export enum WorkoutStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export enum HealthPlatform {
  APPLE_HEALTHKIT = 'APPLE_HEALTHKIT',
  ANDROID_HEALTH_CONNECT = 'ANDROID_HEALTH_CONNECT',
  GARMIN = 'GARMIN',
  WHOOP = 'WHOOP',
  OURA = 'OURA',
  FITBIT = 'FITBIT',
}

export enum HealthConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  REVOKED = 'REVOKED',
  PENDING_PERMISSION = 'PENDING_PERMISSION',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum SocialProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

// Authentication & Identity
export interface IAuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  isEmailVerified: boolean;
  organizationId?: string | null;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  orgId?: string | null;
  iat?: number;
  exp?: number;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// Standard API Response Contracts
export interface IApiMeta {
  requestId?: string;
  timestamp: string;
  page?: number;
  limit?: number;
  total?: number;
}

export interface IApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: IApiError | null;
  meta?: IApiMeta;
}

// Ownership Contract
export interface IOwnable {
  userId: string;
}

// Domain Model Interfaces
export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile extends IOwnable {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  heightCm?: number | null;
  weightKg?: number | null;
  experienceLevel?: ExperienceLevel | null;
  activityMultiplier?: number | null;
  isOnboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface IEmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface IRevokedToken {
  id: string;
  tokenHash: string;
  userId: string;
  revokedAt: Date;
  expiresAt: Date;
}

export interface IUserPreference extends IOwnable {
  id: string;
  userId: string;
  unitSystem: UnitSystem;
  timezone: string; // IANA e.g. "Asia/Kolkata", "America/New_York"
  language: string; // ISO e.g. "en", "es", "hi"
  theme: string;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserGoal extends IOwnable {
  id: string;
  userId: string;
  primaryGoal: PrimaryGoal;
  targetWeightKg?: number | null;
  targetDailyCalories?: number | null;
  targetDailyProteinGrams?: number | null;
  targetDailyCarbsGrams?: number | null;
  targetDailyFatGrams?: number | null;
  targetWeeklyWorkouts?: number | null;
  targetDailySteps?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// -------------------------------------------------------------
// NUTRITION ENGINE CONTRACTS
// -------------------------------------------------------------

export enum MealStatus {
  UPCOMING = 'UPCOMING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  SKIPPED = 'SKIPPED',
  MISSED = 'MISSED',
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
  PRE_WORKOUT = 'PRE_WORKOUT',
  POST_WORKOUT = 'POST_WORKOUT',
  CUSTOM = 'CUSTOM',
}

export enum FoodCategory {
  PROTEIN = 'PROTEIN',
  GRAINS = 'GRAINS',
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  DAIRY = 'DAIRY',
  NUTS_SEEDS = 'NUTS_SEEDS',
  LEGUMES = 'LEGUMES',
  OILS = 'OILS',
  BEVERAGES = 'BEVERAGES',
  SUPPLEMENTS = 'SUPPLEMENTS',
  OTHER = 'OTHER',
}

export interface IFoodItem {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  category: FoodCategory;
  servingSizeG: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number | null;
  sugarGrams?: number | null;
  sodiumMg?: number | null;
  isCustom: boolean;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMealItem {
  id: string;
  mealLogId: string;
  foodItemId: string;
  foodName: string;
  quantity: number;
  servingUnit: string;
  totalWeightG: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  createdAt: Date;
}

export interface IMealLog extends IOwnable {
  id: string;
  userId: string;
  logDate: string; // YYYY-MM-DD
  mealType: MealType;
  name: string;
  status: MealStatus;
  scheduledTime?: string; // HH:mm
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  items: IMealItem[];
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHydrationLog extends IOwnable {
  id: string;
  userId: string;
  logDate: string; // YYYY-MM-DD
  amountMl: number;
  createdAt: Date;
}

export interface INutritionDailySummary {
  date: string;
  calorieTarget: number;
  caloriesConsumed: number;
  caloriesRemaining: number;
  proteinTargetG: number;
  proteinConsumedG: number;
  carbsTargetG: number;
  carbsConsumedG: number;
  fatTargetG: number;
  fatConsumedG: number;
  hydrationTargetMl: number;
  hydrationConsumedMl: number;
  mealsPlanned: number;
  mealsCompleted: number;
  calorieAdherencePercent: number | null;
  mealAdherencePercent: number | null;
}

// -------------------------------------------------------------
// ACTIVITY, STEPS & CARDIO ENGINE CONTRACTS
// -------------------------------------------------------------

export enum CardioType {
  RUNNING = 'RUNNING',
  WALKING = 'WALKING',
  CYCLING = 'CYCLING',
  INDOOR_CYCLING = 'INDOOR_CYCLING',
  ROWING = 'ROWING',
  SWIMMING = 'SWIMMING',
  STAIR_CLIMBING = 'STAIR_CLIMBING',
  HIKING = 'HIKING',
  OTHER = 'OTHER',
}

export enum ActivitySource {
  MANUAL = 'MANUAL',
  APPLE_HEALTH = 'APPLE_HEALTH',
  HEALTH_CONNECT = 'HEALTH_CONNECT',
  GPS = 'GPS',
  SYSTEM = 'SYSTEM',
}

export enum HeartRateZone {
  ZONE_1_RECOVERY = 'ZONE_1_RECOVERY',     // 50-60% Max HR
  ZONE_2_AEROBIC = 'ZONE_2_AEROBIC',       // 60-70% Max HR
  ZONE_3_TEMPO = 'ZONE_3_TEMPO',           // 70-80% Max HR
  ZONE_4_THRESHOLD = 'ZONE_4_THRESHOLD',   // 80-90% Max HR
  ZONE_5_ANAEROBIC = 'ZONE_5_ANAEROBIC',   // 90-100% Max HR
}

export interface ICardioSession extends IOwnable {
  id: string;
  userId: string;
  activityType: CardioType;
  startedAt: Date;
  completedAt?: Date | null;
  durationSeconds: number;
  distanceMeters?: number | null;
  avgPaceSecondsPerKm?: number | null;
  avgSpeedKmh?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  activeCalories?: number | null;
  isManual: boolean;
  source: ActivitySource;
  sourceRecordId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityRecord extends IOwnable {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  stepCount: number;
  activeCalories: number;
  distanceKm: number;
  activeMinutes: number;
  heartRateAvg?: number | null;
  heartRateMin?: number | null;
  heartRateMax?: number | null;
  source: ActivitySource;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDailyActivitySummary {
  date: string;
  stepCount: number;
  stepTarget: number;
  stepProgressPercent: number;
  distanceKm: number;
  activeMinutes: number;
  activeMinutesTarget: number;
  activeCalories: number;
  cardioSessionsCount: number;
  cardioDurationSeconds: number;
  cardioDistanceMeters: number;
  cardioSessions: ICardioSession[];
  source: ActivitySource;
}

export interface IHealthSyncPayload {
  platform: HealthPlatform;
  records: {
    sourceRecordId: string;
    type: 'STEPS' | 'CARDIO' | 'HEART_RATE';
    date: string;
    stepCount?: number;
    distanceMeters?: number;
    durationSeconds?: number;
    cardioType?: CardioType;
    calories?: number;
    avgHeartRate?: number;
    maxHeartRate?: number;
  }[];
}

// -------------------------------------------------------------
// PROGRESS, BODY METRICS & PERFORMANCE CONTRACTS
// -------------------------------------------------------------

export enum BodyMeasurementType {
  WAIST = 'WAIST',
  CHEST = 'CHEST',
  HIPS = 'HIPS',
  NECK = 'NECK',
  SHOULDERS = 'SHOULDERS',
  BICEPS = 'BICEPS',
  FOREARMS = 'FOREARMS',
  THIGHS = 'THIGHS',
  CALVES = 'CALVES',
}

export enum PersonalRecordType {
  HEAVIEST_WEIGHT = 'HEAVIEST_WEIGHT',
  BEST_REPS = 'BEST_REPS',
  MAX_VOLUME = 'MAX_VOLUME',
  ESTIMATED_1RM = 'ESTIMATED_1RM',
}

export enum BMICategory {
  UNDERWEIGHT = 'UNDERWEIGHT',
  NORMAL = 'NORMAL',
  OVERWEIGHT = 'OVERWEIGHT',
  OBESE = 'OBESE',
}

export interface IBodyMetric extends IOwnable {
  id: string;
  userId: string;
  recordedAt: Date;
  weightKg?: number | null;
  bodyFatPercent?: number | null;
  muscleMassKg?: number | null;
  waterPercent?: number | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBodyMeasurement extends IOwnable {
  id: string;
  userId: string;
  measurementType: BodyMeasurementType;
  valueCm: number;
  recordedAt: Date;
  createdAt: Date;
}

export interface IPersonalRecord extends IOwnable {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  prType: PersonalRecordType;
  value: number;
  reps?: number | null;
  weightKg?: number | null;
  workoutSessionId?: string | null;
  achievedAt: Date;
  createdAt: Date;
}

export interface IProgressPhotoMetadata extends IOwnable {
  id: string;
  userId: string;
  photoUrl: string;
  s3Key: string;
  viewAngle: string;
  notes?: string | null;
  takenAt: Date;
  createdAt: Date;
}

export interface IStrengthTrend {
  exerciseId: string;
  exerciseName: string;
  sessionsCount: number;
  baselineWeightKg?: number | null;
  currentWeightKg?: number | null;
  bestWeightKg: number;
  bestReps: number;
  estimated1RM: number;
  totalVolumeKg: number;
  percentageChange: number;
}

export interface IProgressOverview {
  currentWeightKg?: number | null;
  weightChangeKg?: number | null;
  weightTrajectory: { date: string; weightKg: number }[];
  bmi?: number | null;
  bmiCategory?: BMICategory | null;
  bodyFatPercent?: number | null;
  workoutConsistencyPercent: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  nutritionAdherencePercent?: number | null;
  avgDailySteps: number;
  recentPRs: IPersonalRecord[];
  photosCount: number;
  recentPhotos: IProgressPhotoMetadata[];
}

// -------------------------------------------------------------
// AI COACH & INTELLIGENCE ENGINE CONTRACTS
// -------------------------------------------------------------

export enum AIProviderType {
  MOCK = 'MOCK',
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  GEMINI = 'GEMINI',
}

export enum AIMessageRole {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  TOOL = 'TOOL',
}

export enum AIActionType {
  SUGGEST_WORKOUT_CHANGE = 'SUGGEST_WORKOUT_CHANGE',
  SUGGEST_MEAL_CHANGE = 'SUGGEST_MEAL_CHANGE',
  SUGGEST_GOAL_ADJUSTMENT = 'SUGGEST_GOAL_ADJUSTMENT',
  CREATE_DRAFT_PLAN = 'CREATE_DRAFT_PLAN',
  EXPLAIN_PROGRESS = 'EXPLAIN_PROGRESS',
  CREATE_REMINDER_DRAFT = 'CREATE_REMINDER_DRAFT',
}

export enum AIInsightType {
  WORKOUT_CONSISTENCY = 'WORKOUT_CONSISTENCY',
  STRENGTH_PROGRESS = 'STRENGTH_PROGRESS',
  NUTRITION_ADHERENCE = 'NUTRITION_ADHERENCE',
  HYDRATION = 'HYDRATION',
  ACTIVITY = 'ACTIVITY',
  WEIGHT_TREND = 'WEIGHT_TREND',
  GOAL_PROGRESS = 'GOAL_PROGRESS',
}

export interface IAIActionProposal {
  id: string;
  type: AIActionType;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED' | 'APPLIED';
  createdAt: Date;
}

export interface IAIMessage {
  id: string;
  conversationId: string;
  role: AIMessageRole;
  content: string;
  actionProposals?: IAIActionProposal[];
  tokensUsed?: number | null;
  citations?: string[];
  createdAt: Date;
}

export interface IAIConversation extends IOwnable {
  id: string;
  userId: string;
  title: string;
  messages: IAIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIInsight extends IOwnable {
  id: string;
  userId: string;
  type: AIInsightType;
  title: string;
  summary: string;
  sourceData?: Record<string, unknown> | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LIMITED_DATA';
  createdAt: Date;
}

export interface IAIUsageRecord extends IOwnable {
  id: string;
  userId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: 'SUCCESS' | 'ERROR' | 'RATE_LIMITED';
  createdAt: Date;
}

export interface IAIContext {
  userId: string;
  userName: string;
  primaryGoal: string;
  experienceLevel: string;
  heightCm?: number | null;
  currentWeightKg?: number | null;
  bmi?: number | null;
  unitSystem: UnitSystem;
  timezone: string;
  dateRange: {
    start: string;
    end: string;
    timezone: string;
  };
  goals: {
    primaryGoal: string;
    targetWeightKg?: number | null;
    dailyCalorieTarget?: number | null;
    dailyWaterMl?: number | null;
    dailyStepTarget?: number | null;
    weeklyWorkoutDays?: number | null;
  };
  recentWorkouts: {
    title: string;
    completedAt: string;
    totalVolumeKg: number;
    durationSeconds: number;
  }[];
  todayNutrition?: {
    caloriesConsumed: number;
    calorieTarget: number;
    proteinConsumedG: number;
    waterConsumedMl: number;
    adherencePercent: number | null;
  } | null;
  todayActivity?: {
    stepCount: number;
    distanceKm: number;
    activeCalories: number;
    heartRateAvg?: number | null;
  } | null;
  recentPRs: {
    exerciseName: string;
    prType: string;
    value: number;
  }[];
  progress?: {
    latestWeightKg?: number | null;
    baselineWeightKg?: number | null;
    weightChangeKg?: number | null;
    bmi?: number | null;
    bodyFatPercent?: number | null;
    photosCount?: number;
  } | null;
  workoutConsistencyPercent: number;
  dataAvailability: {
    hasWorkouts: boolean;
    hasNutrition: boolean;
    hasActivity: boolean;
    hasHeartRate: boolean;
    hasProgressPhotos: boolean;
    hasBodyFat: boolean;
    hasSleep: boolean;
  };
}

export interface IAIChatResponse {
  message: string;
  actionProposals?: IAIActionProposal[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  promptVersion: string;
  citations?: string[];
}

// -------------------------------------------------------------
// COACH / TRAINER / NUTRITIONIST PORTAL CONTRACTS
// -------------------------------------------------------------

export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoachClientRelationship {
  id: string;
  coachId: string;
  clientId: string;
  organizationId?: string | null;
  status: ClientStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClientInvitation {
  id: string;
  organizationId?: string | null;
  coachId: string;
  clientEmail: string;
  role: UserRole;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPortalClientSummary {
  clientId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  primaryGoal: string;
  status: ClientStatus;
  currentProgramTitle?: string | null;
  lastWorkoutDate?: string | null;
  workoutConsistencyPercent: number;
  nutritionAdherencePercent?: number | null;
  lastActiveAt?: string | null;
}

export interface IPortalRolePermissions {
  canManageClients: boolean;
  canAssignWorkouts: boolean;
  canAssignNutrition: boolean;
  canViewProgress: boolean;
  canViewActivity: boolean;
  canMessageClients: boolean;
  canGenerateReports: boolean;
  canManageOrganization: boolean;
}

export interface IProgramTemplateExercise {
  id?: string;
  exerciseId: string;
  exerciseName?: string;
  primaryMuscle?: string;
  orderIndex: number;
  targetSets: number;
  targetReps: number;
  targetRpe?: number | null;
  restSeconds: number;
  notes?: string | null;
}

export interface IProgramSplitDay {
  id?: string;
  dayOfWeek: number; // 1-7
  title: string;
  exercises: IProgramTemplateExercise[];
}

export interface IProgramDetail {
  id: string;
  creatorId: string;
  name: string;
  description?: string | null;
  weeksCount: number;
  status: ProgramStatus;
  version: number;
  parentProgramId?: string | null;
  days: IProgramSplitDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProgramAssignmentDetail {
  id: string;
  programId: string;
  athleteId: string;
  programTitle: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  version: number;
  createdAt: Date;
}

export interface IProgramReplacementResult {
  success: boolean;
  replacedProgramId: string;
  newProgramId: string;
  effectiveDate: string;
  preservedCompletedSessionsCount: number;
}

export interface IMealPlanItemDetail {
  foodItemId: string;
  foodName?: string;
  quantity: number;
  totalWeightG: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface IMealDetail {
  id?: string;
  name: string;
  orderIndex: number;
  items: IMealPlanItemDetail[];
}

export interface IMealPlanDetail {
  id: string;
  creatorId: string;
  name: string;
  description?: string | null;
  status: ProgramStatus;
  version: number;
  totalDailyCalories: number;
  totalDailyProtein: number;
  totalDailyCarbs: number;
  totalDailyFat: number;
  meals: IMealDetail[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IClientDetailDossier {
  overview: IPortalClientSummary;
  profile: {
    heightCm?: number | null;
    weightKg?: number | null;
    gender?: string | null;
    unitSystem: string;
    timezone: string;
    experienceLevel?: string | null;
  };
  activeProgram?: IProgramAssignmentDetail | null;
  activeMealPlan?: {
    assignmentId: string;
    mealPlanId: string;
    mealPlanTitle: string;
    startDate: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  } | null;
  recentWorkouts: {
    id: string;
    title: string;
    completedAt: string;
    durationSeconds: number;
    totalVolumeKg: number;
    exercisesCount: number;
  }[];
  recentMetrics: {
    weightKg?: number | null;
    bmi?: number | null;
    bmiCategory?: string | null;
    recordedAt?: string | null;
  };
}

// -------------------------------------------------------------
// GATE C: PROGRESS, ACTIVITY, ANALYTICS, CALENDAR & REPORTING
// -------------------------------------------------------------

export type ReportType =
  | 'CLIENT_PROGRESS'
  | 'WORKOUT_ADHERENCE'
  | 'NUTRITION_ADHERENCE'
  | 'COACH_PERFORMANCE'
  | 'ORGANIZATION_SUMMARY'
  | 'ORGANIZATION_OVERVIEW'
  | 'PROGRAM_PERFORMANCE';

export type CalendarEventType =
  | 'PLANNED_WORKOUT'
  | 'COMPLETED_WORKOUT'
  | 'MISSED_WORKOUT'
  | 'REST_DAY'
  | 'CARDIO_SESSION'
  | 'CHECKIN'
  | 'NUTRITION_START';

export interface ICoachCalendarEvent {
  id: string;
  clientId: string;
  clientName: string;
  coachId: string;
  eventType: CalendarEventType;
  title: string;
  startDateTime: string;
  endDateTime?: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
}

export interface IStrengthProgressionPoint {
  date: string;
  estimated1RmKg: number;
  topSetWeightKg: number;
  topSetReps: number;
}

export interface IClientProgressAnalytics {
  clientId: string;
  weightHistory: { date: string; weightKg: number; bmi: number }[];
  netWeightChangeKg: number;
  strengthProgression: {
    exerciseId: string;
    exerciseName: string;
    points: IStrengthProgressionPoint[];
  }[];
  personalRecordsCount: number;
  recentPrs: { exerciseName: string; weightKg: number; achievedAt: string }[];
}

export interface IClientWorkoutAnalytics {
  clientId: string;
  totalWorkoutsCompleted: number;
  scheduledWorkoutsCount: number;
  adherencePercent: number;
  totalTonnageKg: number;
  weeklyVolumeTrend: { weekStart: string; tonnageKg: number; sessionCount: number }[];
  averageSessionDurationMinutes: number;
  averageIntensityRpe: number;
}

export interface IClientNutritionAnalytics {
  clientId: string;
  loggingAdherencePercent: number;
  daysLogged: number;
  totalDays: number;
  averageDailyCalories: number;
  targetDailyCalories: number;
  caloricAdherencePercent: number;
  averageProteinGrams: number;
  averageCarbsGrams: number;
  averageFatGrams: number;
  averageWaterMl: number;
  macroTrend: {
    date: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[];
}

export interface IClientActivityAnalytics {
  clientId: string;
  averageDailySteps: number;
  totalSteps: number;
  stepGoal: number;
  stepGoalAchievedDays: number;
  weeklyCardioMinutes: number;
  cardioSessionsCount: number;
  cardioSessions: {
    id: string;
    type: string;
    durationMinutes: number;
    distanceKm?: number | null;
    avgPaceMinKm?: number | null;
    avgHeartRate?: number | null;
    activeCalories?: number | null;
    date: string;
  }[];
}

export interface IClientProgressPhoto {
  id: string;
  clientId: string;
  pose: 'FRONT' | 'SIDE' | 'BACK';
  photoUrl: string;
  takenAt: string;
  notes?: string | null;
  isCoachAuthorized: boolean;
}

export interface IClientGoalProgress {
  clientId: string;
  primaryGoal: string;
  startWeightKg?: number | null;
  currentWeightKg?: number | null;
  targetWeightKg?: number | null;
  progressPercent: number;
  targetDate?: string | null;
  notes?: string | null;
  updatedAt: string;
}

export interface IReportDataSummary {
  reportId: string;
  type: ReportType;
  generatedAt: string;
  title: string;
  organizationId?: string | null;
  authorCoachId: string;
  clientSummary?: {
    clientId: string;
    clientName: string;
    complianceRate: number;
    keyMetricValue: string;
  }[];
  metrics: Record<string, any>;
}

export interface IReportExportResult {
  reportId: string;
  format: 'CSV' | 'JSON';
  filename: string;
  mimeType: string;
  content: string;
}

// -------------------------------------------------------------
// PHASE 08 GATE D: MESSAGING, COACH AI ASSISTANT & AUDIT
// -------------------------------------------------------------

export interface ICoachMessageAttachment {
  type: 'PROGRAM' | 'MEAL_PLAN' | 'REPORT' | 'IMAGE' | 'LINK';
  title: string;
  url?: string;
  referenceId?: string;
}

export interface ICoachMessage {
  id: string;
  coachId: string;
  clientId: string;
  senderId: string;
  senderName?: string;
  senderRole?: UserRole;
  content: string;
  attachments?: ICoachMessageAttachment[] | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ICoachConversationSummary {
  clientId: string;
  clientName: string;
  clientEmail: string;
  avatarUrl?: string | null;
  lastMessage?: ICoachMessage | null;
  unreadCount: number;
}

export type CoachAiDraftType =
  | 'PERFORMANCE_SUMMARY'
  | 'WORKOUT_ADJUSTMENT'
  | 'NUTRITION_ADJUSTMENT'
  | 'CHECKIN_MESSAGE';

export interface ICoachAiDraft {
  id: string;
  coachId: string;
  clientId: string;
  draftType: CoachAiDraftType;
  prompt: string;
  content: string;
  actionProposal?: Record<string, any> | null;
  status: 'DRAFT' | 'APPLIED' | 'DISCARDED';
  createdAt: string;
}

export interface ICoachAiGenerateRequest {
  clientId: string;
  draftType: CoachAiDraftType;
  instructions?: string;
  timeframeDays?: number;
}

export interface IAuditLogRecord {
  id: string;
  userId?: string | null;
  actorName?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

// -------------------------------------------------------------
// NOTIFICATIONS, REMINDERS & AUTOMATION DOMAIN
// -------------------------------------------------------------

export type NotificationCategory =
  | 'WORKOUT'
  | 'NUTRITION'
  | 'HYDRATION'
  | 'ACTIVITY'
  | 'PROGRESS'
  | 'GOALS'
  | 'MESSAGES'
  | 'COACH'
  | 'SYSTEM';

export type NotificationDeliveryStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type NotificationChannel = 'PUSH' | 'IN_APP' | 'EMAIL';

export interface INotificationDelivery {
  id: string;
  notificationId: string;
  deviceId?: string | null;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  provider: string;
  providerMessageId?: string | null;
  attemptCount: number;
  lastAttemptAt?: string | null;
  errorDetails?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: NotificationCategory;
  type: string;
  data?: Record<string, any> | null;
  deepLinkUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  deliveries?: INotificationDelivery[];
}

export interface IDevice {
  id: string;
  userId: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  pushToken?: string | null;
  model?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationPreference {
  id: string;
  userId: string;
  workoutPush: boolean;
  nutritionPush: boolean;
  hydrationPush: boolean;
  activityPush: boolean;
  progressPush: boolean;
  goalsPush: boolean;
  messagesPush: boolean;
  coachPush: boolean;
  systemPush: boolean;
  workoutEmail: boolean;
  nutritionEmail: boolean;
  messagesEmail: boolean;
  weeklyDigestEmail: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReminder {
  id: string;
  userId: string;
  title: string;
  timeOfDay: string;
  daysOfWeek: number[];
  category: string;
  isEnabled: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  category?: NotificationCategory;
  deepLinkUrl?: string;
}

export interface IPushResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  isInvalidToken?: boolean;
}

export interface IPushNotificationProvider {
  name: string;
  sendPush(token: string, payload: IPushPayload): Promise<IPushResult>;
  sendBatchPush(tokens: string[], payload: IPushPayload): Promise<Map<string, IPushResult>>;
}

// -------------------------------------------------------------
// REDIS, QUEUE & BACKGROUND WORKER DOMAIN
// -------------------------------------------------------------

export type QueueName =
  | 'NOTIFICATIONS_DISPATCH'
  | 'REMINDERS_SCHEDULE'
  | 'AUTOMATIONS_EVALUATE'
  | 'WEEKLY_DIGEST'
  | 'DAILY_ANALYTICS_AGGREGATION'
  | 'WEEKLY_ANALYTICS_AGGREGATION'
  | 'CLIENT_SUMMARY_REFRESH'
  | 'ORGANIZATION_SUMMARY_REFRESH'
  | 'HEALTH_INITIAL_SYNC'
  | 'HEALTH_INCREMENTAL_SYNC'
  | 'WEARABLE_SYNC'
  | 'SYNC_RETRY'
  | 'TOKEN_REFRESH';


export type JobStatus =
  | 'WAITING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED'
  | 'DELAYED'
  | 'CANCELLED';

export type BackoffStrategy = 'FIXED' | 'EXPONENTIAL' | 'EXPONENTIAL_JITTER';

export interface IJobOptions {
  idempotencyKey?: string;
  delayMs?: number;
  maxAttempts?: number;
  backoffMs?: number;
  backoffStrategy?: BackoffStrategy;
  priority?: number;
}

export interface IJobRecord<T = any> {
  id: string;
  name: string;
  queue: QueueName;
  data: T;
  idempotencyKey?: string | null;
  attempts: number;
  maxAttempts: number;
  backoffMs: number;
  backoffStrategy: BackoffStrategy;
  status: JobStatus;
  delayMs?: number | null;
  scheduledFor?: string | null;
  processedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDispatchNotificationJobPayload {
  notificationId?: string;
  userId: string;
  title: string;
  body: string;
  category?: NotificationCategory;
  type?: string;
  data?: Record<string, any>;
  deepLinkUrl?: string;
  forcePush?: boolean;
  skipPush?: boolean;
}

export interface IScheduleReminderJobPayload {
  reminderId: string;
  userId: string;
  scheduledTime: string;
  dayOfWeek: number;
  title: string;
  category: string;
}

export interface IEvaluateAutomationJobPayload {
  eventType: string;
  userId: string;
  entityId?: string;
  payload?: Record<string, any>;
}

export interface IWeeklyDigestJobPayload {
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
}

export interface IQueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  cancelled: number;
  total: number;
}

// -------------------------------------------------------------
// AUTOMATION EVENTS & TRIGGERS
// -------------------------------------------------------------

export type AutomationEventType =
  | 'WORKOUT_COMPLETED'
  | 'MISSED_WORKOUT'
  | 'PR_ACHIEVED'
  | 'MEAL_LOGGED'
  | 'DAILY_MACROS_MET'
  | 'STEP_MILESTONE'
  | 'STREAK_PRESERVED'
  | 'PROGRAM_ASSIGNED'
  | 'MEAL_PLAN_ASSIGNED'
  | 'COACH_MESSAGE_SENT'
  | 'AI_INSIGHT_AVAILABLE';

export interface IWorkoutCompletedEvent {
  workoutId: string;
  userId: string;
  name: string;
  volumeKg: number;
  durationMinutes?: number;
  prCount?: number;
  coachId?: string;
}

export interface IMissedWorkoutEvent {
  userId: string;
  routineName: string;
  scheduledDate: string;
}

export interface IPersonalRecordEvent {
  userId: string;
  exerciseName: string;
  weightKg: number;
  previousMaxKg?: number;
  workoutId?: string;
}

export interface IMealLoggedEvent {
  userId: string;
  mealId: string;
  name: string;
  calories: number;
  proteinGrams: number;
  carbsGrams?: number;
  fatGrams?: number;
}

export interface ICoachAssignmentEvent {
  coachId: string;
  coachName: string;
  athleteId: string;
  assignmentType: 'PROGRAM' | 'MEAL_PLAN';
  assignmentId: string;
  assignmentName: string;
}

export interface ICoachMessageEvent {
  senderId: string;
  senderName: string;
  recipientId: string;
  preview: string;
  conversationId?: string;
}

// -------------------------------------------------------------
// PHASE 10: ADVANCED ANALYTICS, REPORTING & EXECUTIVE INTELLIGENCE
// -------------------------------------------------------------

export type KPICategory =
  | 'USER'
  | 'COACH'
  | 'ORGANIZATION'
  | 'WORKOUT'
  | 'NUTRITION'
  | 'ACTIVITY'
  | 'PROGRESS'
  | 'ENGAGEMENT';

export type KPIUnit =
  | 'PERCENTAGE'
  | 'COUNT'
  | 'MINUTES'
  | 'KG'
  | 'STEPS'
  | 'DAYS'
  | 'RATIO';

export type DataFreshness =
  | 'LIVE'
  | 'RECENT'
  | 'PROCESSING'
  | 'STALE'
  | 'UNAVAILABLE';

export type AnalyticsScope = 'CLIENT' | 'COACH' | 'ORGANIZATION';

export type AnalyticsTimePeriod =
  | 'TODAY'
  | '7_DAYS'
  | '30_DAYS'
  | '90_DAYS'
  | '6_MONTHS'
  | '12_MONTHS'
  | 'CUSTOM';

export interface IKPIDefinition {
  id?: string;
  code: string;
  name: string;
  category: KPICategory;
  description: string;
  calculationFormula: string;
  unit: KPIUnit;
  version: number;
  isActive: boolean;
  qualifyingCriteria?: string;
  sourceTables?: string[];
  metadata?: Record<string, any>;
}

export interface IPeriodComparison<T = number> {
  current: T;
  previous: T;
  changeAbsolute: number;
  changePercentage?: number | null; // relative % growth
  changePercentagePoints?: number | null; // difference for percentages
  trendDirection: 'UP' | 'DOWN' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
}

export interface IMetricCard<T = number> {
  kpiCode: string;
  title: string;
  value: T;
  unit: KPIUnit;
  period: AnalyticsTimePeriod;
  comparison?: IPeriodComparison<T>;
  freshness: DataFreshness;
  lastCalculated: string;
  insufficientData?: boolean;
}

// Level 1: Client Analytics
export interface IClientWorkoutSummary {
  totalPlanned: number;
  totalCompleted: number;
  totalSkipped: number;
  adherencePercentage: number | null; // null if totalPlanned === 0
  totalVolumeKg: number;
  totalDurationMinutes: number;
  prsAchieved: number;
  averageFrequencyPerWeek: number;
}

export interface IClientNutritionSummary {
  daysLogged: number;
  adherencePercentage: number | null;
  averageCalories: number;
  averageProteinGrams: number;
  averageCarbsGrams: number;
  averageFatsGrams: number;
  waterAdherencePercentage: number | null;
}

export interface IClientActivitySummary {
  activeDaysCount: number;
  averageSteps: number;
  totalCardioSessions: number;
  totalCardioMinutes: number;
  totalCardioDistanceMeters: number;
}

export interface IClientProgressSummary {
  currentWeightKg?: number | null;
  weightDeltaKg?: number | null;
  weightTrend?: 'GAINING' | 'LOSING' | 'MAINTAINING' | 'INSUFFICIENT_DATA';
  totalPRs: number;
  goalsCompleted: number;
  goalsActive: number;
}

export interface IClientAnalyticsSummary {
  userId: string;
  timezone: string;
  period: AnalyticsTimePeriod;
  startDate: string;
  endDate: string;
  freshness: DataFreshness;
  lastCalculated: string;
  workout: IClientWorkoutSummary;
  nutrition: IClientNutritionSummary;
  activity: IClientActivitySummary;
  progress: IClientProgressSummary;
}

// Level 2: Coach Analytics
export interface ICoachClientAdherenceItem {
  clientId: string;
  clientName: string;
  avatarUrl?: string | null;
  workoutAdherence: number | null;
  nutritionAdherence: number | null;
  lastActiveDate?: string | null;
  isAtRisk: boolean;
  atRiskReason?: string | null; // Deterministic: "No workout in 7 days", "Nutrition unlogged 5+ days"
}

export interface ICoachWorkloadMetrics {
  totalAssignedClients: number;
  activeClientsCount: number;
  activeProgramsCount: number;
  messagesSent: number;
  reviewsPending: number;
}

export interface ICoachAnalyticsSummary {
  coachId: string;
  organizationId?: string | null;
  period: AnalyticsTimePeriod;
  startDate: string;
  endDate: string;
  freshness: DataFreshness;
  lastCalculated: string;
  workload: ICoachWorkloadMetrics;
  overallWorkoutAdherence: number | null;
  overallNutritionAdherence: number | null;
  clientAdherenceList: ICoachClientAdherenceItem[];
}

// Level 3: Organization Analytics
export interface IOrganizationRetentionCohort {
  cohortMonth: string; // e.g. "2026-08"
  initialClients: number;
  day30RetainedClients: number;
  retentionRatePercentage: number | null;
}

export interface IOrganizationExecutiveOverview {
  organizationId: string;
  reportingTimezone: string;
  period: AnalyticsTimePeriod;
  startDate: string;
  endDate: string;
  freshness: DataFreshness;
  lastCalculated: string;

  totalClients: IMetricCard<number>;
  activeClients: IMetricCard<number>;
  workoutAdherence: IMetricCard<number>;
  nutritionAdherence: IMetricCard<number>;
  averageWeeklyActivityDays: IMetricCard<number>;
  newClients: IMetricCard<number>;
  totalCoaches: number;
  activeCoaches: number;
}

// Reporting Interfaces
export type ReportFormat = 'CSV' | 'PDF' | 'JSON';

export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IReportRequest {
  reportType: ReportType;
  format: ReportFormat;
  scope: AnalyticsScope;
  organizationId?: string;
  coachId?: string;
  clientId?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  filters?: Record<string, any>;
}

export interface IReportResult {
  id: string;
  reportType: ReportType;
  format: ReportFormat;
  scope: AnalyticsScope;
  status: ReportStatus;
  fileUrl?: string | null;
  fileKey?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  errorMessage?: string | null;
}

export interface IDailyAnalyticsJobPayload {
  date?: string; // YYYY-MM-DD, defaults to yesterday or today
  targetUserId?: string; // Optional single user or all active
  targetOrgId?: string; // Optional single org or all active
}

export interface IWeeklyAnalyticsJobPayload {
  weekEndDate?: string;
  targetUserId?: string;
  targetOrgId?: string;
}

export interface IClientSummaryRefreshJobPayload {
  userId: string;
  startDate?: string;
  endDate?: string;
  invalidateCache?: boolean;
}

export interface IOrganizationSummaryRefreshJobPayload {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  invalidateCache?: boolean;
}

// -------------------------------------------------------------
// ACCESSIBILITY & USABILITY TYPES (PHASE 11 - GATE B)
// -------------------------------------------------------------

export type WcagLevel = 'AA' | 'AAA';

export interface IColorContrastResult {
  ratio: number;
  passesNormalTextAA: boolean; // >= 4.5:1
  passesLargeTextAA: boolean;  // >= 3.0:1
  passesNormalTextAAA: boolean; // >= 7.0:1
  passesLargeTextAAA: boolean;  // >= 4.5:1
  passesUiComponent: boolean;   // >= 3.0:1
}

export interface ITouchTargetDimension {
  width: number;
  height: number;
}

export interface IAccessibilityPreferences {
  highContrastEnabled: boolean;
  reducedMotionEnabled: boolean;
  screenReaderOptimized: boolean;
  fontSizeScale: number; // 1.0 to 2.0
}

export interface IAccessibilityLabelDescriptor {
  label: string;
  hint?: string;
  role?: string;
  value?: string;
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
  };
}

// -------------------------------------------------------------
// ENTERPRISE TENANT, ROLES & PRIVACY TYPES (PHASE 11 - GATE C)
// -------------------------------------------------------------

export type EnterpriseTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface IEnterpriseOrgSettings {
  id: string;
  organizationId: string;
  tier: EnterpriseTier;
  maxSeats: number;
  allowedDomains: string[];
  enforceSso: boolean;
  dataRetentionDays: number;
  customBranding?: {
    primaryColor?: string;
    logoUrl?: string;
    companyName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export enum EnterprisePermission {
  VIEW_CLIENT_TELEMETRY = 'VIEW_CLIENT_TELEMETRY',
  MANAGE_CLIENT_PROGRAM = 'MANAGE_CLIENT_PROGRAM',
  MANAGE_CLIENT_NUTRITION = 'MANAGE_CLIENT_NUTRITION',
  EXPORT_ORG_DATA = 'EXPORT_ORG_DATA',
  MANAGE_ORG_MEMBERS = 'MANAGE_ORG_MEMBERS',
  MANAGE_ORG_SETTINGS = 'MANAGE_ORG_SETTINGS',
  AUDIT_LOG_READ = 'AUDIT_LOG_READ',
  EXPORT_PERSONAL_DATA = 'EXPORT_PERSONAL_DATA',
  ERASE_PERSONAL_DATA = 'ERASE_PERSONAL_DATA',
}

export interface IUserConsentPreferences {
  userId: string;
  analyticsTracking: boolean;
  telemetrySharing: boolean;
  marketingCommunications: boolean;
  dataRetentionAgreed: boolean;
  updatedAt: string;
}

export enum ConsentCategory {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  HEALTH_DATA_PROCESSING = 'HEALTH_DATA_PROCESSING',
  AI_COACHING_DATA_INGESTION = 'AI_COACHING_DATA_INGESTION',
  ANALYTICS_TELEMETRY = 'ANALYTICS_TELEMETRY',
  MARKETING_COMMUNICATIONS = 'MARKETING_COMMUNICATIONS',
}

export interface IConsentRecord {
  id: string;
  userId: string;
  category: ConsentCategory;
  version: string;
  granted: boolean;
  grantedAt?: string;
  withdrawnAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IConsentStatus {
  userId: string;
  records: Record<ConsentCategory, IConsentRecord>;
  needsReconsent: boolean;
  outdatedCategories: ConsentCategory[];
}

export enum SecurityAuditEventType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  CONSENT_GRANTED = 'CONSENT_GRANTED',
  CONSENT_WITHDRAWN = 'CONSENT_WITHDRAWN',
  DATA_EXPORT_REQUESTED = 'DATA_EXPORT_REQUESTED',
  DATA_ERASURE_REQUESTED = 'DATA_ERASURE_REQUESTED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  HEALTH_DATA_READ = 'HEALTH_DATA_READ',
}

export interface ISecurityAuditEvent {
  id: string;
  eventType: SecurityAuditEventType;
  actorId: string;
  actorRole: string;
  targetUserId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  previousHash: string;
  integrityHash: string;

  // Backwards compatibility fields for Phase 11 tests
  action?: string;
  metadata?: Record<string, any>;
  userId?: string;
  resource?: string;
}

export type RetentionCategory =
  | 'RAW_TELEMETRY'
  | 'ANALYTICS_AGGREGATES'
  | 'SENSITIVE_PHOTOS'
  | 'AUDIT_LOGS'
  | 'INACTIVE_ACCOUNTS';

export interface IDataRetentionRule {
  category: RetentionCategory;
  retentionDays: number;
  action: 'ANONYMIZE' | 'ARCHIVE' | 'PURGE';
  description: string;
}

export interface IDataPortabilityBundle {
  exportId: string;
  exportedAt: string;
  checksum?: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
  };
  profile: Record<string, any> | null;
  preferences: Record<string, any> | null;
  workouts: Record<string, any>[];
  nutrition: Record<string, any>[];
  activity: Record<string, any>[];
  biometrics: Record<string, any>[];
  consents?: Record<string, any>;
  compliance: {
    format: 'JSON_SCHEMA_V1';
    gdprArticle?: 'ARTICLE_20';
    framework?: 'PRIVACY_READY';
    controlsImplemented?: string[];
    dataSovereignty: 'CANONICAL_UTC_METRIC';
  };
}

export interface IAnonymizationResult {
  userId: string;
  anonymizedAt: string;
  success: boolean;
  recordsScrubbed: number;
  pseudonym: string;
}

// -------------------------------------------------------------
// PHASE 14: INTEGRATIONS & WEARABLE ECOSYSTEM CONTRACTS
// -------------------------------------------------------------

export enum IntegrationCapability {
  STEPS = 'STEPS',
  HEART_RATE = 'HEART_RATE',
  RESTING_HEART_RATE = 'RESTING_HEART_RATE',
  HRV = 'HRV',
  SLEEP = 'SLEEP',
  WORKOUTS = 'WORKOUTS',
  ACTIVE_CALORIES = 'ACTIVE_CALORIES',
  TOTAL_CALORIES = 'TOTAL_CALORIES',
  DISTANCE = 'DISTANCE',
  VO2_MAX = 'VO2_MAX',
  SPO2 = 'SPO2',
  RESPIRATION = 'RESPIRATION',
  WEIGHT = 'WEIGHT',
  BODY_FAT = 'BODY_FAT',
  RECOVERY_SCORE = 'RECOVERY_SCORE',
  READINESS_SCORE = 'READINESS_SCORE',
  ROUTE = 'ROUTE',
}

export enum IntegrationConnectionState {
  AVAILABLE = 'AVAILABLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  SYNCING = 'SYNCING',
  PAUSED = 'PAUSED',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}

export enum HealthPermissionState {
  NOT_REQUESTED = 'NOT_REQUESTED',
  REQUESTED = 'REQUESTED',
  GRANTED = 'GRANTED',
  PARTIALLY_GRANTED = 'PARTIALLY_GRANTED',
  DENIED = 'DENIED',
  REVOKED = 'REVOKED',
  RESTRICTED = 'RESTRICTED',
}

export enum IntegrationAuthType {
  OAUTH2 = 'OAUTH2',
  MOBILE_SDK = 'MOBILE_SDK',
  API_KEY = 'API_KEY',
}

export interface DataSourceProvenance {
  sourceProvider: HealthPlatform | 'MANUAL' | 'SYSTEM';
  sourceRecordId: string;
  userId: string;
  metricType: string;
  recordedAt: string; // ISO 8601
  sourceTimezone?: string;
  importedAt: string; // ISO 8601
  syncJobId?: string;
  deviceModel?: string;
  deviceManufacturer?: string;
  isManualInput: boolean;
  confidenceScore?: number; // 0.0 - 1.0
}

export interface IIntegrationProviderInfo {
  platform: HealthPlatform;
  displayName: string;
  description: string;
  authType: IntegrationAuthType;
  capabilities: IntegrationCapability[];
  status: IntegrationConnectionState;
  requiresCredentials: boolean;
  iconUrl?: string;
}

export interface IIntegrationConnection {
  id: string;
  userId: string;
  platform: HealthPlatform;
  status: IntegrationConnectionState;
  permissionState: HealthPermissionState;
  grantedPermissions: string[];
  lastSyncAt?: string | null;
  lastSuccessfulSyncAt?: string | null;
  lastErrorAt?: string | null;
  lastErrorMessage?: string | null;
  syncCursor?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IIntegrationSyncResult {
  provider: HealthPlatform;
  userId: string;
  jobId: string;
  recordsProcessed: number;
  syncedCount: number;
  duplicatesIgnored: number;
  conflictsResolved: number;
  newCursor?: string;
  syncedAt: string;
}

export type ConflictResolutionStrategy =
  | 'MANUAL_OVERRIDE'
  | 'HIGHER_CONFIDENCE'
  | 'LATEST_TIMESTAMP'
  | 'MAX_VALUE';

export interface IConflictResolutionPolicy {
  metricType: string;
  strategy: ConflictResolutionStrategy;
  description: string;
}

export interface IEncryptedTokenPayload {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

export interface ISanitizedIntegrationTokens {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  maskedAccessToken?: string;
  expiresAt?: string;
}

export interface INormalizedHealthRecord {
  id: string;
  userId: string;
  platform: HealthPlatform;
  metricType: string;
  value: number;
  unit: string;
  recordedAt: string;
  provenance: DataSourceProvenance;
  metadata?: Record<string, any>;
}

export interface IHealthPlatformSyncSummary {
  platform: HealthPlatform;
  syncType: 'INITIAL' | 'INCREMENTAL';
  recordsReceived: number;
  recordsPersisted: number;
  duplicatesIgnored: number;
  conflictsResolved: number;
  syncCursor: string;
  syncedAt: string;
  status: IntegrationConnectionState;
}

export enum TokenRefreshStatus {
  TOKEN_VALID = 'TOKEN_VALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  REFRESH_SUCCESS = 'REFRESH_SUCCESS',
  REFRESH_FAILED = 'REFRESH_FAILED',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
}

export interface IWearableSyncRecord {
  id: string;
  userId: string;
  platform: HealthPlatform;
  metricType: string;
  value: number;
  unit: string;
  recordedAt: string;
  providerAttribution: string;
  isProprietaryScore: boolean;
  provenance: DataSourceProvenance;
  metadata?: Record<string, any>;
}

export interface IWearableProviderStatus {
  platform: HealthPlatform;
  displayName: string;
  authType: IntegrationAuthType;
  availabilityStatus: 'AVAILABLE' | 'CONNECTED' | 'ARCHITECTURE_READY_PENDING_CREDENTIALS' | 'REAUTH_REQUIRED' | 'ERROR';
  capabilities: IntegrationCapability[];
  requiresCredentials: boolean;
  lastSyncAt?: string | null;
  isStale?: boolean;
}

// -------------------------------------------------------------
// PHASE 14 GATE D: SYNC PIPELINE, PRIVACY, CIRCUIT BREAKER & RETENTION
// -------------------------------------------------------------

export interface IPrivacyZone {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
}

export interface IHealthPrivacyPreferences {
  userId: string;
  shareSteps: boolean;
  shareHeartRate: boolean;
  shareSleep: boolean;
  shareWeight: boolean;
  shareWorkouts: boolean;
  shareGpsRoute: boolean;
  shareProprietaryScores: boolean;
  trimRouteEndpoints: boolean;
  routeEndpointTrimMeters: number;
  updatedAt: string;
}

export interface IGpsCoordinate {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  timestamp?: string;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ICircuitBreakerStatus {
  platform: HealthPlatform;
  state: CircuitBreakerState;
  failureCount: number;
  consecutiveSuccesses: number;
  lastFailureTime?: string | null;
  lastStateChange: string;
}

export interface IHealthRetentionPolicy {
  rawIntradayRetentionDays: number;
  routeCoordinatesRetentionDays: number;
  dailyAggregatesRetentionDays: number;
}

export interface IHealthSyncJobResult {
  jobId: string;
  queue: QueueName;
  platform: HealthPlatform;
  userId: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRY_SCHEDULED';
  recordsProcessed: number;
  syncedCount: number;
  duplicatesIgnored: number;
  conflictsResolved: number;
  newCursor?: string;
  error?: string;
  processedAt: string;
}
