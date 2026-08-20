import { Router } from 'express';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { profileImageDescriptor } from '../users/profile-media.service';

const router = Router();
router.use(requireAuth);

/**
 * Canonical Student 360° Profile API
 * Aggregates all authorized student data across 18+ institution domains
 * Single Source of Truth — Zero Data Duplication.
 */
router.get('/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const user = (req as any).user;
    const requestedSections = (req.query.sections as string)?.split(',') || [
      'profile',
      'academic',
      'attendance',
      'marks',
      'fees',
      'leave',
      'documents',
      'mentor',
      'activities',
      'skills',
      'placements',
      'library',
      'hostel',
      'transport',
      'complaints',
      'account',
      'timeline',
      'residential_history',
    ];

    // 1. Fetch canonical Student record with academic hierarchy
    const student = await (prisma as any).student.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        programDepartment: true,
        operatingDepartment: true,
        program: true,
        course: true,
        section: true,
        semester: true,
        academicYear: true,
        user: { select: { id: true, email: true, username: true, status: true, accountStatus: true, profilePhoto: true, profileImageFileId: true, profileImageFile: true, createdAt: true } },
        mentor: { select: { id: true, userId: true, firstName: true, lastName: true, email: true, phone: true, designation: true } },
      },
    });

    if (!student || student.deleted) {
      return res.status(404).json({ status: 'error', message: 'Student record not found' });
    }

    // 2. Authorization Engine
    const isOwnProfile = student.userId === user?.id;
    const isMentor =
      student.mentor?.userId === user?.id ||
      (await (prisma as any).mentorAssignment.count({
        where: { studentId: student.id, mentor: { userId: user?.id }, status: 'ACTIVE' },
      })) > 0;

    const isClassAdviser =
      student.classAdvisorId === user?.id ||
      (await (prisma as any).classAdviserAssignment?.count?.({
        where: { sectionId: student.sectionId, faculty: { userId: user?.id }, status: 'ACTIVE' },
      })) > 0;

    const isParent =
      (await (prisma as any).parentStudentRelation.count({
        where: { studentId: student.id, parent: { userId: user?.id } },
      })) > 0 || student.parentEmail === user?.email;

    const userRole = user?.roleName || user?.role || '';
    const isAdmin = ['Super Admin', 'SUPER_ADMIN', 'College Admin', 'COLLEGE_ADMIN', 'Principal', 'Vice Principal'].includes(userRole);
    const isDean = ['Academic Dean', 'Admission Dean', 'Administration Dean', 'IQAC Dean', 'Dean'].includes(userRole);
    const isCOE = ['COE', 'Examination Cell'].includes(userRole);
    const isHOD = ['HOD', 'Head of Department'].includes(userRole);

    // HOD Department Verification (Supports Home Department & Year 1 S&H Operating Department)
    let isAuthorizedHOD = false;
    if (isHOD) {
      const faculty = await (prisma as any).faculty.findFirst({ where: { userId: user?.id } });
      if (faculty?.departmentId) {
        if (
          student.departmentId === faculty.departmentId ||
          student.operatingDepartmentId === faculty.departmentId ||
          student.programDepartmentId === faculty.departmentId
        ) {
          isAuthorizedHOD = true;
        }
      }
    }

    // Strict Negative Authorization Gate
    if (!isOwnProfile && !isParent && !isMentor && !isClassAdviser && !isAdmin && !isDean && !isCOE && !isAuthorizedHOD) {
      return res.status(403).json({ status: 'error', message: 'Access denied: You are not authorized to view this student profile.' });
    }

    const result: any = {};

    // 3. Section: Basic Identity & Academic Identity
    if (requestedSections.includes('profile')) {
      result.profile = {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        email: student.email,
        phone: student.phone,
        altPhone: student.altPhone,
        gender: student.gender,
        dob: student.dob,
        bloodGroup: student.bloodGroup,
        dateOfAdmission: student.dateOfAdmission,
        status: student.status,
        profilePhoto: student.user ? profileImageDescriptor(student.user).url : null,
        profileImage: student.user ? profileImageDescriptor(student.user) : null,
        degree: student.program?.degree || student.course?.code,
        program: student.program?.name,
        programCode: student.program?.code,
        department: student.department?.name,
        departmentCode: student.department?.code,
        operatingDepartment: student.operatingDepartment?.name || student.department?.name,
        academicYear: student.academicYear?.name,
        semester: student.semester?.name,
        semesterNumber: student.semester?.number,
        section: student.section?.name,
        residentialType: student.residentialType || 'DAY_SCHOLAR',
        transportMode: student.transportMode || 'OTHER',
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        currentAddress: student.currentAddress,
        permanentAddress: student.permanentAddress,
        city: student.city,
        district: student.district,
        state: student.state,
        pinCode: student.pinCode,
        emergencyContactName: student.emergencyContactName,
        emergencyContactPhone: student.emergencyContactPhone,
        emergencyContactRelation: student.emergencyContactRelation,
        mentor: student.mentor ? { id: student.mentor.id, name: `${student.mentor.firstName} ${student.mentor.lastName}`, email: student.mentor.email, phone: student.mentor.phone } : null,
      };
    }

    // 4. Section: Academics & Timetable
    if (requestedSections.includes('academic')) {
      const [curriculumUnits, subjects, assignments] = await Promise.all([
        (prisma as any).curriculumUnit?.findMany?.({
          where: { programId: student.programId, semesterId: student.semesterId },
          take: 20,
        }) || [],
        (prisma as any).subject?.findMany?.({
          where: { departmentId: student.departmentId, semesterId: student.semesterId },
          take: 30,
        }) || [],
        (prisma as any).assignment?.findMany?.({
          where: { sectionId: student.sectionId, status: 'ACTIVE' },
          orderBy: { dueDate: 'asc' },
          take: 20,
        }) || [],
      ]);
      result.academic = { curriculumUnits, subjects, assignments };
    }

    // 5. Section: Attendance (with OD calculation & Risk)
    if (requestedSections.includes('attendance')) {
      const attendance = await (prisma as any).attendance.findMany({
        where: { studentId: student.id },
        orderBy: { date: 'desc' },
        take: 100,
        include: { subject: { select: { name: true, code: true } } },
      });
      const total = attendance.length;
      const present = attendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'ON_DUTY').length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
      const isShortage = percentage < 75;

      result.attendance = {
        records: attendance,
        total,
        present,
        percentage,
        isShortage,
        riskLevel: percentage < 65 ? 'CRITICAL' : percentage < 75 ? 'WARNING' : 'NORMAL',
      };
    }

    // 6. Section: Examination, Marks & Results (MANDATORY: UNPUBLISHED RESULTS HIDDEN FROM STUDENT/PARENT)
    if (requestedSections.includes('marks') || requestedSections.includes('results')) {
      const marksWhere: any = { studentId: student.id };
      if (isOwnProfile || isParent) {
        marksWhere.status = 'PUBLISHED'; // STRICT SECURITY ENFORCEMENT
      }

      const marks = await (prisma as any).mark.findMany({
        where: marksWhere,
        include: { exam: true, subject: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const publishedMarks = marks.filter((m: any) => m.status === 'PUBLISHED');
      const gpas = publishedMarks.filter((m: any) => m.gpa != null).map((m: any) => Number(m.gpa));
      const cgpa = gpas.length > 0 ? Math.round((gpas.reduce((s: number, g: number) => s + g, 0) / gpas.length) * 100) / 100 : null;
      const arrears = publishedMarks.filter((m: any) => m.grade === 'F').length;

      result.marks = {
        records: marks,
        publishedCount: publishedMarks.length,
        cgpa,
        arrearsCount: arrears,
      };
    }

    // 7. Section: Leave & OD
    if (requestedSections.includes('leave')) {
      const leaveRequests = await (prisma as any).studentLeaveRequest.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      result.leave = leaveRequests;
    }

    // 8. Section: Fees & Finance (Receivables, Payments, Immutable Receipts)
    if (requestedSections.includes('fees')) {
      const [bills, payments] = await Promise.all([
        (prisma as any).feeBill.findMany({
          where: { studentId: student.id, deleted: false },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }),
        (prisma as any).feePayment.findMany({
          where: { studentId: student.id },
          include: { bill: { include: { category: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const totalAssessed = bills.reduce((s: number, b: any) => s + (b.amount || 0), 0);
      const totalScholarship = bills.reduce((s: number, b: any) => s + (b.scholarshipDiscount || 0), 0);
      const totalFines = bills.reduce((s: number, b: any) => s + (b.fine || 0), 0);
      const totalPaid = payments
        .filter((p: any) => p.status === 'SUCCEEDED' || p.status === 'COMPLETED')
        .reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const outstanding = Math.max(0, totalAssessed - totalScholarship + totalFines - totalPaid);

      result.fees = {
        bills,
        payments,
        summary: { totalAssessed, totalScholarship, totalFines, totalPaid, outstanding },
      };
    }

    // 9. Section: Documents & Certificates
    if (requestedSections.includes('documents')) {
      const certs = await (prisma as any).certificateGeneration.findMany({
        where: { studentId: student.id },
        include: { template: { select: { name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
      });
      result.documents = certs;
    }

    // 10. Section: Mentor Notes & Counseling (Confidential notes hidden from student/parent)
    if (requestedSections.includes('mentor')) {
      const counselingWhere: any = { studentId: student.id };
      if (isOwnProfile || isParent) {
        counselingWhere.privacyLevel = { notIn: ['MENTOR_ONLY', 'CONFIDENTIAL'] };
      }
      const [counseling, mentorHistory] = await Promise.all([
        (prisma as any).counselingRecord.findMany({
          where: counselingWhere,
          orderBy: { createdAt: 'desc' },
        }),
        (prisma as any).mentorAssignment.findMany({
          where: { studentId: student.id },
          include: { mentor: { select: { firstName: true, lastName: true, designation: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      result.mentor = {
        currentMentor: student.mentor ? `${student.mentor.firstName} ${student.mentor.lastName}` : null,
        counselingRecords: counseling,
        history: mentorHistory,
      };
    }

    // 11. Section: Projects, Activities & Skills
    if (requestedSections.includes('activities') || requestedSections.includes('skills')) {
      const [skills, achievements, activityRecords] = await Promise.all([
        (prisma as any).studentSkill.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' } }),
        (prisma as any).studentAchievement.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' } }),
        (prisma as any).activityAttendanceRecord.findMany({
          where: { studentId: student.id },
          include: { session: { include: { activity: true } } },
          orderBy: { date: 'desc' },
          take: 20,
        }),
      ]);
      result.skills = skills;
      result.achievements = achievements;
      result.activities = activityRecords;
    }

    // 12. Section: Placement & Internships
    if (requestedSections.includes('placements')) {
      const [placements, internships] = await Promise.all([
        (prisma as any).placementApplication.findMany({ where: { studentId: student.id }, orderBy: { appliedAt: 'desc' } }),
        (prisma as any).internship.findMany({ where: { studentId: student.id }, orderBy: { id: 'desc' } }),
      ]);
      result.placements = { applications: placements, internships };
    }

    // 13. Section: Library
    if (requestedSections.includes('library')) {
      const [issues, fines] = await Promise.all([
        (prisma as any).libraryIssue.findMany({
          where: { borrowerId: student.id, status: 'ISSUED' },
          include: { book: { select: { title: true, author: true, isbn: true } } },
        }),
        (prisma as any).libraryFine.findMany({
          where: { borrowerId: student.id, status: 'PENDING' },
        }),
      ]);
      result.library = { currentIssues: issues, pendingFines: fines };
    }

    // 14. Section: Hostel (Active Allocation Based)
    if (requestedSections.includes('hostel')) {
      const allocation = await (prisma as any).hostelAllocation.findFirst({
        where: { studentId: student.id, status: 'ACTIVE' },
        include: { room: { include: { floor: { include: { block: true } } } }, bed: true },
      });
      result.hostel = allocation;
    }

    // 15. Section: Transport (Active College Bus Allocation Based)
    if (requestedSections.includes('transport')) {
      const allocation = await (prisma as any).transportAllocation.findFirst({
        where: { passengerId: student.id, passengerType: 'STUDENT', status: 'ACTIVE' },
        include: { route: true, stop: true },
      });
      result.transport = allocation;
    }

    // 16. Section: Complaints / Grievances
    if (requestedSections.includes('complaints')) {
      const tickets = await (prisma as any).ticket.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      result.complaints = tickets;
    }

    // 17. Section: Account & Security Access (Never expose passwords/hashes)
    if (requestedSections.includes('account') && (isAdmin || isOwnProfile)) {
      const sessions = await (prisma as any).userSession.findMany({
        where: { userId: student.userId || '' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, ipAddress: true, userAgent: true, lastActivity: true, expiresAt: true },
      });
      result.account = {
        userId: student.userId,
        email: student.user?.email,
        username: student.user?.username,
        accountStatus: student.user?.accountStatus || 'ACTIVE',
        status: student.user?.status || 'ACTIVE',
        createdAt: student.user?.createdAt,
        recentSessions: sessions,
      };
    }

    // 18. Section: Residential History
    if (requestedSections.includes('residential_history')) {
      const history = await (prisma as any).studentResidentialHistory.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      result.residentialHistory = history;
    }

    // Digital ID Secure Token Generation
    const digitalIdPayload = {
      studentId: student.id,
      admissionNo: student.admissionNo,
      name: `${student.firstName} ${student.lastName}`,
      department: student.department?.name,
      validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
    };
    const secureToken = crypto.createHmac('sha256', 'campusos-id-secret').update(JSON.stringify(digitalIdPayload)).digest('hex');

    result.digitalId = {
      ...digitalIdPayload,
      secureToken,
      qrUrl: `/api/verify/${secureToken}`,
    };

    res.json({ status: 'success', data: result });
  } catch (e) {
    next(e);
  }
});

export default router;
