import React from 'react';
import { ShieldCheck, Clock, Eye, RotateCcw } from 'lucide-react';
import { useDelegationContext } from '../../delegation/context/DelegationContext';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext';

export const PrincipalDelegationBanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { principalStatus, delegationStatus, delegationEndsAt, updateStatus } = useDelegationContext();

  const rawRole = (typeof user?.role === 'object' ? (user?.role as any)?.name : String(user?.role || '')).toUpperCase();
  const isPrincipal = rawRole.includes('PRINCIPAL') && !rawRole.includes('VICE') && !rawRole.includes('VP');

  // ONLY render for Principal when delegation is ACTIVE and status is not AVAILABLE
  if (!isPrincipal || (principalStatus as string) === 'AVAILABLE' || (principalStatus as string) === 'ONLINE' || delegationStatus !== 'ACTIVE') {
    return null;
  }

  const formattedEnd = delegationEndsAt
    ? new Date(delegationEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '6:00 PM';

  const handleReturnAvailable = async () => {
    try {
      await updateStatus({ status: 'ONLINE', reason: 'Principal returned' });
      navigate('/approval-center');
    } catch (err) {
      console.error('Failed to revert status to available:', err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-violet-500/40 text-violet-100 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/40 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" /> DELEGATION ACTIVE
          </span>
          <span className="text-xs text-slate-300 font-bold">
            Status: <span className="text-violet-400 uppercase font-black">{principalStatus}</span>
          </span>
        </div>
        <p className="text-xs text-slate-300 font-medium">
          Vice Principal <strong className="text-white">Dr. Meenakshi Sundaram</strong> is temporarily handling selected Principal approvals until <strong className="text-violet-300">{formattedEnd}</strong>.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/principal/delegation')}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>Monitor Delegation</span>
        </button>

        <button
          onClick={handleReturnAvailable}
          className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Return Available</span>
        </button>
      </div>
    </div>
  );
};
