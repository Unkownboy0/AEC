import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ComponentType<any>;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = Database,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-input bg-card p-12 text-center shadow-sm animate-in fade-in-50 duration-200',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 text-muted-foreground mb-4">
        <Icon className="h-8 w-8 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="mt-6" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          {actionText}
        </Button>
      )}
    </div>
  );
};
