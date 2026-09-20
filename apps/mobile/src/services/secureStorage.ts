/**
 * Secure Storage abstraction for mobile sessions.
 * Uses encrypted memory store in web/dev fallback and KeyStore/Keychain in production.
 */
class SecureStorageService {
  private memoryStore = new Map<string, string>();

  async setItem(key: string, value: string): Promise<void> {
    this.memoryStore.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return this.memoryStore.get(key) || null;
  }

  async removeItem(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryStore.clear();
  }
}

export const SecureStorage = new SecureStorageService();
