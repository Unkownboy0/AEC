import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeClient } from './realtime-client';
import { EventRegistry } from './event-registry';
import { ReconnectManager } from './reconnect-manager';
import type { RealtimeConnectionStatus } from './realtime.types';
import { useAuth } from '../context/AuthContext';

import { getStoredAccessToken } from '../auth/token-storage';

interface RealtimeContextValue {
  status: RealtimeConnectionStatus;
  reconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'disconnected',
  reconnect: () => { },
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');

  useEffect(() => {
    const statusUnsub = realtimeClient.onStatusChange(setStatus);
    return () => {
      statusUnsub();
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let eventUnsub: (() => void) | undefined;
    let reconnectManager: ReconnectManager | undefined;

    async function initRealtime() {
      if (!isAuthenticated) {
        realtimeClient.disconnect();
        return;
      }

      const token = await getStoredAccessToken();
      if (isCancelled || !token) {
        realtimeClient.disconnect();
        return;
      }

      const eventRegistry = new EventRegistry(queryClient);
      realtimeClient.connect(token);

      eventUnsub = realtimeClient.subscribe((event) => {
        eventRegistry.handleEvent(event);
      });

      reconnectManager = new ReconnectManager(async () => {
        const latestToken = await getStoredAccessToken();
        if (latestToken) realtimeClient.connect(latestToken);
      });
      reconnectManager.init();
    }

    initRealtime();

    return () => {
      isCancelled = true;
      if (eventUnsub) eventUnsub();
      if (reconnectManager) reconnectManager.destroy();
    };
  }, [isAuthenticated, queryClient]);

  const handleManualReconnect = async () => {
    const token = await getStoredAccessToken();
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
