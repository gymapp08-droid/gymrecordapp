import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Length,
  Matches,
  Max,
  Min,
  IsBoolean,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ExperienceLevel,
  Gender,
  PrimaryGoal,
  SocialProvider,
  UnitSystem,
  UserRole,
  FoodCategory,
  MealStatus,
  MealType,
  CardioType,
  ActivitySource,
  HealthPlatform,
  BodyMeasurementType,
  InvitationStatus,
  ClientStatus,
  ProgramStatus,
  ConsentCategory,
  HealthPermissionState,
} from '@alpha/types';


export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. Must include uppercase, lowercase, and a number or symbol',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @Length(2, 100)
  fullName!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.ATHLETE;
}

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(280)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg?: number;
}

export class SetGoalDto {
  @IsEnum(PrimaryGoal)
  primaryGoal!: PrimaryGoal;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  targetWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(10000)
  targetDailyCalories?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  targetWeeklyWorkouts?: number;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token!: string;

  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. Must include uppercase, lowercase, and a number or symbol',
  })
  newPassword!: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token!: string;
}

export class SocialAuthDto {
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  token?: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

export class OnboardingGoalDto {
  @IsEnum(PrimaryGoal)
  primaryGoal!: PrimaryGoal;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  targetWeightKg?: number;
}

export class OnboardingProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsNumber()
  @Min(50)
  @Max(280)
  heightCm!: number;

  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg!: number;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;
}

export class OnboardingPreferencesDto {
  @IsEnum(UnitSystem)
  unitSystem!: UnitSystem;

  @IsString()
  @IsNotEmpty()
  timezone!: string; // e.g. "Asia/Kolkata"

  @IsString()
  @IsNotEmpty()
  language!: string; // e.g. "en"
}

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  primaryMuscle!: string;

  @IsOptional()
  @IsString({ each: true })
  secondaryMuscles?: string[];

  @IsOptional()
  @IsString()
  equipment?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class StartWorkoutSessionDto {
  @IsOptional()
  @IsString()
  workoutTemplateId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;
}

export class LogWorkoutSetDto {
  @IsString()
  @IsNotEmpty()
  workoutSessionExerciseId!: string;

  @IsNumber()
  @Min(1)
  setNumber!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  targetReps?: number;

  @IsNumber()
  @Min(0)
  actualReps!: number;

  @IsNumber()
  @Min(0)
  weightKg!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;

  @IsOptional()
  isCompleted?: boolean;
}

export class UpdateWorkoutSetDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualReps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;

  @IsOptional()
  isCompleted?: boolean;
}

export class CompleteWorkoutSessionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// -------------------------------------------------------------
// NUTRITION VALIDATION DTOs
// -------------------------------------------------------------

export class LogFoodItemDto {
  @IsString()
  @IsNotEmpty()
  foodItemId!: string;

  @IsNumber()
  @Min(0.01)
  @Max(10000)
  quantity!: number; // in grams or servings

  @IsString()
  @IsNotEmpty()
  servingUnit!: string; // 'g', 'ml', 'piece', 'serving'
}

export class CreateMealLogDto {
  @IsEnum(MealType)
  mealType!: MealType;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  logDate?: string; // YYYY-MM-DD (defaults to today)

  @IsOptional()
  @IsString()
  scheduledTime?: string; // HH:mm

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogFoodItemDto)
  items?: LogFoodItemDto[];
}

export class UpdateMealLogDto {
  @IsOptional()
  @IsEnum(MealStatus)
  status?: MealStatus;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}

export class AddFoodToMealDto {
  @IsString()
  @IsNotEmpty()
  foodItemId!: string;

  @IsNumber()
  @Min(0.01)
  @Max(10000)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  servingUnit!: string;
}

export class CreateCustomFoodDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsEnum(FoodCategory)
  category!: FoodCategory;

  @IsNumber()
  @Min(1)
  @Max(5000)
  servingSizeG!: number;

  @IsString()
  @IsNotEmpty()
  servingUnit!: string;

  @IsNumber()
  @Min(0)
  @Max(5000)
  calories!: number;

  @IsNumber()
  @Min(0)
  @Max(500)
  proteinGrams!: number;

  @IsNumber()
  @Min(0)
  @Max(500)
  carbsGrams!: number;

  @IsNumber()
  @Min(0)
  @Max(500)
  fatGrams!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  fiberGrams?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  sugarGrams?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  sodiumMg?: number;
}

