/*
  CAMPUSOS EVENT REGISTRY — Central realtime event handler
*/

import type { QueryClient } from '@tanstack/react-query';
import { eventToQueryKeyMap } from './query-invalidation-map';
import type { RealtimeEventPayload } from './realtime.types';

export class EventRegistry {
  private queryClient: QueryClient;
  private processedEvents = new Set<string>();

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  public handleEvent(event: RealtimeEventPayload) {
    if (!event || !event.eventType) return;

    // Deduplication check by eventId if provided
    if (event.eventId) {
      if (this.processedEvents.has(event.eventId)) {
        return;
      }
      this.processedEvents.add(event.eventId);
      // Keep set bounded to max 200 items
      if (this.processedEvents.size > 200) {
        const first = this.processedEvents.values().next().value;
        if (first) this.processedEvents.delete(first);
      }
    }

    const queryKeys = eventToQueryKeyMap[event.eventType];
    if (queryKeys && queryKeys.length > 0) {
      queryKeys.forEach((key) => {
        this.queryClient.invalidateQueries({ queryKey: key });
      });
    } else {
      // General fallback invalidation based on module
      if (event.module) {
        this.queryClient.invalidateQueries({ queryKey: [event.module] });
      }
    }
  }
}
