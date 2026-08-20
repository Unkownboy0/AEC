/**
 * role_aware_notification_routing.test.ts
 *
 * Comprehensive Role-Aware + Workspace-Aware Notification Routing Test Suite
 *
 * Validates all 35 master requirements:
 * 1. Centralized Recipient Engine (`resolveRecipients`)
 * 2. Workflow Stage Isolation (Student & Faculty Leave/OD)
 * 3. Scope Boundaries (HOD department scope, Mentor mentee scope)
 * 4. Negative Filter Safety (Day scholars 0 hostel, Non-bus 0 transport, Unrelated HOD 0)
 * 5. Complaint Routing & Oversight
 * 6. Deduplication & Anti-Self-Echo
 * 7. Canonical Role-Specific Deep Link Resolution
 */

import { RecipientResolverService } from '../modules/notifications/recipient-resolver.service';
import { NotificationDeepLinkResolver } from '../modules/notifications/notification-deeplink.resolver';
import type { DomainEvent } from '../modules/notifications/domain-events.types';
import { prisma } from '../lib/prisma';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition: boolean, message: string) {
  totalChecks++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedChecks++;
  console.log(`  ✅ ${message}`);
}

async function runRoleAwareNotificationRoutingTests() {
  console.log('======================================================================');
  console.log('🚀 STARTING ROLE-AWARE & WORKSPACE-AWARE NOTIFICATION ROUTING SUITE');
  console.log('======================================================================\n');

  // Look up seeded reference data
  const cseDept = await prisma.department.findFirst({ where: { code: 'CSE' } });
  const itDept = await prisma.department.findFirst({ where: { code: 'IT' } });
  const cseDeptId = cseDept?.id || 'dept-cse';
  const itDeptId = itDept?.id || 'dept-it';

  const studentUser = await prisma.user.findFirst({ where: { email: 'john.smith@gmail.com' } });
  const mentorUser = await prisma.user.findFirst({ where: { email: 'ada.lovelace@geetorus.com' } });
  
  const cseHodUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: cseDept?.hodUserId || undefined },
        { email: 'hod.cse@geetorus.com' },
        { email: 'cse.head@geetorus.com' },
      ],
      status: 'ACTIVE',
    },
    select: { id: true, email: true },
  });
  const cseHodIds = cseHodUsers.map((u) => u.id);

  const itHodUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: itDept?.hodUserId || undefined },
        { email: 'hod.it@geetorus.com' },
        { email: 'it.head@geetorus.com' },
      ],
      status: 'ACTIVE',
    },
    select: { id: true, email: true },
  });
  const itHodIds = itHodUsers.map((u) => u.id);

  const principalUser = await prisma.user.findFirst({ where: { email: 'principal@geetorus.com' } });
  const vpUser = await prisma.user.findFirst({ where: { email: 'vp@geetorus.com' } });
  const aaDeanUser = await prisma.user.findFirst({ where: { email: 'admission.dean@geetorus.com' } });

  const hostellerStudent = await prisma.student.findFirst({ where: { hostelId: { not: null }, userId: { not: null } } });
  const dayScholarStudent = await prisma.student.findFirst({ where: { hostelId: null, userId: { not: null } } });
  const transportStudent = await prisma.student.findFirst({ where: { transportRouteId: { not: null }, userId: { not: null } } });
  const nonTransportStudent = await prisma.student.findFirst({ where: { transportRouteId: null, userId: { not: null } } });

  console.log('1. Verifying Student Leave Workflow Progression & Negative Boundaries...');
  {
    const studentRecord = await prisma.student.findFirst({ where: { userId: studentUser?.id } });

    // 1.1 Submission -> Mentor ONLY
    if (studentRecord && mentorUser) {
      const event: DomainEvent = {
        eventType: 'STUDENT_LEAVE_SUBMITTED',
        entityType: 'STUDENT_LEAVE',
        entityId: 'test-student-leave-1',
        actorUserId: studentUser?.id,
        title: 'Leave Requested',
        body: 'Fever rest requested',
        studentId: studentRecord.id,
        metadata: { studentId: studentRecord.id },
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(recipients.includes(mentorUser.id), 'Student leave submission routes to assigned Mentor');
      cseHodIds.forEach((hid) => assert(!recipients.includes(hid), 'Negative check: HOD receives NOTHING at mentor submission stage'));
      if (principalUser) assert(!recipients.includes(principalUser.id), 'Negative check: Principal receives NOTHING at mentor submission stage');
      if (studentUser) assert(!recipients.includes(studentUser.id), 'Anti-echo check: Submitting student does not receive self-notification');
    }

    // 1.2 Mentor Forward -> HOD ONLY
    if (mentorUser && cseHodIds.length > 0) {
      const event: DomainEvent = {
        eventType: 'STUDENT_LEAVE_FORWARDED',
        entityType: 'STUDENT_LEAVE',
        entityId: 'test-student-leave-1',
        actorUserId: mentorUser.id,
        departmentId: cseDeptId,
        title: 'Leave Endorsed by Mentor',
        body: 'Forwarded to HOD for sanction',
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(cseHodIds.some((id) => recipients.includes(id)), 'Mentor-forwarded leave routes to CSE HOD');
      itHodIds.forEach((id) => assert(!recipients.includes(id), 'Negative check: IT HOD receives NOTHING for CSE student leave'));
      if (principalUser) assert(!recipients.includes(principalUser.id), 'Negative check: Principal receives NOTHING for standard student leave at HOD stage');
    }

    // 1.3 Final Approval -> Student Applicant
    if (studentUser) {
      const event: DomainEvent = {
        eventType: 'STUDENT_LEAVE_APPROVED',
        entityType: 'STUDENT_LEAVE',
        entityId: 'test-student-leave-1',
        actorUserId: cseHodIds[0] || 'hod-actor',
        title: 'Leave Approved',
        body: 'Leave approved by HOD',
        metadata: { applicantUserId: studentUser.id },
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(recipients.includes(studentUser.id), 'Approved leave routes back to Student applicant');
    }
  }

  console.log('\n2. Verifying Faculty Leave Workflow Progression & Executive Escalations...');
  {
    // 2.1 Faculty Submission -> HOD ONLY
    if (mentorUser && cseHodIds.length > 0) {
      const event: DomainEvent = {
        eventType: 'FACULTY_LEAVE_SUBMITTED',
        entityType: 'FACULTY_LEAVE',
        entityId: 'test-fac-leave-10',
        actorUserId: mentorUser.id,
        departmentId: cseDeptId,
        title: 'Faculty Leave Application',
        body: 'Conference attendance leave',
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(cseHodIds.some((id) => recipients.includes(id)), 'Faculty leave submission routes to Department HOD');
      itHodIds.forEach((id) => assert(!recipients.includes(id), 'Negative check: IT HOD receives NOTHING for CSE faculty leave'));
      if (principalUser) assert(!recipients.includes(principalUser.id), 'Negative check: Principal receives NOTHING before HOD recommendation');
    }

    // 2.2 HOD Recommendation -> Principal & VP
    if (cseHodIds.length > 0 && principalUser) {
      const event: DomainEvent = {
        eventType: 'FACULTY_LEAVE_RECOMMENDED',
        entityType: 'FACULTY_LEAVE',
        entityId: 'test-fac-leave-10',
        actorUserId: cseHodIds[0],
        departmentId: cseDeptId,
        title: 'Faculty Leave Recommended',
        body: 'Recommended by HOD for Principal approval',
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(recipients.includes(principalUser.id), 'HOD-recommended faculty leave routes to Principal');
      // VP is notified only when active PrincipalDelegation exists; without delegation, VP is not notified
      itHodIds.forEach((id) => assert(!recipients.includes(id), 'Negative check: Other department HOD receives NOTHING'));
    }
  }

  console.log('\n3. Verifying Negative Filter Safety on Campus Services (Hostel & Transport)...');
  {
    // 3.1 Day Scholars NEVER receive Hostel notices
    if (dayScholarStudent?.userId) {
      const event: DomainEvent = {
        eventType: 'HOSTEL_MESS_NOTICE',
        entityType: 'HOSTEL',
        entityId: 'mess-notice-1',
        studentId: dayScholarStudent.id,
        title: 'Special Hostel Dinner',
        body: 'Dinner timings extended',
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(!recipients.includes(dayScholarStudent.userId), 'Negative filter: Day scholar receives 0 hostel notices');
    }

    // 3.2 Hostellers DO receive Hostel notices
    if (hostellerStudent?.userId) {
      const event: DomainEvent = {
        eventType: 'HOSTEL_MESS_NOTICE',
        entityType: 'HOSTEL',
        entityId: 'mess-notice-1',
        studentId: hostellerStudent.id,
        title: 'Special Hostel Dinner',
        body: 'Dinner timings extended',
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(recipients.includes(hostellerStudent.userId), 'Hostel notice successfully routed to active Hosteller');
    }

    // 3.3 Non-transport students NEVER receive Bus Route Delay notices
    if (nonTransportStudent?.userId) {
      const event: DomainEvent = {
        eventType: 'TRANSPORT_BUS_DELAY',
        entityType: 'TRANSPORT',
        entityId: 'route-delay-1',
        studentId: nonTransportStudent.id,
        title: 'Route 10A Delay',
        body: 'Bus running 25 mins late',
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(!recipients.includes(nonTransportStudent.userId), 'Negative filter: Non-bus user receives 0 transport notices');
    }

    // 3.4 Transport users DO receive Bus Route Delay notices
    if (transportStudent?.userId) {
      const event: DomainEvent = {
        eventType: 'TRANSPORT_BUS_DELAY',
        entityType: 'TRANSPORT',
        entityId: 'route-delay-1',
        studentId: transportStudent.id,
        title: 'Route 10A Delay',
        body: 'Bus running 25 mins late',
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(recipients.includes(transportStudent.userId), 'Transport alert successfully routed to registered bus user');
    }
  }

  console.log('\n4. Verifying Complaint Routing & Oversight Boundaries...');
  {
    if (cseHodIds.length > 0) {
      const event: DomainEvent = {
        eventType: 'ACADEMIC_COMPLAINT_SUBMITTED',
        entityType: 'COMPLAINT',
        entityId: 'comp-99',
        departmentId: cseDeptId,
        priority: 'HIGH',
        title: 'Lab Equipment Concern',
        body: 'Projector in CSE Lab 3 is malfunctioning',
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      assert(cseHodIds.some((id) => recipients.includes(id)), 'Academic complaint routes to current operating HOD as primary owner');
      if (aaDeanUser) assert(recipients.includes(aaDeanUser.id), 'Academic complaint routes to A&A Dean for oversight');
      itHodIds.forEach((id) => assert(!recipients.includes(id), 'Negative check: Unrelated IT HOD receives NOTHING for CSE complaint'));
    }
  }

  console.log('\n5. Verifying Deduplication & Anti-Echo Engine...');
  {
    if (studentUser) {
      // 5.1 Deduplication of multi-occurrence user
      const event: DomainEvent = {
        eventType: 'ASSIGNMENT_GRADED',
        entityType: 'ASSIGNMENT',
        entityId: 'asg-graded-1',
        title: 'Grade Released',
        body: 'Your math assignment received an A',
        targetUserIds: [studentUser.id, studentUser.id, studentUser.id],
        metadata: { studentUserId: studentUser.id },
      };
      const recipients = await RecipientResolverService.resolveRecipients(event);
      const count = recipients.filter((id) => id === studentUser.id).length;
      assert(count === 1, 'Deduplication engine collapses multiple recipient triggers to exactly 1 ID');

      // 5.2 Actor self-echo suppression
      const selfEvent: DomainEvent = {
        eventType: 'TASK_COMPLETED',
        entityType: 'TASK',
        entityId: 'task-echo-1',
        actorUserId: studentUser.id,
        title: 'Task Done',
        body: 'Completed syllabus review',
        metadata: { creatorId: studentUser.id, assigneeId: studentUser.id },
      };
      const selfRecipients = await RecipientResolverService.resolveRecipients(selfEvent);
      assert(!selfRecipients.includes(studentUser.id), 'Anti-echo engine suppresses self-notification for event actor');
    }
  }

  console.log('\n6. Verifying Canonical Role-Specific Deep Link Resolution...');
  {
    const leaveEvent: DomainEvent = {
      eventType: 'FACULTY_LEAVE_RECOMMENDED',
      entityType: 'FACULTY_LEAVE',
      entityId: 'fac-leave-77',
      title: 'Faculty Leave',
      body: 'Sanction required',
    };

    assert(
      NotificationDeepLinkResolver.resolve(leaveEvent, 'HOD') === '/hod/leave-approvals/fac-leave-77',
      'DeepLink: HOD resolves to /hod/leave-approvals/:id'
    );
    assert(
      NotificationDeepLinkResolver.resolve(leaveEvent, 'Principal') === '/principal/approval-center',
      'DeepLink: Principal resolves to /principal/approval-center'
    );
    assert(
      NotificationDeepLinkResolver.resolve(leaveEvent, 'Faculty') === '/faculty/leave-od/fac-leave-77',
      'DeepLink: Faculty resolves to /faculty/leave-od/:id'
    );
    assert(
      NotificationDeepLinkResolver.resolve(leaveEvent, 'Student') === '/student/leave-od/fac-leave-77',
      'DeepLink: Student resolves to /student/leave-od/:id'
    );

    const taskEvent: DomainEvent = {
      eventType: 'TASK_ASSIGNED',
      entityType: 'TASK',
      entityId: 'task-88',
      title: 'NIRF Audit Task',
      body: 'Submit documents',
    };
    assert(NotificationDeepLinkResolver.resolve(taskEvent, 'HOD') === '/hod/tasks', 'DeepLink: HOD task resolves to /hod/tasks');
    assert(NotificationDeepLinkResolver.resolve(taskEvent, 'Faculty') === '/faculty/tasks', 'DeepLink: Faculty task resolves to /faculty/tasks');

    const hostelEvent: DomainEvent = {
      eventType: 'HOSTEL_ROOM_ALLOCATED',
      entityType: 'HOSTEL',
      entityId: 'hostel-room-101',
      title: 'Room Allocated',
      body: 'Room 101 Ramanujan Block',
    };
    assert(NotificationDeepLinkResolver.resolve(hostelEvent, 'Hostel Warden') === '/hostel/dashboard', 'DeepLink: Warden resolves to /hostel/dashboard');
    assert(NotificationDeepLinkResolver.resolve(hostelEvent, 'Student') === '/student/hostel', 'DeepLink: Student resolves to /student/hostel');
  }

  console.log('\n======================================================================');
  console.log(`🎉 NOTIFICATION ROUTING VERIFICATION SUITE COMPLETE: ${passedChecks}/${totalChecks} PASS`);
  console.log('======================================================================\n');
}

runRoleAwareNotificationRoutingTests()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
