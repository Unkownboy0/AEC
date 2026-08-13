import { useState, useEffect, useCallback } from 'react';
import { Circular } from '../types/circular.types';
import { fetchCirculars, acknowledgeCircular as apiAcknowledge, markCircularRead, clearCircular, deleteCircular, archiveCircular } from '../api/circularApi';

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

  const markRead = useCallback(async (id: string) => {
    const target = circulars.find((c) => c.id === id);
    if (!target || target.isRead) return;
    await markCircularRead(id);
    const readAt = new Date().toISOString();
    setCirculars((prev) => prev.map((c) => c.id === id ? { ...c, isRead: true, userReadAt: readAt } : c));
    setUnreadCount((count) => Math.max(0, count - 1));
  }, [circulars]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  const clear = useCallback(async (id: string) => {
    await clearCircular(id);
    setCirculars((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target && !target.isRead) setUnreadCount((count) => Math.max(0, count - 1));
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const removeDraft = useCallback(async (id: string) => {
    await deleteCircular(id);
    setCirculars((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target && !target.isRead) setUnreadCount((count) => Math.max(0, count - 1));
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const cancelPublished = useCallback(async (id: string) => {
    await archiveCircular(id);
    setCirculars((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target && !target.isRead) setUnreadCount((count) => Math.max(0, count - 1));
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  return { circulars, loading, error, unreadCount, refresh, acknowledge, markRead, clear, removeDraft, cancelPublished };
}
