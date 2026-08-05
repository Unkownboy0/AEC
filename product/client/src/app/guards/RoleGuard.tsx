import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AccessDeniedPage } from '../../design-system/components/AccessDeniedPage';

interface RoleGuardProps {
  roles?: string | string[];
  permission?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, permission, children }) => {
  const { user, hasRole, hasPermission } = useAuth();

  if (!user) {
    return <AccessDeniedPage />;
  }

  if (roles && !hasRole(roles)) {
    return <AccessDeniedPage />;
  }

  if (permission && !hasPermission(permission)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};
