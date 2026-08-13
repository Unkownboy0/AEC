import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   DIVIDER — CampusOS Design System Primitive
   ═══════════════════════════════════════════════════════════════════ */

export interface DividerProps {
  label?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Divider: React.FC<DividerProps> = ({
  label,
  className,
  orientation = 'horizontal',
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={clsx('w-px bg-border self-stretch', className)}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div className={clsx('flex items-center gap-3', className)} role="separator">
        <div className="flex-1 h-px bg-border" />
        <span className="text-caption-sm text-muted-foreground shrink-0">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <div
      className={clsx('h-px bg-border w-full', className)}
      role="separator"
      aria-orientation="horizontal"
    />
  );
};

Divider.displayName = 'Divider';
export default Divider;
