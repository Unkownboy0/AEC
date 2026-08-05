import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: true,
    connectionType: 'wifi',
  });

  useEffect(() => {
    // Initial fetch
    Network.getStatus().then(setStatus).catch(() => {});

    // Live listener
    const listener = Network.addListener('networkStatusChange', (newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  return {
    isOnline: status.connected,
    connectionType: status.connectionType,
  };
};
