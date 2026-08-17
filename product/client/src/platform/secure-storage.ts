import { Capacitor } from '@capacitor/core';
import { CampusOSSecureStorage } from './native-secure-storage';

/**
 * Platform Secure Storage abstraction
 * On Native (Android/iOS): Hardware-backed Android Keystore / iOS Keychain.
 * On Web: Browser storage architecture.
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await CampusOSSecureStorage.set({ key, value });
  } else {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {}
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await CampusOSSecureStorage.get({ key });
      return value;
    } catch {
      return null;
    }
  } else {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
}

export async function removeSecureItem(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CampusOSSecureStorage.remove({ key });
    } catch {}
  } else {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
  }
}

export async function clearSecureStorage(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CampusOSSecureStorage.clear();
    } catch {}
  } else {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {}
  }
}