export class LogHydrationDto {
  @IsNumber()
  @Min(10)
  @Max(5000)
  amountMl!: number;

  @IsOptional()
  @IsString()
  logDate?: string; // YYYY-MM-DD
}

export class CreateNutritionPlanDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(500)
  @Max(10000)
  dailyCalories!: number;

  @IsNumber()
  @Min(0)
  @Max(600)
  dailyProteinG!: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  dailyCarbsG!: number;

  @IsNumber()
  @Min(0)
  @Max(400)
  dailyFatG!: number;

  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(10000)
  dailyWaterMl?: number;
}

// -------------------------------------------------------------
// ACTIVITY, STEPS & CARDIO DTOs
// -------------------------------------------------------------

export class CreateCardioSessionDto {
  @IsEnum(CardioType)
  activityType!: CardioType;

  @IsString()
  @IsNotEmpty()
  startedAt!: string; // ISO 8601

  @IsNumber()
  @Min(1)
  @Max(86400) // max 24 hours
  durationSeconds!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500000) // max 500 km
  distanceMeters?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(250)
  avgHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(250)
  maxHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20000)
  activeCalories?: number;

  @IsOptional()
  @IsEnum(ActivitySource)
  source?: ActivitySource;

  @IsOptional()
  @IsString()
  sourceRecordId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCardioSessionDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500000)
  distanceMeters?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400)
  durationSeconds?: number;
}

export class LogManualActivityDto {
  @IsString()
  @IsNotEmpty()
  date!: string; // YYYY-MM-DD

  @IsNumber()
  @Min(0)
  @Max(200000)
  stepCount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1440)
  activeMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  activeCalories?: number;
}

export class SyncHealthRecordItemDto {
  @IsString()
  @IsNotEmpty()
  sourceRecordId!: string;

  @IsString()
  @IsNotEmpty()
  type!: 'STEPS' | 'CARDIO' | 'HEART_RATE';

  @IsString()
  @IsNotEmpty()
  date!: string; // YYYY-MM-DD

  @IsOptional()
  @IsNumber()
  @Min(0)
  stepCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceMeters?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsEnum(CardioType)
  cardioType?: CardioType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(250)
  avgHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(250)
  maxHeartRate?: number;
}

export class SyncHealthDataDto {
  @IsEnum(HealthPlatform)
  platform!: HealthPlatform;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncHealthRecordItemDto)
  records!: SyncHealthRecordItemDto[];
}

// -------------------------------------------------------------
// PROGRESS, BODY METRICS & PERFORMANCE DTOs
// -------------------------------------------------------------

export class LogBodyMetricDto {
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(70)
  bodyFatPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(200)
  muscleMassKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(90)
  waterPercent?: number;

  @IsOptional()
  @IsString()
  recordedAt?: string; // ISO 8601

  @IsOptional()
  @IsString()
  source?: string;
}

export class LogBodyMeasurementDto {
  @IsEnum(BodyMeasurementType)
  measurementType!: BodyMeasurementType;

  @IsNumber()
  @Min(5)
  @Max(300)
  valueCm!: number;

  @IsOptional()
  @IsString()
  recordedAt?: string; // ISO 8601
}

export class CreateProgressPhotoDto {
  @IsString()
  @IsNotEmpty()
  photoUrl!: string;

  @IsString()
  @IsNotEmpty()
  s3Key!: string;

  @IsString()
  @IsNotEmpty()
  viewAngle!: string; // FRONT, SIDE, BACK, etc.

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  takenAt?: string; // ISO 8601
}

// -------------------------------------------------------------
// AI COACH & INTELLIGENCE ENGINE DTOs
// -------------------------------------------------------------

export class AIChatRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  message!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class CreateAIConversationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  title?: string;
}

export class ConfirmAIActionDto {
  @IsString()
  @IsNotEmpty()
  proposalId!: string;

  @IsBoolean()
  confirmed!: boolean;
}

