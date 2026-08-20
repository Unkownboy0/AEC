import apiClient, { apiGet, apiPost } from '../shared/api/api-client';
import { getStoredAccessToken, getStoredRefreshToken, setStoredTokens, clearStoredTokens, setStoredActiveRole } from './token-storage';
import { refreshAuthSession } from './session-refresh';

export interface ProfileImage {
  fileId?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  username?: string;
  phone?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | 'UNSPECIFIED' | string | null;
  status?: string;
  role: string;
  roles?: string[];
  permissions: string[];
  menus: any[];
  profilePhoto?: string | null;
  profileImage?: ProfileImage | null;
  forcePasswordChange?: boolean;
  workspaces?: string[];
  primaryWorkspace?: string;
  activeWorkspace?: string;
  department?: string;
  departmentId?: string;
  student?: any;
  faculty?: any;
  employee?: any;
  parent?: any;
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
        } catch (retryErr: any) {
          if (retryErr?.status === 401) return null;
          throw retryErr;
        }
      }
    }
    throw err;
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
  } catch (err: any) {
    console.error('Failed to switch workspace:', err?.message || 'Unknown error');
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      await apiPost('/auth/logout', { refreshToken });
    }
  } catch (e: any) {
    console.warn('Logout API error ignored during cleanup:', e?.message || 'Network/Server Error');
  } finally {
    await clearStoredTokens();
  }
}
