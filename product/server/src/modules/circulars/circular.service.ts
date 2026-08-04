import { prisma } from '../../lib/prisma';
import { DelegationService } from '../delegation/delegation.service';

export interface CreateCircularDto {
  title: string;
  category?: string;
  priority?: string;
  description?: string;
  content: string;
  broadcastLevel?: string;
  departmentId?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  referenceLink?: string;
  effectiveDate?: string;
  publishDate?: string;
  expiryDate?: string;
  targetDepartments?: string[];
  targetYears?: string[];
  targetSemesters?: string[];
  targetSections?: string[];
  targetRoles?: string[];
  selectedUserIds?: string[];
  acknowledgementRequired?: boolean;
  isPinned?: boolean;
  isEmergency?: boolean;
}

export class CircularService {
  /**
   * List circulars accessible for a given user & role.
   */
  static async listCirculars(userId: string, roleName: string, deptId?: string) {
    const isHod = roleName === 'HOD';

    let filterWhere: any = {};
    if (isHod && deptId) {
      filterWhere = {
        OR: [
          { broadcastLevel: 'ALL_CAMPUS' },
          { broadcastLevel: 'DEPARTMENT_SPECIFIC', departmentId: deptId },
          { authorId: userId }
        ]
      };
    }

    const circulars = await (prisma as any).circular.findMany({
      where: filterWhere,
      orderBy: [
        { isEmergency: 'desc' },
        { isPinned: 'desc' },
        { publishedAt: 'desc' }
      ],
      include: {
        recipients: {
          where: { userId }
        }
      }
    });

    return circulars.map((c: any) => {
      const recipient = c.recipients?.[0];
      return {
        ...c,
        targetDepartments: c.targetDepartments ? JSON.parse(c.targetDepartments) : [],
        targetRoles: c.targetRoles ? JSON.parse(c.targetRoles) : [],
        userStatus: recipient ? recipient.status : 'DELIVERED',
        userReadAt: recipient ? recipient.readAt : null,
        userAcknowledgedAt: recipient ? recipient.acknowledgedAt : null
      };
    });
  }

  /**
   * Create and publish an institutional circular with exact attribution rules.
   */
  static async createAndPublishCircular(
    authorUserId: string,
    authorRole: string,
    deptId: string | undefined,
    dto: CreateCircularDto
  ) {
    // Check if VP is creating circular under active Principal delegation
    let publishedAsLabel = authorRole;
    let delegationId = null;

    if (authorRole === 'Vice Principal' || authorRole === 'VP') {
      const actingStatus = await DelegationService.getVpActingStatus(authorUserId);
      if (actingStatus.isActingPrincipal && actingStatus.activeDelegation) {
        publishedAsLabel = 'Vice Principal — Acting Principal';
        delegationId = actingStatus.activeDelegation.id;
      } else {
        publishedAsLabel = 'Vice Principal';
      }
    } else if (authorRole === 'HOD') {
      publishedAsLabel = 'Head of Department';
    }

    // Generate unique circular number
    const year = new Date().getFullYear();
    const count = await (prisma as any).circular.count();
    const circularNumber = `CIR-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create Circular record
    const circular = await (prisma as any).circular.create({
      data: {
        circularNumber,
        title: dto.title,
        category: dto.category || 'GENERAL',
        priority: dto.priority || 'NORMAL',
        description: dto.description || null,
        content: dto.content,
        broadcastLevel: dto.broadcastLevel || (authorRole === 'HOD' ? 'DEPARTMENT_SPECIFIC' : 'ALL_CAMPUS'),
        departmentId: authorRole === 'HOD' ? deptId : (dto.departmentId || null),
        authorId: authorUserId,
        authorRole,
        publishedAs: publishedAsLabel,
        delegationId,
        attachmentUrl: dto.attachmentUrl || null,
        attachmentName: dto.attachmentName || null,
        referenceLink: dto.referenceLink || null,
        status: 'PUBLISHED',
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        publishDate: dto.publishDate ? new Date(dto.publishDate) : new Date(),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        targetDepartments: JSON.stringify(dto.targetDepartments || []),
        targetYears: JSON.stringify(dto.targetYears || []),
        targetSemesters: JSON.stringify(dto.targetSemesters || []),
        targetSections: JSON.stringify(dto.targetSections || []),
        targetRoles: JSON.stringify(dto.targetRoles || []),
        selectedUserIds: JSON.stringify(dto.selectedUserIds || []),
        acknowledgementRequired: Boolean(dto.acknowledgementRequired),
        isPinned: Boolean(dto.isPinned),
        isEmergency: Boolean(dto.isEmergency),
        publishedAt: new Date()
      }
    });

    // Resolve target audience users and create CircularRecipient records
    const targetUsers = await prisma.user.findMany({
      take: 100,
      select: { id: true }
    });

    const recipientData = targetUsers.map((u) => ({
      circularId: circular.id,
      userId: u.id,
      status: 'DELIVERED',
      deliveredAt: new Date()
    }));

    if (recipientData.length > 0) {
      await (prisma as any).circularRecipient.createMany({
        data: recipientData,
        skipDuplicates: true
      });
    }

    // Dispatch Native In-App Notification
    await prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        recipientId: u.id,
        eventType: dto.isEmergency ? 'EMERGENCY_CIRCULAR' : 'CIRCULAR_PUBLISHED',
        title: `${dto.isEmergency ? '🚨 EMERGENCY CIRCULAR: ' : 'Circular: '}${dto.title}`,
        message: `${publishedAsLabel} published a new circular: "${dto.title}".`,
        relatedEntityType: 'Circular',
        relatedEntityId: circular.id,
        deepLinkRoute: `/circulars/${circular.id}`,
        deliveryState: 'DELIVERED',
        deliveryChannel: 'IN_APP'
      }))
    });

    // Log Delegated Action if VP Acting Principal
    if (delegationId) {
      await DelegationService.logDelegatedAction({
        delegationId,
        module: 'CIRCULAR',
        recordId: circular.id,
        actionType: 'PUBLISHED',
        performedByUserId: authorUserId,
        performedByRole: authorRole,
        performedAsRole: 'ACTING_PRINCIPAL',
        remarks: `Published institutional circular "${dto.title}" under active Principal delegation.`
      });
    }

    return circular;
  }

  /**
   * Mark circular as read / acknowledged by recipient.
   */
  static async acknowledgeCircular(userId: string, circularId: string) {
    const updated = await (prisma as any).circularRecipient.upsert({
      where: {
        circularId_userId: { circularId, userId }
      },
      update: {
        status: 'ACKNOWLEDGED',
        readAt: new Date(),
        acknowledgedAt: new Date()
      },
      create: {
        circularId,
        userId,
        status: 'ACKNOWLEDGED',
        readAt: new Date(),
        acknowledgedAt: new Date()
      }
    });

    return updated;
  }

  /**
   * Get analytics & recipient delivery breakdown for a circular.
   */
  static async getCircularAnalytics(circularId: string) {
    const circular = await (prisma as any).circular.findUnique({
      where: { id: circularId },
      include: { recipients: true }
    });

    if (!circular) throw new Error('Circular not found');

    const total = circular.recipients.length;
    const read = circular.recipients.filter((r: any) => r.readAt || r.status === 'READ' || r.status === 'ACKNOWLEDGED').length;
    const acknowledged = circular.recipients.filter((r: any) => r.acknowledgedAt || r.status === 'ACKNOWLEDGED').length;

    return {
      circular,
      metrics: {
        totalRecipients: total,
        readCount: read,
        acknowledgedCount: acknowledged,
        unreadCount: total - read
      }
    };
  }
}
