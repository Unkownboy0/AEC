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
      <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
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
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              {/* Card Header: Primary & Secondary Column */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white">{getCellValue(item, primaryCol)}</h4>
                  {secondaryCol && (
                    <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                      {getCellValue(item, secondaryCol)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {renderActions && renderActions(item)}
                  <button
                    onClick={(e) => toggleExpand(key, e)}
                    className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Card Details */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300 animate-in fade-in duration-150">
                  {remainingCols.map((col, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-bold">{col.header}:</span>
                      <span className="font-semibold text-slate-200 text-right">
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
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="p-3.5">{col.header}</th>
              ))}
              {renderActions && <th className="p-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200 font-semibold">
            {data.map((item) => {
              const key = keyExtractor(item);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(item)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer"
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
