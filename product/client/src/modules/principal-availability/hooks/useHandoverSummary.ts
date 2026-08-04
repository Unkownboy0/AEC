import { useState, useEffect, useCallback } from 'react';
import { HandoverSummary } from '../types/availability.types';
import { availabilityApi } from '../api/availability.api';

export const useHandoverSummary = () => {
  const [handover, setHandover] = useState<HandoverSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHandover = useCallback(async () => {
    try {
      setLoading(true);
      const data = await availabilityApi.getLatestHandover();
      setHandover(data);
    } catch (err) {
      console.error('Error fetching handover summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledgeHandover = async () => {
    if (!handover) return;
    try {
      await availabilityApi.acknowledgeHandover(handover.id);
      setHandover(null);
    } catch (err) {
      console.error('Error acknowledging handover:', err);
    }
  };

  useEffect(() => {
    fetchHandover();
  }, [fetchHandover]);

  return {
    handover,
    loading,
    refreshHandover: fetchHandover,
    acknowledgeHandover,
  };
};
