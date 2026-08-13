import { prisma } from '../../lib/prisma';
import { CreateCircularDto } from './circular.validation';

export class CircularRepository {
  /**
   * List circulars with recipient status for a specific user.
   */
  /**
   * List circulars with recipient status for a specific user.
   */
  async findMany(whereClause: any, userId: string, scope?: { deptId?: string; institutionWide?: boolean }) {
    const rawCirculars = await (prisma as any).circular.findMany({
      where: whereClause,
      orderBy: [
        { isEmergency: 'desc' },
        { isPinned: 'desc' },
        { publishedAt: 'desc' },
      ],
      include: {
        recipients: {
          where: { userId },
          select: {
            id: true, status: true, deliveredAt: true,
            viewedAt: true, readAt: true, acknowledgedAt: true,
          },
        },
        _count: { select: { recipients: true } },
      },
    });

    const hodCirculars = await (prisma as any).hodCircular.findMany({
      where: {
        status: 'PUBLISHED',
        ...(scope?.institutionWide ? {} : { departmentId: scope?.deptId || '__NO_DEPARTMENT__' }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        publishedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }).catch(() => []);

    const mappedHodCirculars = (hodCirculars || []).map((h: any) => ({
      id: h.id,
      circularNumber: `CIR-${h.id.slice(0, 8).toUpperCase()}`,
      title: h.title,
      category: h.category || 'GENERAL',
      priority: h.priority || 'NORMAL',
      description: h.description || null,
      content: h.content || '',
      broadcastLevel: 'DEPARTMENT_SPECIFIC',
      departmentId: h.departmentId,
      authorId: h.publishedById,
      authorRole: 'HOD',
      publishedAs: 'Head of Department',
      attachmentUrl: h.attachmentUrl || null,
      attachmentName: h.attachmentName || null,
      status: h.status || 'PUBLISHED',
      publishedAt: h.publishedAt || h.createdAt,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      author: h.publishedBy || null,
      department: h.department || null,
      targetDepartments: h.departmentId ? [h.departmentId] : [],
      targetRoles: [],
      targetYears: [],
      targetSemesters: [],
      targetSections: [],
      selectedUserIds: [],
      userStatus: 'DELIVERED',
      isRead: false,
      isAcknowledged: false,
      totalRecipients: 0,
    }));

    const circulars = await this.populateRelations(rawCirculars);

    const mappedCirculars = circulars.filter((c: any) => c.recipients?.[0]?.status !== 'CLEARED').map((c: any) => ({
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

    const existingIds = new Set(mappedCirculars.map((c: any) => c.id));
    for (const h of mappedHodCirculars) {
      if (!existingIds.has(h.id)) {
        mappedCirculars.push(h);
      }
    }

    return mappedCirculars;
  }

  /**
   * Find a single circular by ID.
   */
  async findById(circularId: string, userId?: string) {
    const rawCircular = await (prisma as any).circular.findUnique({
      where: { id: circularId },
      include: {
        recipients: userId
          ? {
              where: { userId },
              select: {
                id: true, status: true, deliveredAt: true,
                viewedAt: true, readAt: true, acknowledgedAt: true,
              },
            }
          : false,
        _count: { select: { recipients: true } },
      },
    });

    if (!rawCircular) {
      const hodC = await (prisma as any).hodCircular.findUnique({
        where: { id: circularId },
        include: {
          department: { select: { id: true, name: true, code: true } },
          publishedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      if (!hodC) return null;

      return {
        id: hodC.id,
        circularNumber: `CIR-${hodC.id.slice(0, 8).toUpperCase()}`,
        title: hodC.title,
        category: hodC.category || 'GENERAL',
        priority: hodC.priority || 'NORMAL',
        description: hodC.description || null,
        content: hodC.content || '',
        broadcastLevel: 'DEPARTMENT_SPECIFIC',
        departmentId: hodC.departmentId,
        authorId: hodC.publishedById,
        authorRole: 'HOD',
        publishedAs: 'Head of Department',
        attachmentUrl: hodC.attachmentUrl || null,
        attachmentName: hodC.attachmentName || null,
        status: hodC.status || 'PUBLISHED',
        publishedAt: hodC.publishedAt || hodC.createdAt,
        createdAt: hodC.createdAt,
        updatedAt: hodC.updatedAt,
        author: hodC.publishedBy || null,
        department: hodC.department || null,
        targetDepartments: hodC.departmentId ? [hodC.departmentId] : [],
        targetRoles: [],
        targetYears: [],
        targetSemesters: [],
        targetSections: [],
        selectedUserIds: [],
        userStatus: 'DELIVERED',
        isRead: false,
        isAcknowledged: false,
        totalRecipients: 0,
      };
    }

    const [circular] = await this.populateRelations([rawCircular]);

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

  private async populateRelations(circulars: any[]) {
    if (!circulars || circulars.length === 0) return [];

    const authorIds = Array.from(new Set(circulars.map((c) => c.authorId).filter(Boolean)));
    const deptIds = Array.from(new Set(circulars.map((c) => c.departmentId).filter(Boolean)));

    const authors = authorIds.length > 0
      ? await (prisma as any).user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];

    const departments = deptIds.length > 0
      ? await (prisma as any).department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true, code: true },
        })
      : [];

    const authorMap = new Map(authors.map((a: any) => [a.id, a]));
    const deptMap = new Map(departments.map((d: any) => [d.id, d]));

    return circulars.map((c: any) => ({
      ...c,
      author: authorMap.get(c.authorId) || null,
      department: deptMap.get(c.departmentId) || null,
    }));
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

  async delete(circularId: string) {
    return (prisma as any).circular.delete({ where: { id: circularId } });
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
    viewedAt: Date;
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
