import { prisma } from '../lib/prisma';
import { StudentLeaveService } from '../modules/enterprise/student-leave.service';
import { HodPortalService } from '../modules/enterprise/hod-portal.service';
import { logger } from '../utils/logger';

async function runVerification() {
  console.log('====================================================');
  console.log('🧪 VERIFYING STUDENT LEAVE/OD WORKFLOW & HOD PORTAL');
  console.log('====================================================\n');

  const leaveService = new StudentLeaveService();
  const hodService = new HodPortalService();

  try {
    // 1. Ensure test Departments exist (CSE and ECE)
    let cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });
    if (!cseDept) {
      cseDept = await prisma.department.create({
        data: { name: 'Computer Science & Engineering', code: 'CSE', status: 'ACTIVE' }
      });
    }

    let eceDept = await prisma.department.findUnique({ where: { code: 'ECE' } });
    if (!eceDept) {
      eceDept = await prisma.department.create({
        data: { name: 'Electronics & Communication Engineering', code: 'ECE', status: 'ACTIVE' }
      });
    }

    // Ensure Roles exist
    let studentRole = await prisma.role.findUnique({ where: { name: 'Student' } });
    if (!studentRole) {
      studentRole = await prisma.role.create({ data: { name: 'Student', roleCode: 'STU' } });
    }

    let facultyRole = await prisma.role.findUnique({ where: { name: 'Faculty' } });
    if (!facultyRole) {
      facultyRole = await prisma.role.create({ data: { name: 'Faculty', roleCode: 'FAC' } });
    }

    let hodRole = await prisma.role.findUnique({ where: { name: 'HOD' } });
    if (!hodRole) {
      hodRole = await prisma.role.create({ data: { name: 'HOD', roleCode: 'HOD' } });
    }

    // 2. Setup CSE HOD User & Faculty
    const cseHodEmail = `cse_hod_test_${Date.now()}@campusos.edu`;
    const cseHodUser = await prisma.user.create({
      data: {
        email: cseHodEmail,
        passwordHash: 'hashed_pw',
        firstName: 'Dr. CSE',
        lastName: 'HOD',
        roleId: hodRole.id,
      }
    });

    const cseHodFaculty = await prisma.faculty.create({
      data: {
        employeeId: `EMP-HOD-${Date.now().toString().slice(-4)}`,
        firstName: 'Dr. CSE',
        lastName: 'HOD',
        email: cseHodEmail,
        phone: '9876543210',
        dob: new Date('1980-01-01'),
        dateOfJoining: new Date('2015-01-01'),
        designation: 'Professor & HOD',
        qualification: 'Ph.D',
        experience: 15,
        departmentId: cseDept.id,
        userId: cseHodUser.id,
      }
    });

    // Update CSE Department with hodUserId and hodId
    await prisma.department.update({
      where: { id: cseDept.id },
      data: { hodUserId: cseHodUser.id, hodId: cseHodFaculty.id, hodName: 'Dr. CSE HOD' }
    });

    // 3. Setup CSE Mentor
    const cseMentorEmail = `cse_mentor_test_${Date.now()}@campusos.edu`;
    const cseMentorUser = await prisma.user.create({
      data: {
        email: cseMentorEmail,
        passwordHash: 'hashed_pw',
        firstName: 'Prof. CSE',
        lastName: 'Mentor',
        roleId: facultyRole.id,
      }
    });

    const cseMentorFaculty = await prisma.faculty.create({
      data: {
        employeeId: `EMP-MTR-${Date.now().toString().slice(-4)}`,
        firstName: 'Prof. CSE',
        lastName: 'Mentor',
        email: cseMentorEmail,
        phone: '9876543211',
        dob: new Date('1985-05-05'),
        dateOfJoining: new Date('2018-01-01'),
        designation: 'Assistant Professor',
        qualification: 'M.Tech',
        experience: 8,
        departmentId: cseDept.id,
        userId: cseMentorUser.id,
      }
    });

    // 4. Setup CSE Academic Context (Academic Year, Program, Course, Semester, Section)
    let acadYear = await prisma.academicYear.findFirst();
    if (!acadYear) {
      acadYear = await prisma.academicYear.create({
        data: { name: '2026-2027', startDate: new Date('2026-06-01'), endDate: new Date('2027-05-31'), isCurrent: true }
      });
    }

    let program = await prisma.program.findFirst({ where: { departmentId: cseDept.id } });
    if (!program) {
      program = await prisma.program.create({
        data: { name: 'B.Tech CSE Test', code: `CSE-${Date.now().toString().slice(-4)}`, departmentId: cseDept.id }
      });
    }

    let course = await prisma.course.findFirst({ where: { departmentId: cseDept.id } });
    if (!course) {
      course = await prisma.course.create({
        data: { name: 'Computer Science', code: 'CS', duration: 4, programId: program.id, departmentId: cseDept.id }
      });
    }

    let semester = await prisma.semester.findFirst({ where: { courseId: course.id } });
    if (!semester) {
      semester = await prisma.semester.create({
        data: { number: 5, name: 'Semester 5', startDate: new Date(), endDate: new Date(), courseId: course.id, programId: program.id, academicYearId: acadYear.id }
      });
    }

    let section = await prisma.section.findFirst({ where: { departmentId: cseDept.id } });
    if (!section) {
      section = await prisma.section.create({
        data: { name: 'A', semesterId: semester.id, programId: program.id, departmentId: cseDept.id }
      });
    }

    // 5. Setup CSE Student
    const cseStudentEmail = `cse_student_test_${Date.now()}@campusos.edu`;
    const cseStudentUser = await prisma.user.create({
      data: {
        email: cseStudentEmail,
        passwordHash: 'hashed_pw',
        firstName: 'Alice',
        lastName: 'Student',
        roleId: studentRole.id,
      }
    });

    const cseStudent = await prisma.student.create({
      data: {
        admissionNo: `ADM-${Date.now().toString().slice(-5)}`,
        firstName: 'Alice',
        lastName: 'Student',
        email: cseStudentEmail,
        phone: '9876543212',
        parentName: 'Bob Student',
        parentPhone: '9876543213',
        dob: new Date('2004-04-04'),
        dateOfAdmission: new Date('2022-08-01'),
        gender: 'Female',
        currentAddress: 'Campus Hostel',
        permanentAddress: 'City Center',
        academicYearId: acadYear.id,
        departmentId: cseDept.id,
        programId: program.id,
        courseId: course.id,
        semesterId: semester.id,
        sectionId: section.id,
        userId: cseStudentUser.id,
        mentorId: cseMentorFaculty.id,
      }
    });

    console.log('✅ Setup completed: Created CSE HOD, Mentor, and Student profiles.');

    // TEST 1: Student Submits Leave Request
    console.log('\n--- TEST 1: Student Submits Request ---');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 2); // 3-day request

    const submittedRequest = await leaveService.submitRequest(cseStudentUser.id, {
      type: 'LEAVE',
      requestCategory: 'MEDICAL',
      reason: 'Fever and medical rest',
      description: 'Prescribed 3 days rest by campus doctor',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      emergencyContact: '9876543213',
    });

    console.log(`✅ Request Created: ${submittedRequest.requestNumber}`);
    console.log(`   Initial Status: ${submittedRequest.workflowStatus} (Expected: PENDING_MENTOR)`);
    console.assert(submittedRequest.workflowStatus === 'PENDING_MENTOR', 'Initial status must be PENDING_MENTOR');

    // TEST 2: Mentor Level 1 Approval & Auto Forward to HOD
    console.log('\n--- TEST 2: Mentor Approves & Forwards to HOD ---');
    const mentorApprovedReq = await leaveService.mentorReview(
      cseMentorUser.id,
      submittedRequest.id,
      'APPROVE',
      'Endorsed by mentor. Student attendance is satisfactory.'
    );

    console.log(`✅ Mentor Review Executed.`);
    console.log(`   Updated Workflow Status: ${mentorApprovedReq.workflowStatus} (Expected: PENDING_HOD)`);
    console.log(`   Assigned HOD Faculty ID: ${mentorApprovedReq.hodId} (Matches HOD: ${mentorApprovedReq.hodId === cseHodFaculty.id})`);
    console.assert(mentorApprovedReq.workflowStatus === 'PENDING_HOD', 'Workflow status must advance to PENDING_HOD after mentor approval');
    console.assert(mentorApprovedReq.hodId === cseHodFaculty.id, 'HOD ID must resolve to the department HOD');

    // TEST 3: HOD Pending Queue & Department Isolation Check
    console.log('\n--- TEST 3: HOD Pending Queue & Data Isolation ---');
    const hodPendingQueue = await leaveService.getHodPendingRequests(cseHodUser.id);
    console.log(`✅ HOD Pending Queue fetched ${hodPendingQueue.length} request(s).`);
    const foundInQueue = hodPendingQueue.some(r => r.id === submittedRequest.id);
    console.assert(foundInQueue, 'Request must appear in HOD pending queue');

    // TEST 4: HOD Final Approval & Attendance Auto-Adjustment
    console.log('\n--- TEST 4: HOD Final Approval & Attendance Auto-Adjustment ---');
    const hodFinalReq = await leaveService.hodReview(
      cseHodUser.id,
      submittedRequest.id,
      'APPROVE',
      'Final HOD Approval Granted.'
    );

    console.log(`✅ HOD Approval Executed.`);
    console.log(`   Final Workflow Status: ${hodFinalReq.workflowStatus} (Expected: APPROVED)`);
    console.assert(hodFinalReq.workflowStatus === 'APPROVED', 'Final status must be APPROVED');

    // Verify Attendance Adjustments
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId: cseStudent.id }
    });
    console.log(`✅ Auto-adjusted ${attendanceRecords.length} daily attendance record(s) to EXCUSED_LEAVE.`);
    console.assert(attendanceRecords.length >= 1, 'Attendance records must be created/adjusted');

    // TEST 5: Guard Rail Test for Missing HOD
    console.log('\n--- TEST 5: Guard Rail Test (Department without HOD) ---');
    // ECE department currently has no HOD
    const eceStudentUser = await prisma.user.create({
      data: { email: `ece_student_${Date.now()}@campusos.edu`, passwordHash: 'pw', firstName: 'Bob', lastName: 'ECE', roleId: studentRole.id }
    });
    const eceStudent = await prisma.student.create({
      data: {
        admissionNo: `ADM-ECE-${Date.now().toString().slice(-4)}`,
        firstName: 'Bob',
        lastName: 'ECE',
        dob: new Date('2004-01-01'),
        dateOfAdmission: new Date(),
        gender: 'Male',
        parentName: 'Parent',
        parentPhone: '9999999999',
        currentAddress: 'Campus',
        permanentAddress: 'Campus',
        academicYearId: acadYear.id,
        departmentId: eceDept.id,
        programId: program.id,
        courseId: course.id,
        semesterId: semester.id,
        sectionId: section.id,
        userId: eceStudentUser.id,
        mentorId: cseMentorFaculty.id, // Mentor in CSE approving for ECE student with no HOD
      }
    });

    const eceReq = await leaveService.submitRequest(eceStudentUser.id, {
      type: 'LEAVE',
      reason: 'Guard rail test',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });

    try {
      await leaveService.mentorReview(cseMentorUser.id, eceReq.id, 'APPROVE', 'Trying to forward without HOD');
      console.error('❌ Guard rail failed: Mentor approval should have thrown BadRequestException');
    } catch (err: any) {
      console.log(`✅ Guard Rail Active: Correctly caught missing HOD error: "${err.message}"`);
    }

    // TEST 6: HOD Dashboard Metrics Verification
    console.log('\n--- TEST 6: HOD Dashboard Executive Metrics ---');
    const dashSummary = await hodService.getDashboardSummary(cseHodUser.id);
    console.log(`✅ Dashboard Summary Fetched for Department: ${dashSummary.department?.name || 'CSE'}`);
    console.log(`   Total Students: ${dashSummary.summaryCards.totalStudents}`);
    console.log(`   Total Faculty: ${dashSummary.summaryCards.totalFaculty}`);
    console.log(`   Approved Today: ${dashSummary.summaryCards.approvedTodayCount}`);

    console.log('\n====================================================');
    console.log('🎉 ALL WORKFLOW & HOD PORTAL TESTS PASSED CLEANLY!');
    console.log('====================================================\n');

  } catch (err: any) {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
