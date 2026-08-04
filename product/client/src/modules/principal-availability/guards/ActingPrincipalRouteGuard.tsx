import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePrincipalAvailability } from '../hooks/usePrincipalAvailability';

export const ActingPrincipalRouteGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { context, loading } = usePrincipalAvailability();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-semibold">
        Validating Acting Principal authorization...
      </div>
    );
  }

  if (!context || !context.canVpActAsPrincipal || context.principalStatus === 'AVAILABLE') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