// -------------------------------------------------------------
// COACH / TRAINER / NUTRITIONIST PORTAL DTOs (PHASE 08)
// -------------------------------------------------------------

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  slug?: string;
}

export class InviteClientDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty({ message: 'Invitation token is required' })
  token!: string;
}

export class FilterInvitationsDto {
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;
}

export class UpdateClientStatusDto {
  @IsEnum(ClientStatus)
  status!: ClientStatus;
}

// -------------------------------------------------------------
// WORKOUT PROGRAM BUILDER & ASSIGNMENT DTOs (GATE B)
// -------------------------------------------------------------

export class CreateProgramExerciseDto {
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @IsNumber()
  orderIndex!: number;

  @IsNumber()
  @Min(1)
  @Max(20)
  targetSets!: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  targetReps!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  targetRpe?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(600)
  restSeconds?: number = 90;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateProgramDayDto {
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProgramExerciseDto)
  exercises!: CreateProgramExerciseDto[];
}

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  weeksCount?: number = 4;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProgramDayDto)
  days!: CreateProgramDayDto[];
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @Length(3, 120)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProgramDayDto)
  days?: CreateProgramDayDto[];
}

export class AssignProgramDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  programId!: string;

  @IsString()
  @IsNotEmpty()
  startDate!: string; // ISO 8601

  @IsOptional()
  @IsString()
  endDate?: string; // ISO 8601
}

export class ReplaceProgramDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  newProgramId!: string;

  @IsString()
  @IsNotEmpty()
  effectiveDate!: string; // ISO 8601

  @IsBoolean()
  confirm!: boolean;
}

// -------------------------------------------------------------
// NUTRITION PLAN BUILDER & ASSIGNMENT DTOs (GATE B)
// -------------------------------------------------------------

export class CreateMealPlanItemDto {
  @IsString()
  @IsNotEmpty()
  foodItemId!: string;

  @IsNumber()
  @Min(0.1)
  quantity!: number;

  @IsNumber()
  @Min(1)
  totalWeightG!: number;

  @IsNumber()
  @Min(0)
  calories!: number;

  @IsNumber()
  @Min(0)
  proteinGrams!: number;

  @IsNumber()
  @Min(0)
  carbsGrams!: number;

  @IsNumber()
  @Min(0)
  fatGrams!: number;
}

export class CreateMealPlanMealDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  orderIndex!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealPlanItemDto)
  items!: CreateMealPlanItemDto[];
}

export class CreateMealPlanDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealPlanMealDto)
  meals!: CreateMealPlanMealDto[];
}

export class AssignMealPlanDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  mealPlanId!: string;

  @IsString()
  @IsNotEmpty()
  startDate!: string; // ISO 8601

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CreateCustomExerciseDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  instructions!: string;

  @IsString()
  @IsNotEmpty()
  equipment!: string;

  @IsString()
  @IsNotEmpty()
  primaryMuscle!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryMuscles?: string[] = [];

  @IsOptional()
  @IsString()
  movementCategory?: string;
}

// -------------------------------------------------------------
// GATE C VALIDATION DTOS
// -------------------------------------------------------------

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  type!: 'CLIENT_PROGRESS' | 'WORKOUT_ADHERENCE' | 'NUTRITION_ADHERENCE' | 'ORGANIZATION_OVERVIEW';

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  format?: 'JSON' | 'CSV';
}

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsString()
  @IsNotEmpty()
  startDateTime!: string; // ISO 8601

  @IsOptional()
  @IsString()
  endDateTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  startDateTime?: string;

  @IsOptional()
  @IsString()
  endDateTime?: string;
}

export class UpdateClientGoalDto {
  @IsOptional()
  @IsEnum(PrimaryGoal)
  primaryGoal?: PrimaryGoal;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(350)
  targetWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(800)
  @Max(10000)
  targetDailyCalories?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(500)
  targetDailyProteinGrams?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(14)
  targetWeeklyWorkouts?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(100000)
  targetDailySteps?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// -------------------------------------------------------------
// PHASE 08 GATE D: MESSAGING & COACH AI ASSISTANT DTOS
// -------------------------------------------------------------

export class SendCoachMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];
}

