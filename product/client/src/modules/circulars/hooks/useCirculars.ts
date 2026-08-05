import { useState, useEffect, useCallback } from 'react';
import { Circular } from '../types/circular.types';
import { fetchCirculars, acknowledgeCircular as apiAcknowledge } from '../api/circularApi';

export function useCirculars() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCirculars();
      setCirculars(data);
      setUnreadCount(data.filter(c => !c.isRead).length);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to load circulars');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const acknowledge = useCallback(async (id: string) => {
    try {
      await apiAcknowledge(id);
      setCirculars(prev =>
        prev.map(c => c.id === id ? { ...c, isAcknowledged: true, userAcknowledgedAt: new Date().toISOString() } : c)
      );
    } catch (err: any) {
      console.error('Acknowledge failed:', err);
    }
  }, []);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { circulars, loading, error, unreadCount, refresh, acknowledge };
}
