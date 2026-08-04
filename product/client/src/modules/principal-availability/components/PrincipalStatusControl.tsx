import React, { useState } from 'react';
import { ChevronDown, Info, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PrincipalStatusBadge } from './PrincipalStatusBadge';
import { AvailabilityModal } from './AvailabilityModal';
import { useDelegationContext } from '../../delegation/context/DelegationContext';
import { useAuth } from '../../../context/AuthContext';

export const PrincipalStatusControl: React.FC = () => {
  const { user } = useAuth();
  const { principalStatus, delegationStatus, delegationEndsAt, updateStatus } = useDelegationContext();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const rawRole = (typeof user?.role === 'object' ? (user?.role as any)?.name : String(user?.role || '')).toUpperCase();
  const isPrincipal = rawRole.includes('PRINCIPAL') && !rawRole.includes('VICE') && !rawRole.includes('VP');

  const status = principalStatus === 'ONLINE' ? 'AVAILABLE' : principalStatus || 'AVAILABLE';

  const formattedEnd = delegationEndsAt
    ? new Date(delegationEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '6:00 PM';

  const handleClick = () => {
    if (isPrincipal) {
      setIsModalOpen(true);
    } else {
      setIsPopoverOpen((prev) => !prev);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={handleClick}
        className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-md transition-all text-xs font-bold"
      >
        <span className="text-slate-400 text-[11px]">Principal Status:</span>
        <PrincipalStatusBadge status={status} size="sm" />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
      </button>

      {/* VP Informational Popover when Vice Principal clicks Principal Status badge */}
      {!isPrincipal && isPopoverOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold text-white flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Principal Availability
            </span>
            <button onClick={() => setIsPopoverOpen(false)} className="text-slate-400 hover:text-white text-[10px]">✕</button>
          </div>

          <p className="text-slate-300">
            Current Status: <strong className="text-amber-400 uppercase font-black">{status}</strong>
          </p>

          {delegationStatus === 'ACTIVE' ? (
            <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Acting Principal Active</span>
              </div>
              <p className="text-slate-300">
                You are handling delegated approvals until <strong className="text-white">{formattedEnd}</strong>.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              The Principal is currently Available. Standard Vice Principal operations active.
            </p>
          )}
        </div>
      )}

      {/* Availability Modal for Principal */}
      {isPrincipal && isModalOpen && (
        <AvailabilityModal
          currentStatus={status}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={async (dto) => {
            const mappedStatus = dto.status === 'AVAILABLE' ? 'ONLINE' : dto.status;
            await updateStatus({
              status: mappedStatus as any,
              reason: dto.reason,
              startsAt: dto.startsAt,
              endsAt: dto.endsAt,
            });
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
