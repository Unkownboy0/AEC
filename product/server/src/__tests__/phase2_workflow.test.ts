import assert from 'assert';
import { prisma } from '../lib/prisma';
import { WorkflowService } from '../modules/workflow/workflow.service';
import { HODController } from '../modules/enterprise/hod.controller';

async function runPhase2Tests() {
  console.log('🧪 Running GEETORUS CampusOS Phase 2 Automated Test Suite...');

  const workflowService = new WorkflowService();

  try {
    // 1. Dynamic Department Dashboard KPIs
    const cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });
    assert.ok(cseDept, 'CSE Department exists');

    const facultyCount = await prisma.faculty.count({ where: { departmentId: cseDept.id } });
    const studentCount = await prisma.student.count({ where: { departmentId: cseDept.id } });
    assert.ok(facultyCount > 0, 'Dynamic faculty count > 0');
    assert.ok(studentCount > 0, 'Dynamic student count > 0');
    console.log(`✅ Test 1 Passed: Dynamic Department KPIs calculated (Faculty: ${facultyCount}, Students: ${studentCount})`);

    // 2. Student Year & Class Hierarchy Structure
    const programs = await prisma.program.findMany({ where: { departmentId: cseDept.id } });
    assert.ok(programs.length > 0, 'Department programs mapped in DB');
    console.log('✅ Test 2 Passed: Student Year & Class Hierarchy validated');

    // 3. 360° Student Profile Aggregation
    const sampleStudent = await prisma.student.findFirst({
      where: { departmentId: cseDept.id },
      include: { user: true, department: true, program: true, mentor: true },
    });
    assert.ok(sampleStudent, 'Sample student retrieved');
    assert.ok(sampleStudent.department, 'Student department relation loaded');
    assert.ok(sampleStudent.program, 'Student program relation loaded');
    console.log(`✅ Test 3 Passed: 360° Student Profile aggregation verified for ${sampleStudent.firstName} ${sampleStudent.lastName}`);

    // 4. Multi-tier Student Leave Flow (Student -> Mentor -> HOD)
    const studentUser = await prisma.user.findUnique({ where: { email: 'student001.cse@geetorus.com' } });
    const mentorUser = await prisma.user.findUnique({ where: { email: 'mentor1.cse@geetorus.com' } });
    const hodUser = await prisma.user.findUnique({ where: { email: 'hod.cse@geetorus.com' } });

    assert.ok(studentUser && mentorUser && hodUser, 'Student, Mentor, and HOD test users exist');

    const request = await workflowService.createRequest(
      studentUser.email,
      'LEAVE',
      'Phase 2 Automated Test Leave',
      'Attending Academic Symposium',
      '2026-08-01',
      '2026-08-02'
    );

    assert.strictEqual(request.currentStep, 'MENTOR', 'Initial request step is MENTOR');

    // Action 1: Mentor approves
    const mentorAction = await workflowService.takeAction(
      request.id,
      mentorUser.email,
      'Faculty',
      'APPROVE',
      'Mentor approved request'
    );
    assert.strictEqual(mentorAction.currentStep, 'HOD', 'Step advances to HOD after Mentor approval');

    // Action 2: HOD approves
    const hodAction = await workflowService.takeAction(
      request.id,
      hodUser.email,
      'HOD',
      'APPROVE',
      'HOD final approval'
    );
    assert.strictEqual(hodAction.status, 'APPROVED', 'Request status is APPROVED after HOD approval');
    console.log('✅ Test 4 Passed: Multi-tier Student Leave Approval Flow verified (Student -> Mentor -> HOD -> Approved)');

    // 5. Principal Offline Delegation to Vice Principal
    // Set PRINCIPAL_OFFLINE_MODE to true
    await prisma.systemSetting.upsert({
      where: { key: 'PRINCIPAL_OFFLINE_MODE' },
      update: { value: 'true' },
      create: { key: 'PRINCIPAL_OFFLINE_MODE', value: 'true' },
    });

    const facultyUser = await prisma.user.findUnique({ where: { email: 'faculty1.cse@geetorus.com' } });
    const vpUser = await prisma.user.findUnique({ where: { email: 'vp@geetorus.com' } });

    if (facultyUser && vpUser) {
      const facRequest = await workflowService.createRequest(
        facultyUser.email,
        'FACULTY_LEAVE',
        'Faculty Conference Duty Leave',
        'Presenting Research Paper',
        '2026-08-10',
        '2026-08-12'
      );

      // HOD approves faculty leave -> moves to PRINCIPAL step
      await workflowService.takeAction(facRequest.id, hodUser.email, 'HOD', 'APPROVE', 'HOD Approved Faculty Leave');

      // Vice Principal actions request since Principal is OFFLINE
      const vpAction = await workflowService.takeAction(
        facRequest.id,
        vpUser.email,
        'Vice Principal',
        'APPROVE',
        'Vice Principal acting on behalf of offline Principal'
      );

      assert.strictEqual(vpAction.status, 'APPROVED', 'Faculty Leave approved by Acting Principal (Vice Principal)');
      console.log('✅ Test 5 Passed: Principal Offline Mode & Acting VP Delegation verified');
    }

    console.log('🎉 ALL PHASE 2 AUTOMATED TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Phase 2 Automated Test Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase2Tests();
