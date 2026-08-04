import React from 'react';
import { ChevronRight, Calendar, User, Building2, ShieldCheck, Clock } from 'lucide-react';
import { ApprovalRequestItem } from '../types/availability.types';

interface ApprovalRequestCardProps {
  request: ApprovalRequestItem;
  onViewDetails: (request: ApprovalRequestItem) => void;
}

export const ApprovalRequestCard: React.FC<ApprovalRequestCardProps> = ({
  request,
  onViewDetails,
}) => {
  const getStatusBadge = () => {
    switch (request.status) {
      case 'PENDING':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'APPROVED':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'REJECTED':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'RETURNED':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between gap-3">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-black uppercase text-slate-300">
            {request.requestType.replace('_', ' ')}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${getStatusBadge()}`}>
            {request.status}
          </span>
        </div>

        <h4 className="text-sm font-extrabold text-white mb-2 leading-snug">
          {request.title || 'Approval Request'}
        </h4>

        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-300">{request.applicantName || 'Applicant'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{request.departmentName || 'General'}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Submitted: {new Date(request.assignedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {request.actionByRole && (
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-850 text-[11px] font-bold text-slate-400 flex items-center justify-between">
          <span>Actor:</span>
          <span className="text-amber-400">
            {request.actionAsRole === 'ACTING_PRINCIPAL'
              ? 'Vice Principal — Acting Principal'
              : 'Principal'}
          </span>
        </div>
      )}

      <button
        onClick={() => onViewDetails(request)}
        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-1"
      >
        <span>View Request Details</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
