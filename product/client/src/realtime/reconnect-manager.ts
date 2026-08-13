/*
  CAMPUSOS RECONNECT MANAGER — Handles socket reconnection & window focus/network recovery
*/

import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { isNativePlatform } from '../platform/platform';

export class ReconnectManager {
  private reconnectCallback: () => void;
  private isListening = false;

  constructor(onReconnect: () => void) {
    this.reconnectCallback = onReconnect;
  }

  public init() {
    if (this.isListening) return;
    this.isListening = true;

    // Window focus recovery
    window.addEventListener('online', this.handleNetworkOnline);
    window.addEventListener('focus', this.handleWindowFocus);

    // Capacitor Native app state listeners
    if (isNativePlatform()) {
      App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          this.reconnectCallback();
        }
      });

      Network.addListener('networkStatusChange', (status) => {
        if (status.connected) {
          this.reconnectCallback();
        }
      });
    }
  }

  private handleNetworkOnline = () => {
    this.reconnectCallback();
  };

  private handleWindowFocus = () => {
    this.reconnectCallback();
  };

  public destroy() {
    window.removeEventListener('online', this.handleNetworkOnline);
    window.removeEventListener('focus', this.handleWindowFocus);
    this.isListening = false;
  }
}
