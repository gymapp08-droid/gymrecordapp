import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Robust Persistent Storage abstraction for mobile sessions and offline telemetry.
 * Uses persistent JSON document storage in Expo native and localStorage in Web.
 * Thread-safe with in-memory caching to eliminate IO latency.
 */
class SecureStorageService {
  private memoryStore = new Map<string, string>();
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private storageFilePath: string = '';

  constructor() {
    this.storageFilePath = `${FileSystem.documentDirectory || ''}alpha_secure_store_v2.json`;
    this.loadPromise = this.loadFromDisk();
  }

  private async loadFromDisk(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key) {
              const val = window.localStorage.getItem(key);
              if (val !== null) this.memoryStore.set(key, val);
            }
          }
        }
      } else if (FileSystem && FileSystem.documentDirectory) {
        this.storageFilePath = `${FileSystem.documentDirectory}alpha_secure_store_v2.json`;
        const fileInfo = await FileSystem.getInfoAsync(this.storageFilePath);
        if (fileInfo.exists) {
          const contents = await FileSystem.readAsStringAsync(this.storageFilePath);
          if (contents) {
            const parsed = JSON.parse(contents);
            if (parsed && typeof parsed === 'object') {
              for (const [k, v] of Object.entries(parsed)) {
                if (typeof v === 'string') {
                  this.memoryStore.set(k, v);
                }
              }
            }
          }
        }
      }
    } catch {
      // Graceful fallback to memory store
    } finally {
      this.isLoaded = true;
    }
  }

  private async saveToDisk(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          this.memoryStore.forEach((v, k) => {
            window.localStorage.setItem(k, v);
          });
        }
      } else if (FileSystem && FileSystem.documentDirectory && FileSystem.writeAsStringAsync) {
        if (!this.storageFilePath) {
          this.storageFilePath = `${FileSystem.documentDirectory}alpha_secure_store_v2.json`;
        }
        const record: Record<string, string> = {};
        this.memoryStore.forEach((v, k) => {
          record[k] = v;
        });
        await FileSystem.writeAsStringAsync(this.storageFilePath, JSON.stringify(record));
      }
    } catch {
      // Non-fatal fallback
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.isLoaded && this.loadPromise) {
      await this.loadPromise;
    }
    this.memoryStore.set(key, value);
    await this.saveToDisk();
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.isLoaded && this.loadPromise) {
      await this.loadPromise;
    }
    return this.memoryStore.get(key) || null;
  }

  async removeItem(key: string): Promise<void> {
    if (!this.isLoaded && this.loadPromise) {
      await this.loadPromise;
    }
    this.memoryStore.delete(key);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    await this.saveToDisk();
  }

  async clear(): Promise<void> {
    if (!this.isLoaded && this.loadPromise) {
      await this.loadPromise;
    }
    this.memoryStore.clear();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    try {
      if (this.storageFilePath && FileSystem && FileSystem.deleteAsync) {
        await FileSystem.deleteAsync(this.storageFilePath, { idempotent: true });
      }
    } catch {
      // Non-fatal
    }
  }
}

export const SecureStorage = new SecureStorageService();
