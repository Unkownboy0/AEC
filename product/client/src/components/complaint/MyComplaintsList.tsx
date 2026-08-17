import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, CheckCircle2, RefreshCw, MessageSquare } from 'lucide-react';
import api from '../../lib/axios';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  resolutionRemarks?: string | null;
  assignedTo?: { firstName: string; lastName: string } | null;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

/*
  Student-scoped complaint list. Deliberately separate from
  ComplaintMonitoringCenter, which calls staff-only /complaints/analytics and
  /complaints/feed (403s for Student). This uses GET /enterprise/tickets,
  which already self-scopes to the caller's own tickets for the Student role
  server-side (enterprise.service.ts listTickets).
*/
export const MyComplaintsList: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTickets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/enterprise/tickets', { params: { pageSize: 50 } });
      setTickets(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load your complaints.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-text-muted">Loading your complaints…</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
        <p className="mt-2 text-xs text-text-muted">{error}</p>
        <button onClick={fetchTickets} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-surface p-10 text-center">
        <MessageSquare className="mx-auto h-6 w-6 text-text-muted" />
        <p className="mt-2 text-xs text-text-muted">You haven't filed any complaints yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <div key={t.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-text-primary truncate">{t.title}</h4>
              <p className="mt-1 text-xs text-text-muted line-clamp-2">{t.description}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${STATUS_STYLE[t.status] || STATUS_STYLE.OPEN}`}>
              {t.status.replace('_', ' ')}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-text-muted">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
            <span>{t.category}</span>
            <span>{t.priority} priority</span>
            {t.assignedTo && <span>Assigned: {t.assignedTo.firstName} {t.assignedTo.lastName}</span>}
          </div>
          {t.resolutionRemarks && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-soft p-3 text-xs text-text-secondary">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span>{t.resolutionRemarks}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyComplaintsList;
