import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export interface RealtimeSyncOptions {
  intervalMs?: number;
  enabled?: boolean;
  onData?: (data: any) => void;
}

export function useRealtimeSync<T = any>(
  key: string[],
  endpoint: string,
  options: RealtimeSyncOptions = {}
) {
  const { user } = useAuth();
  const { intervalMs = 10000, enabled = true, onData } = options;
  const queryClient = useQueryClient();

  const query = useQuery<T>({
    queryKey: [...key, user?.id || 'anonymous'],
    queryFn: async () => {
      const res = await api.get(endpoint);
      return res.data?.data || res.data;
    },
    refetchInterval: enabled ? intervalMs : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: Math.min(intervalMs / 2, 5000),
    enabled: !!user && enabled,
  });

  useEffect(() => {
    if (query.data && onData) {
      onData(query.data);
    }
  }, [query.data, onData]);

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient, key]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
