import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PerformanceProvider, usePerformance } from './src/context/PerformanceContext';
import { UpdateProvider } from './src/context/UpdateContext';
import { AlphaUpdateModal } from './src/components/AlphaUpdateModal';
import { AlphaErrorBoundary } from './src/components/AlphaErrorBoundary';
import {
  HomeIcon,
  WorkoutIcon,
  NutritionIcon,
  ActivityIcon,
  ProgressIcon,
} from './src/components/icons';
import { Theme } from './src/theme/tokens';

// Auth & Onboarding Screens
import {
  SplashScreen,
  WelcomeScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  SuccessScreen,
} from './src/screens/auth';
import {
  GoalSelectionScreen,
  ProfileOnboardingScreen,
  TrainingPreferencesScreen,
  ProgramRecommendationScreen,
  UserProfileData,
  TrainingPreferencesData,
} from './src/screens/onboarding';

// Core Application Tabs
import { HomeScreen } from './src/screens/home';
import {
  WorkoutPlanScreen,
  WorkoutSessionScreen,
  ExerciseDetailScreen,
  WorkoutCompletionScreen,
  ExerciseDetailData,
  WorkoutSummaryResult,
} from './src/screens/workout';
import {
  NutritionDashboardScreen,
  AddFoodScreen,
  MealDetailScreen,
  HydrationScreen,
} from './src/screens/nutrition';
import {
  ActivityDashboardScreen,
  ActiveCardioScreen,
  CardioCompletionScreen,
} from './src/screens/activity';
import {
  ProgressScreen,
  BodyMetricsScreen,
  GoalsScreen,
  MilestonesScreen,
  LogMetricModal,
} from './src/screens/progress';
import { AICoachScreen } from './src/screens/ai';
import {
  ProfileScreen,
  MoreMenuScreen,
  ExerciseLibraryScreen,
  FoodLibraryScreen,
  CalendarHistoryScreen,
  SettingsScreen,
  LIBRARY_EXERCISES,
} from './src/screens/profile';
import {
  NotificationCenterScreen,
  RemindersScreen,
  ReminderSettingsScreen,
} from './src/screens/notifications';
import { WeeklyCheckInScreen } from './src/screens/progress/WeeklyCheckInScreen';
import { IntegrationsScreen } from './src/screens/integrations';

type MainTab = 'HOME' | 'WORKOUT' | 'NUTRITION' | 'ACTIVITY' | 'PROGRESS';

type AuthRoute =
  | 'SPLASH'
  | 'WELCOME'
  | 'GOAL'
  | 'PROFILE'
  | 'PREFERENCES'
  | 'RECOMMENDATION'
  | 'REGISTER'
  | 'LOGIN'
  | 'FORGOT_PASSWORD'
  | 'SUCCESS';

type SubView =
  | null
  | 'COMMAND_HUB'
  | 'ACTIVE_WORKOUT'
  | 'WORKOUT_COMPLETION'
  | 'EXERCISE_DETAIL'
  | 'ADD_FOOD'
  | 'MEAL_DETAIL'
  | 'HYDRATION'
  | 'ACTIVE_CARDIO'
  | 'CARDIO_COMPLETION'
  | 'BODY_METRICS'
  | 'GOALS'
  | 'MILESTONES'
  | 'EXERCISE_LIBRARY'
  | 'FOOD_LIBRARY'
  | 'CALENDAR'
  | 'PROFILE_VIEW'
  | 'INTEGRATIONS'
  | 'REMINDERS'
  | 'NOTIFICATIONS'
  | 'SETTINGS'
  | 'AI_COACH'
  | 'WEEKLY_CHECKIN'
  | 'REMINDER_SETTINGS';

