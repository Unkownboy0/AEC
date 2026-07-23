import React from 'react';
import { cn } from '../../lib/utils';

export interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  className,
  size = 'md',
  fullScreen = false,
  text,
}) => {
  const spinnerElement = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-primary border-t-transparent',
          {
            'h-5 w-5 border-2': size === 'sm',
            'h-8 w-8 border-3': size === 'md',
            'h-12 w-12 border-4': size === 'lg',
          },
          className
        )}
      />
      {text && <p className="mt-3 text-xs font-semibold text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};
