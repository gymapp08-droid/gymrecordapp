import { Injectable } from '@nestjs/common';
import {
  IUserProfile,
  IUserPreference,
  IUserGoal,
  Gender,
  ExperienceLevel,
  UnitSystem,
  PrimaryGoal,
} from '@alpha/types';

@Injectable()
export class UsersService {
  // In-memory mock resource store for testing isolation
  private readonly profiles = new Map<string, IUserProfile>();
  private readonly preferences = new Map<string, IUserPreference>();
  private readonly goals = new Map<string, IUserGoal>();

  async getProfile(userId: string): Promise<IUserProfile> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      // Auto create a default profile for the user
      const defaultProfile: IUserProfile = {
        id: 'prof_' + userId,
        userId,
        fullName: 'Alpha Athlete',
        gender: Gender.MALE,
        heightCm: 180,
        weightKg: 78,
        experienceLevel: ExperienceLevel.INTERMEDIATE,
        activityMultiplier: 1.3,
        isOnboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.profiles.set(userId, defaultProfile);
      return defaultProfile;
    }
    return profile;
  }

  async updateProfile(userId: string, data: Partial<IUserProfile>): Promise<IUserProfile> {
    const profile = await this.getProfile(userId);
    const updated = {
      ...profile,
      ...data,
      updatedAt: new Date(),
    };
    this.profiles.set(userId, updated);
    return updated;
  }

  async getPreferences(userId: string): Promise<IUserPreference> {
    const pref = this.preferences.get(userId);
    if (!pref) {
      const defaultPref: IUserPreference = {
        id: 'pref_' + userId,
        userId,
        unitSystem: UnitSystem.METRIC,
        timezone: 'UTC',
        language: 'en',
        theme: 'black_glass',
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.preferences.set(userId, defaultPref);
      return defaultPref;
    }
    return pref;
  }

  async updatePreferences(userId: string, data: Partial<IUserPreference>): Promise<IUserPreference> {
    const pref = await this.getPreferences(userId);
    const updated = {
      ...pref,
      ...data,
      updatedAt: new Date(),
    };
    this.preferences.set(userId, updated);
    return updated;
  }

  async getGoals(userId: string): Promise<IUserGoal> {
    const goal = this.goals.get(userId);
    if (!goal) {
      const defaultGoal: IUserGoal = {
        id: 'goal_' + userId,
        userId,
        primaryGoal: PrimaryGoal.HYPERTROPHY,
        targetWeightKg: 82.0,
        targetDailyCalories: 2600,
        targetDailySteps: 10000,
        targetWeeklyWorkouts: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.goals.set(userId, defaultGoal);
      return defaultGoal;
    }
    return goal;
  }

  async updateGoals(userId: string, data: Partial<IUserGoal>): Promise<IUserGoal> {
    const goal = await this.getGoals(userId);
    const updated = {
      ...goal,
      ...data,
      updatedAt: new Date(),
    };
    this.goals.set(userId, updated);
    return updated;
  }
}

