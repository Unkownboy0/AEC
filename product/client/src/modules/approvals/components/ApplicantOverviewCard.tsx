import React from 'react';
import { User, Building2, ShieldCheck, BadgeCheck } from 'lucide-react';
import { ApprovalRequestDetails } from '../api/approvalRequests.api';

interface ApplicantOverviewCardProps {
  applicant: ApprovalRequestDetails['applicant'];
}

export const ApplicantOverviewCard: React.FC<ApplicantOverviewCardProps> = ({ applicant }) => {
  if (!applicant) return null;

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
        <User className="w-4 h-4 text-amber-400" />
        Applicant Overview
      </h4>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">Submitted By:</span>
          <span className="font-bold text-slate-200">{applicant.name || 'Executive Applicant'}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">Department:</span>
          <span className="font-bold text-slate-200">{applicant.departmentName || 'Academic Department'}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">Submitted As Role:</span>
          <span className="font-extrabold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 inline-block text-[10px] uppercase mt-0.5">
            {applicant.submittedAsRole || 'Executive'}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[11px]">Employee / ID:</span>
          <span className="font-bold text-slate-200">{applicant.employeeId || 'EMP-SYSTEM'}</span>
        </div>

        {applicant.primaryEmploymentRole && (
          <div className="col-span-2 pt-1 border-t border-slate-900 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Primary Employment Role:</span>
            <span className="font-semibold text-slate-300">{applicant.primaryEmploymentRole}</span>
          </div>
        )}
      </div>
    </div>
  );
};
