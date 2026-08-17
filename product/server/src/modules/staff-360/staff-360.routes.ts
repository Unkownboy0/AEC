import { Router } from 'express';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

/**
 * Canonical Staff / Faculty 360° Profile API
 * Aggregates all employee domains into a single holistic view.
 * Single Source of Truth — Zero Duplicate Staff Records.
 */
router.get('/:facultyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facultyId } = req.params;
    const user = (req as any).user;
    const requestedSections = (req.query.sections as string)?.split(',') || [
      'profile',
      'employment',
      'teaching_scope',
      'timetable',
      'availability',
      'leave',
      'roles_workspaces',
      'mentor_responsibilities',
      'tasks',
      'research',
      'appraisal',
      'documents',
      'assets',
      'finance',
      'service_history',
      'exit_clearance',
      'account',
      'audit',
    ];

    // 1. Find Faculty Master record
    const faculty = await (prisma as any).faculty.findUnique({
      where: { id: facultyId },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            status: true,
            accountStatus: true,
            profilePhoto: true,
            workspaces: true,
            activeWorkspace: true,
            createdAt: true,
            assignedRoles: { include: { role: true } },
            userWorkspaces: true,
          },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ status: 'error', message: 'Faculty / Staff record not found' });
    }

    // 2. Authorization
    const isOwnProfile = faculty.userId === user?.id;
    const userRole = user?.roleName || user?.role || '';
    const isAdmin = ['Super Admin', 'SUPER_ADMIN', 'College Admin', 'COLLEGE_ADMIN', 'Principal', 'Vice Principal', 'HR Admin'].includes(userRole);
    const isDean = ['Academic Dean', 'Administration Dean', 'IQAC Dean', 'Dean'].includes(userRole);
    const isHOD = ['HOD', 'Head of Department'].includes(userRole);

    let isAuthorizedHOD = false;
    if (isHOD) {
      const currentFaculty = await (prisma as any).faculty.findFirst({ where: { userId: user?.id } });
      if (currentFaculty?.departmentId === faculty.departmentId) {
        isAuthorizedHOD = true;
      }
    }

    if (!isOwnProfile && !isAdmin && !isDean && !isAuthorizedHOD) {
      return res.status(403).json({ status: 'error', message: 'Access denied: You are not authorized to view this staff profile.' });
    }

    const result: any = {};

    // 3. Section: Basic Identity & Contact
    if (requestedSections.includes('profile')) {
      result.profile = {
        id: faculty.id,
        employeeId: faculty.employeeId,
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        fullName: `${faculty.firstName} ${faculty.lastName}`,
        email: faculty.email,
        personalEmail: faculty.personalEmail,
        phone: faculty.phone,
        personalPhone: faculty.personalPhone,
        alternatePhone: faculty.alternatePhone,
        dob: faculty.dob,
        gender: faculty.gender,
        bloodGroup: faculty.bloodGroup,
        maritalStatus: faculty.maritalStatus,
        nationality: faculty.nationality,
        designation: faculty.designation,
        department: faculty.department?.name,
        departmentCode: faculty.department?.code,
        status: faculty.status,
        dateOfJoining: faculty.dateOfJoining,
        profilePhoto: faculty.user?.profilePhoto || null,
        emergencyName: faculty.emergencyName,
        emergencyPhone: faculty.emergencyPhone,
        addressLine1: faculty.addressLine1,
        city: faculty.city,
        state: faculty.state,
        pincode: faculty.pincode,
      };
    }

    // 4. Section: Employment & Qualifications
    if (requestedSections.includes('employment')) {
      result.employment = {
        employeeId: faculty.employeeId,
        employmentType: faculty.employmentType || 'FULL_TIME',
        facultyType: faculty.facultyType || 'REGULAR',
        designation: faculty.designation,
        dateOfJoining: faculty.dateOfJoining,
        qualification: faculty.qualification,
        highestDegree: faculty.highestDegree,
        university: faculty.university,
        experienceYears: faculty.experience,
        specialization: faculty.specialization,
        officeRoom: faculty.officeRoom,
      };
    }

    // 5. Section: Teaching & Academic Scope
    if (requestedSections.includes('teaching_scope')) {
      const [subjectAssignments, teachingAssignments] = await Promise.all([
        (prisma as any).subjectAssignment.findMany({
          where: { facultyId: faculty.id },
          include: { subject: true, section: { include: { program: true } } },
        }),
        (prisma as any).facultyTeachingAssignment?.findMany?.({
          where: { facultyId: faculty.id, status: 'ACTIVE' },
          include: { teachingDept: true, subject: true },
        }) || [],
      ]);
      result.teachingScope = { subjectAssignments, crossDepartmentAssignments: teachingAssignments };
    }

    // 6. Section: Timetable & Central Availability Engine
    if (requestedSections.includes('timetable') || requestedSections.includes('availability')) {
      const [timetableSlots, availabilityLog] = await Promise.all([
        (prisma as any).timetableSlot.findMany({
          where: { facultyId: faculty.id },
          include: { subject: true, section: true },
        }),
        (prisma as any).userPresence?.findUnique?.({
          where: { userId: faculty.userId || '' },
        }) || null,
      ]);
      result.timetable = timetableSlots;
      result.availability = {
        status: availabilityLog?.status || 'AVAILABLE',
        currentActivity: availabilityLog?.currentActivity || 'In Office',
        lastUpdated: availabilityLog?.updatedAt || new Date(),
      };
    }

    // 7. Section: Leave & OD
    if (requestedSections.includes('leave')) {
      const [leaves, leaveBalances] = await Promise.all([
        (prisma as any).facultyLeaveRequest.findMany({
          where: { facultyId: faculty.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        (prisma as any).facultyLeaveLedger?.findMany?.({
          where: { facultyId: faculty.id },
        }) || [],
      ]);
      result.leave = { requests: leaves, balances: leaveBalances };
    }

    // 8. Section: Roles & Workspaces (Single Identity with Dynamic Workspaces)
    if (requestedSections.includes('roles_workspaces')) {
      const [userWorkspaces, leaderships] = await Promise.all([
        (prisma as any).userWorkspace.findMany({
          where: { userId: faculty.userId || '' },
        }),
        (prisma as any).leadershipAssignment?.findMany?.({
          where: { userId: faculty.userId || '', status: 'ACTIVE' },
        }) || [],
      ]);
      result.rolesWorkspaces = {
        primaryRole: faculty.user?.assignedRoles?.[0]?.role?.name || faculty.designation,
        assignedRoles: faculty.user?.assignedRoles?.map((r: any) => r.role?.name) || [],
        activeWorkspaces: userWorkspaces,
        leadershipPositions: leaderships,
      };
    }

    // 9. Section: Mentor & Adviser Responsibilities
    if (requestedSections.includes('mentor_responsibilities')) {
      const [activeMentees, adviserSections] = await Promise.all([
        (prisma as any).student.findMany({
          where: { deleted: false, OR: [{ mentorId: faculty.id }, { mentorAssignments: { some: { mentorId: faculty.id, status: 'ACTIVE' } } }] },
          select: { id: true, admissionNo: true, firstName: true, lastName: true, department: { select: { name: true } }, section: { select: { name: true } } },
        }),
        (prisma as any).classAdviserAssignment?.findMany?.({
          where: { facultyId: faculty.id, status: 'ACTIVE' },
          include: { section: { include: { program: true, semester: true } } },
        }) || [],
      ]);
      result.mentorResponsibilities = {
        menteeCount: activeMentees.length,
        mentees: activeMentees,
        classAdviserSections: adviserSections,
      };
    }

    // 10. Section: Tasks & Committees
    if (requestedSections.includes('tasks')) {
      const assignedTasks = await (prisma as any).task.findMany({
        where: { assignees: { some: { userId: faculty.userId || '' } } },
        orderBy: { dueDate: 'asc' },
        take: 20,
      });
      result.tasks = assignedTasks;
    }

    // 11. Section: Research, Publications & Patents
    if (requestedSections.includes('research')) {
      const [projects, publications, patents] = await Promise.all([
        (prisma as any).researchProject.findMany({ where: { piId: faculty.id }, orderBy: { createdAt: 'desc' } }),
        (prisma as any).researchPublication.findMany({ where: { departmentId: faculty.departmentId }, take: 20 }),
        (prisma as any).patent.findMany({ where: { departmentId: faculty.departmentId }, take: 10 }),
      ]);
      result.research = { projects, publications, patents };
    }

    // 12. Section: Appraisal (Self-Appraisal, HOD Review, IQAC Verification)
    if (requestedSections.includes('appraisal')) {
      const appraisalSubmissions = await (prisma as any).appraisalSubmission.findMany({
        where: { facultyId: faculty.id },
        include: { config: { select: { title: true, academicYear: true } } },
        orderBy: { createdAt: 'desc' },
      });
      result.appraisal = appraisalSubmissions;
    }

    // 13. Section: Assets & Inventory Assigned
    if (requestedSections.includes('assets')) {
      const assets = await (prisma as any).asset.findMany({
        where: { assignedToId: faculty.userId || faculty.id, status: 'IN_USE' },
        orderBy: { createdAt: 'desc' },
      });
      result.assets = assets;
    }

    // 14. Section: Finance Context (Advances, Reimbursements, Dues)
    if (requestedSections.includes('finance')) {
      const vouchers = await (prisma as any).financeRequest?.findMany?.({
        where: { requestedById: faculty.userId || '' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }) || [];
      result.finance = { vouchers };
    }

    // 15. Section: Service History & Transfers
    if (requestedSections.includes('service_history')) {
      const transfers = await (prisma as any).facultyDepartmentTransfer?.findMany?.({
        where: { facultyId: faculty.id },
        include: { fromDept: true, toDept: true },
        orderBy: { effectiveDate: 'desc' },
      }) || [];
      result.serviceHistory = { transfers };
    }

    // 16. Section: Exit Clearance Workflow (A&A -> Super Admin -> HOD -> IQAC -> Accounts -> Library -> College Admin -> VP -> Principal -> Super Admin Final)
    if (requestedSections.includes('exit_clearance')) {
      const exitRequest = await (prisma as any).workflowRequest.findFirst({
        where: { facultyRequesterId: faculty.id, type: 'STAFF_EXIT_CLEARANCE' },
        orderBy: { createdAt: 'desc' },
      });
      result.exitClearance = exitRequest;
    }

    // 17. Section: Account & Security Access
    if (requestedSections.includes('account') && (isAdmin || isOwnProfile)) {
      result.account = {
        userId: faculty.userId,
        email: faculty.user?.email,
        username: faculty.user?.username,
        status: faculty.user?.status,
        accountStatus: faculty.user?.accountStatus,
        createdAt: faculty.user?.createdAt,
      };
    }

    res.json({ status: 'success', data: result });
  } catch (e) {
    next(e);
  }
});

export default router;
