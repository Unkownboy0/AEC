import React from 'react';
import { CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { useDelegationContext } from '../context/DelegationContext';

export const PrincipalStatusBadge: React.FC = () => {
  const { principalStatus, delegationStatus, delegationEndsAt } = useDelegationContext();

  if (principalStatus === 'ONLINE') {
    return (
      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PRINCIPAL ONLINE
      </span>
    );
  }

  if (principalStatus === 'BUSY') {
    return (
      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> PRINCIPAL BUSY (DELEGATED)
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> PRINCIPAL OFFLINE — DELEGATED
      </span>
      {delegationStatus === 'ACTIVE' && delegationEndsAt && (
        <span className="text-[11px] text-slate-400 font-medium">
          Valid until {new Date(delegationEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
