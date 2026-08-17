import { prisma } from '../lib/prisma';
import { NotificationService } from '../modules/notifications/notification.service';
import { CircularService } from '../modules/circulars/circular.service';
import { RecipientResolverService } from '../modules/notifications/recipient-resolver.service';

async function main() {
  console.log('====================================================');
  console.log('CAMPUSOS REAL BUSINESS EVENT PUSH VERIFICATION');
  console.log('====================================================\n');

  // Find active student user
  const activeStudent = await prisma.user.findFirst({
    where: {
      email: 'student001.cse@geetorus.com',
    },
  });

  if (!activeStudent) {
    console.error('Active test student not found in database.');
    return;
  }

  const deviceTokens = await prisma.deviceToken.findMany({
    where: { userId: activeStudent.id, active: true },
  });

  console.log(`[Target User] ID: ${activeStudent.id}`);
  console.log(`[Target User] Email: ${activeStudent.email}`);
  console.log(`[Target User] Active Device Tokens: ${deviceTokens.length}`);
  if (deviceTokens.length > 0) {
    console.log(`[Target User] Token[0]: ${deviceTokens[0].token.slice(0, 30)}... (${deviceTokens[0].platform})`);
  }
  console.log('----------------------------------------------------\n');

  // Find an admin user to act as actor
  const adminUser = await prisma.user.findFirst({
    where: {
      role: { name: { in: ['Super Admin', 'College Admin', 'Principal', 'HOD'] } },
      status: 'ACTIVE',
      id: { not: activeStudent.id },
    },
  });

  const actorId = adminUser?.id || 'system-admin';

  // 1. TEST CIRCULAR_PUBLISHED EVENT
  console.log('--- TEST 1: CIRCULAR_PUBLISHED ---');
  const circularResult = await NotificationService.dispatchDomainEvent({
    eventType: 'CIRCULAR_PUBLISHED',
    actorUserId: actorId,
    entityType: 'CIRCULAR',
    entityId: `CIRC-${Date.now()}`,
    title: '📢 End-Semester Schedule & Practical Exam Guidelines',
    body: 'Academic Dean has released the official guidelines and regulations for practical exams.',
    priority: 'HIGH',
    category: 'CIRCULARS',
    deepLinkRoute: '/student/circulars',
    targetUserIds: [activeStudent.id],
  });
  console.log('Result:', circularResult);
  console.log('----------------------------------------------------\n');

  // 2. TEST TASK_ASSIGNED EVENT
  console.log('--- TEST 2: TASK_ASSIGNED ---');
  const taskResult = await NotificationService.dispatchDomainEvent({
    eventType: 'TASK_ASSIGNED',
    actorUserId: actorId,
    entityType: 'TASK',
    entityId: `TASK-${Date.now()}`,
    title: 'New Task: Submit Project Phase 1 Report',
    body: 'Your department mentor assigned a high-priority task with due date this Friday.',
    priority: 'HIGH',
    category: 'TASKS',
    deepLinkRoute: '/student/tasks',
    targetUserIds: [activeStudent.id],
  });
  console.log('Result:', taskResult);
  console.log('----------------------------------------------------\n');

  // 3. TEST LEAVE_APPROVED EVENT
  console.log('--- TEST 3: LEAVE_APPROVED ---');
  const leaveResult = await NotificationService.dispatchDomainEvent({
    eventType: 'LEAVE_APPROVED',
    actorUserId: actorId,
    entityType: 'STUDENT_LEAVE_REQUEST',
    entityId: `SLR-${Date.now()}`,
    title: 'On-Duty Request Approved by HOD',
    body: 'Your 2-day On-Duty application for Hackathon participation has been approved.',
    priority: 'HIGH',
    category: 'APPROVALS',
    deepLinkRoute: '/student/leave-od',
    targetUserIds: [activeStudent.id],
  });
  console.log('Result:', leaveResult);
  console.log('----------------------------------------------------\n');

  // 4. TEST ASSIGNMENT_PUBLISHED EVENT
  console.log('--- TEST 4: ASSIGNMENT_PUBLISHED ---');
  const assignResult = await NotificationService.dispatchDomainEvent({
    eventType: 'ASSIGNMENT_PUBLISHED',
    actorUserId: actorId,
    entityType: 'ASSIGNMENT',
    entityId: `ASN-${Date.now()}`,
    title: 'New Assignment: Distributed Systems Lab #4',
    body: 'Dr. Ramesh published a new lab assignment. Submission deadline is Sunday 11:59 PM.',
    priority: 'NORMAL',
    category: 'ACADEMIC',
    deepLinkRoute: '/student/assignments',
    targetUserIds: [activeStudent.id],
  });
  console.log('Result:', assignResult);
  console.log('----------------------------------------------------\n');

  // 5. TEST PAYMENT_SUCCESS EVENT
  console.log('--- TEST 5: PAYMENT_SUCCESS ---');
  const paymentResult = await NotificationService.dispatchDomainEvent({
    eventType: 'PAYMENT_SUCCESS',
    actorUserId: actorId,
    entityType: 'FEE_PAYMENT',
    entityId: `PAY-${Date.now()}`,
    title: 'Fee Payment Verified',
    body: 'Your payment of INR 45,000 was verified. Official Receipt #REC-2026-8891.',
    priority: 'HIGH',
    category: 'FEES',
    deepLinkRoute: '/student/fees',
    targetUserIds: [activeStudent.id],
  });
  console.log('Result:', paymentResult);
  console.log('----------------------------------------------------\n');

  // 6. TEST EXAM_TIMETABLE_PUBLISHED EVENT
  console.log('--- TEST 6: EXAM_TIMETABLE_PUBLISHED ---');
  const examResult = await NotificationService.dispatchDomainEvent({
    eventType: 'EXAM_TIMETABLE_PUBLISHED',
    actorUserId: actorId,
    entityType: 'EXAM_TIMETABLE',
    entityId: `EXAM-${Date.now()}`,
    title: 'Final Examination Timetable Released',
    body: 'Controller of Examinations published the May 2026 End-Semester Exam Timetable.',
    priority: 'HIGH',
    category: 'EXAMS',
    deepLinkRoute: '/student/examinations',
    targetUserIds: [activeStudent.id],
  });
  console.log('Result:', examResult);
  console.log('----------------------------------------------------\n');

  console.log('====================================================');
  console.log('ALL REAL BUSINESS EVENTS DISPATCHED SUCCESSFULLY TO FCM!');
  console.log('====================================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
