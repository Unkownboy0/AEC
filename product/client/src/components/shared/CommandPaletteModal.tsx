import React from 'react';
import { Search, Command, X, ArrowRight } from 'lucide-react';
import { useCommandPalette, CommandAction } from '../../hooks/useCommandPalette';
import { AppIcon } from '../../design-system/icons/AppIcon';

export const CommandPaletteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { query, setQuery, filteredActions, executeAction } = useCommandPalette();

  if (!isOpen) return null;

  // Group filtered actions by category
  const categories = Array.from(new Set(filteredActions.map((a: CommandAction) => a.category)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative mx-auto max-w-xl transform rounded-2xl bg-surface border border-border shadow-modal transition-all animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 bg-surface-soft/50">
          <Search className="w-5 h-5 text-text-muted shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search page... (Ctrl+K)"
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-medium"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-text-muted hover:text-text-primary rounded-lg text-xs"
            >
              Clear
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-text-muted bg-surface border border-border rounded-md shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Action Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No matching commands or pages found.
            </div>
          ) : (
            categories.map((cat: string) => {
              const catActions = filteredActions.filter((a: CommandAction) => a.category === cat);
              return (
                <div key={cat} className="space-y-1">
                  <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {cat}
                  </p>
                  {catActions.map((act: CommandAction) => (
                    <button
                      key={act.id}
                      onClick={() => executeAction(act)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-text-primary hover:bg-primary-soft hover:text-primary transition-all group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-lg bg-surface-soft group-hover:bg-primary/10 text-text-secondary group-hover:text-primary shrink-0">
                          <AppIcon name={act.icon || 'Circle'} size="sm" />
                        </div>
                        <span className="truncate">{act.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-surface-soft/40 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[9px] bg-surface border border-border rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 text-[9px] bg-surface border border-border rounded">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[9px] bg-surface border border-border rounded">↵</kbd>
              Select
            </span>
          </div>
          <span className="font-semibold text-primary">CampusOS Command Center</span>
        </div>
      </div>
    </div>
  );
};

