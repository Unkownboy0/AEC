import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

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
}

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUserPartial: Partial<User>) => void;
  switchWorkspace: (roleName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchProfile = useCallback(async () => {
    const accessToken = localStorage.getItem('geetorus_access_token');
    const refreshToken = localStorage.getItem('geetorus_refresh_token');

    if (!accessToken && !refreshToken) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. If we have no access token but have a refresh token, try to refresh first
      if (!accessToken && refreshToken) {
        const refreshResponse = await api.post('/auth/refresh', { refreshToken });
        if (refreshResponse.data?.status === 'success') {
          const newAccessToken = refreshResponse.data.data.accessToken;
          localStorage.setItem('geetorus_access_token', newAccessToken);
        } else {
          throw new Error('Refresh failed');
        }
      }

      // 2. Fetch user details
      const response = await api.get('/auth/me');
      if (response.data?.status === 'success') {
        setUser(formatUserWithCacheBust(response.data.data.user));
      } else {
        throw new Error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
      localStorage.removeItem('geetorus_access_token');
      localStorage.removeItem('geetorus_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((updatedUserPartial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedUserPartial };
      return formatUserWithCacheBust(merged);
    });
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogin = async (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('geetorus_access_token', accessToken);
    localStorage.setItem('geetorus_refresh_token', refreshToken);
    
    const savedActiveRole = localStorage.getItem('geetorus_active_role');
    if (savedActiveRole && savedActiveRole !== userData.role) {
      setIsLoading(true);
      try {
        await fetchProfile();
      } catch (err) {
        setUser(formatUserWithCacheBust(userData));
        setIsLoading(false);
      }
    } else {
      setUser(formatUserWithCacheBust(userData));
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    const refreshToken = localStorage.getItem('geetorus_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('geetorus_access_token');
      localStorage.removeItem('geetorus_refresh_token');
      setUser(null);
      setIsLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.error('Logout-all request failed:', error);
    } finally {
      localStorage.removeItem('geetorus_access_token');
      localStorage.removeItem('geetorus_refresh_token');
      setUser(null);
      setIsLoading(false);
    }
  };

  const switchWorkspace = useCallback(async (roleName: string) => {
    localStorage.setItem('geetorus_active_role', roleName);
    try {
      await fetchProfile();
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    }
  }, [fetchProfile]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.role === 'Super Admin') return true;
      if (user.permissions.includes('*:*') || user.permissions.includes('*')) return true;
      if (user.permissions.includes(permission)) return true;

      const parts = permission.split(':');
      if (parts.length !== 2) return false;
      const [reqModule, reqAction] = parts;

      if (user.permissions.includes(`${reqModule}:*`) || user.permissions.includes(`${reqModule}:manage`)) {
        return true;
      }

      if (reqAction === 'read') {
        return user.permissions.includes(`${reqModule}:view`) || user.permissions.includes(`${reqModule}:read`);
      }
      if (reqAction === 'write') {
        return user.permissions.includes(`${reqModule}:create`) || 
               user.permissions.includes(`${reqModule}:edit`) || 
               user.permissions.includes(`${reqModule}:delete`) ||
               user.permissions.includes(`${reqModule}:write`);
      }

      return false;
    },
    [user]
  );

  const hasRole = useCallback(
    (roles: string | string[]) => {
      if (!user) return false;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  const contextValue: AuthContextProps = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    logoutAll: handleLogoutAll,
    hasPermission,
    hasRole,
    refreshUser: fetchProfile,
    updateUser,
    switchWorkspace,
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
