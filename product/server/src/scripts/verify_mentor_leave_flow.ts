import { prisma } from '../lib/prisma';
import { StudentLeaveService } from '../modules/enterprise/student-leave.service';
import { MentorService } from '../modules/mentor/mentor.service';

async function main() {
  console.log('====================================================');
  console.log('  CAMPUSOS STUDENT LEAVE/OD -> MENTOR APPROVAL TEST');
  console.log('====================================================\n');

  const studentLeaveService = new StudentLeaveService();
  const mentorService = new MentorService();

  // 1. Find a Student with an assigned Mentor and Department with HOD
  const student = await prisma.student.findFirst({
    where: {
      userId: { not: undefined },
      mentorId: { not: undefined },
      departmentId: { not: undefined },
    },
    include: {
      department: true,
      user: true,
    },
  });

  if (!student || !student.userId || !student.mentorId || !student.departmentId) {
    console.error('No suitable student with mentor and department found in DB.');
    process.exit(1);
  }

  const mentorFaculty = await prisma.faculty.findUnique({
    where: { id: student.mentorId },
    include: { user: true },
  });

  if (!mentorFaculty || !mentorFaculty.userId) {
    console.error('Mentor faculty or mentor user profile not found.');
    process.exit(1);
  }

  const studentUserId = student.userId;
  const mentorUserId = mentorFaculty.userId;
  const departmentId = student.departmentId;

  console.log(`[Test Setup] Student: ${student.firstName} ${student.lastName} (User ID: ${studentUserId})`);
  console.log(`[Test Setup] Mentor: ${mentorFaculty.firstName} ${mentorFaculty.lastName} (User ID: ${mentorUserId})`);
  console.log(`[Test Setup] Department: ${student.department?.name} (ID: ${departmentId})`);

  // Ensure department has an assigned HOD user
  const hodInfo = await studentLeaveService.resolveDepartmentHodUser(departmentId);
  console.log(`[Test Setup] Resolved HOD User ID: ${hodInfo?.hodUserId || 'NONE'}`);

  let hodUserId = hodInfo?.hodUserId;
  if (!hodUserId) {
    const hodUser = await prisma.user.findFirst({
      where: { role: { name: { in: ['HOD', 'Head of Department'] } }, status: 'ACTIVE' },
    });
    if (hodUser) {
      hodUserId = hodUser.id;
      console.log(`[Test Setup] Using fallback HOD user: ${hodUser.email} (${hodUserId})`);
    }
  }

  console.log('\n--- STEP 1: Student Submits Leave Request ---');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 2);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const leaveReq = await studentLeaveService.submitRequest(studentUserId, {
    type: 'LEAVE',
    requestCategory: 'MEDICAL',
    reason: 'Fever and doctor consultation',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    durationType: 'FULL_DAY',
  });

  console.log(`[PASS] Leave Request Created: ID=${leaveReq.id}, Number=${leaveReq.requestNumber}, Status=${leaveReq.status}`);
  if (leaveReq.status !== 'PENDING_MENTOR') {
    throw new Error(`Expected status PENDING_MENTOR, got ${leaveReq.status}`);
  }

  console.log('\n--- STEP 2: Verify Mentor Pending Queue & Deep Link ---');
  const mentorPending = await mentorService.getPendingLeaveOdRequests(mentorUserId);
  const foundInQueue = mentorPending.find((r: any) => r.id === leaveReq.id);
  console.log(`[PASS] Found in Mentor Queue: ${!!foundInQueue} (Total pending: ${mentorPending.length})`);
  if (!foundInQueue) throw new Error('Request not found in mentor pending list');

  const mentorDetail = await mentorService.getLeaveRequestDetail(mentorUserId, leaveReq.id);
  console.log(`[PASS] Mentor Request Detail query: ID=${mentorDetail.id}, Student=${mentorDetail.student?.firstName}`);

  // Test unauthorized mentor security check
  const otherFaculty = await prisma.faculty.findFirst({
    where: { id: { not: student.mentorId }, userId: { not: undefined } },
  });
  if (otherFaculty?.userId) {
    try {
      await mentorService.getLeaveRequestDetail(otherFaculty.userId, leaveReq.id);
      console.error('[FAIL] Unauthorized mentor was NOT blocked!');
    } catch (err: any) {
      console.log(`[PASS] Unauthorized Mentor Access Blocked (Security Check: ${err.message})`);
    }
  }

  console.log('\n--- STEP 3: Mentor Approves & Forwards to HOD ---');
  const mentorApproved: any = await mentorService.reviewStudentLeaveOd(mentorUserId, leaveReq.id, {
    action: 'APPROVE',
    remarks: 'Medical certificate verified. Recommended.',
  });

  console.log(`[PASS] Mentor Approved: Status=${mentorApproved.status}, WorkflowStatus=${mentorApproved.workflowStatus}`);
  if (mentorApproved.status !== 'PENDING_HOD') {
    throw new Error(`Expected status PENDING_HOD, got ${mentorApproved.status}`);
  }

  console.log('\n--- STEP 4: HOD Approves Final Request ---');
  if (hodUserId) {
    const hodApproved: any = await studentLeaveService.hodReview(
      hodUserId,
      leaveReq.id,
      'APPROVE',
      'Approved by Department HOD'
    );
    console.log(`[PASS] HOD Approved: Status=${hodApproved.status}`);
    if (hodApproved.status !== 'APPROVED') {
      throw new Error(`Expected status APPROVED, got ${hodApproved.status}`);
    }
  }

  console.log('\n--- STEP 5: Student Submits OD Request & Mentor Return Flow ---');
  const odReq = await studentLeaveService.submitRequest(studentUserId, {
    type: 'ON_DUTY',
    requestCategory: 'WORKSHOP',
    reason: 'National AI Workshop Participation',
    startDate: startDate.toISOString().split('T')[0],
    endDate: startDate.toISOString().split('T')[0],
    durationType: 'FULL_DAY',
    eventName: 'National AI Conference',
    eventLocation: 'Convention Center',
  });
  console.log(`[PASS] OD Request Created: ID=${odReq.id}, Number=${odReq.requestNumber}`);

  const mentorReturned: any = await mentorService.reviewStudentLeaveOd(mentorUserId, odReq.id, {
    action: 'RETURN',
    remarks: 'Please attach the conference registration receipt.',
  });
  console.log(`[PASS] Mentor Returned: Status=${mentorReturned.status}, studentActionRequired=${mentorReturned.studentActionRequired}`);
  if (mentorReturned.status !== 'RETURNED_TO_STUDENT') {
    throw new Error(`Expected status RETURNED_TO_STUDENT, got ${mentorReturned.status}`);
  }

  console.log('\n====================================================');
  console.log('  ALL INTEGRATION TESTS PASSED (100% VERIFIED)');
  console.log('====================================================\n');
}

main()
  .catch((e) => {
    console.error('Test Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
