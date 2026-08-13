import React from 'react';
import { clsx } from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   SKELETON — CampusOS Design System Primitive
   
   Loading placeholder that mimics content shape.
   ═══════════════════════════════════════════════════════════════════ */

export interface SkeletonProps {
  className?: string;
  /** Width — use Tailwind classes like w-32, w-full */
  width?: string;
  /** Height — use Tailwind classes like h-4, h-8 */
  height?: string;
  /** Shape variant */
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  variant = 'text',
}) => {
  return (
    <div
      className={clsx(
        'bg-muted animate-pulse',
        variant === 'text' && 'h-4 rounded',
        variant === 'rectangular' && 'rounded-lg',
        variant === 'circular' && 'rounded-full',
        width,
        height,
        className
      )}
      aria-hidden="true"
      role="presentation"
    />
  );
};

/* ─── Preset Skeleton Patterns ─────────────────────────────────── */

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('border border-border rounded-lg p-5 space-y-3', className)}>
    <Skeleton width="w-1/3" height="h-5" />
    <Skeleton width="w-full" height="h-4" />
    <Skeleton width="w-2/3" height="h-4" />
    <div className="flex gap-2 pt-1">
      <Skeleton width="w-16" height="h-6" variant="rectangular" />
      <Skeleton width="w-20" height="h-6" variant="rectangular" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className,
}) => (
  <div className={clsx('space-y-2', className)}>
    {/* Header */}
    <div className="flex gap-4 py-3 border-b border-border">
      <Skeleton width="w-1/4" height="h-4" />
      <Skeleton width="w-1/4" height="h-4" />
      <Skeleton width="w-1/4" height="h-4" />
      <Skeleton width="w-1/4" height="h-4" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3">
        <Skeleton width="w-1/4" height="h-4" />
        <Skeleton width="w-1/4" height="h-4" />
        <Skeleton width="w-1/4" height="h-4" />
        <Skeleton width="w-1/4" height="h-4" />
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({
  count = 4,
  className,
}) => (
  <div className={clsx('space-y-3', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
        <Skeleton variant="circular" width="w-9" height="h-9" />
        <div className="flex-1 space-y-1.5">
          <Skeleton width="w-1/3" height="h-4" />
          <Skeleton width="w-2/3" height="h-3" />
        </div>
      </div>
    ))}
  </div>
);

Skeleton.displayName = 'Skeleton';
SkeletonCard.displayName = 'SkeletonCard';
SkeletonTable.displayName = 'SkeletonTable';
SkeletonList.displayName = 'SkeletonList';

export default Skeleton;
