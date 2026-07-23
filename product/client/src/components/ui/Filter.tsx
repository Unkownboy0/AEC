import React from 'react';
import { Filter as FilterIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterProps {
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Filter: React.FC<FilterProps> = ({
  label,
  options,
  selectedValue,
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
        <FilterIcon className="h-3.5 w-3.5" />
        {label}:
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onChange('')}
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all duration-150',
            selectedValue === ''
              ? 'bg-primary border-primary text-primary-foreground'
              : 'bg-background hover:bg-muted text-muted-foreground'
          )}
        >
          All
        </button>
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all duration-150',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted text-muted-foreground'
              )}
            >
              {opt.label}
              {isSelected && (
                <X
                  className="h-3 w-3 ml-0.5 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
