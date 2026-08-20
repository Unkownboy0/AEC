import { useState, useEffect } from 'react';
import { getNetworkStatus, listenNetworkStatus } from '../platform/network';
import type { NetworkStatusInfo } from '../platform/platform.types';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatusInfo>({
    connected: true,
    connectionType: 'wifi',
  });

  useEffect(() => {
    // Initial fetch
    getNetworkStatus().then(setStatus).catch(() => {});

    // Live listener
    return listenNetworkStatus(setStatus);
  }, []);

  return {
    isOnline: status.connected,
    connectionType: status.connectionType,
  };
};
