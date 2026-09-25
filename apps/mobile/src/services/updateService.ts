import * as Updates from 'expo-updates';
import { AppState, AppStateStatus } from 'react-native';

export type UpdateStatus =
  | 'IDLE'
  | 'CHECKING'
  | 'DOWNLOADING'
  | 'READY_TO_RESTART'
  | 'UP_TO_DATE'
  | 'ERROR';

export interface UpdateInfo {
  status: UpdateStatus;
  isAvailable: boolean;
  isDownloaded: boolean;
  error: string | null;
  lastCheckedAt: Date | null;
  currentUpdateId: string | null;
  downloadedUpdateId: string | null;
  channel: string | null;
  runtimeVersion: string | null;
  isEmbeddedLaunch: boolean;
  isUpdatePending: boolean;
}

export interface UpdateCheckOptions {
  isManual?: boolean;
  isWorkoutActive?: boolean;
}

type UpdateListener = (info: UpdateInfo) => void;

class AlphaUpdateManager {
  private static instance: AlphaUpdateManager;
  private listeners: Set<UpdateListener> = new Set();
  private lastAutoCheckTime = 0;
  private readonly AUTO_CHECK_MIN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes throttle

  private state: UpdateInfo = {
    status: 'IDLE',
    isAvailable: false,
    isDownloaded: false,
    error: null,
    lastCheckedAt: null,
    currentUpdateId: Updates.updateId || null,
    downloadedUpdateId: null,
    channel: Updates.channel || null,
    runtimeVersion: typeof Updates.runtimeVersion === 'string' ? Updates.runtimeVersion : null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    isUpdatePending: false,
  };

  private constructor() {
    this.setupAppStateListener();
  }

  public static getInstance(): AlphaUpdateManager {
    if (!AlphaUpdateManager.instance) {
      AlphaUpdateManager.instance = new AlphaUpdateManager();
    }
    return AlphaUpdateManager.instance;
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = { ...this.state };
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.warn('[AlphaUpdateManager] Error in listener', err);
      }
    });
  }

  private updateState(partial: Partial<UpdateInfo>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public getState(): UpdateInfo {
    return { ...this.state };
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        if (now - this.lastAutoCheckTime > this.AUTO_CHECK_MIN_INTERVAL_MS) {
          this.checkForUpdate({ isManual: false });
        }
      }
    });
  }

  /**
   * Check for an OTA update.
   * If available and not already downloaded, immediately downloads the update safely.
   */
  public async checkForUpdate(options: UpdateCheckOptions = {}): Promise<boolean> {
    if (!Updates.isEnabled) {
      console.log('[AlphaUpdateManager] Updates are disabled in this environment.');
      if (options.isManual) {
        this.updateState({
          status: 'UP_TO_DATE',
          error: null,
          lastCheckedAt: new Date(),
        });
      }
      return false;
    }

    // If an update is already downloaded and ready to apply, don't re-download
    if (this.state.isDownloaded && this.state.status === 'READY_TO_RESTART') {
      return true;
    }

    try {
      this.lastAutoCheckTime = Date.now();
      this.updateState({
        status: 'CHECKING',
        error: null,
      });

      const checkResult = await Updates.checkForUpdateAsync();

      if (checkResult.isAvailable) {
        console.log('[AlphaUpdateManager] New update found. Starting download...');
        this.updateState({
          status: 'DOWNLOADING',
          isAvailable: true,
          error: null,
        });

        const fetchResult = await Updates.fetchUpdateAsync();

        if (fetchResult.isNew) {
          console.log('[AlphaUpdateManager] Update download complete and verified.');
          this.updateState({
            status: 'READY_TO_RESTART',
            isDownloaded: true,
            isUpdatePending: true,
            downloadedUpdateId: (fetchResult.manifest as any)?.id || null,
            lastCheckedAt: new Date(),
            error: null,
          });
          return true;
        } else {
          this.updateState({
            status: 'UP_TO_DATE',
            isAvailable: false,
            lastCheckedAt: new Date(),
          });
          return false;
        }
      } else {
        console.log('[AlphaUpdateManager] App is already on the latest runtime version.');
        this.updateState({
          status: 'UP_TO_DATE',
          isAvailable: false,
          lastCheckedAt: new Date(),
          error: null,
        });
        return false;
      }
    } catch (err: any) {
      console.warn('[AlphaUpdateManager] Update check/download failed:', err?.message || err);
      this.updateState({
        status: 'ERROR',
        error: err?.message || 'Network error while checking for updates.',
        lastCheckedAt: new Date(),
      });
      return false;
    }
  }

  /**
   * Reload app to apply downloaded update.
   * Enforces workout safety: if workout is active, prevents accidental reload.
   */
  public async reloadApp(isWorkoutActive = false): Promise<boolean> {
    if (isWorkoutActive) {
      console.warn('[AlphaUpdateManager] Reload blocked: Workout session is currently active.');
      return false;
    }

    if (!Updates.isEnabled) {
      console.log('[AlphaUpdateManager] reloadAsync skipped: Updates not enabled in this runtime.');
      return false;
    }

    try {
      await Updates.reloadAsync();
      return true;
    } catch (err) {
      console.error('[AlphaUpdateManager] Failed to reload app:', err);
      return false;
    }
  }

  public dismissNotification() {
    // If ready to restart, user postponed restart
    if (this.state.status === 'READY_TO_RESTART') {
      this.updateState({
        isUpdatePending: false, // Keep isDownloaded true, but dismiss modal/banner
      });
    } else if (this.state.status === 'UP_TO_DATE' || this.state.status === 'ERROR') {
      this.updateState({
        status: 'IDLE',
        error: null,
      });
    }
  }
}

export const UpdateService = AlphaUpdateManager.getInstance();
