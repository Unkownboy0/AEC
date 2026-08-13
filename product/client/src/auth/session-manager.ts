import apiClient, { apiGet, apiPost } from '../shared/api/api-client';
import { getStoredAccessToken, getStoredRefreshToken, setStoredTokens, clearStoredTokens, setStoredActiveRole } from './token-storage';
import { refreshAuthSession } from './session-refresh';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  menus: any[];
  profilePhoto?: string;
  forcePasswordChange?: boolean;
  workspaces?: string[];
  activeWorkspace?: string;
  department?: string;
  departmentId?: string;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = await getStoredAccessToken();
  if (!token) return null;

  try {
    const payload = await apiGet<User | { user: User }>('/auth/me');
    return 'user' in payload ? payload.user : payload;
  } catch (err: any) {
    if (err?.status === 401) {
      // Try refresh
      const newToken = await refreshAuthSession();
      if (newToken) {
        try {
          const payload = await apiGet<User | { user: User }>('/auth/me');
          return 'user' in payload ? payload.user : payload;
        } catch (retryErr) {
          return null;
        }
      }
    }
    return null;
  }
}

export async function switchUserWorkspace(targetRole: string): Promise<User | null> {
  try {
    const res = await apiPost<any>('/auth/switch-workspace', { targetRole });
    if (res?.accessToken) {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('Cannot switch workspace without an active refresh session');
      }
      await setStoredTokens(res.accessToken, refreshToken);
    }
    await setStoredActiveRole(res?.activeWorkspace || targetRole);
    if (res?.user) {
      return res.user;
    }
    return await fetchCurrentUser();
  } catch (err) {
    console.error('Failed to switch workspace:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem('geetorus_refresh_token');
    if (refreshToken) {
      await apiPost('/auth/logout', { refreshToken });
    }
  } catch (e) {
    console.warn('Logout API error ignored during cleanup:', e);
  } finally {
    await clearStoredTokens();
  }
}
