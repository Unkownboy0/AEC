import { DomainEvent } from './domain-events.types';
import { logger } from '../../utils/logger';

export interface OutboxEntry {
  id: string;
  event: DomainEvent;
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
  processedAt?: Date;
}

export class NotificationOutboxService {
  private static queue: OutboxEntry[] = [];
  private static isProcessing = false;

  /**
   * Enqueue a domain event to be dispatched safely after database transactions commit.
   */
  public static enqueue(event: DomainEvent): void {
    const entry: OutboxEntry = {
      id: event.eventId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      event: { ...event, eventId: event.eventId || `evt-${Date.now()}` },
      status: 'PENDING',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
    };

    this.queue.push(entry);

    // Schedule post-commit dispatch on next tick
    setImmediate(() => {
      this.processQueue().catch((err) => {
        logger.error('[NotificationOutbox] Background worker error:', err);
      });
    });
  }

  /**
   * Process pending items in the outbox queue.
   */
  private static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) break;

        item.status = 'PROCESSING';
        try {
          const { NotificationService } = await import('./notification.service');
          await NotificationService.executeDispatch(item.event);
          item.status = 'DELIVERED';
          item.processedAt = new Date();
        } catch (err: any) {
          item.retryCount += 1;
          item.lastError = err?.message || String(err);
          if (item.retryCount < item.maxRetries) {
            item.status = 'PENDING';
            // Re-queue with exponential backoff delay
            setTimeout(() => {
              this.queue.push(item);
              this.processQueue().catch(() => {});
            }, item.retryCount * 2000);
          } else {
            item.status = 'FAILED';
            logger.error(`[NotificationOutbox] Permanent delivery failure for event ${item.id}:`, err);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Direct post-commit trigger without waiting for next cron interval.
   */
  public static trigger(event: DomainEvent): void {
    this.enqueue(event);
  }
}
