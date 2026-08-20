import React from 'react';

export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  contentClassName = '',
}) => {
  return (
    <div
      className={`bg-card text-card-foreground border border-border/80 rounded-2xl shadow-2xs overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="px-4 sm:px-5 py-4 border-b border-border/70 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-base font-semibold text-foreground tracking-tight text-pretty">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 text-pretty">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-4 sm:p-5 ${contentClassName}`}>{children}</div>
    </div>
  );
};