export class GenerateCoachAiDraftDto {
  @IsUUID()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  draftType!: 'PERFORMANCE_SUMMARY' | 'WORKOUT_ADJUSTMENT' | 'NUTRITION_ADJUSTMENT' | 'CHECKIN_MESSAGE';

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  timeframeDays?: number;
}

export class ApplyCoachAiDraftDto {
  @IsUUID()
  draftId!: string;

  @IsOptional()
  actionPayload?: any;
}

// -------------------------------------------------------------
// NOTIFICATIONS & REMINDERS DTOS
// -------------------------------------------------------------

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  platform!: 'IOS' | 'ANDROID' | 'WEB';

  @IsOptional()
  @IsString()
  pushToken?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  workoutPush?: boolean;

  @IsOptional()
  @IsBoolean()
  nutritionPush?: boolean;

  @IsOptional()
  @IsBoolean()
  hydrationPush?: boolean;

  @IsOptional()
  @IsBoolean()
  activityPush?: boolean;

  @IsOptional()
  @IsBoolean()
  progressPush?: boolean;

  @IsOptional()
  @IsBoolean()
  goalsPush?: boolean;

  @IsOptional()
  @IsBoolean()
  messagesPush?: boolean;

  @IsOptional()
  @IsBoolean()
  coachPush?: boolean;

  @IsOptional()
  @IsBoolean()
  systemPush?: boolean;

  @IsOptional()
  @IsBoolean()
  workoutEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  nutritionEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  messagesEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyDigestEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'quietHoursStart must be in HH:mm format (e.g. 22:00)' })
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'quietHoursEnd must be in HH:mm format (e.g. 07:00)' })
  quietHoursEnd?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'timeOfDay must be in HH:mm format (e.g. 08:30)' })
  timeOfDay!: string;

  @IsOptional()
  @IsArray()
  daysOfWeek?: number[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'timeOfDay must be in HH:mm format (e.g. 08:30)' })
  timeOfDay?: string;

  @IsOptional()
  @IsArray()
  daysOfWeek?: number[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class NotificationQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

  @IsOptional()
  @IsString()
  category?: string;
}

export class SendNotificationDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  data?: Record<string, any>;

  @IsOptional()
  @IsString()
  deepLinkUrl?: string;
}

// -------------------------------------------------------------
// QUEUE & BACKGROUND WORKER DTOS
// -------------------------------------------------------------

export class QueueJobQueryDto {
  @IsOptional()
  @IsString()
  queue?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class RetryJobDto {
  @IsString()
  @IsNotEmpty()
  jobId!: string;
}

// -------------------------------------------------------------
// USER PREFERENCES & LOCALIZATION DTOS (PHASE 11)
// -------------------------------------------------------------

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(UnitSystem, { message: 'unitSystem must be METRIC or IMPERIAL' })
  unitSystem?: UnitSystem;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  pushNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;
}

// -------------------------------------------------------------
// ENTERPRISE ORG SETTINGS & PRIVACY DTOS (PHASE 11 - GATE C)
// -------------------------------------------------------------

export class UpdateOrgSettingsDto {
  @IsOptional()
  @IsString()
  tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  maxSeats?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @IsOptional()
  @IsBoolean()
  enforceSso?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(3650)
  dataRetentionDays?: number;

  @IsOptional()
  customBranding?: Record<string, any>;
}

export class UpdateConsentPreferencesDto {
  @IsOptional()
  @IsBoolean()
  analyticsTracking?: boolean;

  @IsOptional()
  @IsBoolean()
  telemetrySharing?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingCommunications?: boolean;

  @IsOptional()
  @IsBoolean()
  dataRetentionAgreed?: boolean;
}

export class AnonymizeUserRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Confirmation phrase is required to permanently anonymize account' })
  confirmPhrase!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GrantConsentDto {
  @IsEnum(ConsentCategory, { message: 'Invalid consent category' })
  category!: ConsentCategory;

  @IsString()
  @IsNotEmpty({ message: 'Policy version is required' })
  version!: string;

  @IsBoolean()
  granted!: boolean;
}

export class WithdrawConsentDto {
  @IsEnum(ConsentCategory, { message: 'Invalid consent category' })
  category!: ConsentCategory;

  @IsOptional()
  @IsString()
  reason?: string;
}

