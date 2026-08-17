import { Preferences } from '@capacitor/preferences';

export interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  createdAt: string;
}

export class OfflineSyncEngine {
  private static readonly CACHE_PREFIX = 'campusos_cache_';
  private static readonly QUEUE_KEY = 'campusos_sync_queue';

  /**
   * Caches data in persistent storage for offline availability.
   */
  public static async cacheData<T>(key: string, data: T): Promise<void> {
    try {
      const payload = JSON.stringify({
        data,
        cachedAt: new Date().toISOString(),
      });
      await Preferences.set({ key: `${this.CACHE_PREFIX}${key}`, value: payload });
    } catch {
      // Ignore cache write errors
    }
  }

  /**
   * Retrieves cached data if offline.
   */
  public static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key: `${this.CACHE_PREFIX}${key}` });
      if (!value) return null;
      const parsed = JSON.parse(value);
      return parsed.data as T;
    } catch {
      return null;
    }
  }

  /**
   * Enqueues an action to be executed when connectivity is restored.
   */
  public static async enqueueSyncAction(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<void> {
    const queue = await this.getSyncQueue();
    const newItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    queue.push(newItem);
    await Preferences.set({ key: this.QUEUE_KEY, value: JSON.stringify(queue) });
  }

  public static async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const { value } = await Preferences.get({ key: this.QUEUE_KEY });
      if (!value) return [];
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  public static async clearSyncQueue(): Promise<void> {
    await Preferences.remove({ key: this.QUEUE_KEY });
  }
}
