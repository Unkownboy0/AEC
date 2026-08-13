import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDelegationContext } from '../context/DelegationContext';
import { ShieldAlert } from 'lucide-react';

export const ActingPrincipalRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isActingPrincipal, delegationStatus, principalStatus, loading } = useDelegationContext();

  if (loading) {
    return (
      <div className="p-12 text-center bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-3">
          <ShieldAlert className="w-10 h-10 text-violet-400 mx-auto" />
          <p className="text-xs font-bold text-slate-400">Verifying Acting Principal delegation credentials...</p>
        </div>
      </div>
    );
  }

  const isAccessValid =
    isActingPrincipal ||
    ((principalStatus as string) !== 'AVAILABLE' && (principalStatus as string) !== 'ONLINE' && delegationStatus === 'ACTIVE');

  if (!isAccessValid) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
