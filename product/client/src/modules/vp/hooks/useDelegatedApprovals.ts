import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export interface DelegatedApprovalItem {
  id: string;
  requestId: string;
  requestType: string;
  title: string;
  assignedUserId: string;
  assignedRole: string;
  assignmentType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'NEEDS_INFORMATION';
  completedAt?: string | null;
  actionByUserId?: string | null;
  actionByRole?: string | null;
  actionAsRole?: string | null;
  actionRemarks?: string | null;
  createdAt: string;
  updatedAt: string;
  isUrgent?: boolean;
  category?: string;
  submittedBy?: string;
  submittedByRole?: string;
  department?: string;
  details?: any;
}

export interface QueueSummaryCounts {
  pending: number;
  urgent: number;
  approvedToday: number;
  rejectedToday: number;
  returned: number;
  expiringSoon?: number;
}

export const useDelegatedApprovals = () => {
  const [requests, setRequests] = useState<DelegatedApprovalItem[]>([]);
  const [counts, setCounts] = useState<QueueSummaryCounts>({
    pending: 0,
    urgent: 0,
    approvedToday: 0,
    rejectedToday: 0,
    returned: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/vp/acting-principal/approvals');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        const allRequests: DelegatedApprovalItem[] = data.requests || [];
        setRequests(allRequests);
        
        if (data.counts) {
          setCounts(data.counts);
        } else {
          const pending = allRequests.filter((r) => r.status === 'PENDING');
          const approvedToday = allRequests.filter((r) => r.status === 'APPROVED');
          const rejectedToday = allRequests.filter((r) => r.status === 'REJECTED');
          const returned = allRequests.filter((r) => r.status === 'RETURNED' || r.status === 'NEEDS_INFORMATION');
          const urgent = pending.filter((r) => (r.title || '').toLowerCase().includes('urgent') || r.isUrgent);

          setCounts({
            pending: pending.length,
            urgent: urgent.length,
            approvedToday: approvedToday.length,
            rejectedToday: rejectedToday.length,
            returned: returned.length,
            expiringSoon: 0,
          });
        }
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch VP delegated approvals:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);

    const handleStatusEvent = () => {
      fetchQueue();
    };
    window.addEventListener('principal_status_changed', handleStatusEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('principal_status_changed', handleStatusEvent);
    };
  }, [fetchQueue]);

  return {
    requests,
    counts,
    loading,
    error,
    refetch: fetchQueue,
  };
};
