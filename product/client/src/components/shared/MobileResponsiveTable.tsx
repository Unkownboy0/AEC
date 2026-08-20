import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

export interface MobileResponsiveTableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  isPrimary?: boolean;
  isSecondary?: boolean;
  hideOnMobile?: boolean;
}

interface MobileResponsiveTableProps<T> {
  data: T[];
  columns: MobileResponsiveTableColumn<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  renderActions?: (item: T) => React.ReactNode;
}

export function MobileResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found.',
  onRowClick,
  renderActions,
}: MobileResponsiveTableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getCellValue = (item: T, col: MobileResponsiveTableColumn<T>) => {
    if (typeof col.accessor === 'function') {
      return col.accessor(item);
    }
    return item[col.accessor as string];
  };

  const primaryCol = columns.find((c) => c.isPrimary) || columns[0];
  const secondaryCol = columns.find((c) => c.isSecondary) || columns[1];
  const remainingCols = columns.filter((c) => c !== primaryCol && c !== secondaryCol);

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-border">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Mobile Card Layout (md:hidden) */}
      <div className="md:hidden space-y-3">
        {data.map((item) => {
          const key = keyExtractor(item);
          const isExpanded = Boolean(expandedKeys[key]);

          return (
            <div
              key={key}
              onClick={() => onRowClick && onRowClick(item)}
              className="p-4 rounded-2xl bg-card text-card-foreground border border-border/80 space-y-2 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
            >
              {/* Card Header: Primary & Secondary Column */}
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-foreground break-words">{getCellValue(item, primaryCol)}</h4>
                  {secondaryCol && (
                    <span className="text-xs text-muted-foreground font-medium block mt-1 break-words">
                      {getCellValue(item, secondaryCol)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {renderActions && renderActions(item)}
                  <button
                    onClick={(e) => toggleExpand(key, e)}
                    className="touch-target p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground"
                    aria-label={isExpanded ? 'Hide row details' : 'Show row details'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Card Details */}
              {isExpanded && (
                <div className="pt-3 border-t border-border/80 space-y-2.5 text-xs text-foreground animate-in fade-in duration-150">
                  {remainingCols.map((col, idx) => (
                    <div key={idx} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 items-start text-xs">
                      <span className="text-muted-foreground font-medium break-words">{col.header}</span>
                      <span className="min-w-0 font-medium text-foreground text-right break-words">
                        {getCellValue(item, col)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Standard Desktop Table (hidden md:table) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold text-xs">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="p-3.5">{col.header}</th>
              ))}
              {renderActions && <th className="p-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-foreground font-medium">
            {data.map((item) => {
              const key = keyExtractor(item);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(item)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className="p-3.5">{getCellValue(item, col)}</td>
                  ))}
                  {renderActions && <td className="p-3.5 text-right">{renderActions(item)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
