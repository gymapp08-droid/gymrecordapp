import { SecureStorage } from './secureStorage';
import { getTodayDateString } from '../utils/timezone';

export interface DailySupplementsState {
  multivitamin: boolean;
  calcium: boolean;
  multivitaminTime?: string;
  calciumTime?: string;
}

const DEFAULT_STATE: DailySupplementsState = {
  multivitamin: false,
  calcium: false,
};

export const SupplementService = {
  getStorageKey(dateStr: string = getTodayDateString()): string {
    return `alpha_supplements_${dateStr}`;
  },

  async loadTodaySupplements(): Promise<DailySupplementsState> {
    try {
      const key = this.getStorageKey();
      const raw = await SecureStorage.getItem(key);
      if (raw) {
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
      }
    } catch {
      // Fallback default
    }
    return { ...DEFAULT_STATE };
  },

  async toggleMultivitamin(): Promise<DailySupplementsState> {
    const current = await this.loadTodaySupplements();
    const updated: DailySupplementsState = {
      ...current,
      multivitamin: !current.multivitamin,
      multivitaminTime: !current.multivitamin ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    };
    await SecureStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
    return updated;
  },

  async toggleCalcium(): Promise<DailySupplementsState> {
    const current = await this.loadTodaySupplements();
    const updated: DailySupplementsState = {
      ...current,
      calcium: !current.calcium,
      calciumTime: !current.calcium ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    };
    await SecureStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
    return updated;
  },
};
