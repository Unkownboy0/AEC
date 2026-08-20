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
    <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5">
      <h4 className="text-xs font-extrabold uppercase text-primary tracking-wider flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        Applicant Overview
      </h4>

      <div className="grid grid-cols-2 gap-3.5 text-xs">
        <div>
          <span className="text-muted-foreground block text-[11px] font-medium">Submitted By:</span>
          <span className="font-extrabold text-foreground">{applicant.name || 'User'}</span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[11px] font-medium">Department:</span>
          <span className="font-bold text-foreground">{applicant.departmentName || 'Department'}</span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[11px] font-medium">Submitted As Role:</span>
          <span className="font-extrabold text-primary px-2.5 py-1 rounded-md bg-primary-soft border border-primary/20 inline-block text-[10px] uppercase mt-0.5">
            {displayRole}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[11px] font-medium">Employee / ID:</span>
          <span className="font-mono font-bold text-foreground">{applicant.employeeId || 'EMP-SYSTEM'}</span>
        </div>

        {applicant.primaryEmploymentRole && (
          <div className="col-span-2 pt-2.5 border-t border-border flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Primary Designation:</span>
            <span className="font-bold text-foreground">{applicant.primaryEmploymentRole}</span>
          </div>
        )}
      </div>
    </div>
  );
};

ApplicantOverviewCard.displayName = 'ApplicantOverviewCard';
export default ApplicantOverviewCard;
