"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRefreshStatus = exports.IntegrationAuthType = exports.HealthPermissionState = exports.IntegrationConnectionState = exports.IntegrationCapability = exports.SecurityAuditEventType = exports.ConsentCategory = exports.EnterprisePermission = exports.AIInsightType = exports.AIActionType = exports.AIMessageRole = exports.AIProviderType = exports.BMICategory = exports.PersonalRecordType = exports.BodyMeasurementType = exports.HeartRateZone = exports.ActivitySource = exports.CardioType = exports.FoodCategory = exports.MealType = exports.MealStatus = exports.SocialProvider = exports.AccountStatus = exports.HealthConnectionStatus = exports.HealthPlatform = exports.WorkoutStatus = exports.PrimaryGoal = exports.ExperienceLevel = exports.UnitSystem = exports.Gender = exports.ProgramStatus = exports.ClientStatus = exports.InvitationStatus = exports.UserRole = void 0;
// Core Enums
var UserRole;
(function (UserRole) {
    UserRole["ATHLETE"] = "ATHLETE";
    UserRole["COACH"] = "COACH";
    UserRole["TRAINER"] = "TRAINER";
    UserRole["NUTRITIONIST"] = "NUTRITIONIST";
    UserRole["ORG_ADMIN"] = "ORG_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "PENDING";
    InvitationStatus["ACCEPTED"] = "ACCEPTED";
    InvitationStatus["EXPIRED"] = "EXPIRED";
    InvitationStatus["CANCELLED"] = "CANCELLED";
    InvitationStatus["DECLINED"] = "DECLINED";
})(InvitationStatus || (exports.InvitationStatus = InvitationStatus = {}));
var ClientStatus;
(function (ClientStatus) {
    ClientStatus["ACTIVE"] = "ACTIVE";
    ClientStatus["INVITED"] = "INVITED";
    ClientStatus["INACTIVE"] = "INACTIVE";
    ClientStatus["ARCHIVED"] = "ARCHIVED";
})(ClientStatus || (exports.ClientStatus = ClientStatus = {}));
var ProgramStatus;
(function (ProgramStatus) {
    ProgramStatus["DRAFT"] = "DRAFT";
    ProgramStatus["PUBLISHED"] = "PUBLISHED";
    ProgramStatus["ASSIGNED"] = "ASSIGNED";
    ProgramStatus["ARCHIVED"] = "ARCHIVED";
})(ProgramStatus || (exports.ProgramStatus = ProgramStatus = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
    Gender["PREFER_NOT_TO_SAY"] = "PREFER_NOT_TO_SAY";
})(Gender || (exports.Gender = Gender = {}));
var UnitSystem;
(function (UnitSystem) {
    UnitSystem["METRIC"] = "METRIC";
    UnitSystem["IMPERIAL"] = "IMPERIAL";
})(UnitSystem || (exports.UnitSystem = UnitSystem = {}));
var ExperienceLevel;
(function (ExperienceLevel) {
    ExperienceLevel["BEGINNER"] = "BEGINNER";
    ExperienceLevel["INTERMEDIATE"] = "INTERMEDIATE";
    ExperienceLevel["ADVANCED"] = "ADVANCED";
    ExperienceLevel["ELITE"] = "ELITE";
})(ExperienceLevel || (exports.ExperienceLevel = ExperienceLevel = {}));
var PrimaryGoal;
(function (PrimaryGoal) {
    PrimaryGoal["HYPERTROPHY"] = "HYPERTROPHY";
    PrimaryGoal["STRENGTH"] = "STRENGTH";
    PrimaryGoal["FAT_LOSS"] = "FAT_LOSS";
    PrimaryGoal["ENDURANCE"] = "ENDURANCE";
    PrimaryGoal["LONGEVITY"] = "LONGEVITY";
    PrimaryGoal["GENERAL_FITNESS"] = "GENERAL_FITNESS";
})(PrimaryGoal || (exports.PrimaryGoal = PrimaryGoal = {}));
var WorkoutStatus;
(function (WorkoutStatus) {
    WorkoutStatus["PLANNED"] = "PLANNED";
    WorkoutStatus["IN_PROGRESS"] = "IN_PROGRESS";
    WorkoutStatus["COMPLETED"] = "COMPLETED";
    WorkoutStatus["SKIPPED"] = "SKIPPED";
})(WorkoutStatus || (exports.WorkoutStatus = WorkoutStatus = {}));
var HealthPlatform;
(function (HealthPlatform) {
    HealthPlatform["APPLE_HEALTHKIT"] = "APPLE_HEALTHKIT";
    HealthPlatform["ANDROID_HEALTH_CONNECT"] = "ANDROID_HEALTH_CONNECT";
    HealthPlatform["GARMIN"] = "GARMIN";
    HealthPlatform["WHOOP"] = "WHOOP";
    HealthPlatform["OURA"] = "OURA";
    HealthPlatform["FITBIT"] = "FITBIT";
})(HealthPlatform || (exports.HealthPlatform = HealthPlatform = {}));
var HealthConnectionStatus;
(function (HealthConnectionStatus) {
    HealthConnectionStatus["CONNECTED"] = "CONNECTED";
    HealthConnectionStatus["DISCONNECTED"] = "DISCONNECTED";
    HealthConnectionStatus["REVOKED"] = "REVOKED";
    HealthConnectionStatus["PENDING_PERMISSION"] = "PENDING_PERMISSION";
})(HealthConnectionStatus || (exports.HealthConnectionStatus = HealthConnectionStatus = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "ACTIVE";
    AccountStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
    AccountStatus["SUSPENDED"] = "SUSPENDED";
    AccountStatus["DELETED"] = "DELETED";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
var SocialProvider;
(function (SocialProvider) {
    SocialProvider["GOOGLE"] = "GOOGLE";
    SocialProvider["APPLE"] = "APPLE";
})(SocialProvider || (exports.SocialProvider = SocialProvider = {}));
// -------------------------------------------------------------
// NUTRITION ENGINE CONTRACTS
// -------------------------------------------------------------
var MealStatus;
(function (MealStatus) {
    MealStatus["UPCOMING"] = "UPCOMING";
    MealStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MealStatus["COMPLETED"] = "COMPLETED";
    MealStatus["PARTIAL"] = "PARTIAL";
    MealStatus["SKIPPED"] = "SKIPPED";
    MealStatus["MISSED"] = "MISSED";
})(MealStatus || (exports.MealStatus = MealStatus = {}));
var MealType;
(function (MealType) {
    MealType["BREAKFAST"] = "BREAKFAST";
    MealType["LUNCH"] = "LUNCH";
    MealType["DINNER"] = "DINNER";
    MealType["SNACK"] = "SNACK";
    MealType["PRE_WORKOUT"] = "PRE_WORKOUT";
    MealType["POST_WORKOUT"] = "POST_WORKOUT";
    MealType["CUSTOM"] = "CUSTOM";
})(MealType || (exports.MealType = MealType = {}));
var FoodCategory;
(function (FoodCategory) {
    FoodCategory["PROTEIN"] = "PROTEIN";
    FoodCategory["GRAINS"] = "GRAINS";
    FoodCategory["VEGETABLES"] = "VEGETABLES";
    FoodCategory["FRUITS"] = "FRUITS";
    FoodCategory["DAIRY"] = "DAIRY";
    FoodCategory["NUTS_SEEDS"] = "NUTS_SEEDS";
    FoodCategory["LEGUMES"] = "LEGUMES";
    FoodCategory["OILS"] = "OILS";
    FoodCategory["BEVERAGES"] = "BEVERAGES";
    FoodCategory["SUPPLEMENTS"] = "SUPPLEMENTS";
    FoodCategory["OTHER"] = "OTHER";
})(FoodCategory || (exports.FoodCategory = FoodCategory = {}));
// -------------------------------------------------------------
// ACTIVITY, STEPS & CARDIO ENGINE CONTRACTS
// -------------------------------------------------------------
var CardioType;
(function (CardioType) {
    CardioType["RUNNING"] = "RUNNING";
    CardioType["WALKING"] = "WALKING";
    CardioType["CYCLING"] = "CYCLING";
    CardioType["INDOOR_CYCLING"] = "INDOOR_CYCLING";
    CardioType["ROWING"] = "ROWING";
    CardioType["SWIMMING"] = "SWIMMING";
    CardioType["STAIR_CLIMBING"] = "STAIR_CLIMBING";
    CardioType["HIKING"] = "HIKING";
    CardioType["OTHER"] = "OTHER";
})(CardioType || (exports.CardioType = CardioType = {}));
var ActivitySource;
(function (ActivitySource) {
    ActivitySource["MANUAL"] = "MANUAL";
    ActivitySource["APPLE_HEALTH"] = "APPLE_HEALTH";
    ActivitySource["HEALTH_CONNECT"] = "HEALTH_CONNECT";
    ActivitySource["GPS"] = "GPS";
    ActivitySource["SYSTEM"] = "SYSTEM";
})(ActivitySource || (exports.ActivitySource = ActivitySource = {}));
var HeartRateZone;
(function (HeartRateZone) {
    HeartRateZone["ZONE_1_RECOVERY"] = "ZONE_1_RECOVERY";
    HeartRateZone["ZONE_2_AEROBIC"] = "ZONE_2_AEROBIC";
    HeartRateZone["ZONE_3_TEMPO"] = "ZONE_3_TEMPO";
    HeartRateZone["ZONE_4_THRESHOLD"] = "ZONE_4_THRESHOLD";
    HeartRateZone["ZONE_5_ANAEROBIC"] = "ZONE_5_ANAEROBIC";
})(HeartRateZone || (exports.HeartRateZone = HeartRateZone = {}));
// -------------------------------------------------------------
// PROGRESS, BODY METRICS & PERFORMANCE CONTRACTS
// -------------------------------------------------------------
var BodyMeasurementType;
(function (BodyMeasurementType) {
    BodyMeasurementType["WAIST"] = "WAIST";
    BodyMeasurementType["CHEST"] = "CHEST";
    BodyMeasurementType["HIPS"] = "HIPS";
    BodyMeasurementType["NECK"] = "NECK";
    BodyMeasurementType["SHOULDERS"] = "SHOULDERS";
    BodyMeasurementType["BICEPS"] = "BICEPS";
    BodyMeasurementType["FOREARMS"] = "FOREARMS";
    BodyMeasurementType["THIGHS"] = "THIGHS";
    BodyMeasurementType["CALVES"] = "CALVES";
})(BodyMeasurementType || (exports.BodyMeasurementType = BodyMeasurementType = {}));
var PersonalRecordType;
(function (PersonalRecordType) {
    PersonalRecordType["HEAVIEST_WEIGHT"] = "HEAVIEST_WEIGHT";
    PersonalRecordType["BEST_REPS"] = "BEST_REPS";
    PersonalRecordType["MAX_VOLUME"] = "MAX_VOLUME";
    PersonalRecordType["ESTIMATED_1RM"] = "ESTIMATED_1RM";
})(PersonalRecordType || (exports.PersonalRecordType = PersonalRecordType = {}));
var BMICategory;
(function (BMICategory) {
    BMICategory["UNDERWEIGHT"] = "UNDERWEIGHT";
    BMICategory["NORMAL"] = "NORMAL";
    BMICategory["OVERWEIGHT"] = "OVERWEIGHT";
    BMICategory["OBESE"] = "OBESE";
})(BMICategory || (exports.BMICategory = BMICategory = {}));
// -------------------------------------------------------------
// AI COACH & INTELLIGENCE ENGINE CONTRACTS
// -------------------------------------------------------------
var AIProviderType;
(function (AIProviderType) {
    AIProviderType["MOCK"] = "MOCK";
    AIProviderType["OPENAI"] = "OPENAI";
    AIProviderType["ANTHROPIC"] = "ANTHROPIC";
    AIProviderType["GEMINI"] = "GEMINI";
})(AIProviderType || (exports.AIProviderType = AIProviderType = {}));
var AIMessageRole;
(function (AIMessageRole) {
    AIMessageRole["SYSTEM"] = "SYSTEM";
    AIMessageRole["USER"] = "USER";
    AIMessageRole["ASSISTANT"] = "ASSISTANT";
    AIMessageRole["TOOL"] = "TOOL";
})(AIMessageRole || (exports.AIMessageRole = AIMessageRole = {}));
var AIActionType;
(function (AIActionType) {
    AIActionType["SUGGEST_WORKOUT_CHANGE"] = "SUGGEST_WORKOUT_CHANGE";
    AIActionType["SUGGEST_MEAL_CHANGE"] = "SUGGEST_MEAL_CHANGE";
    AIActionType["SUGGEST_GOAL_ADJUSTMENT"] = "SUGGEST_GOAL_ADJUSTMENT";
    AIActionType["CREATE_DRAFT_PLAN"] = "CREATE_DRAFT_PLAN";
    AIActionType["EXPLAIN_PROGRESS"] = "EXPLAIN_PROGRESS";
    AIActionType["CREATE_REMINDER_DRAFT"] = "CREATE_REMINDER_DRAFT";
})(AIActionType || (exports.AIActionType = AIActionType = {}));
var AIInsightType;
(function (AIInsightType) {
    AIInsightType["WORKOUT_CONSISTENCY"] = "WORKOUT_CONSISTENCY";
    AIInsightType["STRENGTH_PROGRESS"] = "STRENGTH_PROGRESS";
    AIInsightType["NUTRITION_ADHERENCE"] = "NUTRITION_ADHERENCE";
    AIInsightType["HYDRATION"] = "HYDRATION";
    AIInsightType["ACTIVITY"] = "ACTIVITY";
    AIInsightType["WEIGHT_TREND"] = "WEIGHT_TREND";
    AIInsightType["GOAL_PROGRESS"] = "GOAL_PROGRESS";
})(AIInsightType || (exports.AIInsightType = AIInsightType = {}));
var EnterprisePermission;
(function (EnterprisePermission) {
    EnterprisePermission["VIEW_CLIENT_TELEMETRY"] = "VIEW_CLIENT_TELEMETRY";
    EnterprisePermission["MANAGE_CLIENT_PROGRAM"] = "MANAGE_CLIENT_PROGRAM";
    EnterprisePermission["MANAGE_CLIENT_NUTRITION"] = "MANAGE_CLIENT_NUTRITION";
    EnterprisePermission["EXPORT_ORG_DATA"] = "EXPORT_ORG_DATA";
    EnterprisePermission["MANAGE_ORG_MEMBERS"] = "MANAGE_ORG_MEMBERS";
    EnterprisePermission["MANAGE_ORG_SETTINGS"] = "MANAGE_ORG_SETTINGS";
    EnterprisePermission["AUDIT_LOG_READ"] = "AUDIT_LOG_READ";
    EnterprisePermission["EXPORT_PERSONAL_DATA"] = "EXPORT_PERSONAL_DATA";
    EnterprisePermission["ERASE_PERSONAL_DATA"] = "ERASE_PERSONAL_DATA";
})(EnterprisePermission || (exports.EnterprisePermission = EnterprisePermission = {}));
var ConsentCategory;
(function (ConsentCategory) {
    ConsentCategory["TERMS_OF_SERVICE"] = "TERMS_OF_SERVICE";
    ConsentCategory["PRIVACY_POLICY"] = "PRIVACY_POLICY";
    ConsentCategory["HEALTH_DATA_PROCESSING"] = "HEALTH_DATA_PROCESSING";
    ConsentCategory["AI_COACHING_DATA_INGESTION"] = "AI_COACHING_DATA_INGESTION";
    ConsentCategory["ANALYTICS_TELEMETRY"] = "ANALYTICS_TELEMETRY";
    ConsentCategory["MARKETING_COMMUNICATIONS"] = "MARKETING_COMMUNICATIONS";
})(ConsentCategory || (exports.ConsentCategory = ConsentCategory = {}));
var SecurityAuditEventType;
(function (SecurityAuditEventType) {
    SecurityAuditEventType["USER_LOGIN"] = "USER_LOGIN";
    SecurityAuditEventType["USER_LOGIN_FAILED"] = "USER_LOGIN_FAILED";
    SecurityAuditEventType["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    SecurityAuditEventType["SESSION_REVOKED"] = "SESSION_REVOKED";
    SecurityAuditEventType["PASSWORD_RESET_REQUESTED"] = "PASSWORD_RESET_REQUESTED";
    SecurityAuditEventType["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    SecurityAuditEventType["CONSENT_GRANTED"] = "CONSENT_GRANTED";
    SecurityAuditEventType["CONSENT_WITHDRAWN"] = "CONSENT_WITHDRAWN";
    SecurityAuditEventType["DATA_EXPORT_REQUESTED"] = "DATA_EXPORT_REQUESTED";
    SecurityAuditEventType["DATA_ERASURE_REQUESTED"] = "DATA_ERASURE_REQUESTED";
    SecurityAuditEventType["ROLE_CHANGED"] = "ROLE_CHANGED";
    SecurityAuditEventType["HEALTH_DATA_READ"] = "HEALTH_DATA_READ";
})(SecurityAuditEventType || (exports.SecurityAuditEventType = SecurityAuditEventType = {}));
// -------------------------------------------------------------
// PHASE 14: INTEGRATIONS & WEARABLE ECOSYSTEM CONTRACTS
// -------------------------------------------------------------
var IntegrationCapability;
(function (IntegrationCapability) {
    IntegrationCapability["STEPS"] = "STEPS";
    IntegrationCapability["HEART_RATE"] = "HEART_RATE";
    IntegrationCapability["RESTING_HEART_RATE"] = "RESTING_HEART_RATE";
    IntegrationCapability["HRV"] = "HRV";
    IntegrationCapability["SLEEP"] = "SLEEP";
    IntegrationCapability["WORKOUTS"] = "WORKOUTS";
    IntegrationCapability["ACTIVE_CALORIES"] = "ACTIVE_CALORIES";
    IntegrationCapability["TOTAL_CALORIES"] = "TOTAL_CALORIES";
    IntegrationCapability["DISTANCE"] = "DISTANCE";
    IntegrationCapability["VO2_MAX"] = "VO2_MAX";
    IntegrationCapability["SPO2"] = "SPO2";
    IntegrationCapability["RESPIRATION"] = "RESPIRATION";
    IntegrationCapability["WEIGHT"] = "WEIGHT";
    IntegrationCapability["BODY_FAT"] = "BODY_FAT";
    IntegrationCapability["RECOVERY_SCORE"] = "RECOVERY_SCORE";
    IntegrationCapability["READINESS_SCORE"] = "READINESS_SCORE";
    IntegrationCapability["ROUTE"] = "ROUTE";
})(IntegrationCapability || (exports.IntegrationCapability = IntegrationCapability = {}));
var IntegrationConnectionState;
(function (IntegrationConnectionState) {
    IntegrationConnectionState["AVAILABLE"] = "AVAILABLE";
    IntegrationConnectionState["CONNECTING"] = "CONNECTING";
    IntegrationConnectionState["CONNECTED"] = "CONNECTED";
    IntegrationConnectionState["SYNCING"] = "SYNCING";
    IntegrationConnectionState["PAUSED"] = "PAUSED";
    IntegrationConnectionState["REAUTH_REQUIRED"] = "REAUTH_REQUIRED";
    IntegrationConnectionState["ERROR"] = "ERROR";
    IntegrationConnectionState["DISCONNECTED"] = "DISCONNECTED";
})(IntegrationConnectionState || (exports.IntegrationConnectionState = IntegrationConnectionState = {}));
var HealthPermissionState;
(function (HealthPermissionState) {
    HealthPermissionState["NOT_REQUESTED"] = "NOT_REQUESTED";
    HealthPermissionState["REQUESTED"] = "REQUESTED";
    HealthPermissionState["GRANTED"] = "GRANTED";
    HealthPermissionState["PARTIALLY_GRANTED"] = "PARTIALLY_GRANTED";
    HealthPermissionState["DENIED"] = "DENIED";
    HealthPermissionState["REVOKED"] = "REVOKED";
    HealthPermissionState["RESTRICTED"] = "RESTRICTED";
})(HealthPermissionState || (exports.HealthPermissionState = HealthPermissionState = {}));
var IntegrationAuthType;
(function (IntegrationAuthType) {
    IntegrationAuthType["OAUTH2"] = "OAUTH2";
    IntegrationAuthType["MOBILE_SDK"] = "MOBILE_SDK";
    IntegrationAuthType["API_KEY"] = "API_KEY";
})(IntegrationAuthType || (exports.IntegrationAuthType = IntegrationAuthType = {}));
var TokenRefreshStatus;
(function (TokenRefreshStatus) {
    TokenRefreshStatus["TOKEN_VALID"] = "TOKEN_VALID";
    TokenRefreshStatus["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    TokenRefreshStatus["REFRESH_SUCCESS"] = "REFRESH_SUCCESS";
    TokenRefreshStatus["REFRESH_FAILED"] = "REFRESH_FAILED";
    TokenRefreshStatus["REAUTH_REQUIRED"] = "REAUTH_REQUIRED";
})(TokenRefreshStatus || (exports.TokenRefreshStatus = TokenRefreshStatus = {}));
