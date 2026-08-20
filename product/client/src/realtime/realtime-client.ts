/* CampusOS authenticated Server-Sent Events invalidation client. */

import type { RealtimeConnectionStatus, RealtimeEventPayload } from './realtime.types';
import { env } from '../shared/config/environment';

type Listener = (event: RealtimeEventPayload) => void;
type StatusListener = (status: RealtimeConnectionStatus) => void;

export class RealtimeClient {
  private controller: AbortController | null = null;
  private status: RealtimeConnectionStatus = 'disconnected';
  private eventListeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private token: string | null = null;
  private activeRole: string | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;
  private intentionallyDisconnected = true;
  private lastEventId = '';

  public connect(token: string, activeRole?: string) {
    if (!token || this.controller) return;
    this.token = token;
    this.activeRole = activeRole || null;
    this.intentionallyDisconnected = false;
    void this.openStream();
  }

  private async openStream() {
    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    this.controller = new AbortController();
    try {
      const response = await fetch(`${env.apiUrl.replace(/\/$/, '')}/rbac/stream`, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${this.token}`,
          ...(this.activeRole ? { 'X-Active-Role': this.activeRole } : {}),
          ...(this.lastEventId ? { 'Last-Event-ID': this.lastEventId } : {}),
        },
        cache: 'no-store',
        signal: this.controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`SSE connection rejected (${response.status})`);
      this.reconnectAttempt = 0;
      this.setStatus('connected');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!this.intentionallyDisconnected) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() || '';
        for (const frame of frames) this.handleFrame(frame);
      }
    } catch (error) {
      if (!this.intentionallyDisconnected && (error as Error)?.name !== 'AbortError') this.setStatus('error');
    } finally {
      this.controller = null;
      if (!this.intentionallyDisconnected) this.scheduleReconnect();
    }
  }

  private handleFrame(frame: string) {
    if (!frame || frame.startsWith(':')) return;
    const dataLines: string[] = [];
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('id:')) this.lastEventId = line.slice(3).trim();
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length === 0) return;
    try {
      const raw = JSON.parse(dataLines.join('\n'));
      if (raw.type === 'CONNECTED') return;
      const event: RealtimeEventPayload = { ...raw, eventId: raw.eventId || this.lastEventId || undefined, eventType: raw.eventType || raw.type };
      this.eventListeners.forEach((listener) => listener(event));
    } catch {
      // Invalid frames are ignored; the authenticated stream remains connected.
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectAttempt += 1;
    const delay = Math.min(60_000, 1_000 * 2 ** Math.min(this.reconnectAttempt, 6)) + Math.floor(Math.random() * 500);
    this.setStatus('reconnecting');
    this.reconnectTimer = window.setTimeout(() => void this.openStream(), delay);
  }

  public disconnect() {
    this.intentionallyDisconnected = true;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.controller?.abort();
    this.controller = null;
    this.setStatus('disconnected');
  }

  public subscribe(fn: Listener) { this.eventListeners.add(fn); return () => { this.eventListeners.delete(fn); }; }
  public onStatusChange(fn: StatusListener) { this.statusListeners.add(fn); fn(this.status); return () => { this.statusListeners.delete(fn); }; }
  private setStatus(status: RealtimeConnectionStatus) { this.status = status; this.statusListeners.forEach((fn) => fn(status)); }
  public getStatus() { return this.status; }
}

export const realtimeClient = new RealtimeClient();
