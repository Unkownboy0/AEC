import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDelegationContext } from '../../delegation/context/DelegationContext';
import { toast } from '../../../components/ui/Toast';

export const ActingPrincipalRouteGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { principalStatus, delegationStatus, isActingPrincipal, loading } = useDelegationContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs font-semibold tracking-wide">Validating Acting Principal Authorization...</p>
      </div>
    );
  }

  const isAccessValid =
    isActingPrincipal ||
    ((principalStatus as string) !== 'AVAILABLE' && (principalStatus as string) !== 'ONLINE' && delegationStatus === 'ACTIVE');

  if (!isAccessValid) {
    toast.error('Acting Principal access is not currently active.');
    return <Navigate to="/vp/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
