import React, { useState } from 'react';
import { ChevronDown, Info, ShieldAlert } from 'lucide-react';
import { PrincipalStatusBadge } from './PrincipalStatusBadge';
import { PrincipalStatusModal } from './PrincipalStatusModal';
import { useDelegationContext } from '../../delegation/context/DelegationContext';
import { useAuth } from '../../../context/AuthContext';

export const PrincipalStatusControl: React.FC = () => {
  const { user } = useAuth();
  const { principalStatus, delegationStatus, delegationEndsAt, refetch } = useDelegationContext();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const rawRole = (typeof user?.role === 'object' ? (user?.role as any)?.name : String(user?.role || '')).toUpperCase();
  const isPrincipal = rawRole.includes('PRINCIPAL') && !rawRole.includes('VICE') && !rawRole.includes('VP');
  const isVp = rawRole.includes('VP') || rawRole.includes('VICE');

  // ONLY render status control for Principal and VP roles
  if (!isPrincipal && !isVp) {
    return null;
  }

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
        type="button"
        onClick={handleClick}
        className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-soft border border-border hover:border-primary/40 shadow-xs transition-all text-xs font-bold cursor-pointer"
      >
        <span className="text-text-muted text-[11px] hidden sm:inline">Status:</span>
        <PrincipalStatusBadge status={status} size="sm" />
        <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-transform" />
      </button>

      {/* VP Informational Popover when Vice Principal clicks Principal Status badge */}
      {!isPrincipal && isPopoverOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-surface border border-border rounded-2xl p-4 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-extrabold text-text-primary flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-500" />
              Principal Availability
            </span>
            <button onClick={() => setIsPopoverOpen(false)} className="text-text-muted hover:text-text-primary text-[10px]">✕</button>
          </div>

          <p className="text-text-muted">
            Current Status: <strong className="text-primary uppercase font-black">{status}</strong>
          </p>

          {delegationStatus === 'ACTIVE' ? (
            <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                <span>Acting Principal Active</span>
              </div>
              <p className="text-text-muted">
                You are handling delegated approvals until <strong className="text-text-primary">{formattedEnd}</strong>.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-text-muted">
              The Principal is currently Available. Standard Vice Principal operations active.
            </p>
          )}
        </div>
      )}

      {/* Principal Status Modal */}
      {isPrincipal && (
        <PrincipalStatusModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentStatus={status}
          onStatusUpdated={() => {
            setIsModalOpen(false);
            if (refetch) refetch();
          }}
        />
      )}
    </div>
  );
};
