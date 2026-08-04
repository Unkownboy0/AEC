import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';

export interface PublishCircularInput {
  title: string;
  content: string;
  broadcastLevel: 'ALL_CAMPUS' | 'FACULTY_ONLY' | 'STUDENT_ONLY' | 'DEPARTMENT_SPECIFIC';
  departmentId?: string;
  attachmentUrl?: string;
}

export class CircularEngineService {
  /**
   * Publish a new Institutional / Departmental Circular
   */
  async publishCircular(userId: string, input: PublishCircularInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new UnauthorizedException('User account not found');

    // Scoping Rule: HODs can ONLY publish DEPARTMENT_SPECIFIC circulars for their assigned department
    const roleName = user.role?.name || '';
    const isHod = roleName === 'HOD' || roleName === 'Head of Department' || roleName.toLowerCase().includes('hod');

    if (isHod) {
      const faculty = await prisma.faculty.findFirst({ where: { userId } });
      let deptId = faculty?.departmentId || (user as any).departmentId;
      if (!deptId) {
        const membership = await prisma.departmentMembership.findFirst({ where: { userId } });
        deptId = membership?.departmentId;
      }
      if (!deptId) {
        const dept = await prisma.department.findFirst({ where: { hodUserId: userId } });
        deptId = dept?.id;
      }

      if (!deptId) {
        throw new ForbiddenException('Faculty/HOD record not associated with any active department');
      }

      input.broadcastLevel = 'DEPARTMENT_SPECIFIC';
      input.departmentId = deptId;
    }

    if (input.broadcastLevel === 'DEPARTMENT_SPECIFIC' && !input.departmentId) {
      throw new BadRequestException('departmentId is required for DEPARTMENT_SPECIFIC circulars');
    }

    // Generate Circular Number (e.g. CIR-2026-0001)
    const count = await prisma.institutionalCircular.count();
    const circularNumber = `CIR-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const circular = await prisma.institutionalCircular.create({
      data: {
        circularNumber,
        title: input.title,
        content: input.content,
        broadcastLevel: input.broadcastLevel,
        departmentId: input.departmentId,
        authorId: userId,
        attachmentUrl: input.attachmentUrl,
        status: 'PUBLISHED',
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    // Dispatch Notifications to Target Audience
    this.dispatchCircularNotifications(circular).catch((err) => {
      logger.error('Failed to dispatch circular notifications:', err);
    });

    logger.info(`📢 Circular ${circularNumber} published by ${user.email} (Level: ${input.broadcastLevel})`);
    return circular;
  }

  /**
   * Dispatch Notifications to Target Audience
   */
  private async dispatchCircularNotifications(circular: any) {
    let recipientUserIds: string[] = [];

    switch (circular.broadcastLevel) {
      case 'ALL_CAMPUS': {
        const allUsers = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
        recipientUserIds = allUsers.map((u) => u.id);
        break;
      }
      case 'FACULTY_ONLY': {
        const facultyUsers = await prisma.faculty.findMany({
          where: { status: 'ACTIVE', userId: { not: null } },
          select: { userId: true },
        });
        recipientUserIds = facultyUsers.map((f) => f.userId!).filter(Boolean);
        break;
      }
      case 'STUDENT_ONLY': {
        const studentUsers = await prisma.student.findMany({
          where: { status: 'ACTIVE', userId: { not: null } },
          select: { userId: true },
        });
        recipientUserIds = studentUsers.map((s) => s.userId!).filter(Boolean);
        break;
      }
      case 'DEPARTMENT_SPECIFIC': {
        if (circular.departmentId) {
          const deptFaculty = await prisma.faculty.findMany({
            where: { departmentId: circular.departmentId, status: 'ACTIVE', userId: { not: null } },
            select: { userId: true },
          });
          const deptStudents = await prisma.student.findMany({
            where: { departmentId: circular.departmentId, status: 'ACTIVE', userId: { not: null } },
            select: { userId: true },
          });
          const ids = [
            ...deptFaculty.map((f) => f.userId!),
            ...deptStudents.map((s) => s.userId!),
          ];
          recipientUserIds = Array.from(new Set(ids)).filter(Boolean);
        }
        break;
      }
    }

    // Limit notifications batch for scalability
    const topRecipients = recipientUserIds.slice(0, 500);

    for (const uid of topRecipients) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: uid,
            eventType: 'CIRCULAR_PUBLISHED',
            title: `📢 Circular: ${circular.title}`,
            message: circular.content.substring(0, 120) + '...',
            relatedEntityType: 'INSTITUTIONAL_CIRCULAR',
            relatedEntityId: circular.id,
            deepLinkRoute: `/circulars?id=${circular.id}`,
          },
        });
      } catch (_) {}
    }
  }

  /**
   * Get Applicable Circulars for Current Logged-in User
   */
  async getCircularsForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) return [];

    let userDeptId: string | null = null;
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (faculty) userDeptId = faculty.departmentId;

    const student = await prisma.student.findFirst({ where: { userId } });
    if (student) userDeptId = student.departmentId;

    // Super Admin / Executives see all circulars
    const isExecutive = ['Super Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'Admin Dean'].includes(user.role.name);

    const whereClause: any = {};

    if (!isExecutive) {
      const levelFilters = [{ broadcastLevel: 'ALL_CAMPUS' }];

      if (user.role.name === 'Faculty' || user.role.name === 'HOD') {
        levelFilters.push({ broadcastLevel: 'FACULTY_ONLY' });
      }
      if (user.role.name === 'Student') {
        levelFilters.push({ broadcastLevel: 'STUDENT_ONLY' });
      }
      if (userDeptId) {
        levelFilters.push({ broadcastLevel: 'DEPARTMENT_SPECIFIC', departmentId: userDeptId } as any);
      }

      whereClause.OR = levelFilters;
    }

    const circulars = await prisma.institutionalCircular.findMany({
      where: whereClause,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        readReceipts: { where: { userId }, select: { id: true, readAt: true } },
      },
    });

    return circulars.map((c) => ({
      ...c,
      isRead: c.readReceipts.length > 0,
      readAt: c.readReceipts[0]?.readAt || null,
    }));
  }

  /**
   * Mark Circular as Read
   */
  async markAsRead(userId: string, circularId: string) {
    const circular = await prisma.institutionalCircular.findUnique({ where: { id: circularId } });
    if (!circular) throw new NotFoundException('Circular not found');

    return prisma.circularReadReceipt.upsert({
      where: { circularId_userId: { circularId, userId } },
      update: { readAt: new Date() },
      create: { circularId, userId },
    });
  }

  /**
   * Get Circular Analytics (Total Audience vs Read Count)
   */
  async getCircularAnalytics(circularId: string) {
    const circular = await prisma.institutionalCircular.findUnique({
      where: { id: circularId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { readReceipts: true } },
      },
    });

    if (!circular) throw new NotFoundException('Circular not found');

    let totalAudience = 0;

    switch (circular.broadcastLevel) {
      case 'ALL_CAMPUS':
        totalAudience = await prisma.user.count({ where: { status: 'ACTIVE' } });
        break;
      case 'FACULTY_ONLY':
        totalAudience = await prisma.faculty.count({ where: { status: 'ACTIVE' } });
        break;
      case 'STUDENT_ONLY':
        totalAudience = await prisma.student.count({ where: { status: 'ACTIVE' } });
        break;
      case 'DEPARTMENT_SPECIFIC':
        if (circular.departmentId) {
          const fCount = await prisma.faculty.count({ where: { departmentId: circular.departmentId, status: 'ACTIVE' } });
          const sCount = await prisma.student.count({ where: { departmentId: circular.departmentId, status: 'ACTIVE' } });
          totalAudience = fCount + sCount;
        }
        break;
    }

    const readCount = circular._count.readReceipts;
    const readPercentage = totalAudience > 0 ? Math.round((readCount / totalAudience) * 100) : 0;

    return {
      circular,
      totalAudience,
      readCount,
      readPercentage,
    };
  }
}
