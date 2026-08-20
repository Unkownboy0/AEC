import assert from 'assert';
import { prisma } from '../lib/prisma';
import { TransportService } from '../modules/transport/transport.service';

async function verifyThreeStudents() {
  console.log('===============================================================');
  console.log('🧪 VERIFYING 3 STUDENTS RESIDENTIAL & TRANSPORT STATUS');
  console.log('===============================================================');

  const transportService = new TransportService();

  // 1. Verify Student 001 — Hosteller
  console.log('🔍 [TEST 1/3] Testing student001.cse@geetorus.com (Hosteller)...');
  const user001 = await prisma.user.findFirst({
    where: { email: { equals: 'student001.cse@geetorus.com', mode: 'insensitive' } },
    include: { student: true }
  });
  assert(user001 && user001.student, 'User 001 and student profile must exist');
  assert.strictEqual(user001.student.residentialType, 'HOSTELLER', 'Student 001 residentialType must be HOSTELLER');
  assert(user001.student.hostelId, 'Student 001 must have hostelId set');

  const alloc001: any = await transportService.getMyAllocation(user001.id);
  assert.strictEqual(alloc001.isEligible, false, 'Hosteller must not be eligible for college bus tracking');
  assert.strictEqual(alloc001.reason, 'HOSTELLER', 'Reason must be HOSTELLER');
  console.log('  ✅ Student 001 Transport API Response:', alloc001);

  const hostelAlloc001 = await (prisma as any).hostelAllocation.findFirst({
    where: { studentId: user001.student.id, status: 'ACTIVE' },
    include: { room: true, bed: true }
  });
  assert(hostelAlloc001, 'Student 001 must have active hostel allocation');
  console.log('  ✅ Student 001 Active Hostel Allocation:', hostelAlloc001.room?.roomNumber, hostelAlloc001.bed?.bedNumber);

  // 2. Verify Student 002 — Day Scholar (College Bus)
  console.log('\n🔍 [TEST 2/3] Testing student002.cse@geetorus.com (Day Scholar - College Bus)...');
  const user002 = await prisma.user.findFirst({
    where: { email: { equals: 'student002.cse@geetorus.com', mode: 'insensitive' } },
    include: { student: true }
  });
  assert(user002 && user002.student, 'User 002 and student profile must exist');
  assert.strictEqual(user002.student.residentialType, 'DAY_SCHOLAR', 'Student 002 residentialType must be DAY_SCHOLAR');
  assert.strictEqual(user002.student.transportMode, 'COLLEGE_BUS', 'Student 002 transportMode must be COLLEGE_BUS');

  const alloc002: any = await transportService.getMyAllocation(user002.id);
  assert.strictEqual(alloc002.isEligible, true, 'Day scholar with bus pass must be eligible for college bus tracking');
  assert(alloc002.route, 'Student 002 must receive route details');
  assert(alloc002.assignedStop, 'Student 002 must receive assigned stop details');
  console.log('  ✅ Student 002 Transport API Response: Eligible, Route:', alloc002.route?.name, 'Stop:', alloc002.assignedStop?.name);

  const hostelAlloc002 = await (prisma as any).hostelAllocation.findFirst({
    where: { studentId: user002.student.id }
  });
  assert.strictEqual(hostelAlloc002, null, 'Student 002 must not have hostel allocation');
  console.log('  ✅ Student 002 has 0 hostel allocations (verified Day Scholar)');

  // 3. Verify Student 003 — Day Scholar (Out Bus / Private)
  console.log('\n🔍 [TEST 3/3] Testing student003.cse@geetorus.com (Day Scholar - Out Bus)...');
  const user003 = await prisma.user.findFirst({
    where: { email: { equals: 'student003.cse@geetorus.com', mode: 'insensitive' } },
    include: { student: true }
  });
  assert(user003 && user003.student, 'User 003 and student profile must exist');
  assert.strictEqual(user003.student.residentialType, 'DAY_SCHOLAR', 'Student 003 residentialType must be DAY_SCHOLAR');
  assert.strictEqual(user003.student.transportMode, 'OUT_BUS', 'Student 003 transportMode must be OUT_BUS');

  const alloc003: any = await transportService.getMyAllocation(user003.id);
  assert.strictEqual(alloc003.isEligible, false, 'Out-bus day scholar must not receive active bus tracking');
  assert.strictEqual(alloc003.reason, 'NON_COLLEGE_BUS', 'Reason must be NON_COLLEGE_BUS');
  assert.strictEqual(alloc003.transportMode, 'OUT_BUS', 'Transport mode must be OUT_BUS');
  console.log('  ✅ Student 003 Transport API Response:', alloc003);

  const transportAlloc003 = await prisma.transportAllocation.findFirst({
    where: { passengerId: user003.student.id }
  });
  assert.strictEqual(transportAlloc003, null, 'Student 003 must not have active transport allocation');

  const hostelAlloc003 = await (prisma as any).hostelAllocation.findFirst({
    where: { studentId: user003.student.id }
  });
  assert.strictEqual(hostelAlloc003, null, 'Student 003 must not have hostel allocation');
  console.log('  ✅ Student 003 has 0 transport and 0 hostel allocations (verified Out-Bus Day Scholar)');

  console.log('\n===============================================================');
  console.log('🎉 ALL 3/3 STUDENT RESIDENTIAL & TRANSPORT SCENARIOS VERIFIED 100%!');
  console.log('===============================================================');
}

verifyThreeStudents()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
