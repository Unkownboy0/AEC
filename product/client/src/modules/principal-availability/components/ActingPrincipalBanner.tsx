import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Clock, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePrincipalAvailability } from '../hooks/usePrincipalAvailability';

export const ActingPrincipalBanner: React.FC = () => {
  const { context } = usePrincipalAvailability();
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

  if (!context || !context.canVpActAsPrincipal || context.principalStatus === 'AVAILABLE') {
    return null;
  }

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'specified time';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="w-full bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border-b border-amber-500/30 px-6 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5 md:mt-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                  Acting Principal Mode
                </span>
                <span className="text-xs font-bold text-amber-200">
                  The Principal is {context.principalStatus === 'BUSY' ? 'Busy' : 'Offline'}.
                </span>
              </div>
              <p className="text-xs text-amber-100/80 mt-0.5">
                You are currently handling delegated approvals until{' '}
                <strong className="text-white font-bold">
                  {formatTime(context.delegation?.endsAt)}
                </strong>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 hover:bg-amber-900/60 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => navigate('/vp/acting-principal/approvals')}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
            >
              <span>View Approvals</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Delegation Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Principal Status:</span>
                <span className="font-extrabold text-amber-400">{context.principalStatus}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Delegation End Time:</span>
                <span className="font-bold text-slate-200">
                  {context.delegation?.endsAt
                    ? new Date(context.delegation.endsAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold">Reason:</span>
                <p className="text-slate-200 font-medium">
                  {context.delegation?.reason || 'Official duties'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold">Delegated Categories:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(context.delegation?.delegatedCategories || []).map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold"
                    >
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
