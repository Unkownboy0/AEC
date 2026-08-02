import { prisma } from '../../lib/prisma';

export class InteractiveTimelineService {
  /**
   * Get Chronological Interactive Feed
   */
  async getTimelineFeed(userId: string, limit = 50) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) return [];

    const isExecutive = ['Super Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'HOD'].includes(user.role.name);

    // Fetch chronological items in parallel
    const [studentLeaves, facultyLeaves, circulars, securityAudits, tasks] = await Promise.all([
      prisma.studentLeaveRequest.findMany({
        where: isExecutive ? {} : { student: { userId } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
      }),
      prisma.facultyLeaveRequest.findMany({
        where: isExecutive ? {} : { faculty: { userId } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { faculty: { select: { firstName: true, lastName: true, employeeId: true } } },
      }),
      prisma.institutionalCircular.findMany({
        orderBy: { publishedAt: 'desc' },
        take: limit,
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
      prisma.securityAuditLog.findMany({
        where: isExecutive ? {} : { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.task.findMany({
        where: isExecutive ? {} : { createdById: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Format & unify timeline entries
    const feed: any[] = [];

    studentLeaves.forEach((sl) => {
      feed.push({
        id: `SL-${sl.id}`,
        category: 'STUDENT_LEAVE',
        title: `Student ${sl.type}: ${sl.student.firstName} ${sl.student.lastName}`,
        description: `Reason: ${sl.reason} (${sl.totalDays} day(s))`,
        status: sl.status,
        timestamp: sl.createdAt,
        actor: `${sl.student.firstName} ${sl.student.lastName}`,
        entityId: sl.id,
      });
    });

    facultyLeaves.forEach((fl) => {
      feed.push({
        id: `FL-${fl.id}`,
        category: 'FACULTY_LEAVE',
        title: `Faculty ${fl.leaveType}: Prof. ${fl.faculty.firstName} ${fl.faculty.lastName}`,
        description: `Reason: ${fl.reason} (${fl.totalDays} day(s))`,
        status: fl.status,
        timestamp: fl.createdAt,
        actor: `Prof. ${fl.faculty.firstName} ${fl.faculty.lastName}`,
        entityId: fl.id,
      });
    });

    circulars.forEach((c) => {
      feed.push({
        id: `CIR-${c.id}`,
        category: 'CIRCULAR',
        title: `📢 Circular Released: ${c.title}`,
        description: c.content.substring(0, 100) + '...',
        status: c.broadcastLevel,
        timestamp: c.publishedAt,
        actor: `${c.author.firstName} ${c.author.lastName}`,
        entityId: c.id,
      });
    });

    securityAudits.forEach((sa) => {
      feed.push({
        id: `SEC-${sa.id}`,
        category: 'SECURITY_AUDIT',
        title: `🔒 Security Event: ${sa.action} (${sa.module})`,
        description: sa.description || `${sa.action} on module ${sa.module}`,
        status: sa.statusCode === 200 ? 'SUCCESS' : 'DENIED',
        timestamp: sa.createdAt,
        actor: sa.userEmail || 'System',
        entityId: sa.id,
      });
    });

    tasks.forEach((t) => {
      feed.push({
        id: `TSK-${t.id}`,
        category: 'TASK',
        title: `📋 Work Task: ${t.title}`,
        description: `Task ${t.taskNumber} status: ${t.status}`,
        status: t.status,
        timestamp: t.createdAt,
        actor: t.taskNumber,
        entityId: t.id,
      });
    });

    // Sort unified feed by timestamp descending
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return feed.slice(0, limit);
  }
}
