import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolveRoutePath, getRoleDefaultDashboard } from './route-resolver';
import { AppIcon } from '../design-system/icons/AppIcon';

export interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  permission?: string;
}

export const ProtectedRoute: React.FC<RouteGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <AppIcon name="RefreshCw" size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading CampusOS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authorization follows the server-selected workspace. The base identity role can
  // remain FACULTY while the same account is actively operating as HOD or MENTOR.
  // Validating only user.role made an authorized workspace switch navigate straight
  // into the global Access Denied state.
  const role = user.activeWorkspace || user.role || 'STUDENT';
  const resolveResult = resolveRoutePath(location.pathname, role);

  if (allowedRoles && allowedRoles.length > 0) {
    const isRoleAllowed = allowedRoles.some((r) => r.toLowerCase() === role.toLowerCase());
    if (!isRoleAllowed) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
            <AppIcon name="ShieldAlert" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
            You do not have access to this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate(getRoleDefaultDashboard(role))}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
  }

  if (resolveResult.status === 'unauthorized') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
          <AppIcon name="Lock" size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
          You do not have access to this page.
        </p>
        <button
          onClick={() => navigate(getRoleDefaultDashboard(role))}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