// -------------------------------------------------------------
// PHASE 14: INTEGRATIONS & WEARABLE ECOSYSTEM DTOs
// -------------------------------------------------------------

export class ConnectIntegrationDto {
  @IsEnum(HealthPlatform, { message: 'Invalid health platform provider' })
  platform!: HealthPlatform;

  @IsOptional()
  @IsString()
  authCode?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsNumber()
  expiresIn?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}

export class DisconnectIntegrationDto {
  @IsEnum(HealthPlatform, { message: 'Invalid health platform provider' })
  platform!: HealthPlatform;

  @IsOptional()
  @IsBoolean()
  revokeRemoteTokens?: boolean;

  @IsOptional()
  @IsBoolean()
  purgeImportedData?: boolean;
}

export class UpdateIntegrationPermissionsDto {
  @IsEnum(HealthPlatform, { message: 'Invalid health platform provider' })
  platform!: HealthPlatform;

  @IsEnum(HealthPermissionState, { message: 'Invalid permission state' })
  permissionState!: HealthPermissionState;

  @IsArray()
  @IsString({ each: true })
  grantedPermissions!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deniedPermissions?: string[];
}

export class TriggerIntegrationSyncDto {
  @IsEnum(HealthPlatform, { message: 'Invalid health platform provider' })
  platform!: HealthPlatform;

  @IsOptional()
  @IsString()
  syncType?: 'INCREMENTAL' | 'HISTORICAL_BACKFILL';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  syncWindowDays?: number;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class IntegrationWebhookPayloadDto {
  @IsEnum(HealthPlatform, { message: 'Invalid health platform provider' })
  platform!: HealthPlatform;

  @IsString()
  @IsNotEmpty({ message: 'Event type is required' })
  eventType!: string;

  @IsString()
  @IsNotEmpty({ message: 'Event ID is required' })
  eventId!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty({ message: 'Timestamp is required' })
  timestamp!: number | string;

  @IsNotEmpty({ message: 'Payload object is required' })
  payload!: Record<string, any>;
}

export class HealthPlatformRecordDto {
  @IsString()
  @IsNotEmpty({ message: 'sourceRecordId is required' })
  sourceRecordId!: string;

  @IsString()
  @IsNotEmpty({ message: 'metricType is required' })
  metricType!: string;

  @IsString()
  @IsNotEmpty({ message: 'recordedAt ISO date is required' })
  recordedAt!: string;

  @IsNumber()
  value!: number;

  @IsString()
  @IsNotEmpty({ message: 'unit is required' })
  unit!: string;

  @IsOptional()
  @IsString()
  sourceTimezone?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class HealthPlatformIngestDto {
  @IsEnum(HealthPlatform, { message: 'Invalid health platform' })
  platform!: HealthPlatform;

  @IsString()
  syncType!: 'INITIAL' | 'INCREMENTAL';

  @IsOptional()
  @IsString()
  syncCursor?: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @IsString()
  deviceManufacturer?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HealthPlatformRecordDto)
  records!: HealthPlatformRecordDto[];
}

export class CreatePrivacyZoneDto {
  @IsString()
  @IsNotEmpty({ message: 'Zone name is required' })
  name!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(5000)
  radiusMeters?: number;
}

export class UpdateHealthPrivacyPreferencesDto {
  @IsOptional()
  @IsBoolean()
  shareSteps?: boolean;

  @IsOptional()
  @IsBoolean()
  shareHeartRate?: boolean;

  @IsOptional()
  @IsBoolean()
  shareSleep?: boolean;

  @IsOptional()
  @IsBoolean()
  shareWeight?: boolean;

  @IsOptional()
  @IsBoolean()
  shareWorkouts?: boolean;

  @IsOptional()
  @IsBoolean()
  shareGpsRoute?: boolean;

  @IsOptional()
  @IsBoolean()
  shareProprietaryScores?: boolean;

  @IsOptional()
  @IsBoolean()
  trimRouteEndpoints?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2000)
  routeEndpointTrimMeters?: number;
}

export class EnforceRetentionDto {
  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(3650)
  rawIntradayCutoffDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(3650)
  routeCoordinatesCutoffDays?: number;
}
