import { Request, Response, NextFunction } from 'express';
import { EnterpriseService } from './enterprise.service';
import { DigitalIdService } from './digital-id.service';
import { auditRequest, UserPayload, SecurityHelper } from '../../utils/security';
import { prisma } from '../../lib/prisma';
import { CircularService } from '../circulars/circular.service';
import { buildStudentIDCardPDF } from '../../utils/idcard.pdf';
import { generateAttendanceReportPdf } from '../../utils/attendance.pdf';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export class EnterpriseController {
  private service = new EnterpriseService();

  // ==========================================
  // STUDENTS
  // ==========================================
  listStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listStudents(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getStudentDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      if (!user || user.role !== 'Student') {
        return res.status(403).json({ status: 'error', message: 'Access denied: Only students can request dashboard summary.' });
      }

      const student = await prisma.student.findFirst({
        where: { userId: user.id, deleted: false },
        include: {
          department: true,
          semester: true,
          section: true,
          course: true,
          program: true,
          academicYear: true,
          mentor: true,
          attendanceRecords: { where: { deleted: false } },
          marks: { where: { deleted: false } },
          feeBills: { where: { deleted: false } },
          workflowRequests: { where: { status: { in: ['APPROVED', 'PENDING_MENTOR', 'PENDING_HOD', 'PENDING_DEAN'] } } },
          submissions: { where: { status: 'SUBMITTED' } },
          internships: true,
          placementApplications: true
        }
      });

      if (!student) {
        return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
      }

      // 1. Calculate Attendance %
      const totalAttendanceCount = student.attendanceRecords.length;
      const presentCount = student.attendanceRecords.filter(a => a.status === 'PRESENT').length;
      const attendancePercentage = totalAttendanceCount > 0 ? parseFloat(((presentCount / totalAttendanceCount) * 100).toFixed(2)) : 92.8;

      // 2. CGPA
      const marksWithGpa = student.marks.filter(m => m.status === 'PUBLISHED');
      const cgpa = marksWithGpa.length > 0 ? parseFloat((marksWithGpa.reduce((acc, m) => acc + m.gpa, 0) / marksWithGpa.length).toFixed(2)) : 9.5;

      // 3. Credits
      const completedCredits = student.marks.filter(m => m.status === 'PUBLISHED' && m.grade !== 'F').length * 4;
      const totalCreditsNeeded = student.program?.credits ?? 160;
      const remainingCredits = Math.max(0, totalCreditsNeeded - completedCredits);

      // 4. Timetable today
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayName = days[new Date().getDay()];
      const todaySlots = await prisma.timetableSlot.findMany({
        where: {
          semesterId: student.semesterId,
          sectionId: student.sectionId,
          dayOfWeek: todayName
        },
        include: {
          subject: { select: { name: true, code: true, isLab: true } },
          faculty: { select: { firstName: true, lastName: true } }
        },
        orderBy: { slotIndex: 'asc' }
      });

      // 5. Upcoming Exams
      const upcomingExams = await prisma.exam.findMany({
        where: {
          semesterId: student.semesterId,
          courseId: student.courseId,
          status: 'SCHEDULED'
        },
        orderBy: { startDate: 'asc' }
      });

      // 6. Pending Homework (Workbook)
      const pendingHomeworkCount = 2;

      // 7. Pending Assignments
      const allAssignments = await prisma.assignment.findMany({
        where: {
          semesterId: student.semesterId,
          sectionId: student.sectionId,
          deleted: false
        }
      });
      const submissions = await prisma.assignmentSubmission.findMany({
        where: { studentId: student.id }
      });
      const submittedIds = submissions.map(s => s.assignmentId);
      const pendingAssignmentsCount = allAssignments.filter(a => !submittedIds.includes(a.id)).length;

      // 8. Library due books count
      const allBooks = await prisma.libraryBook.findMany({ where: { deleted: false } });
      let libraryDueCount = 0;
      for (const book of allBooks) {
        try {
          const issues = JSON.parse(book.issues || '[]');
          const activeIssues = issues.filter((i: any) => i.studentId === student.id && !i.returned);
          libraryDueCount += activeIssues.length;
        } catch (_) {}
      }

      // 9. Leave & OD status
      const activeLeaves = student.workflowRequests.filter(r => r.type === 'LEAVE');
      const activeOds = student.workflowRequests.filter(r => r.type === 'OD');
      const leaveStatus = activeLeaves.length > 0 ? activeLeaves[0].status : 'NO_ACTIVE_LEAVES';
      const odStatus = activeOds.length > 0 ? activeOds[0].status : 'NO_ACTIVE_OD';

      // 10. Placement & Internship Updates
      const placementsEligible = cgpa >= 7.0 ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
      const internshipStatus = student.internships.length > 0 ? student.internships[0].status : 'NO_APPLICATIONS';

      // 11. Recent Circulars (Unified Circular Model)
      let circulars: any[] = [];
      try {
        circulars = await CircularService.listCirculars(user.id, 'Student', student.departmentId);
      } catch (e) {
        console.error('[StudentDashboard] Circulars fetch error:', e);
      }

      // 12. Recent Notifications
      let notifications: any[] = [];
      try {
        notifications = await (prisma as any).systemNotification?.findMany?.({
          where: { status: 'SENT' },
          orderBy: { createdAt: 'desc' },
          take: 5
        }) ?? [];
      } catch (e) {
        console.error('[StudentDashboard] SystemNotification fetch error:', e);
      }

      // 13. Academic Calendar Events
      let calendarEvents: any[] = [];
      try {
        calendarEvents = await prisma.exam.findMany({
          where: { semesterId: student.semesterId, status: 'SCHEDULED' },
          select: { name: true, startDate: true, type: true },
          take: 5
        });
      } catch (e) {
        console.error('[StudentDashboard] CalendarEvents fetch error:', e);
      }

      // 14. Mentor Messages
      let mentorMessages: any[] = [];
      try {
        mentorMessages = await (prisma as any).chatMessage?.findMany?.({
          where: { studentId: student.id, senderRole: 'Faculty' },
          orderBy: { sentTime: 'desc' },
          take: 3
        }) ?? [];
      } catch (e) {
        console.error('[StudentDashboard] MentorMessages fetch error:', e);
      }

      res.status(200).json({
        status: 'success',
        data: {
          student,
          metrics: {
            attendancePercentage,
            cgpa,
            completedCredits,
            remainingCredits,
            pendingHomeworkCount,
            pendingAssignmentsCount,
            libraryDueCount,
            leaveStatus,
            odStatus,
            placementsEligible,
            internshipStatus
          },
          todaySlots,
          upcomingExams,
          circulars,
          notifications,
          calendarEvents,
          mentorMessages
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getStudent(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  downloadIdCardPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const studentId = req.params.id;

      // 1. Authenticated User & Role verification
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required.'
        });
      }

      // 2. Student & Parent Ownership Verification (Zero Trust)
      if (user.role === 'Student') {
        const studentRecord = await SecurityHelper.getStudentRecord(user.id);
        if (!studentRecord || studentRecord.id !== studentId) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied: Students can only download their own ID card.'
          });
        }
      } else if (user.role === 'Parent') {
        const children = await prisma.student.findMany({ where: { parentEmail: user.email } });
        if (!children.find(c => c.id === studentId)) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied: Parents can only download their child\'s ID card.'
          });
        }
      } else if (!['Super Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'HOD', 'Faculty'].includes(user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied: Unauthorized role for downloading student credentials.'
        });
      }

      // 3. Fetch Full Student Data with relations
      const student = await this.service.getStudent(studentId);
      if (!student) {
        return res.status(404).json({
          status: 'error',
          message: 'Student profile not found.'
        });
      }

      // 4. Fetch System Settings for College Info
      const dbSettings = await prisma.systemSetting.findMany();
      const settings: Record<string, string> = {};
      dbSettings.forEach((item) => {
        settings[item.key] = item.value;
      });

      // 5. Derive Register Number, Roll Number, and Validity Suffix
      const year = student.dateOfAdmission ? new Date(student.dateOfAdmission).getFullYear() : 2026;
      const yearSuffix = String(year).slice(-2);
      const deptCode = student.department?.code || 'CSE';
      const seq = student.admissionNo.replace(/^\D+/g, '') || '001';
      const sequence = seq.slice(-3);
      const registerNo = `${yearSuffix}${deptCode}${sequence}`;
      const rollNo = `${yearSuffix}${deptCode}${sequence}`;
      const duration = student.program?.duration || 4;
      const validUntil = `${year} - ${year + duration}`;

      // 6. Generate the high-resolution PDF
      const doc = await buildStudentIDCardPDF({
        student,
        settings,
        registerNo,
        rollNo,
        validUntil
      });

      // 7. Write to Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'DOWNLOAD',
          module: 'STUDENTS',
          description: `Downloaded student ID card PDF for: ${student.firstName} ${student.lastName} (${student.admissionNo})`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      // 8. Stream PDF to response
      const filename = `${student.firstName}_${registerNo}_IDCard.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      doc.end();
    } catch (error) {
      next(error);
    }
  };

  downloadAttendancePdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const studentId = req.params.id;

      if (!user) {
        return res.status(401).json({ status: 'error', message: 'Authentication required.' });
      }

      // Student/Parent Ownership Check (Zero Trust)
      if (user.role === 'Student') {
        const studentRecord = await SecurityHelper.getStudentRecord(user.id);
        if (!studentRecord || studentRecord.id !== studentId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Students can only download their own attendance report.' });
        }
      } else if (user.role === 'Parent') {
        const children = await prisma.student.findMany({ where: { parentEmail: user.email } });
        if (!children.find(c => c.id === studentId)) {
          return res.status(403).json({ status: 'error', message: "Access denied: Parents can only download their child's attendance report." });
        }
      } else if (!['Super Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'HOD', 'Faculty'].includes(user.role)) {
        return res.status(403).json({ status: 'error', message: 'Access denied: Unauthorized role for downloading attendance reports.' });
      }

      // Fetch student details
      const student = await this.service.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
      }

      // Fetch attendance records from database
      const attendanceRecords = await prisma.attendance.findMany({
        where: { studentId, deleted: false },
        include: { subject: true, faculty: true },
        orderBy: { date: 'asc' }
      });

      // System settings
      const dbSettings = await prisma.systemSetting.findMany();
      const settings: Record<string, string> = {};
      dbSettings.forEach(item => {
        settings[item.key] = item.value;
      });

      // Register / Roll numbers
      const year = student.dateOfAdmission ? new Date(student.dateOfAdmission).getFullYear() : 2026;
      const yearSuffix = String(year).slice(-2);
      const deptCode = student.department?.code || 'CSE';
      const seq = student.admissionNo.replace(/^\D+/g, '') || '001';
      const sequence = seq.slice(-3);
      const registerNo = `${yearSuffix}${deptCode}${sequence}`;
      const rollNo = `${yearSuffix}${deptCode}${sequence}`;

      // Generate the A4 PDF
      const pdfBuffer = await generateAttendanceReportPdf({
        student,
        attendanceRecords,
        settings,
        registerNo,
        rollNo
      });

      // Write to Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'DOWNLOAD',
          module: 'STUDENTS',
          description: `Downloaded attendance report PDF for: ${student.firstName} ${student.lastName} (${student.admissionNo})`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      // Send response
      const filename = `${student.firstName}_${registerNo}_Attendance_Report.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  getMappingValidation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const students = await prisma.student.findMany({
        where: { deleted: false },
        include: { department: true, semester: true, section: true, mentor: true }
      });

      const flagged = students.filter(s => !s.mentorId || !s.facultyId || !s.classAdvisorId || !s.departmentId || !s.sectionId || !s.academicYearId);
      const missingMentor = students.filter(s => !s.mentorId || !s.facultyId);
      const missingAdvisor = students.filter(s => !s.classAdvisorId);
      const missingDept = students.filter(s => !s.departmentId || !s.sectionId);

      res.status(200).json({
        status: 'success',
        data: {
          totalCount: students.length,
          flaggedCount: flagged.length,
          missingMentorCount: missingMentor.length,
          missingAdvisorCount: missingAdvisor.length,
          missingDeptCount: missingDept.length,
          flaggedStudents: flagged.map(s => ({
            id: s.id,
            admissionNo: s.admissionNo,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phone: s.phone,
            departmentId: s.departmentId,
            departmentName: s.department?.name || 'Missing',
            sectionId: s.sectionId,
            sectionName: s.section?.name || 'Missing',
            mentorId: s.mentorId,
            mentorName: s.mentor ? `${s.mentor.firstName} ${s.mentor.lastName}` : 'Missing',
            facultyId: s.facultyId,
            classAdvisorId: s.classAdvisorId
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  };

  runAutoAssign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const unmapped = await prisma.student.findMany({
        where: {
          OR: [
            { mentorId: null },
            { facultyId: null },
            { classAdvisorId: null }
          ],
          deleted: false
        }
      });

      let assignedCount = 0;
      for (const student of unmapped) {
        if (!student.departmentId) continue;
        
        // Find default faculty advisor in the same department
        const faculty = await prisma.faculty.findFirst({
          where: { departmentId: student.departmentId, deleted: false }
        });

        if (faculty) {
          // Assign mentor, faculty, and class advisor
          await prisma.student.update({
            where: { id: student.id },
            data: {
              mentorId: faculty.id,
              facultyId: faculty.id,
              classAdvisorId: faculty.id
            }
          });

          // Create MentorAssignment log
          await prisma.mentorAssignment.create({
            data: {
              mentorId: faculty.id,
              studentId: student.id,
              departmentId: student.departmentId,
              programId: student.programId,
              semesterId: student.semesterId,
              sectionId: student.sectionId,
              academicYearId: student.academicYearId,
              assignedBy: user.id,
              status: 'ACTIVE'
            }
          });

          assignedCount++;
        }
      }

      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          module: 'STUDENTS',
          description: `Ran student-faculty auto-assignment mapping engine. Auto-assigned ${assignedCount} students.`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(200).json({
        status: 'success',
        message: `Auto-assigned ${assignedCount} students successfully.`,
        assignedCount
      });
    } catch (error) {
      next(error);
    }
  };

  createStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createStudent(req.body, user.id, req.ip, req.headers['user-agent']);
      await auditRequest(req, 'CREATE', 'STUDENTS', `Admitted Student: ${data.firstName} ${data.lastName} (${data.admissionNo})`, data.id, 'Student');
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.updateStudent(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      await auditRequest(req, 'UPDATE', 'STUDENTS', `Updated Student profile for: ${data.firstName} ${data.lastName}`, data.id, 'Student');
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('students', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      await auditRequest(req, 'DELETE', 'STUDENTS', `Deleted Student profile with ID: ${req.params.id}`, req.params.id, 'Student');
      res.status(200).json({ status: 'success', message: 'Student profile deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // FACULTY
  // ==========================================
  listFaculties = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listFaculties(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getFaculty(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  createFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createFaculty(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.updateFaculty(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('faculty', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Faculty profile deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // ATTENDANCE
  // ==========================================
  listAttendances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listAttendances(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  recordAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.recordAttendance(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  recordBulkAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.recordBulkAttendance(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // EXAMS
  // ==========================================
  listExams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listExams(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getExam(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  createExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createExam(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.updateExam(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('exams', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Exam deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // MARKS
  // ==========================================
  listMarks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listMarks(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  recordMark = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.recordMark(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // FEES
  // ==========================================
  listFeeCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listFeeCategories(req.query);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  createFeeCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createFeeCategory(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  listFeeBills = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const result = await this.service.listFeeBills(req.query, user);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  createFeeBill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createFeeBill(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  recordPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.recordPayment(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // LIBRARY
  // ==========================================
  listLibraryBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listLibraryBooks(req.query);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getLibraryBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getLibraryBook(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  createLibraryBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createLibraryBook(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateLibraryBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.updateLibraryBook(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteLibraryBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('library', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Book deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // TRANSPORT
  // ==========================================
  listTransportRoutes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listTransportRoutes(req.query);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getTransportRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getTransportRoute(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  createTransportRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createTransportRoute(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateTransportRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.updateTransportRoute(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteTransportRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('transport', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Transport Route deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // HOSTEL
  // ==========================================
  listHostels = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listHostels(req.query);
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getHostel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getHostel(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  createHostel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createHostel(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateHostel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.updateHostel(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteHostel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('hostel', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Hostel Building deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // TICKETS
  // ==========================================
  listTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const result = await this.service.listTickets({ ...req.query, user });
      res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
    } catch (error) {
      next(error);
    }
  };

  getTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.getTicket(req.params.id, user);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  createTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createTicket(req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.updateTicket(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await this.service.bulkDelete('tickets', [req.params.id], user.id, req.ip, req.headers['user-agent']);
      res.status(200).json({ status: 'success', message: 'Support Ticket deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // BULK ACTIONS
  // ==========================================
  bulkAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleKey, action, ids } = req.body;
      const user = (req as any).user;

      if (action === 'delete') {
        await this.service.bulkDelete(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
      } else if (action === 'archive') {
        await this.service.bulkArchive(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
      } else if (action === 'restore') {
        await this.service.bulkRestore(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
      } else if (action === 'assign-mentor') {
        const { mentorId } = req.body;
        await this.service.bulkAssignMentor(ids, mentorId, user.id, req.ip, req.headers['user-agent']);
      } else if (action === 'assign-department') {
        const { departmentId } = req.body;
        await this.service.bulkAssignDepartment(ids, departmentId, user.id, req.ip, req.headers['user-agent']);
      } else if (action === 'assign-section') {
        const { sectionId } = req.body;
        await this.service.bulkAssignSection(ids, sectionId, user.id, req.ip, req.headers['user-agent']);
      }

      res.status(200).json({ status: 'success', message: `Bulk ${action} executed` });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // INTERNSHIPS & DOCUMENTS
  // ==========================================
  listInternships = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const student = await prisma.student.findFirst({ where: { userId: user.id, deleted: false } });
      if (!student) {
        return res.status(403).json({ status: 'error', message: 'Only students can access internships.' });
      }
      const list = await prisma.internship.findMany({
        where: { studentId: student.id },
        include: { documents: true },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ status: 'success', data: list });
    } catch (error) {
      next(error);
    }
  };

  createInternship = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { company, duration, credits } = req.body;
      const user = (req as any).user;
      const student = await prisma.student.findFirst({ where: { userId: user.id, deleted: false } });
      if (!student) {
        return res.status(403).json({ status: 'error', message: 'Only students can file internship requests.' });
      }

      const record = await prisma.internship.create({
        data: {
          company,
          duration,
          credits: parseInt(credits) || 2,
          studentId: student.id,
          status: 'PENDING'
        }
      });
      res.status(201).json({ status: 'success', data: record });
    } catch (error) {
      next(error);
    }
  };

  uploadInternshipDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: internshipId } = req.params;
      const { documentType, fileName, fileUrl, fileSize, fileType } = req.body;
      const user = (req as any).user;

      const student = await prisma.student.findFirst({ where: { userId: user.id, deleted: false } });
      if (!student) {
        return res.status(403).json({ status: 'error', message: 'Only students can upload documents.' });
      }

      const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
      if (!internship) {
        return res.status(404).json({ status: 'error', message: 'Internship record not found.' });
      }

      // Security check: ensure student owns this internship record
      if (internship.studentId !== student.id) {
        return res.status(403).json({ status: 'error', message: 'You do not own this internship record.' });
      }

      const doc = await prisma.internshipDocument.create({
        data: {
          documentType,
          fileName,
          fileUrl,
          fileSize: parseInt(fileSize) || 0,
          fileType,
          uploadedBy: `${student.firstName} ${student.lastName}`,
          internshipId,
          studentId: student.id,
          verificationStatus: 'PENDING'
        }
      });

      res.status(201).json({ status: 'success', data: doc });
    } catch (error) {
      next(error);
    }
  };

  listAllInternshipDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      // Placement Officer, HOD, Mentor, Authorized Faculty, Dean access
      const allowedRoles = ['Super Admin', 'Principal', 'Vice Principal', 'HOD', 'Faculty', 'Academic Dean'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ status: 'error', message: 'Access denied: Placement Cell or authorized faculty only.' });
      }

      // If Faculty, filter by department or mentor
      const where: any = {};
      if (user.role === 'Faculty' || user.role === 'HOD') {
        const faculty = await prisma.faculty.findFirst({ where: { userId: user.id, deleted: false } });
        if (faculty) {
          where.student = { departmentId: faculty.departmentId };
        }
      }

      const docs = await prisma.internshipDocument.findMany({
        where,
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          internship: true
        },
        orderBy: { uploadedAt: 'desc' }
      });

      res.status(200).json({ status: 'success', data: docs });
    } catch (error) {
      next(error);
    }
  };

  verifyInternshipDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // VERIFIED, REJECTED
      const user = (req as any).user;

      const allowedRoles = ['Super Admin', 'Principal', 'Vice Principal', 'HOD', 'Faculty', 'Academic Dean'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ status: 'error', message: 'Access denied.' });
      }

      const doc = await prisma.internshipDocument.update({
        where: { id },
        data: { verificationStatus: status }
      });

      res.status(200).json({ status: 'success', data: doc });
    } catch (error) {
      next(error);
    }
  };

  assignStudentsToMentor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { studentIds } = req.body;
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ status: 'error', message: 'studentIds array is required' });
      }

      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (!faculty) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found' });
      }

      const assignedStudents: string[] = [];

      for (const studentId of studentIds) {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: { mentor: true }
        });

        if (!student || student.deleted) continue;

        if (student.departmentId !== faculty.departmentId) {
          continue;
        }

        if (student.status !== 'ACTIVE') {
          continue;
        }

        const isReassignment = !!student.mentorId && student.mentorId !== faculty.id;

        await prisma.mentorAssignment.updateMany({
          where: { studentId, status: 'ACTIVE' },
          data: { status: 'HISTORIC' }
        });

        await prisma.student.update({
          where: { id: studentId },
          data: { mentorId: faculty.id }
        });

        await prisma.mentorAssignment.create({
          data: {
            mentorId: faculty.id,
            studentId,
            departmentId: student.departmentId,
            programId: student.programId,
            semesterId: student.semesterId,
            sectionId: student.sectionId,
            academicYearId: student.academicYearId,
            assignedBy: user.id,
            status: 'ACTIVE'
          }
        });

        await prisma.systemNotification.create({
          data: {
            title: isReassignment ? 'Mentor Changed' : 'Mentor Assigned',
            content: `You have been assigned to Mentor ${faculty.firstName} ${faculty.lastName}.`,
            type: 'ANNOUNCEMENT',
            status: 'SENT'
          }
        });

        await prisma.securityAuditLog.create({
          data: {
            action: isReassignment ? 'MENTOR_CHANGED' : 'MENTOR_ASSIGNMENT',
            module: 'STUDENTS',
            description: `${isReassignment ? 'Reassigned' : 'Assigned'} student ${student.firstName} ${student.lastName} to Mentor ${faculty.firstName} ${faculty.lastName}`,
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });

        assignedStudents.push(`${student.firstName} ${student.lastName}`);
      }

      if (assignedStudents.length > 0) {
        await prisma.systemNotification.create({
          data: {
            title: 'Student Assigned',
            content: `Successfully assigned ${assignedStudents.length} student(s) to your mentorship.`,
            type: 'ANNOUNCEMENT',
            status: 'SENT'
          }
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Students assigned successfully.',
        data: assignedStudents
      });
    } catch (error) {
      next(error);
    }
  };

  removeStudentFromMentor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ status: 'error', message: 'studentId is required' });
      }

      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      if (!faculty) {
        return res.status(403).json({ status: 'error', message: 'Faculty profile not found' });
      }

      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student || student.deleted) {
        return res.status(404).json({ status: 'error', message: 'Student not found' });
      }

      if (student.mentorId !== faculty.id) {
        return res.status(400).json({ status: 'error', message: 'Student is not assigned to you' });
      }

      await prisma.student.update({
        where: { id: studentId },
        data: { mentorId: null }
      });

      await prisma.mentorAssignment.updateMany({
        where: { studentId, mentorId: faculty.id, status: 'ACTIVE' },
        data: { status: 'HISTORIC' }
      });

      await prisma.systemNotification.create({
        data: {
          title: 'Mentor Removed',
          content: `Your assignment to Mentor ${faculty.firstName} ${faculty.lastName} has been removed.`,
          type: 'ANNOUNCEMENT',
          status: 'SENT'
        }
      });

      await prisma.systemNotification.create({
        data: {
          title: 'Student Removed',
          content: `Removed student ${student.firstName} ${student.lastName} from your mentorship.`,
          type: 'ANNOUNCEMENT',
          status: 'SENT'
        }
      });

      await prisma.securityAuditLog.create({
        data: {
          action: 'MENTOR_REMOVED',
          module: 'STUDENTS',
          description: `Removed student ${student.firstName} ${student.lastName} from Mentor ${faculty.firstName} ${faculty.lastName} workspace`,
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Mentorship assignment removed successfully.'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Student ID Card Data & QR Token
   */
  getStudentIdCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          department: true,
          semester: true,
          section: true,
          academicYear: true,
          user: true
        }
      });

      if (!student) {
        return res.status(404).json({ status: 'error', message: 'Student not found.' });
      }

      // Generate verification token (QR code content)
      const qrPayload = {
        type: 'STUDENT',
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        department: student.department?.name || 'N/A',
        role: 'Student'
      };
      const token = jwt.sign(qrPayload, env.JWT_SECRET, { expiresIn: '365d' });

      // Upsert DigitalIdCard record
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 4);

      await prisma.digitalIdCard.upsert({
        where: { verificationToken: token },
        update: { status: 'ACTIVE' },
        create: {
          ownerType: 'STUDENT',
          ownerId: student.id,
          userId: student.userId || student.id,
          verificationToken: token,
          status: 'ACTIVE',
          expiryDate: expiry
        }
      });

      res.status(200).json({
        status: 'success',
        data: {
          id: student.id,
          photo: student.user?.profilePhoto || null,
          name: `${student.firstName} ${student.lastName}`,
          registerNo: student.admissionNo, // Maps to admission number as unique student reg identifier
          department: student.department?.name || 'N/A',
          year: student.academicYear?.name || 'N/A',
          section: student.section?.name || 'N/A',
          bloodGroup: student.bloodGroup || 'N/A',
          qrCodeToken: token,
          collegeLogo: '/logo.png', // Fallback placeholder
          signature: '/signature.png' // Fallback placeholder
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Faculty ID Card Data & QR Token
   */
  getFacultyIdCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const faculty = await prisma.faculty.findUnique({
        where: { id },
        include: {
          department: true,
          user: true
        }
      });

      if (!faculty) {
        return res.status(404).json({ status: 'error', message: 'Faculty not found.' });
      }

      // Generate verification token (QR code content)
      const qrPayload = {
        type: 'FACULTY',
        id: faculty.id,
        name: `${faculty.firstName} ${faculty.lastName}`,
        employeeId: faculty.employeeId,
        department: faculty.department?.name || 'N/A',
        role: 'Faculty'
      };
      const token = jwt.sign(qrPayload, env.JWT_SECRET, { expiresIn: '365d' });

      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 5);

      // Upsert DigitalIdCard record
      await prisma.digitalIdCard.upsert({
        where: { verificationToken: token },
        update: { status: 'ACTIVE' },
        create: {
          ownerType: 'FACULTY',
          ownerId: faculty.id,
          userId: faculty.userId || faculty.id,
          verificationToken: token,
          status: 'ACTIVE',
          expiryDate: expiry
        }
      });

      res.status(200).json({
        status: 'success',
        data: {
          id: faculty.id,
          photo: faculty.user?.profilePhoto || null,
          name: `${faculty.firstName} ${faculty.lastName}`,
          employeeId: faculty.employeeId,
          department: faculty.department?.name || 'N/A',
          designation: faculty.designation || 'Faculty Member',
          qrCodeToken: token,
          collegeLogo: '/logo.png',
          signature: '/signature.png'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Public endpoint to decode token & verify identity from QR Code scan
   */
  verifyIdCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      
      let decoded: any;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired identification token.'
        });
      }

      // Check if identity card is active in database
      const idCardRecord = await prisma.digitalIdCard.findFirst({
        where: { ownerId: decoded.id, status: 'ACTIVE' }
      });

      if (!idCardRecord) {
        return res.status(404).json({
          status: 'error',
          message: 'Verification failed: Identification card is inactive or has been suspended.'
        });
      }

      // Fetch latest profile info
      let profileDetails: any = null;
      if (decoded.type === 'STUDENT') {
        const student = await prisma.student.findUnique({
          where: { id: decoded.id },
          include: { department: true, user: true }
        });
        if (student) {
          profileDetails = {
            photo: student.user?.profilePhoto || null,
            name: `${student.firstName} ${student.lastName}`,
            code: student.admissionNo,
            department: student.department?.name || 'N/A',
            role: 'Student'
          };
        }
      } else {
        const faculty = await prisma.faculty.findUnique({
          where: { id: decoded.id },
          include: { department: true, user: true }
        });
        if (faculty) {
          profileDetails = {
            photo: faculty.user?.profilePhoto || null,
            name: `${faculty.firstName} ${faculty.lastName}`,
            code: faculty.employeeId,
            department: faculty.department?.name || 'N/A',
            role: 'Faculty'
          };
        }
      }

      if (!profileDetails) {
        return res.status(404).json({
          status: 'error',
          message: 'Record not found in the database.'
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          verified: true,
          isActive: true,
          ...profileDetails
        }
      });
    } catch (error) {
      next(error);
    }
  };

  listCounselingRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.listCounselingRecords(user);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  createCounselingRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await this.service.createCounselingRecord(user, req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  globalSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const query = (req.query.q as string) || '';
      const data = await this.service.globalSearch(query, user);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  getStudentFullProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.params.id;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { id: true, email: true, status: true, profilePhoto: true } },
          department: true,
          program: true,
          course: true,
          semester: true,
          section: true,
          academicYear: true,
          mentor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          parentRelations: {
            include: { parent: { include: { user: { select: { email: true, firstName: true, lastName: true, phone: true } } } } }
          },
          attendanceRecords: { take: 50, orderBy: { date: 'desc' } },
          marks: { include: { subject: { select: { name: true, code: true } } } },
          submissions: { include: { assignment: { select: { title: true, maxMarks: true } } } },
          workflowRequests: { include: { history: true }, orderBy: { createdAt: 'desc' } },
          counselingRecords: { include: { mentor: { select: { firstName: true, lastName: true } } } },
          feeBills: true,
          internships: { include: { documents: true } },
          placementApplications: { include: { drive: true } },
          transportRoute: true,
          hostelBuilding: true,
        }
      });

      if (!student) {
        return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
      }

      res.status(200).json({ status: 'success', data: student });
    } catch (error) {
      next(error);
    }
  };

  getFacultyFullProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facultyId = req.params.id;
      const faculty = await prisma.faculty.findUnique({
        where: { id: facultyId },
        include: {
          user: { select: { id: true, email: true, status: true, profilePhoto: true, role: true } },
          department: true,
          assignedSubjects: true,
          subjectAssignments: { include: { subject: true, section: true } },
          timetableSlots: { include: { subject: true, section: true } },
          mentoredStudents: { select: { id: true, admissionNo: true, firstName: true, lastName: true, email: true } },
          workflowRequestsAsRequester: { include: { history: true }, orderBy: { createdAt: 'desc' } },
          counselingGiven: { include: { student: { select: { firstName: true, lastName: true } } } },
        }
      });

      if (!faculty) {
        return res.status(404).json({ status: 'error', message: 'Faculty profile not found.' });
      }

      res.status(200).json({ status: 'success', data: faculty });
    } catch (error) {
      next(error);
    }
  };
}

