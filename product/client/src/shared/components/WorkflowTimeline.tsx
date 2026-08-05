import React from 'react';
import { CheckCircle2, Clock, XCircle, User, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../../design-system/components/StatusBadge';

export interface WorkflowStep {
  id: string;
  stepName: string;
  actorRole: string;
  actorName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  timestamp?: string;
  comments?: string;
}

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
  currentStep?: string;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ steps, currentStep }) => {
  return (
    <div className="space-y-4 py-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Approval Workflow Lifecycle
      </h4>
      <div className="relative border-l-2 border-border ml-3 space-y-6 pl-5">
        {steps.map((step, idx) => {
          const isCurrent = currentStep === step.stepName || currentStep === step.actorRole;

          const getIcon = () => {
            if (step.status === 'APPROVED') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            if (step.status === 'REJECTED') return <XCircle className="h-4 w-4 text-rose-500" />;
            return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />;
          };

          return (
            <div key={step.id || idx} className="relative">
              {/* Timeline Bullet */}
              <div className="absolute -left-[27px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-xs">
                {getIcon()}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{step.stepName || step.actorRole}</span>
                    <StatusBadge status={step.status} size="sm" />
                  </div>
                  {step.actorName && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3" />
                      {step.actorName} ({step.actorRole})
                    </p>
                  )}
                </div>
                {step.timestamp && (
                  <span className="text-[10px] text-muted-foreground/80 font-mono">
                    {new Date(step.timestamp).toLocaleString()}
                  </span>
                )}
              </div>

              {step.comments && (
                <div className="mt-2 p-2 bg-muted/40 rounded-lg text-xs italic text-muted-foreground border border-border/50">
                  "{step.comments}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
