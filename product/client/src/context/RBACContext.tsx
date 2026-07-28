import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export interface RBACData {
  userId: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  roleCode: string;
  hierarchy: number;
  designation?: string;
  departmentId?: string;
  searchScope: string;
  moduleAccess: Record<string, Record<string, boolean>>;
  sidebarConfig: Record<string, boolean>;
  dashboardConfig: { widgets?: Array<{ id: string; visible: boolean; editable: boolean; configurable: boolean }> };
  workspaces: string[];
  activeWorkspace: string;
  notificationPreferences: Record<string, boolean>;
  isSuperAdmin: boolean;
}

interface RBACContextType {
  rbac: RBACData | null;
  loading: boolean;
  refetchRBAC: () => Promise<void>;
  hasPermission: (moduleName: string, actionName: string) => boolean;
  canAccessSidebar: (itemKey: string) => boolean;
  switchWorkspace: (workspaceName: string) => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rbac, setRbac] = useState<RBACData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRBAC = useCallback(async () => {
    if (!user) {
      setRbac(null);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get('/api/rbac/me');
      if (res.data?.data) {
        setRbac(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user RBAC:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRBAC();
  }, [fetchRBAC]);

  // Real-time synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource('/api/rbac/stream?userId=' + user.id);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PERMISSIONS_UPDATED' || data.type === 'ROLE_UPDATED' || data.type === 'SIDEBAR_UPDATED' || data.type === 'DASHBOARD_UPDATED') {
          fetchRBAC();
        }
      } catch (e) {
        // parsing ignore
      }
    };

    return () => {
      eventSource.close();
    };
  }, [user, fetchRBAC]);

  const hasPermission = useCallback((moduleName: string, actionName: string): boolean => {
    if (!rbac) return false;
    if (rbac.isSuperAdmin) return true;
    const mod = rbac.moduleAccess?.[moduleName];
    if (!mod) return false;
    return mod[actionName] === true || mod['manage'] === true;
  }, [rbac]);

  const canAccessSidebar = useCallback((itemKey: string): boolean => {
    if (!rbac) return true;
    if (rbac.isSuperAdmin) return true;
    if (rbac.sidebarConfig && rbac.sidebarConfig[itemKey] !== undefined) {
      return rbac.sidebarConfig[itemKey] === true;
    }
    return true;
  }, [rbac]);

  const switchWorkspace = useCallback(async (workspaceName: string) => {
    if (!user) return;
    try {
      await axios.patch(`/api/rbac/users/${user.id}`, { activeWorkspace: workspaceName });
      await fetchRBAC();
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    }
  }, [user, fetchRBAC]);

  return (
    <RBACContext.Provider value={{ rbac, loading, refetchRBAC: fetchRBAC, hasPermission, canAccessSidebar, switchWorkspace }}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};
