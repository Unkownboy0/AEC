import React, { useState } from 'react';
import {
  ApprovalViewModel,
  ApprovalActionDef,
  ApprovalFilterState,
} from './ApprovalTypes';
import { ApprovalCard } from './ApprovalCard';
import { ApprovalEmptyState, ApprovalSkeleton } from './ApprovalEmptyState';
import { ApprovalActionModal } from './ApprovalActionModal';
import { RefreshCw, Search, Filter, Layers } from 'lucide-react';

export interface ApprovalSummaryMetric {
  id: string;
  label: string;
  count: number;
  variant?: 'blue' | 'red' | 'emerald' | 'purple' | 'amber' | 'sky' | 'default';
  tabTarget?: string;
}

interface ApprovalInboxProps {
  title: string;
  description?: string;
  metrics?: ApprovalSummaryMetric[];
  requests: ApprovalViewModel[];
  loading?: boolean;
  onRefresh?: () => void;
  onRequestClick: (request: ApprovalViewModel) => void;
  onQuickAction?: (action: ApprovalActionDef, request: ApprovalViewModel, remarks: string) => Promise<void> | void;
  isSubmittingAction?: boolean;
  tabs?: Array<{ key: string; label: string; count?: number }>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  requestTypeOptions?: Array<{ value: string; label: string }>;
  selectedType?: string;
  onTypeChange?: (type: string) => void;
  className?: string;
}

export const ApprovalInbox: React.FC<ApprovalInboxProps> = ({
  title,
  description,
  metrics,
  requests,
  loading = false,
  onRefresh,
  onRequestClick,
  onQuickAction,
  isSubmittingAction = false,
  tabs = [
    { key: 'PENDING', label: 'Pending Review' },
    { key: 'EMERGENCY', label: 'Emergency' },
    { key: 'RECOMMENDED', label: 'Recommended' },
    { key: 'RETURNED', label: 'Returned' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'ALL', label: 'All Requests' },
  ],
  activeTab = 'PENDING',
  onTabChange,
  requestTypeOptions,
  selectedType = 'ALL',
  onTypeChange,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalTab, setInternalTab] = useState(activeTab);
  const currentTab = onTabChange ? activeTab : internalTab;

  // Quick Action Modal State
  const [activeModal, setActiveModal] = useState<{
    actionDef: ApprovalActionDef;
    request: ApprovalViewModel;
  } | null>(null);

  const handleTabSelect = (key: string) => {
    if (onTabChange) {
      onTabChange(key);
    } else {
      setInternalTab(key);
    }
  };

  // Filter requests
  const filtered = requests.filter((r) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.requester?.name || '').toLowerCase().includes(q);
      const matchAdm = (r.requester?.admissionNo || '').toLowerCase().includes(q);
      const matchEmp = (r.requester?.employeeId || '').toLowerCase().includes(q);
      const matchReqNo = (r.requestNumber || r.id).toLowerCase().includes(q);
      const matchTitle = (r.title || '').toLowerCase().includes(q);
      if (!matchName && !matchAdm && !matchEmp && !matchReqNo && !matchTitle) return false;
    }

    // Type filter
    if (selectedType && selectedType !== 'ALL') {
      if (r.requestType !== selectedType && r.typeBadgeLabel !== selectedType) return false;
    }

    // If parent handles tab filtering via API, skip local tab filtering
    if (onTabChange) return true;

    // Local tab filtering fallback
    const status = (r.status || '').toUpperCase();
    if (currentTab === 'PENDING') {
      return status.includes('PENDING') || status === 'SUBMITTED' || status === 'IN_REVIEW';
    }
    if (currentTab === 'EMERGENCY') {
      return (
        (status.includes('PENDING') || status === 'SUBMITTED') &&
        (r.isEmergency || r.priority === 'EMERGENCY')
      );
    }
    if (currentTab === 'RECOMMENDED') {
      return status.includes('RECOMMENDED') || status.includes('FORWARDED');
    }
    if (currentTab === 'RETURNED') {
      return status.includes('RETURN') || status === 'NEEDS_INFORMATION';
    }
    if (currentTab === 'REJECTED') {
      return status.includes('REJECT') || status === 'CANCELLED';
    }
    if (currentTab === 'APPROVED') {
      return status.includes('APPROVED') || status === 'COMPLETED';
    }
    return true;
  });

  const getMetricVariantStyles = (variant?: string, isSelected?: boolean) => {
    if (isSelected) {
      if (variant === 'red') return 'bg-red-600 text-white border-red-600 shadow-md';
      return 'bg-blue-600 text-white border-blue-600 shadow-md';
    }

    switch (variant) {
      case 'red':
        return 'bg-white dark:bg-gray-900 text-red-600 border-red-100 dark:border-red-900/40';
      case 'emerald':
        return 'bg-white dark:bg-gray-900 text-emerald-600 border-gray-100 dark:border-gray-800';
      case 'purple':
        return 'bg-white dark:bg-gray-900 text-purple-600 border-gray-100 dark:border-gray-800';
      case 'amber':
        return 'bg-white dark:bg-gray-900 text-amber-600 border-gray-100 dark:border-gray-800';
      default:
        return 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-100 dark:border-gray-800';
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            title="Refresh inbox"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Summary Cards Grid */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((m) => {
            const isSelected = Boolean(m.tabTarget && m.tabTarget === currentTab);
            return (
              <div
                key={m.id}
                onClick={() => m.tabTarget && handleTabSelect(m.tabTarget)}
                className={`p-4 rounded-2xl border transition-all ${
                  m.tabTarget ? 'cursor-pointer hover:shadow-sm' : ''
                } ${getMetricVariantStyles(m.variant, isSelected)}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{m.label}</p>
                <p className="text-2xl font-black mt-1">{m.count}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs & Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabSelect(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1.5 opacity-70 text-[10px]">({tab.count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Type Filter if options provided */}
          {requestTypeOptions && onTypeChange && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                {requestTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student/faculty name, register number, employee ID, request ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Requests Queue */}
      <div className="space-y-3.5">
        {loading ? (
          <ApprovalSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <ApprovalEmptyState
            title="No requests found"
            description={`No approval requests match the current tab filter (${currentTab}) or search criteria.`}
          />
        ) : (
          filtered.map((req) => (
            <ApprovalCard
              key={req.id}
              request={req}
              onClick={() => onRequestClick(req)}
              onQuickAction={
                onQuickAction
                  ? (act) => setActiveModal({ actionDef: act, request: req })
                  : undefined
              }
            />
          ))
        )}
      </div>

      {/* Quick Action Modal */}
      {activeModal && (
        <ApprovalActionModal
          isOpen={Boolean(activeModal)}
          onClose={() => setActiveModal(null)}
          actionDef={activeModal.actionDef}
          request={activeModal.request}
          isSubmitting={isSubmittingAction}
          onConfirm={async (act, remarks) => {
            if (onQuickAction) {
              await onQuickAction(act, activeModal.request, remarks);
            }
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
};
