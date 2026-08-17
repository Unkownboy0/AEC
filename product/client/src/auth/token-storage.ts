import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { CampusOSSecureStorage } from '../platform/native-secure-storage';

export const ACCESS_TOKEN_KEY = 'campusos_access_token';
export const REFRESH_TOKEN_KEY = 'campusos_refresh_token';
export const ACTIVE_ROLE_KEY = 'campusos_active_role';

// Legacy keys for migration cleanup
const LEGACY_KEYS = [
  'geetorus_access_token',
  'geetorus_refresh_token',
  'geetorus_active_role',
];

/**
 * Migration helper: If a legacy token exists in insecure storage (Preferences/localStorage),
 * securely migrate it to Keystore/Keychain and delete the plaintext copy.
 */
async function migrateLegacyTokenIfPresent(key: string): Promise<string | null> {
  try {
    // Check old Capacitor Preferences
    const prefResult = await Preferences.get({ key });
    if (prefResult?.value) {
      // Store in Keystore/Keychain
      await CampusOSSecureStorage.set({ key, value: prefResult.value });
      // Delete plaintext copy from Preferences
      await Preferences.remove({ key });
      return prefResult.value;
    }
  } catch {}

  // Check legacy localStorage if running in webview with prior state
  try {
    if (typeof localStorage !== 'undefined') {
      const localVal = localStorage.getItem(key);
      if (localVal) {
        await CampusOSSecureStorage.set({ key, value: localVal });
        localStorage.removeItem(key);
        return localVal;
      }
    }
  } catch {}

  // Check old branding keys
  const legacyKey = key.replace('campusos_', 'geetorus_');
  try {
    const legacyPref = await Preferences.get({ key: legacyKey });
    if (legacyPref?.value) {
      await CampusOSSecureStorage.set({ key, value: legacyPref.value });
      await Preferences.remove({ key: legacyKey });
      return legacyPref.value;
    }
  } catch {}

  return null;
}

/**
 * Get stored JWT access token.
 * On Native: retrieved from Android Keystore / iOS Keychain.
 * On Web: retrieved from browser storage.
 */
export async function getStoredAccessToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await CampusOSSecureStorage.get({ key: ACCESS_TOKEN_KEY });
      if (value) return value;
      // If not found, attempt safe migration from legacy storage
      return await migrateLegacyTokenIfPresent(ACCESS_TOKEN_KEY);
    } catch {
      // Return null on secure hardware error without crashing or leaking details
      return null;
    }
  }

  // Web Browser environment
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Get stored JWT refresh token.
 * On Native: retrieved from Android Keystore / iOS Keychain.
 * On Web: retrieved from browser storage.
 */
export async function getStoredRefreshToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await CampusOSSecureStorage.get({ key: REFRESH_TOKEN_KEY });
      if (value) return value;
      // If not found, attempt safe migration from legacy storage
      return await migrateLegacyTokenIfPresent(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  // Web Browser environment
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store JWT access token and refresh token securely.
 * On Native: writes EXCLUSIVELY to Android Keystore / iOS Keychain.
 * Insecure storage (localStorage / standard SharedPreferences) is NOT used.
 */
export async function setStoredTokens(accessToken: string, refreshToken: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CampusOSSecureStorage.set({ key: ACCESS_TOKEN_KEY, value: accessToken });
      await CampusOSSecureStorage.set({ key: REFRESH_TOKEN_KEY, value: refreshToken });

      // Clean up any remaining plaintext copies
      try {
        await Preferences.remove({ key: ACCESS_TOKEN_KEY });
        await Preferences.remove({ key: REFRESH_TOKEN_KEY });
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
        }
      } catch {}
    } catch (e) {
      console.warn('[SecureStorage] Native token write warning');
    }
    return;
  }

  // Web Browser environment
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {}
}

/**
 * Completely clear stored authentication tokens on logout or session revocation.
 * On Native: wipes Android Keystore vault / iOS Keychain items.
 */
export async function clearStoredTokens(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CampusOSSecureStorage.remove({ key: ACCESS_TOKEN_KEY });
      await CampusOSSecureStorage.remove({ key: REFRESH_TOKEN_KEY });
      await CampusOSSecureStorage.remove({ key: ACTIVE_ROLE_KEY });
      await CampusOSSecureStorage.clear();
    } catch {}

    // Also purge any legacy storage entries
    try {
      await Preferences.remove({ key: ACCESS_TOKEN_KEY });
      await Preferences.remove({ key: REFRESH_TOKEN_KEY });
      await Preferences.remove({ key: ACTIVE_ROLE_KEY });
      for (const k of LEGACY_KEYS) {
        await Preferences.remove({ key: k });
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(ACTIVE_ROLE_KEY);
        LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
      }
    } catch {}
    return;
  }

  // Web Browser environment
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/**
 * Get active role session context.
 */
export async function getStoredActiveRole(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await CampusOSSecureStorage.get({ key: ACTIVE_ROLE_KEY });
      if (value) return value;
      return await migrateLegacyTokenIfPresent(ACTIVE_ROLE_KEY);
    } catch {
      return null;
    }
  }

  try {
    return localStorage.getItem(ACTIVE_ROLE_KEY);
  } catch {
    return null;
  }
}

/**
 * Set active role session context.
 */
export async function setStoredActiveRole(role: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CampusOSSecureStorage.set({ key: ACTIVE_ROLE_KEY, value: role });
    } catch {}
    return;
  }

  try {
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
  } catch {}
}
