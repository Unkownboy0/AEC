import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { useDelegationContext } from '../context/DelegationContext';
import { useAuth } from '../../../context/AuthContext';
import api from '@/lib/axios';

export const ActingPrincipalBanner: React.FC = () => {
  const { user } = useAuth();
  const {
    principalStatus,
    delegationStatus,
    isActingPrincipal,
    delegationEndsAt,
    delegationId,
    refreshStatus
  } = useDelegationContext();

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Requirement 2 & 12: Only show when delegation is ACTIVE and VP is Acting Principal
  if (!isActingPrincipal || delegationStatus !== 'ACTIVE' || principalStatus === 'ONLINE') {
    return null;
  }

  const handleAcknowledge = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/vp/acting-principal/acknowledge', {
        delegationId,
        deviceId: 'WEB_DEVICE'
      });
      if (res.status === 200) {
        setAcknowledged(true);
        await refreshStatus();
      }
    } catch (err) {
      console.error('Failed to acknowledge delegation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formattedEnd = delegationEndsAt
    ? new Date(delegationEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'End of Shift';

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-amber-500/40 text-amber-100 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> ACTING PRINCIPAL MODE ACTIVE
          </span>
          <span className="text-xs text-slate-300 font-bold">
            Principal Status: <span className="text-amber-400 uppercase font-black">{principalStatus}</span>
          </span>
          <span className="text-xs text-slate-400 font-medium">| Valid until {formattedEnd}</span>
        </div>

        <p className="text-xs font-semibold text-slate-200 mt-1 leading-relaxed">
          You are acting as Principal under an active delegation. All actions taken in the system will be recorded as performed by{' '}
          <strong className="text-white font-extrabold">{(user as any)?.name || (user as any)?.username || 'Vice Principal'}, Vice Principal — Acting Principal</strong>.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/vp/acting-principal/approval-center"
          className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
        >
          Access Principal Approval Desk <ArrowRight className="w-4 h-4" />
        </a>

        {!acknowledged && (
          <button
            onClick={handleAcknowledge}
            disabled={submitting}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {submitting ? 'Acknowledging...' : 'Acknowledge Authority'}
          </button>
        )}
      </div>
    </div>
  );
};
