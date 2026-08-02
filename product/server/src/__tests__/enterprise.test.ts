import assert from 'assert';
import { prisma } from '../lib/prisma';
import { TaskService } from '../modules/enterprise/task.service';
import { checkPermission } from '../core/middlewares/auth.middleware';

async function runTests() {
  console.log('🧪 Running GEETORUS CampusOS Enterprise Automated Verification Tests...');

  const taskService = new TaskService();

  try {
    // 1. Super Admin permission check bypasses restriction rules
    const hasPerm = checkPermission(['*'], 'any.restricted.permission');
    assert.strictEqual(hasPerm, true, 'Super Admin wildcard permission check failed');
    console.log('✅ Test 1 Passed: Super Admin permission check works');

    // 2. CSE HOD and IT HOD department isolation
    const cseHod = await prisma.user.findUnique({ where: { email: 'hod.cse@geetorus.com' } });
    const itHod = await prisma.user.findUnique({ where: { email: 'hod.it@geetorus.com' } });
    assert.ok(cseHod, 'CSE HOD account exists');
    assert.ok(itHod, 'IT HOD account exists');
    assert.notStrictEqual(cseHod.departmentId, itHod.departmentId, 'CSE and IT HODs have isolated department IDs');
    console.log('✅ Test 2 Passed: Department isolation verified');

    // 3. Mentor assignment scoping
    const mentorUser = await prisma.user.findUnique({ where: { email: 'mentor1.cse@geetorus.com' } });
    assert.ok(mentorUser, 'Mentor user exists');
    const mentorProfile = await prisma.faculty.findUnique({ where: { userId: mentorUser.id } });
    assert.ok(mentorProfile, 'Mentor faculty profile exists');

    const mentorAssignments = await prisma.mentorAssignment.findMany({
      where: { mentorId: mentorProfile.id, status: 'ACTIVE' },
    });
    assert.strictEqual(mentorAssignments.length, 20, 'Mentor 1 is assigned exactly 20 mentor students');
    console.log('✅ Test 3 Passed: Mentor student scoping verified');

    // 4. Task lifecycle state transition
    const adminUser = await prisma.user.findUnique({ where: { email: 'academic.dean@geetorus.com' } });
    const hodUser = await prisma.user.findUnique({ where: { email: 'hod.cse@geetorus.com' } });
    assert.ok(adminUser && hodUser, 'Admin and HOD users exist');

    const task = await taskService.createTask(adminUser.id, {
      title: 'Automated Test Unit Task',
      description: 'Testing task acceptance and progress updates',
      priority: 'HIGH',
      assigneeIds: [hodUser.id],
    });

    assert.strictEqual(task.status, 'NOT_SEEN', 'Initial task status is NOT_SEEN');

    const acceptedTask = await taskService.updateTaskStatus(task.id, hodUser.id, 'ACCEPTED');
    assert.strictEqual(acceptedTask.status, 'ACCEPTED', 'Task status transitions to ACCEPTED');

    const progressTask = await taskService.updateProgress(task.id, hodUser.id, {
      completionPercent: 100,
    });
    assert.strictEqual(progressTask.status, 'COMPLETED', 'Task status transitions to COMPLETED at 100%');
    assert.strictEqual(progressTask.completionPercent, 100, 'Completion percentage is 100');
    console.log('✅ Test 4 Passed: Task lifecycle transitions verified');

    // 5. Seed idempotence
    const cseDepts = await prisma.department.findMany({ where: { code: 'CSE' } });
    assert.strictEqual(cseDepts.length, 1, 'Department seed is idempotent and single record exists');
    console.log('✅ Test 5 Passed: Seed script idempotence verified');

    console.log('🎉 ALL 5 ENTERPRISE AUTOMATED TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Enterprise Automated Test Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
