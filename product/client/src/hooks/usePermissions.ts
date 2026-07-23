import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

export interface SimulationState {
  isSimulating: boolean;
  originalRole: string | null;
  simulatedRole: string | null;
  permissions: string[];
}

export const usePermissions = () => {
  const [userRole, setUserRole] = useState<string>('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [matrixVersion, setMatrixVersion] = useState<number>(Date.now());
  const [simulation, setSimulation] = useState<SimulationState>({
    isSimulating: false,
    originalRole: null,
    simulatedRole: null,
    permissions: []
  });

  // Fetch current user role & permissions from active session / API
  const syncUserPermissions = useCallback(async () => {
    try {
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        const userObj = JSON.parse(storedUserStr);
        setUserRole(userObj.role || '');

        if (userObj.role === 'Super Admin' && !simulation.isSimulating) {
          setPermissions(['*:*']);
        } else if (userObj.permissions) {
          setPermissions(userObj.permissions);
        }
      }

      // Check server permission version
      const verRes = await api.get('/roles/version').catch(() => null);
      if (verRes?.data?.data?.version) {
        const serverVer = verRes.data.data.version;
        if (serverVer > matrixVersion) {
          setMatrixVersion(serverVer);
        }
      }
    } catch {
      // Fallback to cached permissions
    }
  }, [matrixVersion, simulation.isSimulating]);

  useEffect(() => {
    syncUserPermissions();
    const interval = setInterval(syncUserPermissions, 10000); // 10s auto-sync
    return () => clearInterval(interval);
  }, [syncUserPermissions]);

  // Check action permission (e.g., 'students:delete', 'placements:export')
  const hasPermission = useCallback((permissionKey: string): boolean => {
    const activeRole = simulation.isSimulating ? simulation.simulatedRole : userRole;
    const activePerms = simulation.isSimulating ? simulation.permissions : permissions;

    if (activeRole === 'Super Admin' && !simulation.isSimulating) return true;
    if (activePerms.includes('*:*') || activePerms.includes('*')) return true;
    if (activePerms.includes(permissionKey)) return true;

    const [mod, action] = permissionKey.split(':');
    if (!mod || !action) return false;

    if (activePerms.includes(`${mod}:*`) || activePerms.includes(`${mod}:manage`)) {
      return true;
    }

    if (action === 'read' || action === 'view') {
      return activePerms.includes(`${mod}:view`) || activePerms.includes(`${mod}:read`);
    }
    if (action === 'write') {
      return activePerms.includes(`${mod}:create`) || activePerms.includes(`${mod}:edit`) || activePerms.includes(`${mod}:write`);
    }
    if (['create', 'edit', 'delete', 'approve', 'reject', 'upload', 'download', 'export', 'import', 'print', 'assign', 'manage', 'configure', 'analytics', 'reports', 'ai access', 'notifications', 'messaging', 'api access'].includes(action)) {
      return activePerms.includes(`${mod}:${action}`) || activePerms.includes(`${mod}:manage`);
    }

    return false;
  }, [userRole, permissions, simulation]);

  // Start Role Preview Simulation Mode
  const startRoleSimulation = async (targetRoleName: string) => {
    try {
      const res = await api.post('/roles/simulate', { targetRoleName });
      if (res.data?.status === 'success') {
        const simData = res.data.data;
        setSimulation({
          isSimulating: true,
          originalRole: simData.originalRole,
          simulatedRole: simData.simulatedRole,
          permissions: simData.permissions
        });
        return simData;
      }
    } catch (err) {
      console.error('Failed to start role simulation:', err);
    }
    return null;
  };

  // Exit Simulation Mode
  const stopRoleSimulation = () => {
    setSimulation({
      isSimulating: false,
      originalRole: null,
      simulatedRole: null,
      permissions: []
    });
  };

  return {
    userRole: simulation.isSimulating ? simulation.simulatedRole : userRole,
    effectivePermissions: simulation.isSimulating ? simulation.permissions : permissions,
    hasPermission,
    simulation,
    startRoleSimulation,
    stopRoleSimulation,
    syncUserPermissions
  };
};
