import assert from 'assert';
import { prisma } from '../lib/prisma';
import { FacultyLeaveService } from '../modules/faculty-leave/faculty-leave.service';

async function runFacultyTimetableSubstitutionSuite() {
  console.log('================================================================================');
  console.log('🧪 CAMPUSOS — FACULTY LEAVE & DEPARTMENT-WISE TIMETABLE SUBSTITUTION SUITE');
  console.log('================================================================================\n');

  try {
    console.log('📦 Setting up test fixtures (Departments, Courses, Subjects, Faculty & Slots)...');

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

    // 2. Academic Year
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

    // 3. Departments
    let deptIT = await prisma.department.findFirst({ where: { code: 'IT' } });
    if (!deptIT) {
      deptIT = await prisma.department.create({
        data: { name: 'Information Technology', code: 'IT', shortName: 'IT', status: 'ACTIVE' },
      });
    }

    let deptAIDS = await prisma.department.findFirst({ where: { code: 'AIDS' } });
    if (!deptAIDS) {
      deptAIDS = await prisma.department.create({
        data: { name: 'Artificial Intelligence and Data Science', code: 'AIDS', shortName: 'AI&DS', status: 'ACTIVE' },
      });
    }

    // 4. Programs & Courses & Semesters
    let progIT = await prisma.program.findFirst({ where: { departmentId: deptIT.id } });
    if (!progIT) {
      progIT = await prisma.program.create({
        data: { name: 'B.Tech IT', code: 'BTECH-IT-TEST', departmentId: deptIT.id },
      });
    }
    let progAIDS = await prisma.program.findFirst({ where: { departmentId: deptAIDS.id } });
    if (!progAIDS) {
      progAIDS = await prisma.program.create({
        data: { name: 'B.Tech AI&DS', code: 'BTECH-AIDS-TEST', departmentId: deptAIDS.id },
      });
    }

    let courseIT = await prisma.course.findFirst({ where: { departmentId: deptIT.id } });
    if (!courseIT) {
      courseIT = await prisma.course.create({
        data: { name: 'IT Course', code: 'IT-CRS-TEST', duration: 4, programId: progIT.id, departmentId: deptIT.id },
      });
    }
    let courseAIDS = await prisma.course.findFirst({ where: { departmentId: deptAIDS.id } });
    if (!courseAIDS) {
      courseAIDS = await prisma.course.create({
        data: { name: 'AIDS Course', code: 'AIDS-CRS-TEST', duration: 4, programId: progAIDS.id, departmentId: deptAIDS.id },
      });
    }

    let semIT = await prisma.semester.findFirst({ where: { courseId: courseIT.id } });
    if (!semIT) {
      semIT = await prisma.semester.create({
        data: { number: 3, name: 'Semester 3', startDate: new Date('2026-06-01'), endDate: new Date('2026-11-30'), courseId: courseIT.id, programId: progIT.id, academicYearId: academicYear.id },
      });
    }
    let semAIDS = await prisma.semester.findFirst({ where: { courseId: courseAIDS.id } });
    if (!semAIDS) {
      semAIDS = await prisma.semester.create({
        data: { number: 5, name: 'Semester 5', startDate: new Date('2026-06-01'), endDate: new Date('2026-11-30'), courseId: courseAIDS.id, programId: progAIDS.id, academicYearId: academicYear.id },
      });
    }

    // 5. Sections
    let secIT = await prisma.section.findFirst({ where: { semesterId: semIT.id, name: 'II IT-A' } });
    if (!secIT) {
      secIT = await prisma.section.create({
        data: { name: 'II IT-A', semesterId: semIT.id, programId: progIT.id, departmentId: deptIT.id },
      });
    }
    let secAIDS = await prisma.section.findFirst({ where: { semesterId: semAIDS.id, name: 'III AI&DS-A' } });
    if (!secAIDS) {
      secAIDS = await prisma.section.create({
        data: { name: 'III AI&DS-A', semesterId: semAIDS.id, programId: progAIDS.id, departmentId: deptAIDS.id },
      });
    }

    // 6. Subjects
    let subjDBMS = await prisma.subject.findFirst({ where: { code: 'IT-DBMS-2026' } });
    if (!subjDBMS) {
      subjDBMS = await prisma.subject.create({
        data: { name: 'Database Management Systems', code: 'IT-DBMS-2026', credits: 3, departmentId: deptIT.id, semesterId: semIT.id, programId: progIT.id },
      });
    }
    let subjBDALab = await prisma.subject.findFirst({ where: { code: 'AI-BDA-LAB-2026' } });
    if (!subjBDALab) {
      subjBDALab = await prisma.subject.create({
        data: { name: 'Big Data Analytics Lab', code: 'AI-BDA-LAB-2026', credits: 2, departmentId: deptAIDS.id, semesterId: semAIDS.id, programId: progAIDS.id },
      });
    }

    // 7. Users & Faculty
    // Applicant: Dr. Arun (Home: IT, teaches in IT and AI&DS)
    const userArun = await prisma.user.upsert({
      where: { email: 'arun.test.faculty@campusos.internal' },
      update: { roleId: facultyRole.id, departmentId: deptIT.id },
      create: {
        email: 'arun.test.faculty@campusos.internal',
        passwordHash: 'argon2-test-hash',
        firstName: 'Dr. Arun',
        lastName: 'Kumar',
        roleId: facultyRole.id,
        departmentId: deptIT.id,
        status: 'ACTIVE',
      },
    });

    const facultyArun = await prisma.faculty.upsert({
      where: { employeeId: 'FAC-ARUN-TEST' },
      update: { departmentId: deptIT.id, designation: 'Associate Professor', userId: userArun.id },
      create: {
        userId: userArun.id,
        employeeId: 'FAC-ARUN-TEST',
        firstName: 'Dr. Arun',
        lastName: 'Kumar',
        email: 'arun.test.faculty@campusos.internal',
        phone: '+91 98765 43210',
        dob: new Date('1985-05-15'),
        dateOfJoining: new Date('2018-06-01'),
        designation: 'Associate Professor',
        qualification: 'M.Tech, Ph.D',
        experience: 10,
        departmentId: deptIT.id,
        status: 'ACTIVE',
      },
    });

    // IT Substitute Candidate: Dr. Priya (IT Dept)
    const userPriya = await prisma.user.upsert({
      where: { email: 'priya.test.it@campusos.internal' },
      update: { roleId: facultyRole.id, departmentId: deptIT.id },
      create: {
        email: 'priya.test.it@campusos.internal',
        passwordHash: 'argon2-test-hash',
        firstName: 'Dr. Priya',
        lastName: 'Sundaram',
        roleId: facultyRole.id,
        departmentId: deptIT.id,
        status: 'ACTIVE',
      },
    });

    const facultyPriya = await prisma.faculty.upsert({
      where: { employeeId: 'FAC-PRIYA-IT' },
      update: { departmentId: deptIT.id, designation: 'Assistant Professor', userId: userPriya.id },
      create: {
        userId: userPriya.id,
        employeeId: 'FAC-PRIYA-IT',
        firstName: 'Dr. Priya',
        lastName: 'Sundaram',
        email: 'priya.test.it@campusos.internal',
        phone: '+91 98765 43211',
        dob: new Date('1988-08-20'),
        dateOfJoining: new Date('2020-07-01'),
        designation: 'Assistant Professor',
        qualification: 'M.E Software Engg',
        experience: 6,
        departmentId: deptIT.id,
        status: 'ACTIVE',
      },
    });

    // AI&DS Substitute Candidate: Dr. Rajesh (AI&DS Dept)
    const userRajesh = await prisma.user.upsert({
      where: { email: 'rajesh.test.aids@campusos.internal' },
      update: { roleId: facultyRole.id, departmentId: deptAIDS.id },
      create: {
        email: 'rajesh.test.aids@campusos.internal',
        passwordHash: 'argon2-test-hash',
        firstName: 'Dr. Rajesh',
        lastName: 'Venkatesh',
        roleId: facultyRole.id,
        departmentId: deptAIDS.id,
        status: 'ACTIVE',
      },
    });

    const facultyRajesh = await prisma.faculty.upsert({
      where: { employeeId: 'FAC-RAJESH-AIDS' },
      update: { departmentId: deptAIDS.id, designation: 'Professor', userId: userRajesh.id },
      create: {
        userId: userRajesh.id,
        employeeId: 'FAC-RAJESH-AIDS',
        firstName: 'Dr. Rajesh',
        lastName: 'Venkatesh',
        email: 'rajesh.test.aids@campusos.internal',
        phone: '+91 98765 43212',
        dob: new Date('1980-03-10'),
        dateOfJoining: new Date('2015-06-01'),
        designation: 'Professor',
        qualification: 'Ph.D AI & Machine Learning',
        experience: 15,
        departmentId: deptAIDS.id,
        status: 'ACTIVE',
      },
    });

    // HOD User (IT Dept)
    const userHodIT = await prisma.user.upsert({
      where: { email: 'hod.it.test@campusos.internal' },
      update: { roleId: hodRole.id, departmentId: deptIT.id },
      create: {
        email: 'hod.it.test@campusos.internal',
        passwordHash: 'argon2-test-hash',
        firstName: 'Prof. Suresh',
        lastName: 'HOD-IT',
        roleId: hodRole.id,
        departmentId: deptIT.id,
        status: 'ACTIVE',
      },
    });

    await prisma.department.update({
      where: { id: deptIT.id },
      data: { hodUserId: userHodIT.id },
    });

    // Principal User
    const userPrincipal = await prisma.user.upsert({
      where: { email: 'principal.test@campusos.internal' },
      update: { roleId: principalRole.id },
      create: {
        email: 'principal.test@campusos.internal',
        passwordHash: 'argon2-test-hash',
        firstName: 'Dr. V.',
        lastName: 'Principal',
        roleId: principalRole.id,
        status: 'ACTIVE',
      },
    });

    // 8. Setup Published Timetable Slots for Dr. Arun:
    // - Monday Period 1 (09:00 - 09:50) -> IT Department (II IT-A, DBMS)
    // - Monday Period 3 (10:50 - 11:40) -> IT Department (II IT-A, DBMS)
    // - Monday Period 4 & 5 (11:40 - 13:20) -> AI&DS Department (III AI&DS-A, Big Data Analytics Lab - Multi Period!)
    await prisma.timetableSlotOverride.deleteMany({ where: { originalFacultyId: facultyArun.id } });
    await prisma.timetableSlot.deleteMany({ where: { facultyId: facultyArun.id } });

    const slotP1 = await prisma.timetableSlot.create({
      data: {
        dayOfWeek: 'MONDAY',
        slotIndex: 1,
        startTime: '09:00 AM',
        endTime: '09:50 AM',
        academicYearId: academicYear.id,
        departmentId: deptIT.id,
        semesterId: semIT.id,
        sectionId: secIT.id,
        subjectId: subjDBMS.id,
        facultyId: facultyArun.id,
        roomNo: 'IT-201',
        isLab: false,
        slotType: 'THEORY',
        status: 'ACTIVE',
      },
    });

    const slotP3 = await prisma.timetableSlot.create({
      data: {
        dayOfWeek: 'MONDAY',
        slotIndex: 3,
        startTime: '10:50 AM',
        endTime: '11:40 AM',
        academicYearId: academicYear.id,
        departmentId: deptIT.id,
        semesterId: semIT.id,
        sectionId: secIT.id,
        subjectId: subjDBMS.id,
        facultyId: facultyArun.id,
        roomNo: 'IT-201',
        isLab: false,
        slotType: 'THEORY',
        status: 'ACTIVE',
      },
    });

    // Consecutive multi-period lab in AI&DS department
    const slotP4 = await prisma.timetableSlot.create({
      data: {
        dayOfWeek: 'MONDAY',
        slotIndex: 4,
        startTime: '11:40 AM',
        endTime: '12:30 PM',
        academicYearId: academicYear.id,
        departmentId: deptAIDS.id,
        semesterId: semAIDS.id,
        sectionId: secAIDS.id,
        subjectId: subjBDALab.id,
        facultyId: facultyArun.id,
        roomNo: 'AI Lab-2',
        isLab: true,
        slotType: 'LAB',
        status: 'ACTIVE',
      },
    });

    const slotP5 = await prisma.timetableSlot.create({
      data: {
        dayOfWeek: 'MONDAY',
        slotIndex: 5,
        startTime: '12:30 PM',
        endTime: '01:20 PM',
        academicYearId: academicYear.id,
        departmentId: deptAIDS.id,
        semesterId: semAIDS.id,
        sectionId: secAIDS.id,
        subjectId: subjBDALab.id,
        facultyId: facultyArun.id,
        roomNo: 'AI Lab-2',
        isLab: true,
        slotType: 'LAB',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Fixtures initialized successfully.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1: AUTO-DETECT TIMETABLE & MULTI-PERIOD LAB MERGING
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🧪 TEST 1: Auto-Detect Timetable & Multi-Period Lab Merging...');
    const testMonday = new Date('2026-08-17'); // 17 Aug 2026 is a Monday

    const detectionResult = await FacultyLeaveService.detectAffectedSessions({
      facultyId: facultyArun.id,
      startDate: testMonday,
      endDate: testMonday,
    });

    assert.strictEqual(detectionResult.totalSessions, 3, 'Should produce 3 distinct session groups (P1, P3, P4–P5)');
    const p1Session = detectionResult.sessions.find(s => s.periodStart === 1);
    const p3Session = detectionResult.sessions.find(s => s.periodStart === 3);
    const labSession = detectionResult.sessions.find(s => s.periodStart === 4);

    assert.ok(p1Session, 'Period 1 IT session detected');
    assert.strictEqual(p1Session?.departmentCode, 'IT');
    assert.strictEqual(p1Session?.periodDisplay, 'Period 1');

    assert.ok(labSession, 'Multi-period Lab session detected');
    assert.strictEqual(labSession?.periodDisplay, 'Period 4–5', 'P4 and P5 merged into "Period 4–5"');
    assert.strictEqual(labSession?.periodEnd, 5);
    assert.strictEqual(labSession?.departmentCode, 'AIDS');
    assert.strictEqual(labSession?.slotIds.length, 2, 'Lab session encapsulates both slot IDs');
    assert.strictEqual(labSession?.isLab, true);

    console.log('✅ TEST 1 PASSED: Multi-period lab merged and all sessions detected accurately.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2: DEPARTMENT-WISE SUBSTITUTE CANDIDATE SCOPING
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🧪 TEST 2: Department-Wise Substitute Candidate Scoping...');
    // IT Session should offer IT faculty (Dr. Priya)
    assert.ok(p1Session?.eligibleSubstitutes.length > 0, 'IT session has eligible candidates');
    const hasPriyaInIT = p1Session?.eligibleSubstitutes.some(c => c.facultyId === facultyPriya.id);
    assert.ok(hasPriyaInIT, 'Dr. Priya (IT) is eligible for IT DBMS class');

    // AI&DS Session should offer AI&DS faculty (Dr. Rajesh)
    assert.ok(labSession?.eligibleSubstitutes.length > 0, 'AI&DS session has eligible candidates');
    const hasRajeshInAIDS = labSession?.eligibleSubstitutes.some(c => c.facultyId === facultyRajesh.id);
    assert.ok(hasRajeshInAIDS, 'Dr. Rajesh (AI&DS) is eligible for AI&DS Big Data Analytics Lab');

    console.log('✅ TEST 2 PASSED: Candidates scoped strictly by class-owning department.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: HALF-DAY FILTERING & SUNDAY NON-WORKING DETECTION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🧪 TEST 3: Half-Day Filtering & Sunday Handling...');
    const firstHalfResult = await FacultyLeaveService.detectAffectedSessions({
      facultyId: facultyArun.id,
      startDate: testMonday,
      endDate: testMonday,
      isHalfDay: true,
      halfDayPeriod: 'FIRST_HALF',
    });
    assert.ok(firstHalfResult.sessions.some(s => s.periodStart === 1));

    const sundayDate = new Date('2026-08-16'); // 16 Aug 2026 is Sunday
    const sundayResult = await FacultyLeaveService.detectAffectedSessions({
      facultyId: facultyArun.id,
      startDate: sundayDate,
      endDate: sundayDate,
    });
    assert.strictEqual(sundayResult.totalSessions, 0, 'Sunday has 0 affected sessions');
    assert.ok(sundayResult.nonWorkingDays.length > 0, 'Sunday identified as non-working day');

    console.log('✅ TEST 3 PASSED: Half-Day filtering and Sunday detection verified.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: END-TO-END SUBMISSION, HOD FORWARD & PRINCIPAL APPROVAL
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🧪 TEST 4: End-to-End Submission, HOD Forward & Principal Approval Overrides...');
    
    // 1. Submit Leave Request with chosen substitutes:
    // P1 (IT) -> Dr. Priya
    // P3 (IT) -> Dr. Priya
    // P4-P5 (AI&DS) -> Dr. Rajesh
    const preparedSubstitutions = detectionResult.sessions.map(s => {
      if (s.departmentCode === 'IT') {
        return {
          ...s,
          assignedSubstituteId: facultyPriya.id,
          assignedSubstituteName: 'Dr. Priya Sundaram',
        };
      } else {
        return {
          ...s,
          assignedSubstituteId: facultyRajesh.id,
          assignedSubstituteName: 'Dr. Rajesh Venkatesh',
        };
      }
    });

    const leaveReq = await FacultyLeaveService.submitLeaveOd(userArun.id, {
      requestType: 'LEAVE',
      category: 'Casual Leave',
      startDate: '2026-08-17',
      endDate: '2026-08-17',
      totalDays: 1,
      reason: 'Attending University Valuation Board',
      isHalfDay: false,
      isEmergency: false,
      affectedPeriods: preparedSubstitutions as any,
      substitutionsList: preparedSubstitutions as any,
    });

    assert.ok(leaveReq.id, 'Leave request created');
    assert.strictEqual(leaveReq.status, 'PENDING_HOD');

    // 2. HOD Review & Forward
    const forwardedReq = await FacultyLeaveService.hodForwardToPrincipal({
      hodUserId: userHodIT.id,
      requestId: leaveReq.id,
      remarks: 'Substitutions verified for both IT and AI&DS classes. Forwarded to Principal.',
    });
    assert.strictEqual(forwardedReq.status, 'FORWARDED_TO_PRINCIPAL');

    // 3. Principal Approval -> Activates TimetableSlotOverrides
    const approvedReq = await FacultyLeaveService.principalFinalApprove({
      principalUserId: userPrincipal.id,
      requestId: leaveReq.id,
      remarks: 'Final Approval granted.',
    });
    assert.strictEqual(approvedReq.status, 'APPROVED_PRINCIPAL');

    // Verify overrides created in database
    const overrides = await prisma.timetableSlotOverride.findMany({
      where: { leaveRequestId: leaveReq.id, status: 'ACTIVE' },
    });

    assert.strictEqual(overrides.length, 4, '4 individual period overrides created (P1, P3, P4, P5)');
    const priyaOverrides = overrides.filter(o => o.substituteFacultyId === facultyPriya.id);
    const rajeshOverrides = overrides.filter(o => o.substituteFacultyId === facultyRajesh.id);

    assert.strictEqual(priyaOverrides.length, 2, 'Priya covers P1 & P3 IT classes');
    assert.strictEqual(rajeshOverrides.length, 2, 'Rajesh covers P4 & P5 AI&DS lab session');

    // Verify canonical TimetableSlot is intact
    const originalSlotP1 = await prisma.timetableSlot.findUnique({ where: { id: slotP1.id } });
    assert.strictEqual(originalSlotP1?.facultyId, facultyArun.id, 'Original timetable slot preserves Dr. Arun');

    console.log('✅ TEST 4 PASSED: End-to-end workflow successfully created non-destructive overrides.\n');

    console.log('================================================================================');
    console.log('🏆 ALL 4 FACULTY TIMETABLE SUBSTITUTION TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================================\n');

  } catch (err) {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFacultyTimetableSubstitutionSuite();
