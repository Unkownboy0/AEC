import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeClient } from './realtime-client';
import { EventRegistry } from './event-registry';
import { ReconnectManager } from './reconnect-manager';
import type { RealtimeConnectionStatus } from './realtime.types';
import { useAuth } from '../context/AuthContext';

interface RealtimeContextValue {
  status: RealtimeConnectionStatus;
  reconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'disconnected',
  reconnect: () => {},
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('geetorus_access_token') : null;
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');

  useEffect(() => {
    const statusUnsub = realtimeClient.onStatusChange(setStatus);
    return () => {
      statusUnsub();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      realtimeClient.disconnect();
      return;
    }

    const eventRegistry = new EventRegistry(queryClient);

    realtimeClient.connect(token);

    const eventUnsub = realtimeClient.subscribe((event) => {
      eventRegistry.handleEvent(event);
    });

    const reconnectManager = new ReconnectManager(() => {
      if (token) realtimeClient.connect(token);
    });
    reconnectManager.init();

    return () => {
      eventUnsub();
      reconnectManager.destroy();
    };
  }, [isAuthenticated, token, queryClient]);

  const handleManualReconnect = () => {
    if (token) {
      realtimeClient.disconnect();
      realtimeClient.connect(token);
    }
  };

  return (
    <RealtimeContext.Provider value={{ status, reconnect: handleManualReconnect }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
