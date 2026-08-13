import React from 'react';

interface ApprovalCategoryFilterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  counts?: {
    pending: number;
    processed: number;
    vpHandled: number;
    returned: number;
    all: number;
  };
}

const MAIN_TABS = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'PROCESSED', label: 'Processed' },
  { id: 'VP_HANDLED', label: 'Handled by VP' },
  { id: 'RETURNED', label: 'Returned to Me' },
  { id: 'ALL', label: 'All' },
];

const CATEGORY_OPTIONS = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'FACULTY_LEAVE', label: 'Leave & OD' },
  { id: 'DOCUMENT_APPROVAL', label: 'Documents' },
  { id: 'CIRCULAR_APPROVAL', label: 'Circulars' },
  { id: 'TASK_APPROVAL', label: 'Tasks' },
  { id: 'MEETING_APPROVAL', label: 'Meetings' },
  { id: 'ADMINISTRATIVE', label: 'Administrative' },
];

export const ApprovalCategoryFilter: React.FC<ApprovalCategoryFilterProps> = ({
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  counts,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-surface p-2 rounded-2xl border border-border shadow-xs">
      {/* Main Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1">
        {MAIN_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          const countVal =
            tab.id === 'PENDING'
              ? counts?.pending
              : tab.id === 'PROCESSED'
              ? counts?.processed
              : tab.id === 'VP_HANDLED'
              ? counts?.vpHandled
              : tab.id === 'RETURNED'
              ? counts?.returned
              : counts?.all;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'
              }`}
            >
              <span>{tab.label}</span>
              {countVal !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-black/20 text-white'
                      : 'bg-surface-soft text-text-muted border border-border'
                  }`}
                >
                  {countVal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category Dropdown Filter */}
      <div className="w-full md:w-auto px-2">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full md:w-48 px-3.5 py-2 rounded-xl bg-surface-soft border border-border text-text-primary text-xs font-bold focus:outline-none focus:border-amber-500"
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
