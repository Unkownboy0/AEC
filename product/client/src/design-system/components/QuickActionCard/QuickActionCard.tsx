import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   QUICK ACTION CARD — CampusOS Design System Component
   
   Dashboard quick action tile. Max 6-8 per dashboard.
   ═══════════════════════════════════════════════════════════════════ */

export interface QuickActionCardProps {
  label: string;
  icon: React.ReactNode;
  description?: string;
  onClick: () => void;
  badge?: string | number;
  variant?: 'default' | 'primary';
  className?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  label,
  icon,
  description,
  onClick,
  badge,
  variant = 'default',
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex flex-col items-start gap-3 p-4 rounded-lg text-left w-full',
        'border transition-all duration-fast',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        variant === 'default' && 'bg-surface border-border hover:border-border-strong hover:bg-raised',
        variant === 'primary' && 'bg-accent border-primary/20 hover:border-primary/40',
        className
      )}
    >
      <div
        className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          '[&>svg]:w-[18px] [&>svg]:h-[18px]',
          variant === 'default' && 'bg-muted text-foreground',
          variant === 'primary' && 'bg-primary text-primary-foreground'
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-card-title text-foreground truncate">{label}</p>
        {description && (
          <p className="text-caption-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        )}
      </div>
      {badge !== undefined && badge !== null && badge !== 0 && (
        <span className="absolute top-3 right-3 bg-danger text-danger-foreground text-[10px] font-bold px-1.5 py-px rounded-pill min-w-[18px] text-center">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

QuickActionCard.displayName = 'QuickActionCard';
export default QuickActionCard;
