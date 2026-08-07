import React from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Input } from '../../primitives/Input/Input';

/* ═══════════════════════════════════════════════════════════════════
   LIST PAGE PATTERN — CampusOS Design System Pattern
   
   Standard list/table page layout:
   - Header with Title & Primary Action
   - Filter & Search Bar
   - Content Table (Desktop) / Cards (Mobile)
   - Pagination / Footer
   ═══════════════════════════════════════════════════════════════════ */

export interface ListPagePatternProps {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: React.ReactNode;
  content: React.ReactNode;
  pagination?: React.ReactNode;
  className?: string;
}

export const ListPagePattern: React.FC<ListPagePatternProps> = ({
  title,
  description,
  primaryAction,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filters,
  content,
  pagination,
  className,
}) => {
  return (
    <div className={clsx('space-y-6', className)}>
      <PageHeader title={title} description={description} action={primaryAction} />

      {/* Search & Filter Bar */}
      {(onSearchChange || filters) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 border border-border rounded-lg">
          {onSearchChange && (
            <div className="flex-1 max-w-md">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                size="sm"
              />
            </div>
          )}
          {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
        </div>
      )}

      {/* Main Table or Card List */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {content}
      </div>

      {/* Pagination Footer */}
      {pagination && <div className="flex justify-end">{pagination}</div>}
    </div>
  );
};

ListPagePattern.displayName = 'ListPagePattern';
export default ListPagePattern;
