/*
  CAMPUSOS REALTIME TYPES — Central realtime event definitions
*/

export interface RealtimeEventPayload {
  eventId?: string;
  eventType: string;
  entityId?: string | number;
  module?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
}

export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface EventRegistryHandler {
  queryKeysToInvalidate: (string | unknown[])[];
  onEvent?: (payload: RealtimeEventPayload) => void;
}
