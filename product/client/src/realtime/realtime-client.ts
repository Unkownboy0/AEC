/*
  CAMPUSOS REALTIME CLIENT — Universal WebSocket / SSE client
*/

import type { RealtimeConnectionStatus, RealtimeEventPayload } from './realtime.types';
import { env } from '../shared/config/environment';

type Listener = (event: RealtimeEventPayload) => void;
type StatusListener = (status: RealtimeConnectionStatus) => void;

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private status: RealtimeConnectionStatus = 'disconnected';
  private eventListeners: Set<Listener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private token: string | null = null;
  private reconnectTimer: number | null = null;

  public connect(token: string) {
    if (!token) return;
    this.token = token;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');
    try {
      let baseOrigin = env.socketUrl;
      let wsProtocol = 'ws:';

      if (baseOrigin.startsWith('https://')) {
        wsProtocol = 'wss:';
        baseOrigin = baseOrigin.replace('https://', '');
      } else if (baseOrigin.startsWith('http://')) {
        wsProtocol = 'ws:';
        baseOrigin = baseOrigin.replace('http://', '');
      }

      const wsUrl = `${wsProtocol}//${baseOrigin}/api/v1/realtime/ws?token=${encodeURIComponent(token)}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.setStatus('connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const data: RealtimeEventPayload = JSON.parse(event.data);
          this.eventListeners.forEach((fn) => fn(data));
        } catch {
          // ignore non-json ping/pong frames
        }
      };

      this.socket.onerror = () => {
        this.setStatus('error');
      };

      this.socket.onclose = () => {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };
    } catch {
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      if (this.token) {
        this.setStatus('reconnecting');
        this.connect(this.token);
      }
    }, 5000);
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  public subscribe(fn: Listener) {
    this.eventListeners.add(fn);
    return () => {
      this.eventListeners.delete(fn);
    };
  }

  public onStatusChange(fn: StatusListener) {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => {
      this.statusListeners.delete(fn);
    };
  }

  private setStatus(status: RealtimeConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  public getStatus() {
    return this.status;
  }
}

export const realtimeClient = new RealtimeClient();
