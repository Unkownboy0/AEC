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
      color: 'amber',
      border: 'border-amber-500/30',
      activeBg: 'bg-amber-500/10',
      text: 'text-amber-400',
    },
    {
      id: 'APPROVED',
      title: 'Approved Today',
      helper: 'Processed successfully',
      count: summary.approvedTodayCount,
      icon: CheckCircle2,
      color: 'emerald',
      border: 'border-emerald-500/30',
      activeBg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
    },
    {
      id: 'REJECTED',
      title: 'Rejected Today',
      helper: 'Declined applications',
      count: summary.rejectedTodayCount,
      icon: XCircle,
      color: 'rose',
      border: 'border-rose-500/30',
      activeBg: 'bg-rose-500/10',
      text: 'text-rose-400',
    },
    {
      id: 'RETURNED',
      title: 'Returned to Me',
      helper: 'Transferred back from VP',
      count: summary.returnedCount,
      icon: RotateCcw,
      color: 'indigo',
      border: 'border-indigo-500/30',
      activeBg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
    },
    {
      id: 'URGENT',
      title: 'Urgent Requests',
      helper: 'Requires immediate action',
      count: summary.urgentCount,
      icon: AlertTriangle,
      color: 'purple',
      border: 'border-purple-500/30',
      activeBg: 'bg-purple-500/10',
      text: 'text-purple-400',
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
            onClick={() => onSelectFilter && onSelectFilter(card.id)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 shadow-md flex flex-col justify-between ${
              isSelected
                ? `${card.activeBg} ${card.border} ring-2 ring-slate-700`
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-300">{card.title}</span>
              <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${card.text}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={`text-2xl font-black ${card.text}`}>{card.count}</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5 line-clamp-1">
                {card.helper}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
