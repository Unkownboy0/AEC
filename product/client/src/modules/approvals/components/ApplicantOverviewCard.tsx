import React from 'react';
import { User, Building2, ShieldCheck, BadgeCheck } from 'lucide-react';
import { ApprovalRequestDetails } from '../api/approvalRequests.api';

interface ApplicantOverviewCardProps {
  applicant: ApprovalRequestDetails['applicant'];
}

export const ApplicantOverviewCard: React.FC<ApplicantOverviewCardProps> = ({ applicant }) => {
  if (!applicant) return null;

  const isHod =
    (applicant.submittedAsRole || '').toUpperCase().includes('HOD') ||
    (applicant.name || '').toLowerCase().includes('hod') ||
    (applicant as any)?.title?.includes('[HOD]');

  const displayRole = isHod ? 'Head of Department (HOD)' : applicant.submittedAsRole || 'Executive';

  return (
    <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
      <h4 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-400 tracking-wider flex items-center gap-2">
        <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        Applicant Overview
      </h4>

      <div className="grid grid-cols-2 gap-3.5 text-xs">
        <div>
          <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-medium">Submitted By (HOD Name):</span>
          <span className="font-extrabold text-slate-900 dark:text-slate-100">{applicant.name || 'John Doe'}</span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-medium">Department:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{applicant.departmentName || 'Computer Science & Engineering'}</span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-medium">Submitted As Role:</span>
          <span className="font-extrabold text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 inline-block text-[10px] uppercase mt-0.5">
            {displayRole}
          </span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-medium">Employee / ID:</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{applicant.employeeId || 'EMP-SYSTEM'}</span>
        </div>

        {applicant.primaryEmploymentRole && (
          <div className="col-span-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Primary Employment Designation:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{applicant.primaryEmploymentRole}</span>
          </div>
        )}
      </div>
    </div>
  );
};

ApplicantOverviewCard.displayName = 'ApplicantOverviewCard';
export default ApplicantOverviewCard;
