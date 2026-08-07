import React from 'react';
import { Clock, CheckCircle2, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';

interface SummaryCounts {
  pendingCount: number;
  approvedTodayCount: number;
  rejectedTodayCount: number;
  returnedCount: number;
  urgentCount: number;
}

interface ApprovalSummaryCardsProps {
  summary: SummaryCounts;
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export const ApprovalSummaryCards: React.FC<ApprovalSummaryCardsProps> = ({
  summary,
  activeFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: 'PENDING',
      title: 'Pending Approvals',
      helper: 'Needs your attention',
      count: summary.pendingCount,
      icon: Clock,
      border: 'border-amber-500/40',
      activeBg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'APPROVED',
      title: 'Approved Today',
      helper: 'Processed successfully',
      count: summary.approvedTodayCount,
      icon: CheckCircle2,
      border: 'border-emerald-500/40',
      activeBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'REJECTED',
      title: 'Rejected Today',
      helper: 'Declined applications',
      count: summary.rejectedTodayCount,
      icon: XCircle,
      border: 'border-rose-500/40',
      activeBg: 'bg-rose-50 dark:bg-rose-950/30',
      text: 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'RETURNED',
      title: 'Returned to Me',
      helper: 'Transferred back from VP',
      count: summary.returnedCount,
      icon: RotateCcw,
      border: 'border-indigo-500/40',
      activeBg: 'bg-indigo-50 dark:bg-indigo-950/30',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'URGENT',
      title: 'Urgent Requests',
      helper: 'Requires immediate action',
      count: summary.urgentCount,
      icon: AlertTriangle,
      border: 'border-purple-500/40',
      activeBg: 'bg-purple-50 dark:bg-purple-950/30',
      text: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(card.id)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 shadow-xs flex flex-col justify-between ${
              isSelected
                ? `${card.activeBg} ${card.border} ring-2 ring-primary/40`
                : 'bg-surface border-border hover:border-primary/40 hover:bg-surface-soft'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-primary">{card.title}</span>
              <div className={`p-2 rounded-xl bg-surface-soft border border-border/60 ${card.text}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={`text-2xl font-black ${card.text}`}>{card.count}</div>
              <div className="text-[11px] font-medium text-text-muted mt-0.5 line-clamp-1">
                {card.helper}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
