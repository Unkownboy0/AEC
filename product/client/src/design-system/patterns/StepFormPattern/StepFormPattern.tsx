import React from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Button } from '../../primitives/Button/Button';

/* ═══════════════════════════════════════════════════════════════════
   STEP FORM PATTERN — CampusOS Design System Pattern
   
   Multi-step guided form for complex creation/edits:
   - Progress Step Indicator
   - Step Content Body
   - Back / Next / Submit Action Bar
   ═══════════════════════════════════════════════════════════════════ */

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export interface StepFormPatternProps {
  title: string;
  description?: string;
  steps: Step[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const StepFormPattern: React.FC<StepFormPatternProps> = ({
  title,
  description,
  steps,
  currentStepIndex,
  onStepChange,
  onSubmit,
  isSubmitting = false,
  canProceed = true,
  children,
  className,
}) => {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className={clsx('space-y-6 max-w-form mx-auto pb-20 lg:pb-6', className)}>
      <PageHeader title={title} description={description} />

      {/* Step Indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-4 overflow-x-auto no-scrollbar">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.id}
              onClick={() => isCompleted && onStepChange(idx)}
              className={clsx(
                'flex items-center gap-2 text-caption shrink-0 select-none',
                isCompleted && 'cursor-pointer text-primary',
                isCurrent && 'font-semibold text-foreground',
                !isCompleted && !isCurrent && 'text-muted-foreground'
              )}
            >
              <span
                className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-caption-sm font-bold',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-accent text-primary border border-primary',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {idx + 1}
              </span>
              <span className="truncate max-w-[120px] sm:max-w-none">{step.title}</span>
              {idx < steps.length - 1 && <span className="text-border mx-1">/</span>}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 space-y-6">
        {children}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="secondary"
          onClick={() => onStepChange(currentStepIndex - 1)}
          disabled={isFirstStep || isSubmitting}
        >
          Previous
        </Button>
        {isLastStep ? (
          <Button variant="primary" onClick={onSubmit} isLoading={isSubmitting} disabled={!canProceed}>
            Complete & Submit
          </Button>
        ) : (
          <Button variant="primary" onClick={() => onStepChange(currentStepIndex + 1)} disabled={!canProceed}>
            Next Step
          </Button>
        )}
      </div>
    </div>
  );
};

StepFormPattern.displayName = 'StepFormPattern';
export default StepFormPattern;
