/*
  CAMPUSOS RECONNECT MANAGER — Handles socket reconnection & window focus/network recovery
*/

import { isNativePlatform } from '../platform/platform';
import { listenAppLifecycle } from '../platform/lifecycle';
import { listenNetworkStatus } from '../platform/network';

export class ReconnectManager {
  private reconnectCallback: () => void;
  private isListening = false;
  private removeLifecycle = () => {};
  private removeNetwork = () => {};

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
      this.removeLifecycle = listenAppLifecycle(this.reconnectCallback);
      this.removeNetwork = listenNetworkStatus((status) => {
        if (status.connected) this.reconnectCallback();
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
    this.removeLifecycle();
    this.removeNetwork();
    this.removeLifecycle = () => {};
    this.removeNetwork = () => {};
    this.isListening = false;
  }
}
