import React from 'react';
import { ApprovalTimelineStep } from './ApprovalTypes';
import { ShieldCheck, CheckCircle2, Clock, XCircle, RotateCcw, UserCheck } from 'lucide-react';

interface ApprovalWorkflowTimelineProps {
  timeline?: ApprovalTimelineStep[];
  className?: string;
}

export const ApprovalWorkflowTimeline: React.FC<ApprovalWorkflowTimelineProps> = ({
  timeline,
  className = '',
}) => {
  if (!timeline || timeline.length === 0) return null;

  const getStepDot = (step: ApprovalTimelineStep) => {
    if (step.status === 'COMPLETED') {
      return 'bg-emerald-600 ring-emerald-100 dark:ring-emerald-950';
    }
    if (step.status === 'REJECTED') {
      return 'bg-red-600 ring-red-100 dark:ring-red-950';
    }
    if (step.status === 'RETURNED') {
      return 'bg-amber-500 ring-amber-100 dark:ring-amber-950';
    }
    if (step.status === 'CURRENT') {
      return 'bg-blue-600 ring-blue-100 dark:ring-blue-950 animate-pulse';
    }
    return 'bg-gray-300 dark:bg-gray-700 ring-gray-100 dark:ring-gray-800';
  };

  return (
    <div className={`p-5 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 ${className}`}>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Workflow & Approval Timeline</span>
      </h3>

      <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-3 pl-6 space-y-6 pt-1 pb-1">
        {timeline.map((step, idx) => {
          const dotClass = getStepDot(step);

          return (
            <div key={step.id || idx} className="relative">
              <span
                className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full ring-4 ring-white dark:ring-gray-900 ${dotClass}`}
              />

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {step.stage}
                  </span>

                  {step.action && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/50">
                      {step.action}
                    </span>
                  )}

                  {step.performedAsRole && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200/50 dark:border-purple-900/50 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      {step.performedAsRole}
                    </span>
                  )}
                </div>

                {step.comment && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 mt-1">
                    "{step.comment}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                  {step.actorName && (
                    <span>
                      By <span className="font-semibold text-gray-600 dark:text-gray-300">{step.actorName}</span>
                      {step.actorRole && ` (${step.actorRole})`}
                    </span>
                  )}
                  {step.timestamp && (
                    <span>
                      • {new Date(step.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
