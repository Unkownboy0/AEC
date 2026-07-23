import { Request, Response, NextFunction } from 'express';
import { AcademicsService } from './academics.service';
import { BadRequestException } from '../../utils/exceptions';
import { auditRequest, UserPayload } from '../../utils/security';
import { prisma } from '../../lib/prisma';

export class AcademicsController {
  private service = new AcademicsService();

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getDashboardStats();
      res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // DEPARTMENTS
  // ==========================================
  listDepts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listDepartments(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getDept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dept = await this.service.getDepartment(req.params.id);
      res.status(200).json({ status: 'success', data: dept });
    } catch (error) {
      next(error);
    }
  };

  createDept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const dept = await this.service.createDepartment(req.body, user.id, req.ip, req.headers['user-agent']);
      await auditRequest(req, 'CREATE', 'DEPARTMENTS', `Created Department: ${dept.name} (${dept.code})`, dept.id, 'Department');
      res.status(201).json({ status: 'success', data: dept });
    } catch (error) {
      next(error);
    }
  };

  updateDept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const dept = await this.service.updateDepartment(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      await auditRequest(req, 'UPDATE', 'DEPARTMENTS', `Updated Department details for: ${dept.code}`, dept.id, 'Department');
      res.status(200).json({ status: 'success', data: dept });
    } catch (error) {
      next(error);
    }
  };

  deleteDept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('departments', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Department deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // PROGRAMS
  // ==========================================
  listPrograms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listPrograms(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prog = await this.service.getProgram(req.params.id);
      res.status(200).json({ status: 'success', data: prog });
    } catch (error) {
      next(error);
    }
  };

  createProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const program = await this.service.createProgram(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data: program });
    } catch (error) {
      next(error);
    }
  };

  updateProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const program = await this.service.updateProgram(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data: program });
    } catch (error) {
      next(error);
    }
  };

  deleteProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('programs', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Program deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // COURSES
  // ==========================================
  listCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listCourses(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.service.getCourse(req.params.id);
      res.status(200).json({ status: 'success', data: course });
    } catch (error) {
      next(error);
    }
  };

  createCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const course = await this.service.createCourse(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data: course });
    } catch (error) {
      next(error);
    }
  };

  updateCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const course = await this.service.updateCourse(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data: course });
    } catch (error) {
      next(error);
    }
  };

  deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('courses', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Course deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // ACADEMIC YEARS
  // ==========================================
  listYears = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listYears(req.query);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getYear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = await this.service.getYear(req.params.id);
      res.status(200).json({ status: 'success', data: year });
    } catch (error) {
      next(error);
    }
  };

  createYear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const year = await this.service.createYear(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data: year });
    } catch (error) {
      next(error);
    }
  };

  updateYear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const year = await this.service.updateYear(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data: year });
    } catch (error) {
      next(error);
    }
  };

  deleteYear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('years', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Academic Year deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  cloneYear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const cloned = await this.service.cloneAcademicYear(req.params.id, req.body.targetName, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data: cloned });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // SEMESTERS
  // ==========================================
  listSemesters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listSemesters(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getSemester = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sem = await this.service.getSemester(req.params.id);
      res.status(200).json({ status: 'success', data: sem });
    } catch (error) {
      next(error);
    }
  };

  createSemester = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const sem = await this.service.createSemester(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data: sem });
    } catch (error) {
      next(error);
    }
  };

  updateSemester = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const sem = await this.service.updateSemester(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data: sem });
    } catch (error) {
      next(error);
    }
  };

  deleteSemester = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('semesters', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Semester deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // SECTIONS
  // ==========================================
  listSections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listSections(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sec = await this.service.getSection(req.params.id);
      res.status(200).json({ status: 'success', data: sec });
    } catch (error) {
      next(error);
    }
  };

  createSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const section = await this.service.createSection(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data: section });
    } catch (error) {
      next(error);
    }
  };

  updateSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const section = await this.service.updateSection(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data: section });
    } catch (error) {
      next(error);
    }
  };

  deleteSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('sections', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Section deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // SUBJECTS
  // ==========================================
  listSubjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listSubjects(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sub = await this.service.getSubject(req.params.id);
      res.status(200).json({ status: 'success', data: sub });
    } catch (error) {
      next(error);
    }
  };

  createSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const subject = await this.service.createSubject(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data: subject });
    } catch (error) {
      next(error);
    }
  };

  updateSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const subject = await this.service.updateSubject(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data: subject });
    } catch (error) {
      next(error);
    }
  };

  deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('subjects', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Subject deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // BULK SERVICES
  // ==========================================
  bulkAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleKey, action, ids } = req.body;
      if (!moduleKey || !action || !ids || !Array.isArray(ids)) {
        throw new BadRequestException('moduleKey, action, and ids array are required');
      }

      const user = (req as any).user;

      if (action === 'delete') {
        await this.service.bulkDelete(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
      } else if (action === 'archive') {
        await this.service.bulkArchive(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
      } else if (action === 'restore') {
        await this.service.bulkRestore(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
      } else {
        throw new BadRequestException('Invalid bulk action');
      }

      res.status(200).json({ status: 'success', message: `Bulk ${action} executed successfully` });
    } catch (error) {
      next(error);
    }
  };

  importPreview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleKey, rows } = req.body;
      const preview = await this.service.previewImport(moduleKey, rows);
      res.status(200).json({ status: 'success', data: preview });
    } catch (error) {
      next(error);
    }
  };

  importCommit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleKey, rows } = req.body;
      const user = (req as any).user;
      const result = await this.service.executeImport(moduleKey, rows, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // SUBJECT ASSIGNMENTS (FACULTY ALLOCATION)
  // ==========================================
  listSubjectAssignments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { academicYearId, departmentId, semesterId, sectionId, facultyId } = req.query;

      const filters: any = {};
      if (academicYearId) filters.academicYearId = academicYearId as string;
      if (semesterId) filters.semesterId = semesterId as string;
      if (sectionId) filters.sectionId = sectionId as string;
      if (facultyId) filters.facultyId = facultyId as string;

      // Route departmentId filter through subject relation
      if (departmentId) {
        filters.subject = { ...(filters.subject || {}), departmentId: departmentId as string };
      }

      // Scope: HOD/Faculty can only see their own department
      if (user.role === 'HOD' || user.role === 'Faculty') {
        const deptId = await this.service.getFacultyDeptId(user.id);
        if (deptId) {
          filters.subject = { ...(filters.subject || {}), departmentId: deptId };
        }
      }

      const items = await prisma.subjectAssignment.findMany({
        where: filters,
        include: {
          faculty: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
          subject: { select: { id: true, name: true, code: true, credits: true } },
          section: { select: { id: true, name: true } },
          semester: { select: { id: true, name: true } },
          academicYear: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      next(error);
    }
  };

  createSubjectAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { facultyId, subjectId, sectionId, semesterId, academicYearId, isMentor } = req.body;

      if (!facultyId || !subjectId || !sectionId || !semesterId || !academicYearId) {
        return res.status(400).json({ status: 'error', message: 'All fields (facultyId, subjectId, sectionId, semesterId, academicYearId) are required.' });
      }

      // Check for existing assignment to prevent duplicates
      const existing = await prisma.subjectAssignment.findFirst({
        where: { facultyId, subjectId, sectionId, semesterId },
      });

      if (existing) {
        return res.status(400).json({ status: 'error', message: 'This subject/section is already assigned to this faculty member.' });
      }

      const item = await prisma.subjectAssignment.create({
        data: {
          facultyId,
          subjectId,
          sectionId,
          semesterId,
          academicYearId,
          isMentor: !!isMentor,
        },
      });

      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  deleteSubjectAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.subjectAssignment.delete({ where: { id } });
      res.status(200).json({ status: 'success', message: 'Subject assignment removed successfully.' });
    } catch (error) {
      next(error);
    }
  };

  facultyCreateSubjectAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const {
        departmentId, programId, academicYearId, semesterId, sectionId,
        subjectCode, subjectName, subjectType, credits, teachingHours
      } = req.body;

      if (!departmentId || !programId || !academicYearId || !semesterId || !sectionId || !subjectCode || !subjectName) {
        return res.status(400).json({ status: 'error', message: 'Department, Program, Academic Year, Semester, Section, Subject Code, and Subject Name are required.' });
      }

      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (!faculty) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
      }

      let subject = await prisma.subject.findFirst({
        where: { code: subjectCode, deleted: false }
      });

      if (!subject) {
        const isLab = subjectType === 'Lab';
        const isElective = subjectType === 'Elective';
        
        subject = await prisma.subject.create({
          data: {
            code: subjectCode,
            name: subjectName,
            credits: parseInt(credits, 10) || 3,
            theoryHours: isLab ? 0 : (parseInt(teachingHours, 10) || 3),
            practicalHours: isLab ? (parseInt(teachingHours, 10) || 3) : 0,
            isLab,
            isElective,
            semesterId,
            departmentId,
            programId,
            sectionId
          }
        });
      }

      const existing = await prisma.subjectAssignment.findFirst({
        where: {
          facultyId: faculty.id,
          subjectId: subject.id,
          sectionId,
          semesterId
        }
      });

      if (existing) {
        return res.status(400).json({ status: 'error', message: 'This subject/section is already assigned to you.' });
      }

      const assignment = await prisma.subjectAssignment.create({
        data: {
          facultyId: faculty.id,
          subjectId: subject.id,
          sectionId,
          semesterId,
          academicYearId,
          isMentor: false
        },
        include: {
          subject: true,
          section: true,
          semester: true,
          academicYear: true
        }
      });

      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          module: 'ACADEMICS',
          description: `Faculty manually assigned subject ${subjectName} (${subjectCode}) to self`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(201).json({ status: 'success', data: assignment });
    } catch (error) {
      next(error);
    }
  };

  facultyUpdateSubjectAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { subjectName, teachingHours, sectionId, status, subjectType } = req.body;

      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (!faculty) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
      }

      const assignment = await prisma.subjectAssignment.findUnique({
        where: { id },
        include: { subject: true }
      });

      if (!assignment) {
        return res.status(404).json({ status: 'error', message: 'Subject assignment not found.' });
      }

      if (assignment.facultyId !== faculty.id && user.role !== 'Super Admin' && user.role !== 'HOD') {
        return res.status(403).json({ status: 'error', message: 'You can only update your own assigned subjects.' });
      }

      const updateData: any = {};
      if (sectionId) updateData.sectionId = sectionId;

      const updatedAssignment = await prisma.subjectAssignment.update({
        where: { id },
        data: updateData,
        include: { subject: true, section: true, semester: true }
      });

      if (assignment.subjectId) {
        const isLab = subjectType === 'Lab';
        const isElective = subjectType === 'Elective';
        
        await prisma.subject.update({
          where: { id: assignment.subjectId },
          data: {
            name: subjectName || undefined,
            theoryHours: teachingHours ? (isLab ? 0 : parseInt(teachingHours, 10)) : undefined,
            practicalHours: teachingHours ? (isLab ? parseInt(teachingHours, 10) : 0) : undefined,
            isLab,
            isElective,
            status: status || undefined
          }
        });
      }

      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          module: 'ACADEMICS',
          description: `Updated subject assignment ${id} details`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(200).json({ status: 'success', data: updatedAssignment });
    } catch (error) {
      next(error);
    }
  };

  facultyDeleteSubjectAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (!faculty) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
      }

      const assignment = await prisma.subjectAssignment.findUnique({
        where: { id }
      });

      if (!assignment) {
        return res.status(404).json({ status: 'error', message: 'Subject assignment not found.' });
      }

      if (assignment.facultyId !== faculty.id && user.role !== 'Super Admin' && user.role !== 'HOD') {
        return res.status(403).json({ status: 'error', message: 'You can only delete your own assigned subjects.' });
      }

      await prisma.subjectAssignment.delete({ where: { id } });

      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          module: 'ACADEMICS',
          description: `Removed subject assignment ${id}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(200).json({ status: 'success', message: 'Subject assignment removed successfully.' });
    } catch (error) {
      next(error);
    }
  };
}
