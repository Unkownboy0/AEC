import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export type CircularEventType =
  | 'circular.created'
  | 'circular.published'
  | 'circular.updated'
  | 'circular.archived'
  | 'circular.recipient.created'
  | 'circular.read'
  | 'circular.acknowledged'
  | 'notification.created';

class CircularEventBus extends EventEmitter {
  emit(event: CircularEventType, payload: any): boolean {
    logger.info(`[CircularEvent] ${event}`, { circularId: payload?.id ?? payload?.circularId });
    return super.emit(event, payload);
  }
}

export const circularEvents = new CircularEventBus();
circularEvents.setMaxListeners(50);

/**
 * Convenience helpers to emit events.
 */
export const CircularEvents = {
  created: (circular: any) => circularEvents.emit('circular.created', circular),
  published: (circular: any) => circularEvents.emit('circular.published', circular),
  updated: (circular: any) => circularEvents.emit('circular.updated', circular),
  archived: (circular: any) => circularEvents.emit('circular.archived', circular),
  recipientCreated: (payload: any) => circularEvents.emit('circular.recipient.created', payload),
  read: (payload: { circularId: string; userId: string }) => circularEvents.emit('circular.read', payload),
  acknowledged: (payload: { circularId: string; userId: string }) => circularEvents.emit('circular.acknowledged', payload),
  notificationCreated: (payload: any) => circularEvents.emit('notification.created', payload),
};
