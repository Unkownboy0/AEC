import { prisma } from '../../lib/prisma';
import { CreateCircularDto } from './circular.validation';

export class CircularRepository {
  /**
   * List circulars with recipient status for a specific user.
   */
  async findMany(whereClause: any, userId: string) {
    const circulars = await (prisma as any).circular.findMany({
      where: whereClause,
      orderBy: [
        { isEmergency: 'desc' },
        { isPinned: 'desc' },
        { publishedAt: 'desc' },
      ],
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        recipients: {
          where: { userId },
          select: {
            id: true, status: true, deliveredAt: true,
            openedAt: true, readAt: true, acknowledgedAt: true,
          },
        },
        _count: { select: { recipients: true } },
      },
    });

    return circulars.map((c: any) => ({
      ...c,
      targetDepartments: this.parseJson(c.targetDepartments),
      targetRoles: this.parseJson(c.targetRoles),
      targetYears: this.parseJson(c.targetYears),
      targetSemesters: this.parseJson(c.targetSemesters),
      targetSections: this.parseJson(c.targetSections),
      selectedUserIds: this.parseJson(c.selectedUserIds),
      userStatus: c.recipients?.[0]?.status ?? 'DELIVERED',
      userReadAt: c.recipients?.[0]?.readAt ?? null,
      userAcknowledgedAt: c.recipients?.[0]?.acknowledgedAt ?? null,
      isRead: !!(c.recipients?.[0]?.readAt),
      isAcknowledged: !!(c.recipients?.[0]?.acknowledgedAt),
      totalRecipients: c._count?.recipients ?? 0,
    }));
  }

  /**
   * Find a single circular by ID.
   */
  async findById(circularId: string, userId?: string) {
    const circular = await (prisma as any).circular.findUnique({
      where: { id: circularId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        recipients: userId
          ? {
              where: { userId },
              select: {
                id: true, status: true, deliveredAt: true,
                openedAt: true, readAt: true, acknowledgedAt: true,
              },
            }
          : false,
        _count: { select: { recipients: true } },
      },
    });

    if (!circular) return null;

    return {
      ...circular,
      targetDepartments: this.parseJson(circular.targetDepartments),
      targetRoles: this.parseJson(circular.targetRoles),
      targetYears: this.parseJson(circular.targetYears),
      targetSemesters: this.parseJson(circular.targetSemesters),
      targetSections: this.parseJson(circular.targetSections),
      selectedUserIds: this.parseJson(circular.selectedUserIds),
      userStatus: circular.recipients?.[0]?.status ?? null,
      userReadAt: circular.recipients?.[0]?.readAt ?? null,
      userAcknowledgedAt: circular.recipients?.[0]?.acknowledgedAt ?? null,
      isRead: !!(circular.recipients?.[0]?.readAt),
      isAcknowledged: !!(circular.recipients?.[0]?.acknowledgedAt),
      totalRecipients: circular._count?.recipients ?? 0,
    };
  }

  /**
   * Create a new circular record.
   */
  async create(data: {
    circularNumber: string;
    title: string;
    category: string;
    priority: string;
    description?: string | null;
    content: string;
    broadcastLevel: string;
    departmentId?: string | null;
    authorId: string;
    authorRole: string;
    publishedAs: string;
    delegationId?: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    referenceLink?: string | null;
    status: string;
    publishDate?: Date | null;
    expiryDate?: Date | null;
    targetDepartments: string;
    targetRoles: string;
    targetYears: string;
    targetSemesters: string;
    targetSections: string;
    selectedUserIds: string;
    acknowledgementRequired: boolean;
    isPinned: boolean;
    isEmergency: boolean;
    publishedAt?: Date | null;
  }) {
    return (prisma as any).circular.create({ data });
  }

  /**
   * Update circular fields.
   */
  async update(circularId: string, data: Partial<any>) {
    return (prisma as any).circular.update({ where: { id: circularId }, data });
  }

  /**
   * Count all circulars (used for numbering).
   */
  async count(where?: any): Promise<number> {
    return (prisma as any).circular.count({ where });
  }

  /**
   * Upsert recipient record.
   */
  async upsertRecipient(circularId: string, userId: string, data: Partial<{
    status: string;
    deliveredAt: Date;
    openedAt: Date;
    readAt: Date;
    acknowledgedAt: Date;
    recipientRole: string;
    departmentId: string;
    notificationId: string;
  }>) {
    return (prisma as any).circularRecipient.upsert({
      where: { circularId_userId: { circularId, userId } },
      update: data,
      create: { circularId, userId, status: 'DELIVERED', deliveredAt: new Date(), ...data },
    });
  }

  /**
   * Bulk-create recipient records (skip duplicates).
   */
  async createManyRecipients(records: Array<{
    circularId: string;
    userId: string;
    status: string;
    deliveredAt: Date;
    recipientRole?: string;
    departmentId?: string;
  }>) {
    if (records.length === 0) return { count: 0 };
    return (prisma as any).circularRecipient.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  /**
   * Get recipient list for a circular.
   */
  async getRecipients(circularId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (prisma as any).circularRecipient.findMany({
        where: { circularId },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
        orderBy: { deliveredAt: 'desc' },
      }),
      (prisma as any).circularRecipient.count({ where: { circularId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get analytics for a circular.
   */
  async getAnalytics(circularId: string) {
    const circular = await (prisma as any).circular.findUnique({
      where: { id: circularId },
      include: {
        recipients: {
          select: { status: true, readAt: true, acknowledgedAt: true },
        },
      },
    });

    if (!circular) return null;

    const total = circular.recipients.length;
    const read = circular.recipients.filter((r: any) => r.readAt || ['READ', 'ACKNOWLEDGED'].includes(r.status)).length;
    const acknowledged = circular.recipients.filter((r: any) => r.acknowledgedAt || r.status === 'ACKNOWLEDGED').length;

    return {
      totalRecipients: total,
      readCount: read,
      acknowledgedCount: acknowledged,
      unreadCount: total - read,
      readPercentage: total > 0 ? Math.round((read / total) * 100) : 0,
      acknowledgedPercentage: total > 0 ? Math.round((acknowledged / total) * 100) : 0,
    };
  }

  private parseJson(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value); } catch { return []; }
  }
}
