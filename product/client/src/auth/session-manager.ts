import apiClient, { apiGet, apiPost } from '../shared/api/api-client';
import { getStoredAccessToken, setStoredTokens, clearStoredTokens, getStoredActiveRole, setStoredActiveRole } from './token-storage';
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
    const user = await apiGet<User>('/auth/me');
    return user;
  } catch (err: any) {
    if (err?.status === 401) {
      // Try refresh
      const newToken = await refreshAuthSession();
      if (newToken) {
        try {
          return await apiGet<User>('/auth/me');
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
      await setStoredTokens(res.accessToken, (await getStoredAccessToken()) || '');
    }
    await setStoredActiveRole(targetRole);
    if (res?.user) {
      return res.user;
    }
    return await fetchCurrentUser();
  } catch (err) {
    console.error('Failed to switch workspace:', err);
    await setStoredActiveRole(targetRole);
    return await fetchCurrentUser();
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
