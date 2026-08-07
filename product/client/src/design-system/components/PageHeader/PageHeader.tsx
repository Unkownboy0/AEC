import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   PAGE HEADER — CampusOS Design System Component
   
   Every page must have:
   - Page title
   - Short explanation
   - Primary action (optional)
   - Breadcrumbs (optional)
   ═══════════════════════════════════════════════════════════════════ */

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  breadcrumbs,
  badge,
  className,
}) => {
  return (
    <div className={clsx('space-y-1', className)}>
      {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-page-title-sm md:text-page-title font-semibold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {badge && badge}
          </div>
          {description && (
            <p className="mt-1 text-body text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
};

PageHeader.displayName = 'PageHeader';
export default PageHeader;
