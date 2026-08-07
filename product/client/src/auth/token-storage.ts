import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const ACCESS_TOKEN_KEY = 'geetorus_access_token';
const REFRESH_TOKEN_KEY = 'geetorus_refresh_token';
const ACTIVE_ROLE_KEY = 'geetorus_active_role';

export async function getStoredAccessToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: ACCESS_TOKEN_KEY });
      if (value) return value;
    } catch (e) {
      console.warn('Failed reading access token from Preferences, checking localStorage:', e);
    }
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
      if (value) return value;
    } catch (e) {
      console.warn('Failed reading refresh token from Preferences, checking localStorage:', e);
    }
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setStoredTokens(accessToken: string, refreshToken: string): Promise<void> {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  if (Capacitor.isNativePlatform()) {
    try {
      await Preferences.set({ key: ACCESS_TOKEN_KEY, value: accessToken });
      await Preferences.set({ key: REFRESH_TOKEN_KEY, value: refreshToken });
    } catch (e) {
      console.warn('Failed saving tokens to Capacitor Preferences:', e);
    }
  }
}

export async function clearStoredTokens(): Promise<void> {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  if (Capacitor.isNativePlatform()) {
    try {
      await Preferences.remove({ key: ACCESS_TOKEN_KEY });
      await Preferences.remove({ key: REFRESH_TOKEN_KEY });
    } catch (e) {
      console.warn('Failed clearing tokens from Capacitor Preferences:', e);
    }
  }
}

export async function getStoredActiveRole(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: ACTIVE_ROLE_KEY });
      if (value) return value;
    } catch (e) {
      // fallback
    }
  }
  return localStorage.getItem(ACTIVE_ROLE_KEY);
}

export async function setStoredActiveRole(role: string): Promise<void> {
  localStorage.setItem(ACTIVE_ROLE_KEY, role);
  if (Capacitor.isNativePlatform()) {
    try {
      await Preferences.set({ key: ACTIVE_ROLE_KEY, value: role });
    } catch (e) {
      // fallback
    }
  }
}
