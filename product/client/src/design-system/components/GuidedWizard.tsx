import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProgressTracker, StepItem } from './ProgressTracker';
import { toast } from '../../components/ui/Toast';

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  component: React.ReactNode;
  validate?: () => boolean | string;
}

export interface GuidedWizardProps {
  title: string;
  description?: string;
  steps: WizardStep[];
  onComplete: () => Promise<void> | void;
  submitLabel?: string;
  successMessage?: string;
  onCancel?: () => void;
}

export const GuidedWizard: React.FC<GuidedWizardProps> = ({
  title,
  description,
  steps,
  onComplete,
  submitLabel = 'Complete & Send',
  successMessage = 'Action completed successfully!',
  onCancel,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = async () => {
    setValidationError(null);

    if (currentStep.validate) {
      const validationResult = currentStep.validate();
      if (typeof validationResult === 'string') {
        setValidationError(validationResult);
        return;
      }
      if (validationResult === false) {
        setValidationError('Please complete the required details before proceeding to the next step.');
        return;
      }
    }

    if (isLastStep) {
      try {
        setIsSubmitting(true);
        await onComplete();
        toast.success(successMessage);
      } catch (err: any) {
        toast.error(err.message || 'Unable to submit request. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const stepItems: StepItem[] = steps.map((s, idx) => ({
    id: s.id,
    label: s.title,
    status:
      idx < currentStepIndex
        ? 'completed'
        : idx === currentStepIndex
        ? 'current'
        : 'upcoming',
  }));

  return (
    <div className="bg-surface border border-border rounded-3xl shadow-xs overflow-hidden max-w-3xl mx-auto space-y-6 p-6 sm:p-8">
      {/* Wizard Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black tracking-wider text-primary px-2.5 py-1 bg-primary/10 rounded-full border border-primary/20">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        <h2 className="text-xl font-extrabold text-text-primary mt-2 tracking-tight">{title}</h2>
        {description && <p className="text-xs text-text-muted mt-1 leading-relaxed">{description}</p>}
      </div>

      {/* Progress Stepper Bar */}
      <div className="py-2">
        <ProgressTracker steps={stepItems} />
      </div>

      {/* Current Step Content Container */}
      <div className="pt-4 border-t border-border space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-text-primary">{currentStep.title}</h3>
          {currentStep.subtitle && (
            <p className="text-xs text-text-muted mt-0.5">{currentStep.subtitle}</p>
          )}
        </div>

        {/* Step Custom Form Content */}
        <div className="min-h-[160px] py-2">{currentStep.component}</div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Step Controls Footer */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-xl bg-surface-soft hover:bg-surface text-text-primary border border-border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isFirstStep ? 'Close' : 'Back'}</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary-hover shadow-md active:scale-95 transition-all flex items-center gap-1.5"
        >
          <span>{isSubmitting ? 'Processing...' : isLastStep ? submitLabel : 'Next Step'}</span>
          {!isLastStep && <ArrowRight className="w-4 h-4" />}
          {isLastStep && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
