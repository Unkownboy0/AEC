import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'table' | 'chart';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text', count = 1 }) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'avatar':
        return 'h-10 w-10 rounded-full';
      case 'card':
        return 'h-32 w-full rounded-xl';
      case 'table':
        return 'h-12 w-full rounded-md';
      case 'chart':
        return 'h-48 w-full rounded-xl';
      default:
        return 'h-4 w-full rounded';
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse bg-muted/60 dark:bg-muted/30 ${getVariantStyle()} ${className}`}
        />
      ))}
    </>
  );
};

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <Skeleton variant="card" className="h-24" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Skeleton variant="card" count={4} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton variant="chart" className="lg:col-span-2" />
      <Skeleton variant="card" className="h-48" />
    </div>
  </div>
);
