import { validateApiConfig } from '../config/api-config';
import { getStoredAccessToken, getStoredRefreshToken, getStoredActiveRole } from './token-storage';
import { fetchCurrentUser, User } from './session-manager';
import { refreshAuthSession } from './session-refresh';

export type AuthBootstrapStatus = 'BOOTING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ERROR';

export interface BootstrapResult {
  status: AuthBootstrapStatus;
  user: User | null;
  errorMessage?: string;
}

export async function bootstrapAuthSession(): Promise<BootstrapResult> {
  const configValidation = validateApiConfig();
  if (!configValidation.isValid) {
    return {
      status: 'ERROR',
      user: null,
      errorMessage: configValidation.message || 'Configuration Error: Unable to resolve API base URL.',
    };
  }

  let accessToken = await getStoredAccessToken();
  const refreshToken = await getStoredRefreshToken();

  if (!accessToken && !refreshToken) {
    return {
      status: 'UNAUTHENTICATED',
      user: null,
    };
  }

  if (!accessToken && refreshToken) {
    accessToken = await refreshAuthSession();
    if (!accessToken) {
      return {
        status: 'UNAUTHENTICATED',
        user: null,
      };
    }
  }

  try {
    const user = await fetchCurrentUser();
    if (user) {
      const activeRole = await getStoredActiveRole();
      if (activeRole && user.workspaces?.includes(activeRole) && user.role !== activeRole) {
        user.role = activeRole;
      }
      return {
        status: 'AUTHENTICATED',
        user,
      };
    } else {
      return {
        status: 'UNAUTHENTICATED',
        user: null,
      };
    }
  } catch (err: any) {
    console.error('[AuthBootstrap] Error during bootstrap session restoration:', err);
    return {
      status: 'ERROR',
      user: null,
      errorMessage: err.message || 'Failed to restore session. Please try logging in again.',
    };
  }
}