function MainNavigator() {
  const { status } = useAuth();
  const { recordWorkoutCompletion } = usePerformance();
  const [authRoute, setAuthRoute] = useState<AuthRoute>('SPLASH');
  const [activeTab, setActiveTab] = useState<MainTab>('HOME');
  const [activeSubView, setActiveSubView] = useState<SubView>(null);

  // Onboarding user configuration state across multi-step flow
  const [onboardingGoal, setOnboardingGoal] = useState<string>('MUSCLE_HYPERTROPHY');
  const [onboardingProfile, setOnboardingProfile] = useState<UserProfileData | null>(null);
  const [onboardingPreferences, setOnboardingPreferences] = useState<TrainingPreferencesData | null>(null);

  // Subview context states
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetailData | undefined>(undefined);
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState<WorkoutSummaryResult | null>(null);
  const [activeMealType, setActiveMealType] = useState<string>('LUNCH');
  const [activeCardioModality, setActiveCardioModality] = useState<string>('OUTDOOR_RUN');
  const [lastCardioStats, setLastCardioStats] = useState<{
    durationSeconds: number;
    distanceKm: number;
    avgPace: string;
    calories: number;
    avgHr: number;
  }>({
    durationSeconds: 1540,
    distanceKm: 5.2,
    avgPace: '4:56 /km',
    calories: 380,
    avgHr: 148,
  });
  const [logMetricModalVisible, setLogMetricModalVisible] = useState(false);

  // Splash countdown
  // Splash & Initial Session Restoration
  useEffect(() => {
    if (status === 'authenticated') {
      // Authenticated session restored: do nothing, main dashboard renders
    } else if (status === 'unauthenticated' && authRoute === 'SPLASH') {
      setAuthRoute('WELCOME');
    }
  }, [status, authRoute]);

  // While checking/restoring persistent session from local storage, keep splash screen visible
  if (status === 'loading' || (status === 'idle' && authRoute === 'SPLASH')) {
    return (
      <SplashScreen
        onComplete={() => {
          if (status === 'unauthenticated') {
            setAuthRoute('WELCOME');
          }
        }}
      />
    );
  }

  // Unauthenticated / Onboarding Flow
  if (status !== 'authenticated' && authRoute !== 'SUCCESS') {
    switch (authRoute) {
      case 'SPLASH':
        return <SplashScreen onComplete={() => setAuthRoute(status === 'authenticated' ? 'SUCCESS' : 'WELCOME')} />;
      case 'WELCOME':
        return (
          <WelcomeScreen
            onContinue={() => setAuthRoute('GOAL')}
            onLogin={() => setAuthRoute('LOGIN')}
          />
        );
      case 'GOAL':
        return (
          <GoalSelectionScreen
            onBack={() => setAuthRoute('WELCOME')}
            onNext={(goalId?: string) => {
              if (goalId) setOnboardingGoal(goalId);
              setAuthRoute('PROFILE');
            }}
          />
        );
      case 'PROFILE':
        return (
          <ProfileOnboardingScreen
            onBack={() => setAuthRoute('GOAL')}
            onNext={(profile: UserProfileData) => {
              setOnboardingProfile(profile);
              setAuthRoute('PREFERENCES');
            }}
          />
        );
      case 'PREFERENCES':
        return (
          <TrainingPreferencesScreen
            onBack={() => setAuthRoute('PROFILE')}
            onFinish={(prefs: TrainingPreferencesData) => {
              setOnboardingPreferences(prefs);
              setAuthRoute('RECOMMENDATION');
            }}
          />
        );
      case 'RECOMMENDATION':
        return (
          <ProgramRecommendationScreen
            goal={onboardingGoal}
            profile={onboardingProfile}
            preferences={onboardingPreferences}
            onBack={() => setAuthRoute('PREFERENCES')}
            onSelectProgram={(_programId: string) => {
              setAuthRoute('REGISTER');
            }}
          />
        );
      case 'REGISTER':
        return (
          <RegisterScreen
            onNavigateToLogin={() => setAuthRoute('LOGIN')}
            onRegistrationSuccess={() => setAuthRoute('SUCCESS')}
          />
        );
      case 'LOGIN':
        return (
          <LoginScreen
            onNavigateToRegister={() => setAuthRoute('REGISTER')}
            onNavigateToForgotPassword={() => setAuthRoute('FORGOT_PASSWORD')}
          />
        );
      case 'FORGOT_PASSWORD':
        return (
          <ForgotPasswordScreen
            onBackToLogin={() => setAuthRoute('LOGIN')}
          />
        );
      default:
        return <WelcomeScreen onContinue={() => setAuthRoute('GOAL')} onLogin={() => setAuthRoute('LOGIN')} />;
    }
  }

  // Success Celebration Screen after Auth/Onboarding
  if (authRoute === 'SUCCESS' && activeTab === 'HOME' && !activeSubView) {
    // Show success once, then user taps continue to enter app
    return (
      <SuccessScreen
        onContinue={() => {
          setAuthRoute('WELCOME'); // reset flag so main app displays
        }}
      />
    );
  }

  // Master Authenticated Dashboard Shell
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05070B" />

      {/* Main Tab Switcher */}
      <View style={styles.content}>
        {activeTab === 'HOME' && (
          <HomeScreen
            onStartWorkout={() => setActiveSubView('ACTIVE_WORKOUT')}
            onNavigateToWorkout={() => setActiveTab('WORKOUT')}
            onNavigateToNutrition={() => setActiveTab('NUTRITION')}
            onNavigateToActivity={() => setActiveTab('ACTIVITY')}
            onNavigateToAICoach={() => setActiveSubView('AI_COACH')}
            onOpenNotifications={() => setActiveSubView('NOTIFICATIONS')}
            onOpenCommandHub={() => setActiveSubView('COMMAND_HUB')}
            onOpenIntegrations={() => setActiveSubView('INTEGRATIONS')}
            onOpenCalendarHistory={() => setActiveSubView('CALENDAR')}
            onOpenWeeklyCheckIn={() => setActiveSubView('WEEKLY_CHECKIN')}
            onOpenReminderSettings={() => setActiveSubView('REMINDER_SETTINGS')}
          />
        )}

        {activeTab === 'WORKOUT' && (
          <WorkoutPlanScreen
            onStartWorkout={() => setActiveSubView('ACTIVE_WORKOUT')}
          />
        )}

        {activeTab === 'NUTRITION' && (
          <NutritionDashboardScreen
            onOpenAddFood={(mealType) => {
              setActiveMealType(mealType);
              setActiveSubView('ADD_FOOD');
            }}
            onOpenMealDetail={(mealType) => {
              setActiveMealType(mealType);
              setActiveSubView('MEAL_DETAIL');
            }}
            onOpenHydration={() => setActiveSubView('HYDRATION')}
          />
        )}

        {activeTab === 'ACTIVITY' && (
          <ActivityDashboardScreen
            onStartCardio={(modality) => {
              setActiveCardioModality(modality);
              setActiveSubView('ACTIVE_CARDIO');
            }}
          />
        )}

        {activeTab === 'PROGRESS' && <ProgressScreen />}
      </View>

      {/* Persistent Bottom Navigation Bar - Exactly 5 Tabs with Crisp Vector Icons */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'HOME' && styles.navItemActive]}
          onPress={() => setActiveTab('HOME')}
          activeOpacity={0.7}
        >
          <HomeIcon
            size={20}
            color={activeTab === 'HOME' ? Theme.colors.cyanGlow : Theme.colors.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'HOME' && styles.navTextActive]}>HOME</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'WORKOUT' && styles.navItemActive]}
          onPress={() => setActiveTab('WORKOUT')}
          activeOpacity={0.7}
        >
          <WorkoutIcon
            size={20}
            color={activeTab === 'WORKOUT' ? Theme.colors.cyanGlow : Theme.colors.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'WORKOUT' && styles.navTextActive]}>WORKOUT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'NUTRITION' && styles.navItemActive]}
          onPress={() => setActiveTab('NUTRITION')}
          activeOpacity={0.7}
        >
          <NutritionIcon
            size={20}
            color={activeTab === 'NUTRITION' ? Theme.colors.cyanGlow : Theme.colors.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'NUTRITION' && styles.navTextActive]}>NUTRITION</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'ACTIVITY' && styles.navItemActive]}
          onPress={() => setActiveTab('ACTIVITY')}
          activeOpacity={0.7}
        >
          <ActivityIcon
            size={20}
            color={activeTab === 'ACTIVITY' ? Theme.colors.cyanGlow : Theme.colors.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'ACTIVITY' && styles.navTextActive]}>ACTIVITY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'PROGRESS' && styles.navItemActive]}
          onPress={() => setActiveTab('PROGRESS')}
          activeOpacity={0.7}
        >
          <ProgressIcon
            size={20}
            color={activeTab === 'PROGRESS' ? Theme.colors.cyanGlow : Theme.colors.textMuted}
          />
          <Text style={[styles.navText, activeTab === 'PROGRESS' && styles.navTextActive]}>PROGRESS</Text>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Modal Subviews */}
      <Modal visible={activeSubView !== null} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#05070B" />
          {activeSubView === 'COMMAND_HUB' && (
            <MoreMenuScreen
              onBack={() => setActiveSubView(null)}
              onNavigate={(route) => {
                switch (route) {
                  case 'PROFILE':
                    setActiveSubView('PROFILE_VIEW');
                    break;
                  case 'BODY_METRICS':
                    setActiveSubView('BODY_METRICS');
                    break;
                  case 'GOALS':
                    setActiveSubView('GOALS');
                    break;
                  case 'MILESTONES':
                    setActiveSubView('MILESTONES');
                    break;
                  case 'EXERCISE_LIBRARY':
                    setActiveSubView('EXERCISE_LIBRARY');
                    break;
                  case 'FOOD_LIBRARY':
                    setActiveSubView('FOOD_LIBRARY');
                    break;
                  case 'CALENDAR':
                    setActiveSubView('CALENDAR');
                    break;
                  case 'INTEGRATIONS':
                    setActiveSubView('INTEGRATIONS');
                    break;
                  case 'REMINDERS':
                    setActiveSubView('REMINDERS');
                    break;
                  case 'NOTIFICATIONS':
                    setActiveSubView('NOTIFICATIONS');
                    break;
                  case 'SETTINGS':
                    setActiveSubView('SETTINGS');
                    break;
                  default:
                    break;
                }
              }}
            />
          )}

          {activeSubView === 'ACTIVE_WORKOUT' && (
            <WorkoutSessionScreen
              onBack={() => setActiveSubView(null)}
              onCompleteWorkout={(summary) => {
                recordWorkoutCompletion(summary);
                setLastWorkoutSummary(summary);
                setActiveSubView('WORKOUT_COMPLETION');
              }}
              onOpenExerciseDetail={(exerciseId) => {
                const found = LIBRARY_EXERCISES.find(
                  (e) => e.id === exerciseId || e.name.toLowerCase() === exerciseId.toLowerCase()
                );
                if (found) {
                  setSelectedExercise(found);
                }
                setActiveSubView('EXERCISE_DETAIL');
              }}
            />
          )}

          {activeSubView === 'WORKOUT_COMPLETION' && (
            <WorkoutCompletionScreen
              sessionTitle={lastWorkoutSummary?.sessionTitle}
              durationSeconds={lastWorkoutSummary?.durationSeconds}
              totalVolumeKg={lastWorkoutSummary?.totalVolumeKg}
              setsCompleted={lastWorkoutSummary?.totalSetsCompleted}
              repsCompleted={lastWorkoutSummary?.totalRepsCompleted}
              prsAchieved={lastWorkoutSummary?.prsAchieved}
              onFinish={() => {
                setActiveSubView(null);
                setActiveTab('HOME');
              }}
            />
          )}

          {activeSubView === 'EXERCISE_DETAIL' && (
            <ExerciseDetailScreen
              exercise={selectedExercise}
              onBack={() => setActiveSubView(null)}
            />
          )}

          {activeSubView === 'ADD_FOOD' && (
            <AddFoodScreen
              mealType={activeMealType}
              onBack={() => setActiveSubView(null)}
              onAddFood={() => setActiveSubView(null)}
            />
          )}

          {activeSubView === 'MEAL_DETAIL' && (
            <MealDetailScreen
              mealType={activeMealType}
              onBack={() => setActiveSubView(null)}
              onAddMoreFood={(type) => {
                setActiveMealType(type);
                setActiveSubView('ADD_FOOD');
              }}
            />
          )}

          {activeSubView === 'HYDRATION' && (
            <HydrationScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'ACTIVE_CARDIO' && (
            <ActiveCardioScreen
              modality={activeCardioModality}
              onFinishCardio={(stats) => {
                setLastCardioStats(stats);
                setActiveSubView('CARDIO_COMPLETION');
              }}
              onCancel={() => setActiveSubView(null)}
            />
          )}

          {activeSubView === 'CARDIO_COMPLETION' && (
            <CardioCompletionScreen
              stats={lastCardioStats}
              onFinish={() => setActiveSubView(null)}
            />
          )}

          {activeSubView === 'BODY_METRICS' && (
            <BodyMetricsScreen
              onBack={() => setActiveSubView(null)}
              onOpenLogModal={() => setLogMetricModalVisible(true)}
            />
          )}

          {activeSubView === 'GOALS' && (
            <GoalsScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'MILESTONES' && (
            <MilestonesScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'EXERCISE_LIBRARY' && (
            <ExerciseLibraryScreen
              onBack={() => setActiveSubView(null)}
              onSelectExercise={(ex) => {
                setSelectedExercise(ex);
                setActiveSubView('EXERCISE_DETAIL');
              }}
            />
          )}

          {activeSubView === 'FOOD_LIBRARY' && (
            <FoodLibraryScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'CALENDAR' && (
            <CalendarHistoryScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'PROFILE_VIEW' && (
            <ProfileScreen
              onBack={() => setActiveSubView(null)}
              onNavigateToSettings={() => setActiveSubView('SETTINGS')}
              onNavigateToIntegrations={() => setActiveSubView('INTEGRATIONS')}
            />
          )}

          {activeSubView === 'INTEGRATIONS' && (
            <IntegrationsScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'REMINDERS' && (
            <RemindersScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'NOTIFICATIONS' && (
            <NotificationCenterScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'SETTINGS' && (
            <SettingsScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'AI_COACH' && (
            <AICoachScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'WEEKLY_CHECKIN' && (
            <WeeklyCheckInScreen onBack={() => setActiveSubView(null)} />
          )}

          {activeSubView === 'REMINDER_SETTINGS' && (
            <ReminderSettingsScreen onBack={() => setActiveSubView(null)} />
          )}

          {/* Metric modal inside Body Metrics */}
          <LogMetricModal
            visible={logMetricModalVisible}
            onClose={() => setLogMetricModalVisible(false)}
            onSave={() => setLogMetricModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AlphaErrorBoundary>
      <AuthProvider>
        <PerformanceProvider>
          <UpdateProvider>
            <MainNavigator />
            <AlphaUpdateModal />
          </UpdateProvider>
        </PerformanceProvider>
      </AuthProvider>
    </AlphaErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  content: {
    flex: 1,
  },
  navBar: {
    height: 64,
    flexDirection: 'row',
    backgroundColor: '#07090E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 52,
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  navIcon: {
    fontSize: 16,
    marginBottom: 2,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navText: {
    fontSize: 9,
    fontFamily: Theme.typography.telemetry.fontFamily,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#00F0FF',
  },
});
