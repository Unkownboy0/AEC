import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notifications/notification.service';

export class AssignmentController {
  // ─── Faculty: Create Assignment ───────────────────────────────────────────
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const {
        title,
        description,
        dueDate,
        maxMarks,
        subjectId,
        sectionId,
        semesterId,
        programId,
        departmentId,
        academicYearId,
        attachments,
        targetSubject,
        targetClass
      } = req.body;

      // Resolve faculty record
      const faculty = await prisma.faculty.findFirst({
        where: { userId: user.id, deleted: false },
        select: { id: true },
      });

      if (!faculty && !['SuperAdmin', 'HOD', 'Academic Dean', 'Principal', 'Vice Principal'].includes(user.role)) {
        return res.status(403).json({ status: 'error', message: 'Only faculty can create assignments.' });
      }

      const facultyId = faculty?.id;
      if (!facultyId) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
      }

      const data: any = {
        title,
        description,
        dueDate: new Date(dueDate),
        maxMarks: maxMarks ?? 100,
        facultyId,
        attachments: JSON.stringify(attachments ?? []),
        targetSubject: targetSubject ? String(targetSubject).trim() : null,
        targetClass: targetClass ? String(targetClass).trim() : null,
      };

      if (subjectId) data.subjectId = subjectId;
      if (sectionId) data.sectionId = sectionId;
      if (semesterId) data.semesterId = semesterId;
      if (programId) data.programId = programId;
      if (departmentId) data.departmentId = departmentId;
      if (academicYearId) data.academicYearId = academicYearId;

      if (!targetSubject && !targetClass) {
        // Resolve subject assignment to auto-populate missing fields
        const subjectAssign = await prisma.subjectAssignment.findFirst({
          where: { facultyId, subjectId: subjectId || '' },
          select: { 
            sectionId: true, 
            semesterId: true, 
            academicYearId: true,
            section: {
              select: { programId: true, departmentId: true }
            }
          }
        });

        const resolvedSectionId = sectionId || subjectAssign?.sectionId;
        const resolvedSemesterId = semesterId || subjectAssign?.semesterId;
        const resolvedProgramId = programId || subjectAssign?.section?.programId;
        const resolvedDepartmentId = departmentId || subjectAssign?.section?.departmentId;
        const resolvedAcademicYearId = academicYearId || subjectAssign?.academicYearId;

        if (!resolvedSectionId || !resolvedSemesterId || !resolvedProgramId || !resolvedDepartmentId || !resolvedAcademicYearId) {
          return res.status(400).json({ status: 'error', message: 'Could not resolve complete class mapping for subject assignment.' });
        }

        data.subjectId = subjectId;
        data.sectionId = resolvedSectionId;
        data.semesterId = resolvedSemesterId;
        data.programId = resolvedProgramId;
        data.departmentId = resolvedDepartmentId;
        data.academicYearId = resolvedAcademicYearId;
      }

      const assignment = await prisma.assignment.create({
        data,
        include: {
          subject: { select: { name: true, code: true } },
          section: { select: { name: true } },
          semester: { select: { name: true } },
          faculty: { select: { firstName: true, lastName: true } },
        },
      });

      // Emit canonical ASSIGNMENT_PUBLISHED domain event to target section students
      NotificationService.dispatchDomainEvent({
        eventType: 'ASSIGNMENT_PUBLISHED',
        actorUserId: user.id,
        entityType: 'ASSIGNMENT',
        entityId: assignment.id,
        title: `New Assignment: ${assignment.title}`,
        body: `${assignment.faculty ? `${assignment.faculty.firstName} ${assignment.faculty.lastName}` : 'Faculty'} published assignment "${assignment.title}". Due: ${new Date(assignment.dueDate).toLocaleDateString('en-IN')}`,
        priority: 'NORMAL',
        category: 'ACADEMIC',
        deepLinkRoute: '/student/assignments',
        sectionId: assignment.sectionId || undefined,
        metadata: {
          assignmentId: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          sectionId: assignment.sectionId,
        },
      }).catch((err) => console.error('[AssignmentController] Notification dispatch error:', err));

      res.status(201).json({ status: 'success', data: assignment });
    } catch (error) {
      next(error);
    }
  };

  // ─── List Assignments (context-aware) ────────────────────────────────────
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { semesterId, sectionId, subjectId, search } = req.query;

      let where: any = { deleted: false };

      // Faculty: only see their own assignments
      if (user.role === 'Faculty') {
        const faculty = await prisma.faculty.findFirst({
          where: { userId: user.id, deleted: false },
          select: { id: true },
        });
        if (faculty) where.facultyId = faculty.id;
      }

      // Student: only see assignments for their section/semester
      if (user.role === 'Student') {
        const student = await prisma.student.findFirst({
          where: { userId: user.id, deleted: false },
          select: { sectionId: true, semesterId: true },
        });
        if (student) {
          where.sectionId = student.sectionId;
          where.semesterId = student.semesterId;
        }
      }

      if (semesterId) where.semesterId = semesterId as string;
      if (sectionId) where.sectionId = sectionId as string;
      if (subjectId) where.subjectId = subjectId as string;

      if (search) {
        const searchStr = search as string;
        where.OR = [
          { title: { contains: searchStr } },
          { description: { contains: searchStr } },
          { targetSubject: { contains: searchStr } },
          { targetClass: { contains: searchStr } },
          { subject: { name: { contains: searchStr } } },
          { section: { name: { contains: searchStr } } },
        ];
      }

      const assignments = await prisma.assignment.findMany({
        where,
        include: {
          subject: { select: { name: true, code: true } },
          section: { select: { name: true } },
          semester: { select: { name: true } },
          program: { select: { name: true, code: true } },
          faculty: { select: { firstName: true, lastName: true, employeeId: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { dueDate: 'asc' },
      });

      // If student, attach their submission status to each assignment
      if (user.role === 'Student') {
        const student = await prisma.student.findFirst({
          where: { userId: user.id, deleted: false },
          select: { id: true },
        });
        if (student) {
          const mySubmissions = await prisma.assignmentSubmission.findMany({
            where: { studentId: student.id },
            select: { assignmentId: true, status: true, marksObtained: true, feedback: true, submittedAt: true },
          });
          const submissionMap = Object.fromEntries(mySubmissions.map((s) => [s.assignmentId, s]));

          const enriched = assignments.map((a) => ({
            ...a,
            mySubmission: submissionMap[a.id] || null,
          }));
          return res.status(200).json({ status: 'success', data: enriched });
        }
      }

      res.status(200).json({ status: 'success', data: assignments });
    } catch (error) {
      next(error);
    }
  };

  // ─── Get single Assignment ───────────────────────────────────────────────
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          subject: true,
          section: true,
          semester: true,
          program: true,
          department: true,
          faculty: { select: { firstName: true, lastName: true, employeeId: true } },
          submissions: {
            include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } },
            orderBy: { submittedAt: 'desc' },
          },
        },
      });

      if (!assignment || assignment.deleted) {
        return res.status(404).json({ status: 'error', message: 'Assignment not found.' });
      }

      res.status(200).json({ status: 'success', data: assignment });
    } catch (error) {
      next(error);
    }
  };

  // ─── Update Assignment (Faculty/Admin only) ───────────────────────────────
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, description, dueDate, maxMarks, status, attachments, targetSubject, targetClass } = req.body;

      const assignment = await prisma.assignment.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
          ...(maxMarks !== undefined && { maxMarks }),
          ...(status !== undefined && { status }),
          ...(attachments !== undefined && { attachments: JSON.stringify(attachments) }),
          ...(targetSubject !== undefined && { targetSubject: targetSubject ? String(targetSubject).trim() : null }),
          ...(targetClass !== undefined && { targetClass: targetClass ? String(targetClass).trim() : null }),
        },
      });

      res.status(200).json({ status: 'success', data: assignment });
    } catch (error) {
      next(error);
    }
  };

  // ─── Delete Assignment ───────────────────────────────────────────────────
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.assignment.update({ where: { id }, data: { deleted: true } });
      res.status(200).json({ status: 'success', message: 'Assignment deleted.' });
    } catch (error) {
      next(error);
    }
  };

  // ─── Student: Submit Assignment ──────────────────────────────────────────
  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: assignmentId } = req.params;
      const { fileUrl, fileName, fileSize, fileType } = req.body;
      const user = (req as any).user;

      const student = await prisma.student.findFirst({
        where: { userId: user.id, deleted: false },
        select: { id: true, programId: true, departmentId: true, semesterId: true, sectionId: true },
      });

      if (!student) {
        return res.status(403).json({ status: 'error', message: 'Only students can submit assignments.' });
      }

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment || assignment.deleted) {
        return res.status(404).json({ status: 'error', message: 'Assignment not found.' });
      }

      // Security validation: ensure the student belongs to the program, department, semester, and section of the assignment
      if (
        assignment.programId !== student.programId ||
        assignment.departmentId !== student.departmentId ||
        assignment.semesterId !== student.semesterId ||
        assignment.sectionId !== student.sectionId
      ) {
        return res.status(403).json({ status: 'error', message: 'You are not authorized to submit this assignment.' });
      }

      const isLate = new Date() > new Date(assignment.dueDate);

      const submission = await prisma.assignmentSubmission.upsert({
        where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
        create: {
          assignmentId,
          studentId: student.id,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize ? parseInt(fileSize, 10) : null,
          fileType: fileType || null,
          facultyId: assignment.facultyId,
          departmentId: assignment.departmentId,
          semesterId: assignment.semesterId,
          sectionId: assignment.sectionId,
          status: isLate ? 'LATE' : 'SUBMITTED',
          submittedAt: new Date(),
        },
        update: {
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize ? parseInt(fileSize, 10) : null,
          fileType: fileType || null,
          facultyId: assignment.facultyId,
          departmentId: assignment.departmentId,
          semesterId: assignment.semesterId,
          sectionId: assignment.sectionId,
          status: isLate ? 'LATE' : 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      res.status(200).json({ status: 'success', data: submission });
    } catch (error: any) {
      console.error("Database Insert Failed during assignment submission:", error);
      res.status(500).json({ status: 'error', message: error.message || 'Database Insert Failed during assignment submission' });
    }
  };

  // ─── Faculty: Grade Submission ───────────────────────────────────────────
  grade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { submissionId } = req.params;
      const { marksObtained, feedback } = req.body;

      const submission = await prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          marksObtained: parseInt(marksObtained, 10),
          feedback,
          status: 'GRADED',
        },
        include: {
          student: { select: { id: true, userId: true, firstName: true, lastName: true } },
          assignment: { select: { id: true, title: true, maxMarks: true } },
        },
      });

      if (submission.student?.userId) {
        NotificationService.dispatchDomainEvent({
          eventType: 'ASSIGNMENT_GRADED',
          actorUserId: user?.id,
          entityType: 'ASSIGNMENT',
          entityId: submission.assignmentId,
          title: `Assignment Graded: ${submission.assignment?.title || 'Assignment'}`,
          body: `Your submission for "${submission.assignment?.title || 'Assignment'}" has been graded: ${marksObtained}/${submission.assignment?.maxMarks || 100} marks.${feedback ? ` Feedback: ${feedback}` : ''}`,
          priority: 'NORMAL',
          category: 'ACADEMIC',
          deepLinkRoute: '/student/assignments',
          targetUserIds: [submission.student.userId],
          metadata: {
            submissionId: submission.id,
            assignmentId: submission.assignmentId,
            marksObtained: parseInt(marksObtained, 10),
            maxMarks: submission.assignment?.maxMarks,
          },
        }).catch((err) => console.error('[AssignmentController] Grading notification error:', err));
      }

      res.status(200).json({ status: 'success', data: submission });
    } catch (error) {
      next(error);
    }
  };

  // ─── Get submissions for an assignment (Faculty) ─────────────────────────
  getSubmissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: assignmentId } = req.params;

      const submissions = await prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: {
          student: {
            select: { firstName: true, lastName: true, admissionNo: true, email: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      res.status(200).json({ status: 'success', data: submissions });
    } catch (error) {
      next(error);
    }
  };
}
