import { Request, Response, NextFunction } from 'express';
import { TimetableService } from './timetable.service';
import { prisma } from '../../lib/prisma';
import { ForbiddenException } from '../../utils/exceptions';

const assertHodDepartment = async (req: Request, departmentId: string) => {
  const role = String((req as any).user?.role || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!['HOD', 'HEADOFDEPARTMENT'].includes(role)) return;
  const assigned = await prisma.departmentHodAssignment.count({ where: { hodUserId: (req as any).user.id, departmentId, isActive: true, effectiveFrom: { lte: new Date() }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }] } });
  if (!assigned) throw new ForbiddenException('Cross-department timetable access denied');
};

export class TimetableController {
  private service = new TimetableService();

  listSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.listSlots(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  createSlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await assertHodDepartment(req, req.body.departmentId);
      const data = await this.service.createSlot(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteSlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const slot = await prisma.timetableSlot.findUnique({ where: { id }, select: { departmentId: true } });
      if (slot) await assertHodDepartment(req, slot.departmentId);
      const data = await this.service.deleteSlot(id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  generateAIDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId, semesterId, academicYearId } = req.body;
      await assertHodDepartment(req, departmentId);
      const data = await this.service.generateAIDraft(departmentId, semesterId, academicYearId);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  facultyCreateSlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (!faculty) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
      }

      req.body.facultyId = faculty.id;
      
      const data = await this.service.createSlot(req.body);
      
      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          module: 'TIMETABLE',
          description: `Faculty manually added timetable slot for Day ${req.body.dayOfWeek} Period ${req.body.slotIndex}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  facultyUpdateSlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (!faculty) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
      }

      const slot = await prisma.timetableSlot.findUnique({ where: { id } });
      if (!slot) {
        return res.status(404).json({ status: 'error', message: 'Timetable slot not found.' });
      }

      if (slot.facultyId !== faculty.id && user.role !== 'Super Admin' && user.role !== 'HOD') {
        return res.status(403).json({ status: 'error', message: 'You can only update your own timetable slots.' });
      }

      const { dayOfWeek, slotIndex, startTime, endTime, roomNo, subjectId, sectionId, semesterId, academicYearId, departmentId } = req.body;
      
      if (slotIndex || dayOfWeek || roomNo) {
        const checkIndex = slotIndex || slot.slotIndex;
        const checkDay = dayOfWeek || slot.dayOfWeek;
        const checkRoom = roomNo || slot.roomNo;
        const checkYear = academicYearId || slot.academicYearId;

        if (roomNo && roomNo !== slot.roomNo) {
          const roomConflict = await prisma.timetableSlot.findFirst({
            where: { id: { not: id }, academicYearId: checkYear, dayOfWeek: checkDay, slotIndex: checkIndex, roomNo: checkRoom }
          });
          if (roomConflict) {
            return res.status(400).json({ status: 'error', message: `Conflict: Room ${checkRoom} is occupied during Period ${checkIndex}.` });
          }
        }
      }

      const updated = await prisma.timetableSlot.update({
        where: { id },
        data: {
          dayOfWeek,
          slotIndex,
          startTime,
          endTime,
          roomNo,
          subjectId,
          sectionId,
          semesterId,
          academicYearId,
          departmentId
        },
        include: {
          subject: true,
          section: true,
          semester: true
        }
      });

      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          module: 'TIMETABLE',
          description: `Updated timetable slot ${id}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  };

  facultyDeleteSlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (!faculty) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
      }

      const slot = await prisma.timetableSlot.findUnique({ where: { id } });
      if (!slot) {
        return res.status(404).json({ status: 'error', message: 'Timetable slot not found.' });
      }

      if (slot.facultyId !== faculty.id && user.role !== 'Super Admin' && user.role !== 'HOD') {
        return res.status(403).json({ status: 'error', message: 'You can only delete your own timetable slots.' });
      }

      await prisma.timetableSlot.delete({ where: { id } });

      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          module: 'TIMETABLE',
          description: `Deleted timetable slot ${id}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(200).json({ status: 'success', message: 'Timetable slot deleted successfully.' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit timetable for Academic Dean review
   */
  submitForReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId, semesterId, academicYearId } = req.body;
      await assertHodDepartment(req, departmentId);
      const record = await prisma.timetablePublish.upsert({
        where: { id: `${departmentId}_${semesterId}_${academicYearId}` },
        update: { status: 'HOD_REVIEW' },
        create: {
          id: `${departmentId}_${semesterId}_${academicYearId}`,
          departmentId,
          semesterId,
          academicYearId,
          status: 'HOD_REVIEW'
        }
      });
      res.status(200).json({ status: 'success', data: record });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Review timetable (Dean approval/rejection)
   */
  reviewTimetable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // compound id e.g. `${departmentId}_${semesterId}_${academicYearId}`
      const { status } = req.body; // 'DEAN_APPROVED' or 'DRAFT'

      const record = await prisma.timetablePublish.update({
        where: { id },
        data: { status }
      });
      res.status(200).json({ status: 'success', data: record });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Publish approved timetable
   */
  publishTimetable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const record = await prisma.timetablePublish.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });
      res.status(200).json({ status: 'success', data: record });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current publish status of department timetable
   */
  getPublishStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId, semesterId, academicYearId } = req.query as Record<string, string>;
      const record = await prisma.timetablePublish.findUnique({
        where: { id: `${departmentId}_${semesterId}_${academicYearId}` }
      });
      res.status(200).json({ status: 'success', data: record || { status: 'DRAFT' } });
    } catch (error) {
      next(error);
    }
  };
}
