import React from 'react';
import { ApprovalActionDef, ApprovalActionType } from './ApprovalTypes';
import { CheckCircle2, RotateCcw, XCircle, ArrowRightCircle, HelpCircle } from 'lucide-react';

interface ApprovalActionBarProps {
  actions?: ApprovalActionDef[];
  onTriggerAction: (actionDef: ApprovalActionDef) => void;
  isStickyMobile?: boolean;
  className?: string;
}

export const ApprovalActionBar: React.FC<ApprovalActionBarProps> = ({
  actions,
  onTriggerAction,
  isStickyMobile = true,
  className = '',
}) => {
  if (!actions || actions.length === 0) return null;

  const getActionIcon = (actionType: ApprovalActionType) => {
    switch (actionType) {
      case 'APPROVE':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'RECOMMEND':
      case 'FORWARD':
        return <ArrowRightCircle className="w-4 h-4" />;
      case 'RETURN':
        return <RotateCcw className="w-4 h-4" />;
      case 'REJECT':
        return <XCircle className="w-4 h-4" />;
      case 'REQUEST_INFO':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20';
      case 'secondary':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20';
      case 'info':
        return 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200';
    }
  };

  return (
    <div
      className={`${
        isStickyMobile
          ? 'sticky bottom-0 z-30 sm:static bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 sm:p-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-800'
          : ''
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-end gap-2.5 max-w-full">
        {actions.map((act, idx) => (
          <button
            key={act.action || idx}
            type="button"
            onClick={() => onTriggerAction(act)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 ${getVariantStyles(
              act.variant
            )}`}
          >
            {getActionIcon(act.action)}
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
