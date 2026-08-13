import React from 'react';
import { ChevronRight, Calendar, User, Building2, FileText, ShieldCheck } from 'lucide-react';
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
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400';
      case 'APPROVED':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400';
      case 'REJECTED':
        return 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400';
      case 'RETURNED':
        return 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
    }
  };

  const isHodApplicant =
    (request.title || '').includes('[HOD]') ||
    (request.assignedRole || '').includes('HOD') ||
    (request.applicantName || '').toLowerCase().includes('hod');

  const applicantRole = isHodApplicant ? 'Head of Department (HOD)' : 'Faculty Executive';
  const reasonText = (request as any).reason || (request as any).description || (request as any).leaveReason;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all flex flex-col justify-between gap-3 group">
      <div>
        {/* Request Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider">
            {request.requestType.replace('_', ' ')}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusBadge()}`}>
            {request.status}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-3 leading-snug">
          {request.title || 'Approval Request'}
        </h4>

        {/* Applicant Details */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
          {/* Submitted By (HOD Name) */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 font-medium">HOD Name:</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              {request.applicantName || 'John Doe'}
            </span>
          </div>

          {/* Department Name */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Department:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              {request.departmentName || 'Computer Science & Engineering'}
            </span>
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Role:</span>
            <span className="font-bold text-purple-700 dark:text-purple-300 text-[10px] uppercase">
              {applicantRole}
            </span>
          </div>

          {/* Submitted Date */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 dark:text-slate-500">Submitted:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {new Date(request.assignedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Applicant Submitted Reason Box */}
        {reasonText && (
          <div className="mt-3 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 text-xs text-slate-800 dark:text-slate-200 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span>Applicant Submitted Reason:</span>
            </div>
            <p className="font-medium leading-relaxed text-slate-900 dark:text-slate-100 line-clamp-2">
              "{reasonText}"
            </p>
          </div>
        )}
      </div>

      {request.actionByRole && (
        <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <span>Actor:</span>
          <span className="text-amber-600 dark:text-amber-400">
            {request.actionAsRole === 'ACTING_PRINCIPAL'
              ? 'Vice Principal — Acting Principal'
              : 'Principal'}
          </span>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={() => onViewDetails(request)}
        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 dark:hover:bg-purple-600 text-slate-800 dark:text-slate-200 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer shadow-2xs group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600"
      >
        <span>View Request Details</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

ApprovalRequestCard.displayName = 'ApprovalRequestCard';
export default ApprovalRequestCard;
