import { prisma } from '../../lib/prisma';
import type { DomainEvent } from './domain-events.types';

export class NotificationPolicyService {
  private static recentEventHashes = new Map<string, number>();

  /**
   * Checks if an event is critical/mandatory (e.g. emergencies, security alerts, exam timetables).
   * CRITICAL events override quiet hours and user opt-outs.
   */
  public static isMandatoryEvent(event: DomainEvent): boolean {
    const criticalTypes = [
      'EMERGENCY_ALERT',
      'SECURITY_ALERT',
      'CAMPUS_ANNOUNCEMENT',
      'EXAM_TIMETABLE_PUBLISHED',
      'HALL_ALLOCATION_PUBLISHED',
      'ATTENDANCE_SHORTAGE',
      'HOSTEL_EMERGENCY',
      'BUS_BREAKDOWN_ALERT',
      'MAJOR_INCIDENT_ALERT',
    ];
    return event.priority === 'CRITICAL' || criticalTypes.includes(event.eventType);
  }

  /**
   * Checks if an event requires immediate action from the recipient
   * (e.g. leave approvals, task assignments, payment due, substitution).
   * Action-required items are NEVER silenced into daily digests.
   */
  public static isActionRequiredEvent(event: DomainEvent): boolean {
    const actionTypes = [
      'LEAVE_SUBMITTED',
      'LEAVE_REQUESTED',
      'OD_SUBMITTED',
      'OD_REQUESTED',
      'STUDENT_LEAVE_SUBMITTED',
      'STUDENT_OD_SUBMITTED',
      'FACULTY_LEAVE_SUBMITTED',
      'FACULTY_OD_SUBMITTED',
      'FACULTY_LEAVE_RECOMMENDED',
      'FACULTY_OD_RECOMMENDED',
      'HOD_LEAVE_SUBMITTED',
      'TASK_ASSIGNED',
      'HOD_TASK_ASSIGNED',
      'DEAN_TASK_ASSIGNED',
      'PAYMENT_ACTION_REQUIRED',
      'FEE_REFUND_REQUESTED',
      'SUBSTITUTE_REQUIRED',
      'REFUND_APPROVAL_REQUIRED',
      'HOSTEL_OUTING_REQUEST',
    ];
    return event.priority === 'ACTION_REQUIRED' || event.priority === 'HIGH' || actionTypes.includes(event.eventType);
  }

  /**
   * Anti-spam / Idempotency check:
   * Uses dedupe key concept: eventId + recipientUserId + notificationPurpose
   * Prevents sending duplicate notifications when a user holds multiple roles for one event.
   */
  public static isDuplicateOrSpam(event: DomainEvent, recipientId: string): boolean {
    const purpose = event.workspaceContext || event.entityType || 'GENERAL';
    const eventId = event.eventId || event.entityId || 'no-id';
    const key = `${eventId}:${recipientId}:${purpose}:${event.eventType}`;
    const now = Date.now();
    const lastTime = this.recentEventHashes.get(key);

    if (lastTime && now - lastTime < 15_000) {
      return true; // Throttle duplicate notification for same recipient and purpose
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
   * Checks if current time falls inside quiet hours (default: 22:00 to 07:00).
   */
  public static isInQuietHours(quietStartHour = 22, quietEndHour = 7): boolean {
    const currentHour = new Date().getHours();
    if (quietStartHour > quietEndHour) {
      return currentHour >= quietStartHour || currentHour < quietEndHour;
    }
    return currentHour >= quietStartHour && currentHour < quietEndHour;
  }

  /**
   * Resolves effective delivery channels for a specific user and event.
   * Enforces Quiet-Hours policies: NORMAL priority notifications suppress PUSH during quiet hours.
   * Critical alerts and Action-Required events override quiet hours.
   */
  public static async resolveChannelsForUser(
    recipientId: string,
    event: DomainEvent
  ): Promise<{ inApp: boolean; push: boolean; email: boolean; isDigestOnly?: boolean }> {
    const isMandatory = this.isMandatoryEvent(event);
    const isActionRequired = this.isActionRequiredEvent(event);

    if (isMandatory) {
      return { inApp: true, push: true, email: true };
    }

    try {
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId: recipientId },
      });

      const inAppAllowed = !pref || pref.inAppEnabled;
      let pushAllowed = !pref || pref.pushEnabled;
      const emailAllowed = !!pref?.emailEnabled;

      // Quiet hours check for NORMAL / LOW priority non-actionable notifications
      if (!isActionRequired && event.priority !== 'HIGH' && this.isInQuietHours()) {
        pushAllowed = false; // Suppress push during quiet hours for non-urgent items
      }

      return {
        inApp: inAppAllowed,
        push: pushAllowed,
        email: emailAllowed,
        isDigestOnly: !isActionRequired && event.priority === 'LOW' && this.isInQuietHours(),
      };
    } catch {
      return { inApp: true, push: !this.isInQuietHours(), email: false };
    }
  }
}

