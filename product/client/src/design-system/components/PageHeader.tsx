import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  backUrl?: string;
  onBack?: () => void;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'danger' | 'secondary';
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  backUrl,
  onBack,
  primaryAction,
  secondaryActions = [],
  children,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  const hasBack = Boolean(backUrl || onBack);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {hasBack && (
            <button
              onClick={handleBack}
              className="mt-1 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {(primaryAction || secondaryActions.length > 0) && (
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
            {secondaryActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}

            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition-all ${
                  primaryAction.disabled
                    ? 'opacity-50 cursor-not-allowed bg-indigo-400'
                    : primaryAction.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-[0.98]'
                    : primaryAction.variant === 'secondary'
                    ? 'bg-slate-800 hover:bg-slate-900 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
};
