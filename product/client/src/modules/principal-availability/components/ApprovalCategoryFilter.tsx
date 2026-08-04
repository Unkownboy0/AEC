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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
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
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              {countVal !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
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
          className="w-full md:w-48 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold focus:outline-none focus:border-amber-500"
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
