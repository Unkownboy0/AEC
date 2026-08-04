import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, Clock, ShieldAlert, Circle } from 'lucide-react';
import { DelegationModal } from './DelegationModal';
import { useDelegationContext } from './context/DelegationContext';

export const PrincipalHeaderStatusControl: React.FC = () => {
  const { principalStatus, updateStatus } = useDelegationContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalTargetStatus, setModalTargetStatus] = useState<'BUSY' | 'OFFLINE' | null>(null);

  const handleSelectStatus = async (status: 'ONLINE' | 'BUSY' | 'OFFLINE') => {
    setIsDropdownOpen(false);
    if (status === principalStatus) return;

    if (status === 'BUSY' || status === 'OFFLINE') {
      setModalTargetStatus(status);
    } else {
      await updateStatus({ status: 'ONLINE' });
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`px-3.5 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all shadow-md ${
          principalStatus === 'ONLINE'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
            : principalStatus === 'BUSY'
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
        }`}
      >
        <Circle
          className={`w-2.5 h-2.5 fill-current ${
            principalStatus === 'ONLINE'
              ? 'text-emerald-400'
              : principalStatus === 'BUSY'
              ? 'text-amber-400 animate-pulse'
              : 'text-rose-400 animate-pulse'
          }`}
        />
        <span>STATUS: {principalStatus}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs font-semibold space-y-1">
          <button
            onClick={() => handleSelectStatus('ONLINE')}
            className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${
              principalStatus === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-300 font-extrabold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-extrabold">Online</div>
              <div className="text-[10px] text-slate-400">Direct Principal sign-off</div>
            </div>
          </button>

          <button
            onClick={() => handleSelectStatus('BUSY')}
            className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${
              principalStatus === 'BUSY' ? 'bg-amber-500/20 text-amber-300 font-extrabold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-extrabold">Busy (Delegate VP)</div>
              <div className="text-[10px] text-slate-400">Time-bounded Vice Principal sign-off</div>
            </div>
          </button>

          <button
            onClick={() => handleSelectStatus('OFFLINE')}
            className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${
              principalStatus === 'OFFLINE' ? 'bg-rose-500/20 text-rose-300 font-extrabold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <div>
              <div className="font-extrabold">Offline (Delegate VP)</div>
              <div className="text-[10px] text-slate-400">Full VP Acting Principal sign-off</div>
            </div>
          </button>
        </div>
      )}

      {modalTargetStatus && (
        <DelegationModal
          targetStatus={modalTargetStatus}
          onClose={() => setModalTargetStatus(null)}
          onSuccess={() => {
            setModalTargetStatus(null);
          }}
        />
      )}
    </div>
  );
};
