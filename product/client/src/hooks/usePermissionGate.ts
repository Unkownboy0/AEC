import { useCallback } from 'react';
import { useRBAC } from '../context/RBACContext';

export function usePermissionGate() {
  const { rbac, hasPermission } = useRBAC();

  const canAccess = useCallback(
    (moduleName: string, actionName: string): boolean => {
      if (!rbac) return false;
      if (rbac.isSuperAdmin) return true;
      return hasPermission(moduleName, actionName);
    },
    [rbac, hasPermission]
  );

  const canView = useCallback((moduleName: string) => canAccess(moduleName, 'view'), [canAccess]);
  const canCreate = useCallback((moduleName: string) => canAccess(moduleName, 'create'), [canAccess]);
  const canUpdate = useCallback((moduleName: string) => canAccess(moduleName, 'update'), [canAccess]);
  const canDelete = useCallback((moduleName: string) => canAccess(moduleName, 'delete'), [canAccess]);
  const canApprove = useCallback((moduleName: string) => canAccess(moduleName, 'approve'), [canAccess]);
  const canExport = useCallback((moduleName: string) => canAccess(moduleName, 'export'), [canAccess]);
  const canDownload = useCallback((moduleName: string) => canAccess(moduleName, 'download'), [canAccess]);
  const canAssign = useCallback((moduleName: string) => canAccess(moduleName, 'assign'), [canAccess]);
  const canManage = useCallback((moduleName: string) => canAccess(moduleName, 'manage'), [canAccess]);

  return {
    canAccess,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canApprove,
    canExport,
    canDownload,
    canAssign,
    canManage,
    role: rbac?.roleName,
    roleCode: rbac?.roleCode,
    isSuperAdmin: rbac?.isSuperAdmin || false,
  };
}
