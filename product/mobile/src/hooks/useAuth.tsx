import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { api, getApiErrorMessage } from '../lib/api';
import { clearSession, isBiometricEnabled, readSession, saveSession, setBiometricEnabled } from '../lib/session';
import type { AuthResponse, User } from '../types';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  unlock: () => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  setBiometrics: (enabled: boolean) => Promise<boolean>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const response = await api.get('/auth/me');
    const nextUser = response.data?.data?.user as User | undefined;
    if (!nextUser) throw new Error('The existing API returned no user profile');
    setUser(nextUser);
    const session = await readSession();
    if (session.accessToken && session.refreshToken) {
      await saveSession(session.accessToken, session.refreshToken, nextUser);
    }
  }, []);

  useEffect(() => {
    let active = true;
    readSession()
      .then(async ({ accessToken, refreshToken, user: cachedUser }) => {
        if (!active || (!accessToken && !refreshToken)) return;
        if (cachedUser) setUser(cachedUser);
        try {
          await loadProfile();
        } catch {
          if (active) setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    setError(null);
    const response = await api.post('/auth/login', { email, password, rememberMe });
    const result = response.data?.data as AuthResponse | undefined;
    if (!result?.accessToken || !result.refreshToken || !result.user) {
      throw new Error('The existing API returned an incomplete login response');
    }
    await saveSession(result.accessToken, result.refreshToken, result.user);
    setUser(result.user);
  }, []);

  const unlock = useCallback(async () => {
    const enabled = await isBiometricEnabled();
    if (!enabled) return false;
    const supported = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!supported || !enrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock CampusOS',
      cancelLabel: 'Use password',
      disableDeviceFallback: false,
    });
    if (!result.success) return false;
    try {
      await loadProfile();
      return true;
    } catch {
      await clearSession();
      setUser(null);
      return false;
    }
  }, [loadProfile]);

  const logout = useCallback(async () => {
    const { refreshToken } = await readSession();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } finally {
      await clearSession();
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await api.post('/auth/logout-all');
    } finally {
      await clearSession();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      await loadProfile();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not refresh your profile'));
    }
  }, [loadProfile]);

  const setBiometrics = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const supported = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!supported || !enrolled) return false;
    }
    await setBiometricEnabled(enabled);
    return true;
  }, []);

  const hasPermission = useCallback(
    (permission: string) =>
      user?.role === 'Super Admin' ||
      Boolean(user?.permissions?.includes(permission) || user?.permissions?.includes(permission.split(':')[0] + ':manage')),
    [user],
  );

  const value = useMemo(
    () => ({ user, isLoading, error, login, unlock, logout, logoutAll, hasPermission, setBiometrics, refreshUser }),
    [user, isLoading, error, login, unlock, logout, logoutAll, hasPermission, setBiometrics, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}