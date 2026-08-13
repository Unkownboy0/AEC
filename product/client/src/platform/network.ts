import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import type { NetworkStatusInfo } from './platform.types';

export async function getNetworkStatus(): Promise<NetworkStatusInfo> {
  if (Capacitor.isNativePlatform()) {
    const status: ConnectionStatus = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType as any,
    };
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return {
    connected: isOnline,
    connectionType: isOnline ? 'wifi' : 'none',
  };
}

export function listenNetworkStatus(callback: (status: NetworkStatusInfo) => void) {
  if (Capacitor.isNativePlatform()) {
    const listener = Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType as any,
      });
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }

  const handleOnline = () => callback({ connected: true, connectionType: 'wifi' });
  const handleOffline = () => callback({ connected: false, connectionType: 'none' });

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
