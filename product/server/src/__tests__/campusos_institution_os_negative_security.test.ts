import assert from 'node:assert/strict';
import { StudentResidentialService } from '../modules/mentor/student-residential.service';
import { MentorFeeService } from '../modules/mentor/mentor-fee.service';
import { SecurityHelper } from '../utils/security';
import { prisma } from '../lib/prisma';

async function runNegativeSecurityAndWorkflowSuite() {
  console.log('🧪 Starting CampusOS Complete Institution OS Negative Security & Integrity Suite...\n');

  // =========================================================================
  // TEST 1: Mentor Mentee Negative Authorization Guard (Residential Status)
  // Mentor A must NEVER access or modify Residential Status for an unassigned student
  // =========================================================================
  console.log('▶ Test 1: Mentor cross-student residential update must throw 403 Forbidden');
  const residentialService = new StudentResidentialService();

  // Mock faculty profile
  const originalFacultyFindFirst = (prisma as any).faculty.findFirst;
  const originalStudentFindFirst = (prisma as any).student.findFirst;

  (prisma as any).faculty.findFirst = async ({ where }: any) => {
    if (where?.userId === 'mentor-user-1') return { id: 'faculty-1', firstName: 'Mentor', lastName: 'One' };
    return null;
  };

  // Mock student lookup returning null for mentor-1 (unassigned mentee)
  (prisma as any).student.findFirst = async ({ where }: any) => {
    if (where?.id === 'unassigned-student-id') {
      return null;
    }
    return { id: 'assigned-student-id', firstName: 'Assigned', lastName: 'Mentee', admissionNo: '2026CSE001' };
  };

  await assert.rejects(
    async () => {
      await residentialService.updateResidentialStatus(
        'mentor-user-1',
        'unassigned-student-id',
        { residentialType: 'HOSTELLER', reason: 'Attempt unauthorized update' },
        'Mentor'
      );
    },
    (err: any) => {
      assert.equal(err.status || err.statusCode, 403);
      assert.match(err.message, /only view and manage residential\/transport for assigned mentees/i);
      return true;
    },
    'Expected 403 Forbidden when mentor attempts to update residential status for unassigned student'
  );
  console.log('  ✅ Passed: Cross-student mentor residential modification strictly rejected with 403 Forbidden.');

  // =========================================================================
  // TEST 2: Mentor Fee Assessment Negative Authorization Guard
  // Mentor must NOT assess or alter fee for an arbitrary student
  // =========================================================================
  console.log('▶ Test 2: Mentor cross-student fee assessment must throw 403 Forbidden');
  const feeService = new MentorFeeService();

  await assert.rejects(
    async () => {
      await feeService.assessFee(
        'mentor-user-1',
        'unassigned-student-id',
        { amount: 50000, dueDate: new Date().toISOString(), reason: 'Assessing fee for wrong student' },
        ['MENTOR_FEE_ADD'],
        'Mentor'
      );
    },
    (err: any) => {
      assert.equal(err.status || err.statusCode, 403);
      assert.match(err.message, /only manage fee details for assigned mentees/i);
      return true;
    },
    'Expected 403 Forbidden when mentor assesses fee for unassigned student'
  );
  console.log('  ✅ Passed: Cross-student mentor fee assessment strictly rejected with 403 Forbidden.');

  // =========================================================================
  // TEST 3: Unpublished Marks & Results Privacy for Student and Parent Roles
  // SecurityHelper must strictly enforce status: 'PUBLISHED' for Students and Parents
  // =========================================================================
  console.log('▶ Test 3: Unpublished marks filter verification for Student and Parent roles');
  
  // Student role filter check
  const studentUser: any = { id: 'user-student-1', role: 'Student', email: 'student@example.com' };
  (prisma as any).student.findFirst = async () => ({ id: 'student-profile-1' });

  const studentMarksWhere: any = {};
  await SecurityHelper.applySecurityFilters(studentUser, studentMarksWhere, 'marks');
  assert.equal(studentMarksWhere.studentId, 'student-profile-1');
  assert.equal(studentMarksWhere.status, 'PUBLISHED', 'Student marks filter MUST enforce status: PUBLISHED');

  // Parent role filter check
  const parentUser: any = { id: 'user-parent-1', role: 'Parent', email: 'parent@example.com' };
  const originalStudentFindMany = (prisma as any).student.findMany;
  (prisma as any).student.findMany = async () => [{ id: 'child-1' }, { id: 'child-2' }];

  const parentMarksWhere: any = {};
  await SecurityHelper.applySecurityFilters(parentUser, parentMarksWhere, 'marks');
  assert.deepEqual(parentMarksWhere.studentId, { in: ['child-1', 'child-2'] });
  assert.equal(parentMarksWhere.status, 'PUBLISHED', 'Parent marks filter MUST enforce status: PUBLISHED');

  console.log('  ✅ Passed: Unpublished results/marks are strictly hidden with status: PUBLISHED for Students and Parents.');

  // =========================================================================
  // TEST 4: Residential Transition Workflow Task Trigger Verification
  // DAY_SCHOLAR -> HOSTELLER must trigger HOSTEL_ALLOCATION_REQUIRED workflow task
  // =========================================================================
  console.log('▶ Test 4: Residential DAY_SCHOLAR -> HOSTELLER workflow task creation');

  let createdWorkflowTask: any = null;
  let createdResidentialHistory: any = null;
  let updatedStudentData: any = null;

  (prisma as any).student.findFirst = async () => ({
    id: 'mentee-1',
    firstName: 'Arun',
    lastName: 'Kumar',
    admissionNo: '2026IT042',
    residentialType: 'DAY_SCHOLAR',
    transportMode: 'OTHER',
    department: { name: 'Information Technology' },
    section: { name: 'A' },
  });

  (prisma as any).workflowRequest.create = async ({ data }: any) => {
    createdWorkflowTask = { id: 'wf-task-hostel-1', ...data };
    return createdWorkflowTask;
  };

  (prisma as any).user.findMany = async () => [{ id: 'warden-user-1' }];
  (prisma as any).student.update = async ({ data }: any) => {
    updatedStudentData = data;
    return { id: 'mentee-1', ...data };
  };
  (prisma as any).studentResidentialHistory.create = async ({ data }: any) => {
    createdResidentialHistory = data;
    return { id: 'hist-1', ...data };
  };

  const residentialResult = await residentialService.updateResidentialStatus(
    'mentor-user-1',
    'mentee-1',
    {
      residentialType: 'HOSTELLER',
      reason: 'Student opted for on-campus hostel accommodation for academic term',
      remarks: 'Requires Block A floor 2 room',
    },
    'Mentor'
  );

  assert.equal(residentialResult.status, 'success');
  assert.ok(createdWorkflowTask, 'HOSTEL_ALLOCATION_REQUIRED workflow task must be created');
  assert.equal(createdWorkflowTask.type, 'HOSTEL_ALLOCATION_REQUIRED');
  assert.equal(createdWorkflowTask.status, 'PENDING_HOSTEL_ADMIN');
  assert.equal(updatedStudentData.residentialType, 'HOSTELLER');
  assert.equal(createdResidentialHistory.oldResidentialType, 'DAY_SCHOLAR');
  assert.equal(createdResidentialHistory.newResidentialType, 'HOSTELLER');

  console.log('  ✅ Passed: DAY_SCHOLAR -> HOSTELLER accurately triggers HOSTEL_ALLOCATION_REQUIRED workflow task and audit history.');

  // Restore mocks
  (prisma as any).faculty.findFirst = originalFacultyFindFirst;
  (prisma as any).student.findFirst = originalStudentFindFirst;
  (prisma as any).student.findMany = originalStudentFindMany;

  console.log('\n🎉 ALL CampusOS Complete Institution OS Negative Security & Integrity Tests Passed Successfully!\n');
}

runNegativeSecurityAndWorkflowSuite().catch((err) => {
  console.error('❌ Test Suite Failure:', err);
  process.exit(1);
});
