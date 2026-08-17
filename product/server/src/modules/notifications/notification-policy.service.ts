import { prisma } from '../../lib/prisma';
import type { DomainEvent } from './domain-events.types';

export class NotificationPolicyService {
  private static recentEventHashes = new Map<string, number>();

  /**
   * Checks if an event is mandatory (e.g. emergencies, exam timetables, critical alerts).
   */
  public static isMandatoryEvent(event: DomainEvent): boolean {
    const criticalTypes = [
      'EMERGENCY_ALERT',
      'SECURITY_ALERT',
      'CAMPUS_ANNOUNCEMENT',
      'EXAM_TIMETABLE_PUBLISHED',
      'HALL_ALLOCATION_PUBLISHED',
      'ATTENDANCE_SHORTAGE',
    ];
    return event.priority === 'CRITICAL' || criticalTypes.includes(event.eventType);
  }

  /**
   * Anti-spam / Idempotency check:
   * Returns true if a duplicate event was already processed within the cooldown window (10s).
   */
  public static isDuplicateOrSpam(event: DomainEvent, recipientId: string): boolean {
    const key = `${event.eventType}:${event.entityId}:${recipientId}`;
    const now = Date.now();
    const lastTime = this.recentEventHashes.get(key);

    if (lastTime && now - lastTime < 10_000) {
      return true; // Throttle duplicate alert
    }

    this.recentEventHashes.set(key, now);

    // Housekeeping: clean entries older than 60s
    if (this.recentEventHashes.size > 5000) {
      for (const [k, time] of this.recentEventHashes.entries()) {
        if (now - time > 60_000) this.recentEventHashes.delete(k);
      }
    }

    return false;
  }

  /**
   * Resolves effective delivery channels for a specific user and event.
   */
  public static async resolveChannelsForUser(
    recipientId: string,
    event: DomainEvent
  ): Promise<{ inApp: boolean; push: boolean; email: boolean }> {
    const isMandatory = this.isMandatoryEvent(event);

    if (isMandatory) {
      return { inApp: true, push: true, email: true };
    }

    try {
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId: recipientId },
      });

      return {
        inApp: !pref || pref.inAppEnabled,
        push: !pref || pref.pushEnabled,
        email: !!pref?.emailEnabled,
      };
    } catch {
      return { inApp: true, push: true, email: false };
    }
  }
}
