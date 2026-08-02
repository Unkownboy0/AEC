import React from 'react';
import { useRBAC } from '../context/RBACContext';

interface PermissionGateProps {
  /**
   * Permission group or module code/name (e.g. 'students', 'faculty', 'attendance', 'fees', 'reports')
   */
  module: string;
  /**
   * Action type (e.g. 'view', 'create', 'update', 'delete', 'approve', 'reject', 'export', 'download', 'assign', 'manage')
   */
  action: string;
  /**
   * Content to render when user HAS permission
   */
  children: React.ReactNode;
  /**
   * Optional fallback when permission is missing. Defaults to `null` (completely removes from UI).
   */
  fallback?: React.ReactNode;
}

/**
 * Enterprise PermissionGate Component
 * Completely removes inaccessible buttons, actions, and sections from the DOM.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  action,
  children,
  fallback = null,
}) => {
  const { rbac, loading, hasPermission } = useRBAC();

  if (loading) return null;

  // Super Admin bypass
  if (rbac?.isSuperAdmin) {
    return <>{children}</>;
  }

  const isPermitted = hasPermission(module, action);

  if (!isPermitted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
