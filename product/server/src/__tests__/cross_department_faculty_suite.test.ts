import assert from 'assert';
import { prisma } from '../lib/prisma';
import { CrossDepartmentService } from '../modules/enterprise/cross-department.service';
import { FacultyAvailabilityService } from '../modules/enterprise/faculty-availability.service';
import { FacultyLeaveService } from '../modules/faculty-leave/faculty-leave.service';
import { CampusOfficeService } from '../modules/enterprise/campus-office.service';

async function runCrossDepartmentFacultySuite() {
  console.log('================================================================================');
  console.log('🧪 CAMPUSOS — CROSS-DEPARTMENT FACULTY, AVAILABILITY, LEAVE & OFFICE SUITE');
  console.log('================================================================================\n');

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // SETUP FIXTURES
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📦 Setting up test fixtures (Departments, Courses, Subjects, Faculty & Users)...');

    // 1. Roles
    const facultyRole = await prisma.role.findFirst({ where: { name: 'Faculty' } }) ||
      await prisma.role.create({
        data: { name: 'Faculty', description: 'Faculty Role', priority: 10, hierarchy: 10, color: '#ec4899', isSystem: true },
      });

    const hodRole = await prisma.role.findFirst({ where: { name: 'HOD' } }) ||
      await prisma.role.create({
        data: { name: 'HOD', description: 'HOD Role', priority: 8, hierarchy: 8, color: '#8b5cf6', isSystem: true },
      });

    const principalRole = await prisma.role.findFirst({ where: { name: 'Principal' } }) ||
      await prisma.role.create({
        data: { name: 'Principal', description: 'Principal Role', priority: 3, hierarchy: 3, color: '#f59e0b', isSystem: true },
      });

    let academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          name: '2026-2027',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2027-05-31'),
          isCurrent: true,
        },
      });
    }

    let deptIT = await prisma.department.findFirst({
      where: { OR: [{ code: 'IT' }, { name: 'Information Technology' }] },
    });
    if (!deptIT) {
      deptIT = await prisma.department.create({
        data: { name: 'Information Technology', code: 'IT', shortName: 'IT', status: 'ACTIVE' },
      });
    }

    let deptAIDS = await prisma.department.findFirst({
      where: { OR: [{ code: 'AIDS' }, { name: { contains: 'Intelligence', mode: 'insensitive' } }] },
    });
    if (!deptAIDS) {
      deptAIDS = await prisma.department.create({
        data: { name: 'Artificial Intelligence and Data Science', code: 'AIDS', shortName: 'AI&DS', status: 'ACTIVE' },
      });
    }

    let programIT = await prisma.program.findFirst({ where: { departmentId: deptIT.id } });
    if (!programIT) {
      programIT = await prisma.program.create({
        data: { name: 'B.Tech Information Technology', code: 'BTECH-IT', departmentId: deptIT.id },
      });
    }

    let programAIDS = await prisma.program.findFirst({ where: { departmentId: deptAIDS.id } });
    if (!programAIDS) {
      programAIDS = await prisma.program.create({
        data: { name: 'B.Tech AI & Data Science', code: 'BTECH-AIDS', departmentId: deptAIDS.id },
      });
    }

    let courseIT = await prisma.course.findFirst({ where: { departmentId: deptIT.id } });
    if (!courseIT) {
      courseIT = await prisma.course.create({
        data: { name: 'IT Engineering', code: 'IT-ENG', duration: 4, programId: programIT.id, departmentId: deptIT.id },
      });
    }

    let courseAIDS = await prisma.course.findFirst({ where: { departmentId: deptAIDS.id } });
    if (!courseAIDS) {
      courseAIDS = await prisma.course.create({
        data: { name: 'AI&DS Engineering', code: 'AIDS-ENG', duration: 4, programId: programAIDS.id, departmentId: deptAIDS.id },
      });
    }

    let semIT = await prisma.semester.findFirst({ where: { courseId: courseIT.id } });
    if (!semIT) {
      semIT = await prisma.semester.create({
        data: { number: 3, name: 'Semester 3', startDate: new Date('2026-06-01'), endDate: new Date('2026-11-30'), courseId: courseIT.id, programId: programIT.id, academicYearId: academicYear.id },
      });
    }

    let semAIDS = await prisma.semester.findFirst({ where: { courseId: courseAIDS.id } });
    if (!semAIDS) {
      semAIDS = await prisma.semester.create({
        data: { number: 3, name: 'Semester 3', startDate: new Date('2026-06-01'), endDate: new Date('2026-11-30'), courseId: courseAIDS.id, programId: programAIDS.id, academicYearId: academicYear.id },
      });
    }

    let secIT = await prisma.section.findFirst({ where: { semesterId: semIT.id } });
    if (!secIT) {
      secIT = await prisma.section.create({
        data: { name: 'II IT-A', semesterId: semIT.id, programId: programIT.id, departmentId: deptIT.id },
      });
    }

    let secAIDS = await prisma.section.findFirst({ where: { semesterId: semAIDS.id } });
    if (!secAIDS) {
      secAIDS = await prisma.section.create({
        data: { name: 'II AI&DS-A', semesterId: semAIDS.id, programId: programAIDS.id, departmentId: deptAIDS.id },
      });
    }

    const subjDBMS = await prisma.subject.upsert({
      where: { code: 'IT8401' },
      update: {},
      create: {
        name: 'Database Management Systems',
        code: 'IT8401',
        credits: 4,
        semesterId: semIT.id,
        departmentId: deptIT.id,
        programId: programIT.id,
        sectionId: secIT.id,
      },
    });

    const subjPython = await prisma.subject.upsert({
      where: { code: 'AD8402' },
      update: {},
      create: {
        name: 'Python Programming',
        code: 'AD8402',
        credits: 4,
        semesterId: semAIDS.id,
        departmentId: deptAIDS.id,
        programId: programAIDS.id,
        sectionId: secAIDS.id,
      },
    });

    const userArun = await prisma.user.upsert({
      where: { email: 'arun.kumar@geetorus.com' },
      update: { departmentId: deptIT.id },
      create: {
        email: 'arun.kumar@geetorus.com',
        passwordHash: '$2a$10$Campus123HashPlaceholder',
        firstName: 'Arun',
        lastName: 'Kumar',
        departmentId: deptIT.id,
        roleId: facultyRole.id,
        status: 'ACTIVE',
      },
    });

    const facultyArun = await prisma.faculty.upsert({
      where: { employeeId: 'AEC01IT' },
      update: { departmentId: deptIT.id },
      create: {
        employeeId: 'AEC01IT',
        firstName: 'Arun',
        lastName: 'Kumar',
        email: 'arun.kumar@geetorus.com',
        phone: '+91 98765 43210',
        dob: new Date('1986-04-12'),
        dateOfJoining: new Date('2018-06-01'),
        designation: 'Assistant Professor',
        qualification: 'M.Tech, Ph.D (Pursuing)',
        experience: 9,
        departmentId: deptIT.id,
        userId: userArun.id,
      },
    });

    const facultyPriya = await prisma.faculty.upsert({
      where: { employeeId: 'AEC02IT' },
      update: {},
      create: {
        employeeId: 'AEC02IT',
        firstName: 'Priya',
        lastName: 'Sundaram',
        email: 'priya.s@geetorus.com',
        phone: '+91 98765 43211',
        dob: new Date('1989-07-22'),
        dateOfJoining: new Date('2020-07-01'),
        designation: 'Assistant Professor',
        qualification: 'M.E Software Engg',
        experience: 6,
        departmentId: deptIT.id,
      },
    });

    const userHodIT = await prisma.user.upsert({
      where: { email: 'it.head@geetorus.com' },
      update: { departmentId: deptIT.id },
      create: {
        email: 'it.head@geetorus.com',
        passwordHash: '$2a$10$Campus123HashPlaceholder',
        firstName: 'Robert',
        lastName: 'Vance',
        departmentId: deptIT.id,
        roleId: hodRole.id,
        status: 'ACTIVE',
      },
    });

    const userPrincipal = await prisma.user.upsert({
      where: { email: 'principal@geetorus.com' },
      update: {},
      create: {
        email: 'principal@geetorus.com',
        passwordHash: '$2a$10$Campus123HashPlaceholder',
        firstName: 'Dr. Subramanian',
        lastName: 'Ramasamy',
        roleId: principalRole.id,
        status: 'ACTIVE',
      },
    });

    const db = prisma as any;

    // Clean previous test data
    await prisma.facultyLeaveRequest.deleteMany({ where: { facultyId: facultyArun.id } });
    await db.timetableSlotOverride.deleteMany({ where: { originalFacultyId: facultyArun.id } });
    await db.timetableSlotOverride.deleteMany({ where: { substituteFacultyId: facultyPriya.id } });
    await db.facultyLeaveLedger.deleteMany({ where: { facultyId: facultyArun.id } });
    await db.facultyDepartmentTransfer.deleteMany({ where: { facultyId: facultyArun.id } });

    // Reset Timetable slots for clean test
    await prisma.timetableSlot.deleteMany({ where: { facultyId: facultyArun.id } });

    // Slot 1: IT Department - DBMS (Wednesday Period 1)
    await prisma.timetableSlot.create({
      data: {
        dayOfWeek: 'WEDNESDAY',
        slotIndex: 1,
        startTime: '09:00',
        endTime: '09:50',
        academicYearId: academicYear.id,
        departmentId: deptIT.id,
        semesterId: semIT.id,
        sectionId: secIT.id,
        subjectId: subjDBMS.id,
        facultyId: facultyArun.id,
        roomNo: 'IT-LH-201',
      },
    });

    // Slot 2: AI&DS Department - Python Programming (Wednesday Period 3)
    await prisma.timetableSlot.create({
      data: {
        dayOfWeek: 'WEDNESDAY',
        slotIndex: 3,
        startTime: '11:00',
        endTime: '11:50',
        academicYearId: academicYear.id,
        departmentId: deptAIDS.id,
        semesterId: semAIDS.id,
        sectionId: secAIDS.id,
        subjectId: subjPython.id,
        facultyId: facultyArun.id,
        roomNo: 'AIDS-LAB-102',
      },
    });

    console.log('✅ Fixtures initialized successfully.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1 — Cross-Department Faculty & Workload
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 1: Cross-Department Faculty Visibility & Aggregated Workload');
    console.log('────────────────────────────────────────────────────────────────────────');

    await db.facultyTeachingAssignment.deleteMany({ where: { facultyId: facultyArun.id } });
    const assignment = await CrossDepartmentService.requestTeachingAssignment({
      facultyId: facultyArun.id,
      teachingDepartmentId: deptAIDS.id,
      subjectId: subjPython.id,
      sectionId: secAIDS.id,
      semesterId: semAIDS.id,
      academicYearId: academicYear.id,
      periodsPerWeek: 4,
      requestedById: userHodIT.id,
      remarks: 'Handling Python Programming for II AI&DS-A',
    });

    assert.strictEqual(assignment.status, 'REQUESTED', 'Teaching assignment status is REQUESTED');

    const approvedAssignment = await CrossDepartmentService.approveTeachingAssignment(assignment.id, userHodIT.id);
    assert.strictEqual(approvedAssignment.status, 'ACTIVE', 'Teaching assignment status is ACTIVE');

    // Aggregated workload calculation
    const workload = await CrossDepartmentService.calculateFacultyWorkload(facultyArun.id);
    assert.strictEqual(workload.employeeId, 'AEC01IT', 'Faculty employeeId matches');
    assert.strictEqual(workload.homeDepartment.code, 'IT', 'Home department is IT');
    assert.ok(workload.homeDeptHours >= 1, 'Home department hours counted');
    assert.ok(workload.crossDeptHours >= 1, 'Cross department teaching hours counted');
    assert.ok(workload.totalTeachingHours >= 3, 'Aggregated total teaching hours calculated accurately');
    console.log(`  • Home Hours (IT): ${workload.homeDeptHours}, Cross-Dept (AI&DS): ${workload.crossDeptHours}, Total: ${workload.totalTeachingHours} hrs/week`);

    // Visibility Scoping
    const itRoster = await CrossDepartmentService.getDepartmentFacultyRoster(deptIT.id);
    const arunInIT = itRoster.homeFaculty.find((f: any) => f.id === facultyArun.id);
    assert.ok(arunInIT, 'IT HOD sees Arun as Home Faculty');

    const aidsRoster = await CrossDepartmentService.getDepartmentFacultyRoster(deptAIDS.id);
    const arunInAIDS = aidsRoster.crossDepartmentFaculty.find((f: any) => f.id === facultyArun.id);
    assert.ok(arunInAIDS, 'AI&DS HOD sees Arun in Cross-Department Teaching scope');

    // Real-time Availability Derivation
    const p1Status = await FacultyAvailabilityService.deriveFacultyPeriodStatus({
      facultyId: facultyArun.id,
      date: new Date('2026-08-19'), // Wednesday
      periodNumber: 1,
      dayOfWeek: 'WEDNESDAY',
    });
    assert.strictEqual(p1Status.status, 'IN_CLASS', 'Period 1 is IN_CLASS (IT DBMS)');

    const p2Status = await FacultyAvailabilityService.deriveFacultyPeriodStatus({
      facultyId: facultyArun.id,
      date: new Date('2026-08-19'),
      periodNumber: 2,
      dayOfWeek: 'WEDNESDAY',
    });
    assert.strictEqual(p2Status.status, 'AVAILABLE', 'Period 2 is AVAILABLE');

    const p3Status = await FacultyAvailabilityService.deriveFacultyPeriodStatus({
      facultyId: facultyArun.id,
      date: new Date('2026-08-19'),
      periodNumber: 3,
      dayOfWeek: 'WEDNESDAY',
    });
    assert.strictEqual(p3Status.status, 'IN_CLASS', 'Period 3 is IN_CLASS (AI&DS Python)');

    console.log('✅ TEST 1 PASSED: Cross-Department Faculty Visibility & Aggregated Workload verified.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2 — Leave & Substitution Flow with Idempotent Ledger
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 2: Leave Application, Timetable Affected Classes & Idempotent Ledger');
    console.log('────────────────────────────────────────────────────────────────────────');

    const leaveDate = new Date('2026-08-19'); // Wednesday
    const initialBalances = await FacultyLeaveService.getFacultyLeaveBalances(facultyArun.id);
    const clBalance = initialBalances.find(b => b.leaveType === 'CASUAL_LEAVE');
    const openingCL = clBalance?.availableDays || 12;

    // Auto-detect affected classes across IT and AI&DS
    const affectedPeriods = await FacultyLeaveService.detectAffectedTimetablePeriods(
      facultyArun.id,
      leaveDate,
      leaveDate
    );
    assert.ok(affectedPeriods.length >= 2, 'Auto-detected affected periods across departments');
    console.log(`  • Auto-detected ${affectedPeriods.length} affected periods across IT and AI&DS on Wednesday`);

    // Free faculty search
    const freeFaculty = await FacultyAvailabilityService.findAvailableFaculty({
      date: '2026-08-19',
      periodNumber: 1,
      departmentId: deptIT.id,
      subjectId: subjDBMS.id,
    });
    const priyaFound = freeFaculty.suggestions.some(f => f.facultyId === facultyPriya.id);
    assert.ok(priyaFound, 'Free Faculty Finder suggested Priya for Period 1 DBMS');

    // Submit Leave with Substitution assigned
    const substitutionsList = affectedPeriods.map(p => ({
      ...p,
      assignedSubstituteId: facultyPriya.id,
      assignedSubstituteName: 'Prof. Priya Sundaram',
    }));

    const leaveRequest = await FacultyLeaveService.submitLeaveOd(userArun.id, {
      requestType: 'LEAVE',
      category: 'CASUAL_LEAVE',
      reason: 'Attending family function',
      startDate: '2026-08-19',
      endDate: '2026-08-19',
      totalDays: 1,
      isHalfDay: false,
      isEmergency: false,
      affectedPeriods: affectedPeriods.map(p => `P${p.slotIndex}-${p.subjectCode}`),
      substitutionsList,
    });
    assert.strictEqual(leaveRequest.status, 'PENDING_HOD', 'Leave request created in PENDING_HOD');

    // HOD forwards to Principal
    const forwardedReq = await FacultyLeaveService.hodForwardToPrincipal({
      hodUserId: userHodIT.id,
      requestId: leaveRequest.id,
      remarks: 'Affected classes and substitutions verified. Forwarded.',
      confirmedSubstitutions: substitutionsList,
    });
    assert.strictEqual(forwardedReq.status, 'FORWARDED_TO_PRINCIPAL', 'HOD forwarded to Principal');

    // Principal Approves
    const approvedReq = await FacultyLeaveService.principalFinalApprove({
      principalUserId: userPrincipal.id,
      requestId: leaveRequest.id,
      remarks: 'Approved by Principal.',
    });
    assert.strictEqual(approvedReq.status, 'APPROVED_PRINCIPAL', 'Principal approved leave request');

    // Ledger debit verification
    const postBalances = await FacultyLeaveService.getFacultyLeaveBalances(facultyArun.id);
    const postCL = postBalances.find(b => b.leaveType === 'CASUAL_LEAVE');
    assert.strictEqual(postCL?.availableDays, openingCL - 1, 'Leave ledger debited exactly 1 day');
    console.log(`  • Ledger updated: Opening = ${openingCL}, Post-Approval Available = ${postCL?.availableDays}`);

    // Timetable override verification
    const overrides = await db.timetableSlotOverride.findMany({
      where: { leaveRequestId: leaveRequest.id },
    });
    assert.ok(overrides.length >= 1, 'TimetableSlotOverride records activated for substitute');

    // Verify Arun status is ON_LEAVE on that date
    const arunStatusOnLeave = await FacultyAvailabilityService.deriveFacultyPeriodStatus({
      facultyId: facultyArun.id,
      date: leaveDate,
      periodNumber: 1,
      dayOfWeek: 'WEDNESDAY',
    });
    assert.strictEqual(arunStatusOnLeave.status, 'ON_LEAVE', 'Arun real-time status is ON_LEAVE');

    // Verify Priya status is SUBSTITUTE_CLASS
    const priyaStatus = await FacultyAvailabilityService.deriveFacultyPeriodStatus({
      facultyId: facultyPriya.id,
      date: leaveDate,
      periodNumber: 1,
      dayOfWeek: 'WEDNESDAY',
    });
    assert.strictEqual(priyaStatus.status, 'SUBSTITUTE_CLASS', 'Priya real-time status is SUBSTITUTE_CLASS');

    // Idempotency: retry approval does NOT double-debit
    await FacultyLeaveService.principalFinalApprove({
      principalUserId: userPrincipal.id,
      requestId: leaveRequest.id,
      remarks: 'Retry approval check',
    });
    const recheckBalances = await FacultyLeaveService.getFacultyLeaveBalances(facultyArun.id);
    const recheckCL = recheckBalances.find(b => b.leaveType === 'CASUAL_LEAVE');
    assert.strictEqual(recheckCL?.availableDays, openingCL - 1, 'Idempotency verified: No double deduction');

    console.log('✅ TEST 2 PASSED: Leave Flow, Substitution & Idempotent Ledger verified.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3 — Permanent Department Transfer with Historical Preservation
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 3: Permanent Department Transfer with Historical Preservation');
    console.log('────────────────────────────────────────────────────────────────────────');

    const transferProposal = await CrossDepartmentService.proposeDepartmentTransfer({
      facultyId: facultyArun.id,
      toDepartmentId: deptAIDS.id,
      effectiveDate: new Date('2026-09-01'),
      reason: 'Strategic department restructuring for AI research center',
      designationImpact: 'Assistant Professor (AI&DS)',
      handoverNotes: { mentorHandover: 'Handed over to Prof. Priya', assetHandover: 'Keys submitted' },
      initiatedById: userHodIT.id,
      initiatedByName: 'Robert Vance (HOD IT)',
    });
    assert.strictEqual(transferProposal.status, 'PROPOSED', 'Transfer proposed');

    // Step 1: Receiving HOD
    const step1 = await CrossDepartmentService.processTransferStep({
      transferId: transferProposal.id,
      action: 'APPROVE',
      approverId: 'aids-hod-id',
      approverName: 'Dr. Geoffrey Hinton',
      approverRole: 'RECEIVING_HOD',
      comments: 'AI&DS department accepts Arun Kumar.',
    });
    assert.strictEqual(step1.status, 'RECEIVING_HOD_APPROVED', 'Receiving HOD approved');

    // Step 2: HR
    const step2 = await CrossDepartmentService.processTransferStep({
      transferId: transferProposal.id,
      action: 'APPROVE',
      approverId: 'hr-admin-id',
      approverName: 'HR Administration',
      approverRole: 'HR',
    });
    assert.strictEqual(step2.status, 'HR_APPROVED', 'HR approved');

    // Step 3: VP
    const step3 = await CrossDepartmentService.processTransferStep({
      transferId: transferProposal.id,
      action: 'APPROVE',
      approverId: 'vp-user-id',
      approverName: 'Dr. Meenakshi Sundaram (VP)',
      approverRole: 'VP',
    });
    assert.strictEqual(step3.status, 'VP_APPROVED', 'VP approved');

    // Step 4: Principal Final Approval
    const step4 = await CrossDepartmentService.processTransferStep({
      transferId: transferProposal.id,
      action: 'APPROVE',
      approverId: userPrincipal.id,
      approverName: 'Dr. Subramanian Ramasamy (Principal)',
      approverRole: 'PRINCIPAL',
      comments: 'Permanent transfer approved effective immediately.',
    });
    assert.strictEqual(step4.status, 'COMPLETED', 'Transfer completed');

    // Verify Faculty now officially belongs to AI&DS
    const updatedArun = await prisma.faculty.findUnique({
      where: { id: facultyArun.id },
      include: { department: true },
    });
    assert.strictEqual(updatedArun?.departmentId, deptAIDS.id, 'Faculty home department updated to AI&DS');
    assert.strictEqual(updatedArun?.department.code, deptAIDS.code, 'Home department code matches AI&DS');

    // Verify Historical record in transfers table retains original fromDepartment
    const transferRecord = await db.facultyDepartmentTransfer.findUnique({
      where: { id: transferProposal.id },
      include: { fromDepartment: true, toDepartment: true },
    });
    assert.strictEqual(transferRecord?.fromDepartment.code, deptIT.code, 'Historical from-department preserved as IT');
    assert.strictEqual(transferRecord?.toDepartment.code, deptAIDS.code, 'Historical to-department recorded as AI&DS');
    console.log('  • Faculty Home Department successfully updated to AI&DS while preserving historical IT records.');

    console.log('✅ TEST 3 PASSED: Permanent Department Transfer verified.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4 — Campus Office Document & Report Review Workflow
    // ──────────────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🧪 TEST 4: Campus Office Documents, Auto-Fill Tokens, Review & Forms');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 1. Create Document from Template
    const doc = await CampusOfficeService.createDocument(userArun.id, {
      title: 'IT & AI&DS Monthly Academic Progress Report',
      type: 'REPORT',
      category: 'DEPARTMENT',
      templateKey: 'DEPT_MONTHLY_REPORT',
    });
    assert.strictEqual(doc.status, 'DRAFT', 'Initial document status is DRAFT');
    assert.strictEqual(doc.currentVersion, 1, 'Initial version is 1');

    // 2. Update with rich sections
    const parsedContent = JSON.parse(doc.contentJson || '{}');
    parsedContent.sections.push({
      heading: '6. Cross-Department Faculty Teaching Load',
      text: 'Dr. Arun Kumar completed 16 hours of lectures across IT and AI&DS.',
    });

    const updatedDoc = await CampusOfficeService.updateDocument(doc.id, userArun.id, {
      title: 'IT & AI&DS Monthly Academic Progress Report (Finalized)',
      contentJson: parsedContent,
      tags: ['ACADEMIC', 'MONTHLY_REPORT'],
    });
    assert.ok(updatedDoc.title.includes('Finalized'), 'Document title updated');

    // 3. Submit Document for HOD Review
    const submittedDoc = await CampusOfficeService.submitDocumentForReview(doc.id, userArun.id, {
      targetWorkflowStep: 'HOD',
      submissionRemarks: 'Submitted for monthly HOD review and sign-off.',
    });
    assert.strictEqual(submittedDoc.status, 'IN_REVIEW', 'Document status is IN_REVIEW');
    assert.strictEqual(submittedDoc.currentVersion, 2, 'Version bumped to 2 upon review submission');

    // 4. HOD Review & Comment
    const reviewedDoc = await CampusOfficeService.reviewDocument(doc.id, userHodIT.id, {
      action: 'RETURN',
      commentText: 'Please add lab experiment log summary in Section 4 before final sign-off.',
    });
    assert.strictEqual(reviewedDoc.status, 'RETURNED', 'Document returned with comments');
    assert.ok(reviewedDoc.comments.length >= 1, 'Review comment logged');

    // 5. Final Approval
    const approvedDoc = await CampusOfficeService.reviewDocument(doc.id, userHodIT.id, {
      action: 'APPROVE',
      commentText: 'Lab experiments verified. Report approved.',
    });
    assert.strictEqual(approvedDoc.status, 'APPROVED', 'Document approved by HOD');

    // 6. Test Forms Engine: Create & Submit Response
    const formDoc = await CampusOfficeService.createDocument(userArun.id, {
      title: 'Faculty Research Data Collection 2026',
      type: 'FORM',
      category: 'IQAC',
      templateKey: 'IQAC_DATA_COLLECTION',
    });

    const formResponse = await CampusOfficeService.submitFormResponse(formDoc.id, {
      userId: userArun.id,
      email: userArun.email,
      name: `${userArun.firstName} ${userArun.lastName}`,
      answers: {
        q1: 'Dr. Arun Kumar',
        q2: 'AI&DS',
        q3: 'SCI/Scopus Journal',
        q4: 'Deep Learning Architectures for Smart Campus Operations',
        q5: 'IEEE Transactions on Education (DOI: 10.1109/TE.2026.12345)',
      },
    });
    assert.strictEqual(formResponse.status, 'SUBMITTED', 'Form response submitted successfully');

    const responsesSummary = await CampusOfficeService.getFormResponses(formDoc.id);
    assert.strictEqual(responsesSummary.totalResponses, 1, 'Form responses consolidated');
    assert.ok(responsesSummary.responses[0].answers.q4.includes('Deep Learning'), 'Form answers stored accurately');

    // 7. Test Campus Drive
    const driveFolder = await CampusOfficeService.createDriveItem(userArun.id, {
      name: 'Department Files 2026',
      isFolder: true,
      scope: 'DEPARTMENT',
      departmentId: deptAIDS.id,
    });
    assert.strictEqual(driveFolder.isFolder, true, 'Campus drive folder created');

    console.log('✅ TEST 4 PASSED: Campus Office Documents, Versioning, Review & Forms verified.\n');

    console.log('================================================================================');
    console.log('🏆 ALL 4 END-TO-END SUITE TESTS COMPLETED SUCCESSFULLY!');
    console.log('================================================================================\n');

  } catch (err: any) {
    console.error('❌ TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCrossDepartmentFacultySuite();
