import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { profileImageDescriptor } from '../users/profile-media.service';

export class ComplaintController {
  private async resolveComplaintScope(user: any) {
    const role = String(user?.role || '').toUpperCase().replace(/[\s_-]+/g, '');
    if (['PRINCIPAL', 'VICEPRINCIPAL', 'SUPERADMIN', 'COLLEGEADMIN'].includes(role)) {
      return { role, departmentIds: undefined as string[] | undefined };
    }
    if (role !== 'HOD' && role !== 'HEADOFDEPARTMENT') {
      return { role, departmentIds: [] as string[] };
    }

    const [record, faculty, memberships] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id }, select: { departmentId: true } }),
      prisma.faculty.findFirst({ where: { userId: user.id, deleted: false }, select: { departmentId: true } }),
      prisma.departmentMembership.findMany({ where: { userId: user.id, role: 'HOD' }, select: { departmentId: true } }),
    ]);
    const departmentIds = Array.from(new Set([
      record?.departmentId,
      faculty?.departmentId,
      ...memberships.map(item => item.departmentId),
    ].filter((id): id is string => Boolean(id))));
    return { role, departmentIds };
  }

  private ticketScopeWhere(departmentIds?: string[]) {
    if (departmentIds === undefined) return {};
    if (departmentIds.length === 0) return { id: '__NO_COMPLAINT_SCOPE__' };
    return {
      OR: [
        { student: { departmentId: { in: departmentIds } } },
        { faculty: { departmentId: { in: departmentIds } } },
      ],
    };
  }

  private async findComplaintInScope(user: any, ticketId: string) {
    const scope = await this.resolveComplaintScope(user);
    if (!['PRINCIPAL', 'VICEPRINCIPAL', 'SUPERADMIN', 'COLLEGEADMIN', 'HOD', 'HEADOFDEPARTMENT'].includes(scope.role)) {
      throw new ForbiddenException('You do not have permission to manage complaints.');
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, deleted: false, ...this.ticketScopeWhere(scope.departmentIds) },
    });
    if (!ticket) throw new NotFoundException('Complaint was not found in your department scope.');
    return { ticket, scope };
  }

  /**
   * Institution-wide Complaint Analytics & Metrics for Principal Dashboard
   */
  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear, departmentId } = req.query as Record<string, string>;
      const scope = await this.resolveComplaintScope((req as any).user);

      // 1. Fetch tickets from DB
      const tickets = await prisma.ticket.findMany({
        where: { deleted: false, ...this.ticketScopeWhere(scope.departmentIds) },
        include: {
          student: {
            include: {
              department: { select: { id: true, name: true, code: true } },
              program: { select: { id: true, name: true, code: true } }
            }
          },
          faculty: {
            include: {
              department: { select: { id: true, name: true, code: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // 2. Fetch departments
      const departments = await prisma.department.findMany({
        where: { archived: false, ...(scope.departmentIds !== undefined ? { id: { in: scope.departmentIds } } : {}) },
        select: { id: true, name: true, code: true }
      });

      const totalComplaints = tickets.length;
      const pendingComplaints = tickets.filter(t => t.status === 'OPEN' || t.status === 'PENDING').length;
      const underInvestigation = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'UNDER_INVESTIGATION').length;
      const resolvedComplaints = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      const escalatedComplaints = tickets.filter(t => t.status === 'ESCALATED').length;

      const highPriority = tickets.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length;
      const criticalComplaints = tickets.filter(t => t.priority === 'CRITICAL').length;

      const studentComplaints = tickets.filter(t => t.studentId != null).length;
      const facultyComplaints = tickets.filter(t => t.facultyId != null && t.studentId == null).length;
      const mentorComplaints = 0;
      const hodComplaints = 0;
      const anonymousComplaints = tickets.filter(t => t.category === 'ANONYMOUS').length;

      // Department distribution
      const deptMap = new Map<string, { code: string; name: string; total: number; pending: number; resolved: number; escalated: number }>();

      departments.forEach(d => {
        const code = d.code ? d.code.toUpperCase() : d.name.toUpperCase();
        deptMap.set(code, {
          code,
          name: d.name,
          total: 0,
          pending: 0,
          resolved: 0,
          escalated: 0
        });
      });

      tickets.forEach(t => {
        const deptCode = t.student?.department?.code?.toUpperCase() || t.faculty?.department?.code?.toUpperCase();
        if (!deptCode) return;
        const target = deptMap.get(deptCode);
        if (target) {
          target.total += 1;
          if (t.status === 'OPEN' || t.status === 'PENDING' || t.status === 'IN_PROGRESS') target.pending += 1;
          if (t.status === 'RESOLVED' || t.status === 'CLOSED') target.resolved += 1;
          if (t.status === 'ESCALATED') target.escalated += 1;
        }
      });

      const departmentDistribution = Array.from(deptMap.values());

      // Category breakdown
      const categoryMap = new Map<string, number>();
      ['ACADEMIC', 'HOSTEL', 'INFRASTRUCTURE', 'FEE', 'DISCIPLINE', 'FACULTY', 'GENERAL', 'ANONYMOUS'].forEach(c => {
        categoryMap.set(c, 0);
      });

      tickets.forEach(t => {
        const cat = (t.category || 'GENERAL').toUpperCase();
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count
      }));

      const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' });
      const monthlyMap = new Map<string, { month: string; total: number; resolved: number; pending: number }>();
      tickets.forEach((ticket) => {
        const month = monthFormatter.format(ticket.createdAt);
        const item = monthlyMap.get(month) || { month, total: 0, resolved: 0, pending: 0 };
        item.total += 1;
        if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') item.resolved += 1;
        else item.pending += 1;
        monthlyMap.set(month, item);
      });
      const monthlyTrends = Array.from(monthlyMap.values()).reverse();

      res.status(200).json({
        status: 'success',
        data: {
          kpis: {
            totalComplaints,
            pendingComplaints,
            underInvestigation,
            resolvedComplaints,
            escalatedComplaints,
            highPriority,
            criticalComplaints,
            studentComplaints,
            facultyComplaints,
            mentorComplaints,
            hodComplaints,
            anonymousComplaints
          },
          departmentDistribution,
          categoryBreakdown,
          monthlyTrends
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Live Complaint Feed with search and multi-filtering
   */
  getFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, department, role, category, status, priority, academicYear } = req.query as Record<string, string>;
      const scope = await this.resolveComplaintScope((req as any).user);

      const tickets = await prisma.ticket.findMany({
        where: { deleted: false, ...this.ticketScopeWhere(scope.departmentIds) },
        include: {
          student: {
            include: {
              department: { select: { name: true, code: true } },
              program: { select: { name: true, code: true } },
              semester: { select: { name: true } },
              user: { select: { id: true, profilePhoto: true, profileImageFileId: true, profileImageFile: true, email: true } }
            }
          },
          faculty: {
            include: {
              department: { select: { name: true, code: true } },
              user: { select: { id: true, profilePhoto: true, profileImageFileId: true, profileImageFile: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      let feed = tickets.map(t => {
        let submittedByRole = 'Student';
        let submittedByName = 'Anonymous';
        let departmentName: string | null = null;
        let departmentCode: string | null = null;
        let userPhoto = null;
        let programName: string | null = null;
        let semesterName: string | null = null;
        let employeeId: string | null = null;
        let registerNo: string | null = null;

        let userEmail: string | null = null;
        let userPhone: string | null = null;

        if (t.student) {
          submittedByRole = 'Student';
          submittedByName = `${t.student.firstName} ${t.student.lastName}`;
          departmentName = t.student.department?.name || null;
          departmentCode = t.student.department?.code || null;
          userPhoto = t.student.user ? profileImageDescriptor(t.student.user).url : null;
          userEmail = t.student.user?.email || t.student.email || null;
          userPhone = t.student.phone || null;
          programName = t.student.program?.name || null;
          semesterName = t.student.semester?.name || null;
          registerNo = t.student.admissionNo || null;
        } else if (t.faculty) {
          submittedByRole = 'Faculty';
          submittedByName = `${t.faculty.firstName} ${t.faculty.lastName}`;
          departmentName = t.faculty.department?.name || null;
          departmentCode = t.faculty.department?.code || null;
          userPhoto = t.faculty.user ? profileImageDescriptor(t.faculty.user).url : null;
          userEmail = t.faculty.user?.email || t.faculty.email || null;
          userPhone = t.faculty.phone || null;
          employeeId = t.faculty.employeeId || null;
        }

        let parsedReplies = [];
        try {
          parsedReplies = typeof t.replies === 'string' ? JSON.parse(t.replies) : (t.replies || []);
        } catch {
          parsedReplies = [];
        }

        return {
          id: t.id,
          complaintNumber: `CMP-${t.id.slice(0, 8).toUpperCase()}`,
          title: t.title,
          description: t.description,
          reason: t.description,
          status: t.status || 'OPEN',
          priority: t.priority || 'MEDIUM',
          category: t.category || 'GENERAL',
          submittedByName,
          submittedByRole,
          departmentName,
          departmentCode,
          registerNo,
          employeeId,
          userEmail,
          userPhone,
          programName,
          semesterName,
          userPhoto,
          assignedOfficer: null,
          assignedDepartment: null,
          complaintSource: 'Web Portal',
          submittedDate: t.createdAt,
          updatedDate: t.updatedAt,
          replies: parsedReplies,
          resolutionProgress: t.status === 'RESOLVED' || t.status === 'CLOSED' ? 100 : t.status === 'IN_PROGRESS' || t.status === 'UNDER_INVESTIGATION' ? 60 : t.status === 'ESCALATED' ? 85 : 20,
          attachments: []
        };
      });

      // Apply Filters
      if (search) {
        const q = search.toLowerCase();
        feed = feed.filter(f =>
          f.complaintNumber.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.submittedByName.toLowerCase().includes(q) ||
          (f.departmentCode?.toLowerCase().includes(q) ?? false) ||
          f.category.toLowerCase().includes(q) ||
          f.status.toLowerCase().includes(q)
        );
      }

      if (department && department !== 'ALL') {
        feed = feed.filter(f => f.departmentCode?.toUpperCase() === department.toUpperCase());
      }

      if (role && role !== 'ALL') {
        feed = feed.filter(f => f.submittedByRole.toUpperCase() === role.toUpperCase());
      }

      if (category && category !== 'ALL') {
        feed = feed.filter(f => f.category.toUpperCase() === category.toUpperCase());
      }

      if (status && status !== 'ALL') {
        feed = feed.filter(f => f.status.toUpperCase() === status.toUpperCase());
      }

      if (priority && priority !== 'ALL') {
        feed = feed.filter(f => f.priority.toUpperCase() === priority.toUpperCase());
      }

      res.status(200).json({
        status: 'success',
        data: {
          feed,
          totalCount: feed.length
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Principal attaches internal oversight remark without modifying original complaint text
   */
  addInternalRemark = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const user = (req as any).user;

      if (!remark) {
        return res.status(400).json({ status: 'error', message: 'Remark text is required.' });
      }

      const { ticket, scope } = await this.findComplaintInScope(user, id);
      {
        let repliesList = [];
        try {
          repliesList = typeof ticket.replies === 'string' ? JSON.parse(ticket.replies) : (ticket.replies || []);
        } catch {
          repliesList = [];
        }

        repliesList.push({
          id: `REMARK-${Date.now()}`,
          author: `${scope.role === 'HOD' || scope.role === 'HEADOFDEPARTMENT' ? 'HOD' : 'Principal'} ${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          role: scope.role,
          content: remark,
          isInternalRemark: true,
          createdAt: new Date().toISOString()
        });

        await prisma.ticket.update({
          where: { id },
          data: { replies: JSON.stringify(repliesList) }
        });
      }

      // Log activity
      if (user?.id) {
        await prisma.userActivityLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',
            module: 'COMPLAINT',
            description: `${scope.role} added an internal note on complaint #${id}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });
      }

      res.status(200).json({ status: 'success', message: 'Internal oversight remark attached successfully.' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Principal escalates complaint to High Priority / Urgent / Critical / Management
   */
  escalateComplaint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { priority, targetBody, escalationNote } = req.body;
      const user = (req as any).user;

      const { ticket, scope } = await this.findComplaintInScope(user, id);
      {
        let repliesList = [];
        try {
          repliesList = typeof ticket.replies === 'string' ? JSON.parse(ticket.replies) : (ticket.replies || []);
        } catch {
          repliesList = [];
        }

        repliesList.push({
          id: `ESCALATE-${Date.now()}`,
          author: `${scope.role === 'HOD' || scope.role === 'HEADOFDEPARTMENT' ? 'HOD' : 'Principal'} ${user?.firstName || ''}`.trim(),
          role: scope.role,
          content: `ESCALATION RECORDED: Marked as ${priority || 'CRITICAL'}. Forwarded to ${targetBody || 'Governing Body'}. Note: ${escalationNote || 'Immediate resolution requested.'}`,
          isEscalation: true,
          createdAt: new Date().toISOString()
        });

        await prisma.ticket.update({
          where: { id },
          data: {
            status: 'ESCALATED',
            priority: priority || 'CRITICAL',
            replies: JSON.stringify(repliesList)
          }
        });

        // Dispatch In-App Notification to Deans / Authorities
        await prisma.systemNotification.create({
          data: {
            title: `[ESCALATION] Complaint #${ticket.id.slice(0, 8).toUpperCase()} escalated`,
            content: `${scope.role} escalated complaint '${ticket.title}' to ${priority || 'CRITICAL'} priority. Target: ${targetBody || 'Management'}.`,
            type: 'ANNOUNCEMENT',
            status: 'SENT'
          }
        });
      }

      // Log activity
      if (user?.id) {
        await prisma.userActivityLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',
            module: 'COMPLAINT',
            description: `${scope.role} escalated complaint #${id} to ${priority || 'CRITICAL'} priority (${targetBody || 'Management'})`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });
      }

      res.status(200).json({ status: 'success', message: 'Complaint escalated and notifications dispatched.' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Audit logging for Principal complaint dashboard actions
   */
  recordAudit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, description } = req.body;
      const userId = (req as any).user?.id;

      if (userId) {
        await prisma.userActivityLog.create({
          data: {
            userId,
            action: action === 'EXPORT' ? 'EXPORT' : action === 'PRINT' ? 'PRINT' : 'VIEW',
            module: 'COMPLAINT',
            description: `Principal Complaint Monitoring: ${description || 'Complaint dashboard accessed.'}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });
      }

      res.status(200).json({ status: 'success', message: 'Audit recorded.' });
    } catch (error) {
      logger.error('Failed to record complaint audit log:', error);
      res.status(200).json({ status: 'success', message: 'Audit skipped.' });
    }
  };
}
