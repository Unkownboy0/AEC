import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';

export const ActingPrincipalBanner: React.FC = () => {
  const [actingStatus, setActingStatus] = useState<any>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/vp/acting-principal/status');
      if (res.data?.success && res.data?.data) {
        setActingStatus(res.data.data.activeDelegation || null);
        setAcknowledged(Boolean(res.data.data.activeDelegation?.acknowledgedAt));
      }
    } catch (err) {
      console.error('Failed to fetch VP acting status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (!actingStatus) return null;

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/vp/acting-principal/acknowledge/${actingStatus.id}`, {
        deviceId: 'WEB_DEVICE'
      });
      if (res.status === 200) {
        setAcknowledged(true);
      }
    } catch (err) {
      console.error('Failed to acknowledge acting principal authority:', err);
    } finally {
      setLoading(false);
    }
  };

  const formattedEnd = new Date(actingStatus.endDate).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-500/40 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-100 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
      
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
          <Crown className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-black uppercase tracking-wider">
              Active Principal Delegation
            </span>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Valid until {formattedEnd}
            </span>
          </div>

          <h2 className="text-base font-extrabold text-white mt-1">
            Acting Principal Authority Granted by Principal
          </h2>

          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
            Reason: <strong className="text-slate-100">{actingStatus.reason}</strong>. All requests approved or rejected by you during this period will be explicitly attributed as <span className="text-amber-300 font-bold">Vice Principal — Acting Principal</span>.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
        {!acknowledged ? (
          <button
            onClick={handleAcknowledge}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-600 hover:to-violet-700 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Acknowledging...' : 'Acknowledge Acting Authority'}
          </button>
        ) : (
          <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Authority Acknowledged
          </span>
        )}
      </div>
    </div>
  );
};
