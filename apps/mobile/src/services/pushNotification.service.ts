import { Platform } from 'react-native';
import { ApiClient } from './api';
import { SecureStorage } from './secureStorage';
import { IDevice, IPushPayload } from '@alpha/types';

export type DeepLinkHandler = (route: string, params?: Record<string, string>) => void;

class PushNotificationService {
  private deepLinkHandler: DeepLinkHandler | null = null;

  setDeepLinkHandler(handler: DeepLinkHandler): void {
    this.deepLinkHandler = handler;
  }

  /**
   * Register physical device with ALPHA Push Backend
   */
  async registerDevice(pushToken?: string): Promise<IDevice | null> {
    const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
    const simulatedToken =
      pushToken || (await SecureStorage.getItem('alpha_push_token')) || `mock_expo_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const res = await ApiClient.post<IDevice>('/devices/register', {
      platform,
      pushToken: simulatedToken,
      model: `${Platform.OS.toUpperCase()} Device`,
      osVersion: `${Platform.OS} ${Platform.Version || '17.0'}`,
      appVersion: '1.0.0',
    });

    if (res.success && res.data) {
      await SecureStorage.setItem('alpha_device_id', res.data.id);
      await SecureStorage.setItem('alpha_push_token', simulatedToken);
      return res.data;
    }

    return null;
  }

  /**
   * Unregister device on user logout
   */
  async unregisterDevice(): Promise<boolean> {
    const deviceId = await SecureStorage.getItem('alpha_device_id');
    if (!deviceId) return true;

    const res = await ApiClient.delete(`/devices/${deviceId}`);
    await SecureStorage.removeItem('alpha_device_id');
    await SecureStorage.removeItem('alpha_push_token');
    return res.success;
  }

  /**
   * Parse incoming push notification deep-link URL and invoke navigation
   * e.g. alpha://workouts/session/123 -> route: 'WorkoutSession', params: { sessionId: '123' }
   */
  handleDeepLink(url?: string): void {
    if (!url || !this.deepLinkHandler) return;

    try {
      // Normalize URL (strip alpha://)
      const cleanPath = url.replace(/^alpha:\/\//, '').replace(/^\//, '');
      const segments = cleanPath.split('/');

      // Pattern: workouts/session/:id
      if (segments[0] === 'workouts' && segments[1] === 'session' && segments[2]) {
        this.deepLinkHandler('WorkoutSession', { sessionId: segments[2] });
        return;
      }

      // Pattern: progress/weekly
      if (segments[0] === 'progress' && segments[1] === 'weekly') {
        this.deepLinkHandler('ProgressWeekly');
        return;
      }

      // Pattern: nutrition/meal/:id
      if (segments[0] === 'nutrition' && segments[1] === 'meal' && segments[2]) {
        this.deepLinkHandler('MealDetail', { mealId: segments[2] });
        return;
      }

      // Pattern: portal/messages
      if (segments[0] === 'portal' && segments[1] === 'messages') {
        this.deepLinkHandler('CoachChat');
        return;
      }

      // Default fallback
      this.deepLinkHandler(segments[0] || 'Home');
    } catch (e) {
      console.warn('Failed to parse push notification deep-link:', e);
    }
  }

  /**
   * Simulated push arrival on client
   */
  simulatePushArrival(payload: IPushPayload): void {
    if (payload.deepLinkUrl) {
      this.handleDeepLink(payload.deepLinkUrl);
    }
  }
}

export const PushNotification = new PushNotificationService();
