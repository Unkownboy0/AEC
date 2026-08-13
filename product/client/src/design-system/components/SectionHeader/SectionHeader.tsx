import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   SECTION HEADER — CampusOS Design System Component
   
   Used to separate content sections within a page.
   ═══════════════════════════════════════════════════════════════════ */

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-section-title font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

SectionHeader.displayName = 'SectionHeader';
export default SectionHeader;
