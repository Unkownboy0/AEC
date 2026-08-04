import { useState, useEffect, useCallback } from 'react';
import { PrincipalAvailabilityContext, ApprovalRequestItem } from '../types/availability.types';
import { availabilityApi } from '../api/availability.api';

export const useActingPrincipalContext = () => {
  const [context, setContext] = useState<PrincipalAvailabilityContext | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequestItem[]>([]);
  const [processedRequests, setProcessedRequests] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDelegatedQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await availabilityApi.getVpDelegatedQueue();
      setContext(data.context);
      setPendingRequests(data.pendingRequests || []);
      setProcessedRequests(data.processedRequests || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch VP delegated approval queue:', err);
      setError(err?.response?.data?.error || err.message || 'Access restricted');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRequest = async (assignmentId: string, remarks?: string) => {
    await availabilityApi.approveDelegatedRequest(assignmentId, remarks);
    await fetchDelegatedQueue();
  };

  const rejectRequest = async (assignmentId: string, remarks?: string) => {
    await availabilityApi.rejectDelegatedRequest(assignmentId, remarks);
    await fetchDelegatedQueue();
  };

  useEffect(() => {
    fetchDelegatedQueue();
    const interval = setInterval(fetchDelegatedQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchDelegatedQueue]);

  return {
    context,
    pendingRequests,
    processedRequests,
    loading,
    error,
    refreshQueue: fetchDelegatedQueue,
    approveRequest,
    rejectRequest,
  };
};
