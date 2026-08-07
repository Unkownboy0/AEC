import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ForbiddenException, NotFoundException, BadRequestException } from '../../utils/exceptions';

export class CircularController {
  /**
   * Helper to resolve faculty department for HOD / Faculty roles
   */
  private async getFacultyDept(userId: string) {
    const faculty = await prisma.faculty.findFirst({
      where: { userId },
      include: { department: true }
    });
    return faculty;
  }

  /**
   * Helper to resolve student department for Student role
   */
  private async getStudentDept(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId },
      include: { department: true }
    });
    return student;
  }

  /**
   * List circulars filtered by department isolation
   */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      let deptId = '';

      const roleUpper = (user.role || '').toUpperCase();
      const isExecutive = [
        'SUPER ADMIN', 'ADMIN', 'PRINCIPAL', 'VP', 'VICE PRINCIPAL', 'VICE_PRINCIPAL',
        'DEAN', 'ACADEMIC DEAN', 'ADMISSION DEAN', 'IQAC DEAN', 'EXECUTIVE'
      ].includes(roleUpper);

      if (isExecutive) {
        deptId = (req.query.departmentId as string) || '';
      } else if (user.role === 'HOD' || user.role === 'Faculty' || roleUpper.includes('HOD') || roleUpper.includes('FACULTY')) {
        const faculty = await this.getFacultyDept(user.id);
        if (faculty) {
          deptId = faculty.departmentId;
        }
      } else if (user.role === 'Student' || user.role === 'Parent' || roleUpper.includes('STUDENT') || roleUpper.includes('PARENT')) {
        const student = await this.getStudentDept(user.id);
        if (student) {
          deptId = student.departmentId;
        }
      } else {
        deptId = (req.query.departmentId as string) || '';
      }

      const where: any = {};
      if (deptId) {
        const instDept = await prisma.department.findFirst({
          where: {
            OR: [
              { code: 'ALL' },
              { code: 'INST' },
              { name: { contains: 'Institution' } },
              { name: { contains: 'All' } }
            ]
          }
        });
        if (instDept) {
          where.departmentId = { in: [deptId, instDept.id] };
        } else {
          where.departmentId = deptId;
        }
      }

      // Students can only see PUBLISHED circulars
      if (user.role === 'Student' || user.role === 'Parent') {
        where.status = 'PUBLISHED';
      }

      const circulars = await prisma.hodCircular.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          publishedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profilePhoto: true
            }
          },
          department: true,
          recipients: {
            where: { userId: user.id }
          }
        }
      });

      // Format response to include read tracking state for current user
      const formatted = circulars.map(c => {
        const parsedImages = typeof c.images === 'string' ? JSON.parse(c.images || '[]') : c.images;
        const readRecord = c.recipients[0];
        return {
          id: c.id,
          title: c.title,
          category: c.category,
          priority: c.priority,
          description: c.description,
          content: c.content,
          status: c.status,
          images: parsedImages,
          attachmentUrl: c.attachmentUrl,
          attachmentName: c.attachmentName,
          publishedAt: c.publishedAt,
          createdAt: c.createdAt,
          departmentId: c.departmentId,
          department: c.department,
          publishedBy: c.publishedBy,
          isRead: readRecord ? readRecord.status === 'READ' : false,
          readAt: readRecord?.readAt || null
        };
      });

      res.status(200).json({
        status: 'success',
        data: formatted
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create new circular (auto-inheriting HOD department)
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const roleUpper = (user.role || '').toUpperCase();
      const canPublish = [
        'SUPER ADMIN', 'ADMIN', 'PRINCIPAL', 'VP', 'VICE PRINCIPAL', 'VICE_PRINCIPAL',
        'DEAN', 'ACADEMIC DEAN', 'ADMISSION DEAN', 'IQAC DEAN', 'HOD', 'HEAD_OF_DEPARTMENT'
      ].includes(roleUpper);

      if (!canPublish) {
        throw new ForbiddenException('Only institutional leaders and HODs can publish circulars');
      }

      const faculty = await this.getFacultyDept(user.id);
      let departmentId = faculty?.departmentId || '';

      if (!departmentId) {
        const instDept = await prisma.department.findFirst({
          where: { OR: [{ code: 'ALL' }, { code: 'INST' }, { name: { contains: 'Institution' } }] }
        });
        departmentId = instDept?.id || '';
      }

      if (!departmentId) {
        const anyDept = await prisma.department.findFirst();
        departmentId = anyDept?.id || '';
      }

      const { title, category, priority, description, content, status, images, attachmentUrl, attachmentName } = req.body;
      if (!title || !content) {
        throw new BadRequestException('title and content fields are required');
      }

      const circularStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
      const publishedAt = circularStatus === 'PUBLISHED' ? new Date() : null;

      const circular = await prisma.hodCircular.create({
        data: {
          title,
          category,
          priority: priority || 'NORMAL',
          description,
          content,
          status: circularStatus,
          images: images ? JSON.stringify(images) : '[]',
          attachmentUrl,
          attachmentName,
          publishedAt,
          departmentId,
          publishedById: user.id
        }
      });

      // If published, trigger real-time system notifications and read tracking records
      if (circularStatus === 'PUBLISHED') {
        await this.deliverCircularNotifications(circular, faculty);
      }

      res.status(201).json({
        status: 'success',
        data: circular
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update circular (verifying HOD owns the department)
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const circular = await prisma.hodCircular.findUnique({ where: { id } });
      if (!circular) {
        throw new NotFoundException('Circular not found');
      }

      const faculty = await this.getFacultyDept(user.id);
      if (user.role !== 'Super Admin' && (!faculty || faculty.departmentId !== circular.departmentId)) {
        throw new ForbiddenException('You cannot update circulars outside your department');
      }

      const { title, category, priority, description, content, status, images, attachmentUrl, attachmentName } = req.body;
      const willPublish = status === 'PUBLISHED' && circular.status !== 'PUBLISHED';
      const updatedStatus = status || circular.status;

      const updated = await prisma.hodCircular.update({
        where: { id },
        data: {
          title: title || circular.title,
          category: category || circular.category,
          priority: priority || circular.priority,
          description: description !== undefined ? description : circular.description,
          content: content || circular.content,
          status: updatedStatus,
          images: images ? JSON.stringify(images) : circular.images,
          attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : circular.attachmentUrl,
          attachmentName: attachmentName !== undefined ? attachmentName : circular.attachmentName,
          publishedAt: willPublish ? new Date() : circular.publishedAt
        }
      });

      if (willPublish) {
        await this.deliverCircularNotifications(updated, faculty!);
      }

      res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete circular
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const circular = await prisma.hodCircular.findUnique({ where: { id } });
      if (!circular) {
        throw new NotFoundException('Circular not found');
      }

      const faculty = await this.getFacultyDept(user.id);
      if (user.role !== 'Super Admin' && (!faculty || faculty.departmentId !== circular.departmentId)) {
        throw new ForbiddenException('You cannot delete circulars outside your department');
      }

      await prisma.hodCircular.delete({ where: { id } });

      res.status(200).json({
        status: 'success',
        message: 'Circular deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark circular as read by user
   */
  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const tracker = await prisma.hodCircularReadTracker.upsert({
        where: {
          circularId_userId: { circularId: id, userId: user.id }
        },
        update: {
          status: 'READ',
          readAt: new Date()
        },
        create: {
          circularId: id,
          userId: user.id,
          status: 'READ',
          readAt: new Date()
        }
      });

      res.status(200).json({
        status: 'success',
        data: tracker
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get HOD circular read stats
   */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const circular = await prisma.hodCircular.findUnique({
        where: { id },
        include: {
          recipients: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!circular) {
        throw new NotFoundException('Circular not found');
      }

      const totalRecipients = circular.recipients.length;
      const readCount = circular.recipients.filter(r => r.status === 'READ').length;
      const unreadCount = totalRecipients - readCount;

      res.status(200).json({
        status: 'success',
        data: {
          totalRecipients,
          readCount,
          unreadCount,
          recipients: circular.recipients
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deliver notifications to all users of the department and auto-initialize read trackers
   */
  private async deliverCircularNotifications(circular: any, hodFaculty: any) {
    try {
      // Find all students, faculty, and mentors belonging to the target department
      const departmentId = circular.departmentId;
      const deptName = hodFaculty?.department?.name || 'Institution';
      const publisherTitle = hodFaculty?.designation || 'Principal / Executive';

      const [students, faculties] = await Promise.all([
        prisma.student.findMany({
          where: departmentId ? { departmentId, deleted: false } : { deleted: false },
          select: { userId: true }
        }),
        prisma.faculty.findMany({
          where: departmentId ? { departmentId, deleted: false } : { deleted: false },
          select: { userId: true }
        })
      ]);

      const userIds = Array.from(new Set([
        ...students.map(s => s.userId).filter(Boolean),
        ...faculties.map(f => f.userId).filter(Boolean)
      ])) as string[];

      if (userIds.length === 0) return;

      // 1. Create SystemNotification for UI popup alerts & bell log
      await prisma.systemNotification.create({
        data: {
          title: `New Circular: ${circular.title}`,
          content: `${publisherTitle} (${deptName}) has published a new circular: "${circular.description || circular.title}".`,
          type: 'ANNOUNCEMENT',
          status: 'SENT',
          imageUrl: circular.attachmentUrl || null
        }
      });

      // 2. Initialize Read Trackers for all recipients
      const trackerData = userIds.map(userId => ({
        circularId: circular.id,
        userId,
        status: 'DELIVERED'
      }));

      // SQLite does not support skipDuplicates in createMany, but since we are doing initial creation for a brand new circular ID, there will be no duplicates anyway.
      await prisma.hodCircularReadTracker.createMany({
        data: trackerData
      });
    } catch (err) {
      console.error('[deliverCircularNotifications] error:', err);
    }
  }
}
