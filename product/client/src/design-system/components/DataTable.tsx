import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  mobileCardRender?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyTitle = 'No records found',
  emptyDescription,
  keyExtractor,
  onRowClick,
  mobileCardRender,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (isLoading) {
    return (
      <div className="space-y-2 p-4 bg-card rounded-xl border border-border">
        <Skeleton variant="table" count={5} />
      </div>
    );
  }

  // Filter
  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 text-xs">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Filter records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {sortedData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`py-3 px-4 ${col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {col.header}
                        {col.sortable && sortKey === col.key && (
                          sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedData.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-muted/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="py-3 px-4 text-foreground">
                        {col.render ? col.render(item) : String(item[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2.5">
            {sortedData.map((item) => (
              <div
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={`p-3.5 bg-card border border-border rounded-xl shadow-2xs space-y-1.5 ${
                  onRowClick ? 'active:scale-[0.99] transition-transform cursor-pointer' : ''
                }`}
              >
                {mobileCardRender
                  ? mobileCardRender(item)
                  : columns.map((col) => (
                      <div key={col.key} className="flex justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">{col.header}:</span>
                        <span className="text-foreground font-medium">
                          {col.render ? col.render(item) : String(item[col.key] ?? '')}
                        </span>
                      </div>
                    ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
