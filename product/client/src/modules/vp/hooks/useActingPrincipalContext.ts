import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export interface ActingPrincipalContextData {
  principalStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  delegationStatus: 'INACTIVE' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  canVpActAsPrincipal: boolean;
  delegation?: {
    id: string;
    startsAt: string;
    endsAt: string;
    reason: string;
    delegatedCategories: string[];
    permissions: string[];
  } | null;
  counts?: {
    pending: number;
    urgent: number;
    approvedToday: number;
    rejectedToday: number;
    returned: number;
  };
  permissionVersion?: number;
  serverTime?: string;
}

export const useActingPrincipalContext = () => {
  const [contextData, setContextData] = useState<ActingPrincipalContextData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/vp/acting-principal/context');
      if (res.data?.success) {
        setContextData(res.data.data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch acting principal context:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to fetch context');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();
    const interval = setInterval(fetchContext, 15000);
    return () => clearInterval(interval);
  }, [fetchContext]);

  return {
    context: contextData,
    loading,
    error,
    refreshContext: fetchContext,
  };
};
