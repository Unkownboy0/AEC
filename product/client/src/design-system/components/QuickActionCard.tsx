import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode | React.ElementType;
  to?: string;
  onClick?: () => void;
  badge?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'amber';
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon: IconComponent,
  to,
  onClick,
  badge,
  variant = 'default',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  const renderIcon = () => {
    if (React.isValidElement(IconComponent)) {
      return IconComponent;
    }
    if (typeof IconComponent === 'function' || typeof IconComponent === 'object') {
      const Comp = IconComponent as React.ElementType;
      return <Comp className="w-5 h-5" />;
    }
    return IconComponent as React.ReactNode;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-200/60 dark:border-indigo-800/40 hover:border-indigo-400';
      case 'success':
        return 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-400';
      case 'amber':
        return 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-200/60 dark:border-amber-800/40 hover:border-amber-400';
      default:
        return 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group w-full p-4 text-left rounded-2xl border shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 ${getVariantStyles()}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
          {renderIcon()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {title}
            </h3>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
};
