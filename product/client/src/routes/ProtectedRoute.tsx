import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">Authenticating session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedView requiredPermission={requiredPermission} />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <AccessDeniedView allowedRoles={allowedRoles} />;
  }

  return <>{children}</>;
};

const AccessDeniedView: React.FC<{ requiredPermission?: string; allowedRoles?: string[] }> = ({
  requiredPermission,
  allowedRoles,
}) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Access Denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You do not have the authorization required to view this section.
      </p>
      {requiredPermission && (
        <span className="mt-4 rounded-md bg-muted px-2.5 py-1 text-xs font-mono font-medium text-muted-foreground">
          Required Permission: {requiredPermission}
        </span>
      )}
      {allowedRoles && (
        <span className="mt-4 rounded-md bg-muted px-2.5 py-1 text-xs font-mono font-medium text-muted-foreground">
          Allowed Roles: {allowedRoles.join(', ')}
        </span>
      )}
      <button
        onClick={() => window.history.back()}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-200"
      >
        Go Back
      </button>
    </div>
  );
};
