import { useState, useEffect, useCallback } from 'react';
import { PrincipalAvailabilityContext, UpdateAvailabilityDto } from '../types/availability.types';
import { availabilityApi } from '../api/availability.api';

export const usePrincipalAvailability = () => {
  const [context, setContext] = useState<PrincipalAvailabilityContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      const data = await availabilityApi.getAvailabilityContext();
      setContext(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch Principal Availability context:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (dto: UpdateAvailabilityDto) => {
    try {
      setLoading(true);
      const updated = await availabilityApi.updateAvailabilityStatus(dto);
      setContext(updated);
      setError(null);
      return updated;
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(err?.response?.data?.error || err.message || 'Status update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
    // Poll every 15 seconds for realtime state synchronization
    const interval = setInterval(fetchContext, 15000);
    return () => clearInterval(interval);
  }, [fetchContext]);

  return {
    context,
    loading,
    error,
    refreshAvailability: fetchContext,
    updateStatus,
  };
};
