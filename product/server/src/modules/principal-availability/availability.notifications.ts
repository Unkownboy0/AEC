import { NotificationService } from '../notifications/notification.service';
import { logger } from '../../utils/logger';

export class AvailabilityNotificationService {
  /**
   * Notify VP when Principal sets status to BUSY or OFFLINE and delegates authority
   */
  static async notifyVpDelegationStarted(params: {
    vpUserId: string;
    principalName: string;
    status: 'BUSY' | 'OFFLINE';
    endsAt: string;
    pendingCount: number;
  }) {
    const formatTime = params.endsAt
      ? new Date(params.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'until specified time';

    await NotificationService.sendNotification({
      recipientId: params.vpUserId,
      eventType: 'ACTING_PRINCIPAL_ASSIGNED',
      title: 'Acting Principal Assignment',
      message: `The Principal is ${params.status === 'BUSY' ? 'Busy' : 'Offline'}. ${params.pendingCount} pending approvals have been assigned to you until ${formatTime}.`,
      relatedEntityType: 'PRINCIPAL_DELEGATION',
      deepLinkRoute: '/vp/acting-principal/approvals',
      deliveryChannel: 'IN_APP',
    });

    logger.info(`Notified VP (${params.vpUserId}) of active delegation start`);
  }

  /**
   * Notify VP when a new approval request is delegated to them
   */
  static async notifyVpNewDelegatedRequest(params: {
    vpUserId: string;
    requestType: string;
    applicantName: string;
    requestId: string;
  }) {
    await NotificationService.sendNotification({
      recipientId: params.vpUserId,
      eventType: 'NEW_DELEGATED_APPROVAL',
      title: 'New Delegated Approval',
      message: `A ${params.requestType.replace('_', ' ')} request from ${params.applicantName} requires your action.`,
      relatedEntityType: 'APPROVAL_REQUEST',
      relatedEntityId: params.requestId,
      deepLinkRoute: '/vp/acting-principal/approvals',
      deliveryChannel: 'IN_APP',
    });
  }

  /**
   * Notify VP and Principal when Principal returns AVAILABLE
   */
  static async notifyDelegationEnded(params: {
    vpUserId: string;
    principalUserId: string;
    returnedCount: number;
    processedCount: number;
  }) {
    // Notify VP
    await NotificationService.sendNotification({
      recipientId: params.vpUserId,
      eventType: 'DELEGATION_ENDED',
      title: 'Delegation Ended',
      message: `The Principal is now Available. ${params.returnedCount} unresolved requests were returned to the Principal.`,
      relatedEntityType: 'PRINCIPAL_DELEGATION',
      deepLinkRoute: '/dashboard',
      deliveryChannel: 'IN_APP',
    });

    // Notify Principal
    await NotificationService.sendNotification({
      recipientId: params.principalUserId,
      eventType: 'HANDOVER_READY',
      title: 'Handover Ready',
      message: `Vice Principal processed ${params.processedCount} requests during your absence. ${params.returnedCount} requests need your review.`,
      relatedEntityType: 'DELEGATION_HANDOVER',
      deepLinkRoute: '/principal/approval-center',
      deliveryChannel: 'IN_APP',
    });

    logger.info(`Notified VP (${params.vpUserId}) and Principal (${params.principalUserId}) of delegation end`);
  }
}
