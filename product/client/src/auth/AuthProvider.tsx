import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, switchUserWorkspace, logoutUser, fetchCurrentUser } from './session-manager';
export type { User };
import { setStoredTokens, clearStoredTokens } from './token-storage';
import { bootstrapAuthSession, AuthBootstrapStatus } from './auth-bootstrap';

export interface AuthContextProps {
  user: User | null;
  status: AuthBootstrapStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage?: string;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUserPartial: Partial<User>) => void;
  switchWorkspace: (roleName: string) => Promise<void>;
  retryBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthBootstrapStatus>('BOOTING');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const formatUserWithCacheBust = (userData: User): User => {
    if (userData && userData.profilePhoto && !userData.profilePhoto.startsWith('data:')) {
      const cleanPhoto = userData.profilePhoto.split('?')[0];
      return {
        ...userData,
        profilePhoto: `${cleanPhoto}?v=${Date.now()}`,
      };
    }
    return userData;
  };

  const runBootstrap = useCallback(async () => {
    setStatus('BOOTING');
    setErrorMessage(undefined);
    const result = await bootstrapAuthSession();
    if (result.status === 'AUTHENTICATED' && result.user) {
      setUser(formatUserWithCacheBust(result.user));
    } else {
      setUser(null);
    }
    setErrorMessage(result.errorMessage);
    setStatus(result.status);
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await fetchCurrentUser();
    if (updated) {
      setUser(formatUserWithCacheBust(updated));
      setStatus('AUTHENTICATED');
    } else {
      setUser(null);
      setStatus('UNAUTHENTICATED');
    }
  }, []);

  useEffect(() => {
    runBootstrap();

    const handleAuthExpired = () => {
      setUser(null);
      setStatus('UNAUTHENTICATED');
    };

    window.addEventListener('campusos_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('campusos_auth_expired', handleAuthExpired);
    };
  }, [runBootstrap]);

  const handleLogin = async (accessToken: string, refreshToken: string, userData: User) => {
    await setStoredTokens(accessToken, refreshToken);
    setUser(formatUserWithCacheBust(userData));
    setStatus('AUTHENTICATED');
  };

  const handleLogout = async () => {
    setStatus('BOOTING');
    await logoutUser();
    setUser(null);
    setStatus('UNAUTHENTICATED');
  };

  const handleLogoutAll = async () => {
    setStatus('BOOTING');
    await logoutUser();
    setUser(null);
    setStatus('UNAUTHENTICATED');
  };

  const switchWorkspace = useCallback(async (roleName: string) => {
    setStatus('BOOTING');
    const updatedUser = await switchUserWorkspace(roleName);
    if (updatedUser) {
      setUser(formatUserWithCacheBust(updatedUser));
      setStatus('AUTHENTICATED');
    } else {
      await refreshUser();
    }
  }, [refreshUser]);

  const updateUser = useCallback((updatedUserPartial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedUserPartial };
      return formatUserWithCacheBust(merged);
    });
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.role === 'Super Admin' || user.role === 'SUPER_ADMIN') return true;
      if (user.permissions?.includes('*:*') || user.permissions?.includes('*')) return true;
      if (user.permissions?.includes(permission)) return true;

      const parts = permission.split(':');
      if (parts.length !== 2) return false;
      const [reqModule, reqAction] = parts;

      if (user.permissions?.includes(`${reqModule}:*`) || user.permissions?.includes(`${reqModule}:manage`)) {
        return true;
      }

      if (reqAction === 'read') {
        return (
          user.permissions?.includes(`${reqModule}:view`) ||
          user.permissions?.includes(`${reqModule}:read`)
        );
      }
      if (reqAction === 'write') {
        return (
          user.permissions?.includes(`${reqModule}:create`) ||
          user.permissions?.includes(`${reqModule}:edit`) ||
          user.permissions?.includes(`${reqModule}:delete`) ||
          user.permissions?.includes(`${reqModule}:write`)
        );
      }

      return false;
    },
    [user]
  );

  const hasRole = useCallback(
    (roles: string | string[]) => {
      if (!user) return false;
      const allowedRoles = Array.isArray(roles)
        ? roles.map((r) => r.toUpperCase())
        : [roles.toUpperCase()];
      return allowedRoles.includes(user.role.toUpperCase());
    },
    [user]
  );

  const contextValue: AuthContextProps = {
    user,
    status,
    isAuthenticated: status === 'AUTHENTICATED' && !!user,
    isLoading: status === 'BOOTING',
    errorMessage,
    login: handleLogin,
    logout: handleLogout,
    logoutAll: handleLogoutAll,
    hasPermission,
    hasRole,
    refreshUser,
    updateUser,
    switchWorkspace,
    retryBootstrap: runBootstrap,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
