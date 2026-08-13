import React from 'react';
import { ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { useDelegationContext } from '../../delegation/context/DelegationContext';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext';

export const VpActingPrincipalBanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { principalStatus, delegationStatus, delegationEndsAt } = useDelegationContext();

  const rawRole = (typeof user?.role === 'object' ? (user?.role as any)?.name : String(user?.role || '')).toUpperCase();
  const isVp = rawRole.includes('VP') || rawRole.includes('VICE') || rawRole.includes('ACTING_PRINCIPAL') || rawRole.includes('ACTING PRINCIPAL');

  // ONLY render for Vice Principal (VP) / Acting Principal when Principal status is not AVAILABLE and delegation is ACTIVE
  if (!isVp || (principalStatus as string) === 'AVAILABLE' || (principalStatus as string) === 'ONLINE' || delegationStatus !== 'ACTIVE') {
    return null;
  }

  const formattedEnd = delegationEndsAt
    ? new Date(delegationEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '6:00 PM';

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-amber-500/40 text-amber-100 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> ACTING PRINCIPAL MODE
          </span>
          <span className="text-xs text-slate-300 font-bold">
            Principal Status: <span className="text-rose-400 uppercase font-black">{principalStatus}</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 font-medium">
          The Principal is currently <strong className="text-rose-300">{principalStatus}</strong>. You are handling delegated approvals until <strong className="text-amber-300">{formattedEnd}</strong>.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/vp/acting-principal/approvals')}
          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5 active:scale-95"
        >
          <span>View Approvals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
