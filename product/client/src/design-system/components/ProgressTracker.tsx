import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  sublabel?: string;
  status: 'completed' | 'current' | 'upcoming' | 'rejected';
}

export interface ProgressTrackerProps {
  steps: StepItem[];
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <ol className="flex items-center w-full">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <li
              key={step.id}
              className={`flex items-center ${
                !isLast ? 'w-full' : ''
              }`}
            >
              <div className="flex flex-col items-center group">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                    step.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : step.status === 'current'
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40'
                      : step.status === 'rejected'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="mt-2 text-center min-w-[70px]">
                  <p
                    className={`text-xs font-semibold ${
                      step.status === 'current'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : step.status === 'completed'
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.sublabel && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {step.sublabel}
                    </p>
                  )}
                </div>
              </div>

              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-6 transition-all ${
                    step.status === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
