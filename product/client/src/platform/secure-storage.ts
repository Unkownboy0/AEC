import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[Storage] localStorage setItem failed:', e);
    }
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

export async function removeSecureItem(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

export async function clearSecureStorage(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.clear();
  } else {
    try {
      localStorage.clear();
    } catch {}
  }
}
