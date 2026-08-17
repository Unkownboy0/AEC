import { registerPlugin, Capacitor } from '@capacitor/core';

export interface SecureStoragePluginInterface {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<{ keys: string[] }>;
}

/**
 * Web fallback for SecureStorage (in-memory vault + browser web storage)
 * Note: Native mobile platforms (Android/iOS) use genuine hardware Keystore/Keychain plugins.
 */
export class WebSecureStorageFallback implements SecureStoragePluginInterface {
  private memoryVault: Map<string, string> = new Map();

  async get(options: { key: string }): Promise<{ value: string | null }> {
    if (this.memoryVault.has(options.key)) {
      return { value: this.memoryVault.get(options.key)! };
    }
    try {
      const val = typeof localStorage !== 'undefined' ? localStorage.getItem(options.key) : null;
      return { value: val };
    } catch {
      return { value: null };
    }
  }

  async set(options: { key: string; value: string }): Promise<void> {
    this.memoryVault.set(options.key, options.value);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(options.key, options.value);
      }
    } catch {}
  }

  async remove(options: { key: string }): Promise<void> {
    this.memoryVault.delete(options.key);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(options.key);
      }
    } catch {}
  }

  async clear(): Promise<void> {
    this.memoryVault.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('campusos_access_token');
        localStorage.removeItem('campusos_refresh_token');
        localStorage.removeItem('campusos_active_role');
        localStorage.removeItem('geetorus_access_token');
        localStorage.removeItem('geetorus_refresh_token');
        localStorage.removeItem('geetorus_active_role');
      }
    } catch {}
  }

  async keys(): Promise<{ keys: string[] }> {
    const memoryKeys = Array.from(this.memoryVault.keys());
    try {
      const storageKeys = typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [];
      return { keys: Array.from(new Set([...memoryKeys, ...storageKeys])) };
    } catch {
      return { keys: memoryKeys };
    }
  }
}

/**
 * Native hardware-backed Secure Storage bridge.
 * - Android: Android Keystore (MasterKey AES-256-GCM + EncryptedSharedPreferences)
 * - iOS: Apple Keychain (kSecClassGenericPassword + kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly)
 * - Web: WebSecureStorageFallback
 *
 * IMPORTANT — Lazy Singleton Pattern:
 * `registerPlugin` is intentionally deferred to first access via getCampusOSSecureStorage().
 * Calling registerPlugin() at module evaluation time causes a Capacitor bridge timing error
 * ("Cannot read properties of undefined (reading 'triggerEvent')") because the bridge may not
 * yet be fully mounted when the module is first imported during React tree initialization.
 */
let _campusOSSecureStorage: SecureStoragePluginInterface | null = null;

export function getCampusOSSecureStorage(): SecureStoragePluginInterface {
  if (!_campusOSSecureStorage) {
    _campusOSSecureStorage = registerPlugin<SecureStoragePluginInterface>(
      'CampusOSSecureStorage',
      {
        web: () => Promise.resolve(new WebSecureStorageFallback()),
      }
    );
  }
  return _campusOSSecureStorage;
}

/**
 * @deprecated Use getCampusOSSecureStorage() instead. Direct export was causing
 * Capacitor bridge initialization timing errors (triggerEvent TypeError) because
 * registerPlugin() was called at module evaluation time before the bridge mounted.
 */
export const CampusOSSecureStorage: SecureStoragePluginInterface = new Proxy(
  {} as SecureStoragePluginInterface,
  {
    get(_target, prop: keyof SecureStoragePluginInterface) {
      return getCampusOSSecureStorage()[prop];
    },
  }
);
