import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

export class AvailabilityEventEmitter extends EventEmitter {
  private static instance: AvailabilityEventEmitter;

  private constructor() {
    super();
  }

  public static getInstance(): AvailabilityEventEmitter {
    if (!AvailabilityEventEmitter.instance) {
      AvailabilityEventEmitter.instance = new AvailabilityEventEmitter();
    }
    return AvailabilityEventEmitter.instance;
  }

  public emitAvailabilityChanged(data: {
    principalUserId: string;
    principalStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
    delegationStatus: string;
    actingPrincipalUserId?: string | null;
    version: number;
  }) {
    logger.info(`[Realtime Event] principal.availability.changed: ${data.principalStatus}`);
    this.emit('principal.availability.changed', data);
    this.emit('permission.context.changed', data);
  }

  public emitDelegationStarted(data: {
    delegationId: string;
    principalUserId: string;
    actingUserId: string;
    endsAt: string;
  }) {
    logger.info(`[Realtime Event] principal.delegation.started: ${data.delegationId}`);
    this.emit('principal.delegation.started', data);
    this.emit('approval.queue.updated', { targetUserIds: [data.actingUserId] });
  }

  public emitDelegationEnded(data: {
    delegationId: string;
    principalUserId: string;
    actingUserId: string;
    handoverId?: string;
  }) {
    logger.info(`[Realtime Event] principal.delegation.ended: ${data.delegationId}`);
    this.emit('principal.delegation.ended', data);
    this.emit('permission.context.changed', { userId: data.actingUserId });
    this.emit('approval.queue.updated', { targetUserIds: [data.principalUserId, data.actingUserId] });
  }

  public emitHandoverGenerated(data: { handoverId: string; principalUserId: string }) {
    logger.info(`[Realtime Event] principal.handover.generated: ${data.handoverId}`);
    this.emit('principal.handover.generated', data);
  }
}

export const availabilityEvents = AvailabilityEventEmitter.getInstance();
