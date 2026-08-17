import type { NotificationEventType } from './notification.types';

/*
  CAMPUSOS NOTIFICATION ROUTER
  
  Maps backend eventType values to frontend route patterns.
  Uses existing actual routes from Router.tsx — no invented routes.
  
  Template params (`:id`, `:threadId`) are replaced at runtime
  by the NotificationProvider using relatedEntityId from the payload.
*/

export interface NotificationRoute {
  /** Route pattern with optional :id / :threadId params */
  pattern: string;
  /** Which field from the notification provides the ID */
  idField?: 'relatedEntityId';
}

export const NOTIFICATION_ROUTE_MAP: Partial<Record<NotificationEventType, NotificationRoute>> = {
  // Leave & OD
  LEAVE_SUBMITTED:             { pattern: '/faculty/mentor/leave-od/:id',     idField: 'relatedEntityId' },
  LEAVE_REQUESTED:             { pattern: '/faculty/mentor/leave-od/:id',     idField: 'relatedEntityId' },
  OD_SUBMITTED:                { pattern: '/faculty/mentor/leave-od/:id',     idField: 'relatedEntityId' },
  OD_REQUESTED:                { pattern: '/faculty/mentor/leave-od/:id',     idField: 'relatedEntityId' },
  LEAVE_FORWARDED:             { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_APPROVED:              { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_REJECTED:              { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  OD_APPROVED:                 { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  OD_REJECTED:                 { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  STUDENT_LEAVE_FORWARDED_TO_HOD: { pattern: '/hod/leave-approvals/:id',      idField: 'relatedEntityId' },
  LEAVE_MENTOR_REVIEWED:       { pattern: '/hod/leave-approvals/:id',         idField: 'relatedEntityId' },
  LEAVE_SENT_TO_HOD:           { pattern: '/hod/leave-approvals/:id',         idField: 'relatedEntityId' },
  LEAVE_HOD_APPROVED:          { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_HOD_REJECTED:          { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_SENT_TO_PRINCIPAL:     { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_PRINCIPAL_APPROVED:    { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_PRINCIPAL_REJECTED:    { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_RETURNED:              { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_DELEGATED_TO_VP:       { pattern: '/vp/acting-principal/approvals',   idField: undefined },

  // Approvals (HOD/Principal/VP side)
  APPROVAL_DELEGATED:          { pattern: '/vp/acting-principal/approvals',   idField: undefined },

  // Tasks
  TASK_ASSIGNED:               { pattern: '/faculty/tasks',                   idField: undefined },
  TASK_UPDATED:                { pattern: '/faculty/tasks',                   idField: undefined },
  TASK_DEADLINE_APPROACHING:   { pattern: '/faculty/tasks',                   idField: undefined },
  TASK_SUBMITTED:              { pattern: '/hod/tasks',                       idField: undefined },
  TASK_REVISION_REQUESTED:     { pattern: '/faculty/tasks',                   idField: undefined },
  TASK_COMPLETED:              { pattern: '/hod/tasks',                       idField: undefined },
  TASK_OVERDUE:                { pattern: '/faculty/tasks',                   idField: undefined },
  TASK_COMMENTED:              { pattern: '/faculty/tasks',                   idField: undefined },

  // Assignments
  ASSIGNMENT_PUBLISHED:        { pattern: '/student/assignments',              idField: undefined },
  ASSIGNMENT_DUE_SOON:         { pattern: '/student/assignments',              idField: undefined },
  ASSIGNMENT_SUBMISSION_RECEIVED: { pattern: '/faculty/assignments',          idField: undefined },
  ASSIGNMENT_GRADED:           { pattern: '/student/assignments',              idField: undefined },
  MARKS_PUBLISHED:             { pattern: '/student/results',                 idField: undefined },

  // Exams
  EXAM_TIMETABLE_PUBLISHED:    { pattern: '/student/examinations',            idField: undefined },
  HALL_TICKET_AVAILABLE:       { pattern: '/student/examinations',            idField: undefined },
  HALL_ALLOCATION_PUBLISHED:   { pattern: '/student/examinations',            idField: undefined },
  EXAM_RESULT_PUBLISHED:       { pattern: '/student/results',                 idField: undefined },
  RESULT_PUBLISHED:            { pattern: '/student/results',                 idField: undefined },
  REVALUATION_UPDATE:          { pattern: '/student/results',                 idField: undefined },
  EXAM_DUTY_ASSIGNED:          { pattern: '/faculty/timetable',              idField: undefined },

  // Fees
  FEE_BILL_CREATED:            { pattern: '/student/fees',                    idField: undefined },
  FEE_DUE:                     { pattern: '/student/fees',                    idField: undefined },
  FEE_PAYMENT_DUE:             { pattern: '/student/fees',                    idField: undefined },
  PAYMENT_SUCCESS:             { pattern: '/student/fees',                    idField: undefined },
  PAYMENT_FAILED:              { pattern: '/student/fees',                    idField: undefined },
  FEE_PAYMENT_SUCCESS:         { pattern: '/student/fees',                    idField: undefined },
  FEE_RECEIPT_AVAILABLE:       { pattern: '/student/fees',                    idField: undefined },
  RECEIPT_GENERATED:           { pattern: '/student/fees',                    idField: undefined },
  SCHOLARSHIP_UPDATE:          { pattern: '/student/fees',                    idField: undefined },

  // Circulars
  CIRCULAR_PUBLISHED:          { pattern: '/student/circulars',               idField: undefined },
  EMERGENCY_CIRCULAR:          { pattern: '/student/circulars',               idField: undefined },
  CIRCULAR_REMINDER:           { pattern: '/student/circulars',               idField: undefined },
  EMERGENCY_NOTICE:            { pattern: '/student/circulars',               idField: undefined },
  CIRCULAR_ACKNOWLEDGEMENT_REQUIRED: { pattern: '/student/circulars',        idField: undefined },

  // Messages
  MESSAGE_RECEIVED:            { pattern: '/student/messages',                idField: undefined },
  MENTOR_MESSAGE_RECEIVED:     { pattern: '/student/messages',                idField: undefined },
  PARENT_COMMUNICATION:        { pattern: '/parent/messages',                 idField: undefined },
  ADMIN_MESSAGE:               { pattern: '/student/messages',                idField: undefined },

  // Complaints
  COMPLAINT_SUBMITTED:         { pattern: '/hod/complaints',                  idField: undefined },
  COMPLAINT_ASSIGNED:          { pattern: '/hod/complaints',                  idField: undefined },
  COMPLAINT_STATUS_UPDATED:    { pattern: '/hod/complaints',                  idField: undefined },
  COMPLAINT_ESCALATED:         { pattern: '/principal/complaints',            idField: undefined },
  COMPLAINT_RESOLVED:          { pattern: '/hod/complaints',                  idField: undefined },

  // Placement
  PLACEMENT_OPPORTUNITY:       { pattern: '/student/placements',              idField: undefined },
  PLACEMENT_ELIGIBILITY_UPDATE:{ pattern: '/student/placements',              idField: undefined },
  INTERVIEW_SCHEDULED:         { pattern: '/student/placements',              idField: undefined },
  APPLICATION_STATUS_CHANGED:  { pattern: '/student/placements',              idField: undefined },
  OFFER_AVAILABLE:             { pattern: '/student/placements',              idField: undefined },
  INTERNSHIP_REPORT_DUE:       { pattern: '/student/placements',              idField: undefined },

  // Delegation & Approvals
  PRINCIPAL_BUSY:              { pattern: '/vp/dashboard',                    idField: undefined },
  PRINCIPAL_OFFLINE:           { pattern: '/vp/dashboard',                    idField: undefined },
  DELEGATION_ACTIVATED:        { pattern: '/vp/acting-principal/approvals',   idField: undefined },
  DELEGATION_ENDING:           { pattern: '/principal/delegation',            idField: undefined },
  DELEGATION_COMPLETED:        { pattern: '/principal/delegation',            idField: undefined },
  HANDOVER_AVAILABLE:          { pattern: '/principal/delegation',            idField: undefined },
  HANDOVER_READY:              { pattern: '/vp/acting-principal/approvals',   idField: undefined },
  HANDOVER_SUMMARY_READY:      { pattern: '/vp/acting-principal/approvals',   idField: undefined },
  ACTING_PRINCIPAL_ASSIGNED:   { pattern: '/vp/acting-principal/approvals',   idField: undefined },
  ACTING_PRINCIPAL_ACTIVATED:  { pattern: '/vp/acting-principal/approvals',   idField: undefined },
  ACTING_PRINCIPAL_REVOKED:    { pattern: '/vp/dashboard',                    idField: undefined },
  NEW_DELEGATED_APPROVAL:      { pattern: '/vp/acting-principal/approvals',   idField: undefined },
  DELEGATION_ENDED:            { pattern: '/principal/delegation',            idField: undefined },

  // Attendance
  ATTENDANCE_MARKED:           { pattern: '/student/attendance',              idField: undefined },
  ATTENDANCE_SHORTAGE:         { pattern: '/student/attendance',              idField: undefined },
  ATTENDANCE_SHORTAGE_DETECTED:{ pattern: '/student/attendance',              idField: undefined },
  LOW_ATTENDANCE_WARNING:      { pattern: '/student/attendance',              idField: undefined },
  CONTINUOUS_ABSENCE_ALERT:    { pattern: '/student/attendance',              idField: undefined },
  ATTENDANCE_CORRECTION_APPROVED: { pattern: '/student/attendance',          idField: undefined },
  ATTENDANCE_CORRECTION_REJECTED: { pattern: '/student/attendance',          idField: undefined },

  // Faculty Leave & Substitution & Timetable
  FACULTY_LEAVE_SUBMITTED:     { pattern: '/hod/approvals',                   idField: undefined },
  FACULTY_LEAVE_APPROVED:      { pattern: '/faculty/timetable',               idField: undefined },
  FACULTY_LEAVE_REJECTED:      { pattern: '/faculty/timetable',               idField: undefined },
  SUBSTITUTE_ASSIGNED:         { pattern: '/faculty/timetable',               idField: undefined },
  CLASS_SUBSTITUTION_ASSIGNED: { pattern: '/faculty/timetable',               idField: undefined },
  SUBSTITUTION_ASSIGNED:       { pattern: '/faculty/timetable',               idField: undefined },
  TIMETABLE_PUBLISHED:         { pattern: '/faculty/timetable',               idField: undefined },
  TIMETABLE_CHANGED:           { pattern: '/faculty/timetable',               idField: undefined },
  TIMETABLE_UPDATED:           { pattern: '/faculty/timetable',               idField: undefined },
  FACULTY_LEAVE:               { pattern: '/faculty/leave-od',                idField: undefined },
  ON_DUTY:                     { pattern: '/faculty/leave-od',                idField: undefined },

  // Announcements & General
  CAMPUS_ANNOUNCEMENT:         { pattern: '/circulars',                       idField: undefined },
  ANNOUNCEMENT:                { pattern: '/circulars',                       idField: undefined },
  GENERAL:                     { pattern: '/notifications',                   idField: undefined },
};

/**
 * Resolve a notification to its target route path.
 * Guaranteed to return a valid navigable path.
 */
export function resolveNotificationRoute(
  eventType?: string | null,
  relatedEntityId?: string | null,
  deepLinkRoute?: string | null,
  userRole?: string | null
): string {
  // 1. Direct valid deepLinkRoute takes top priority
  if (deepLinkRoute && typeof deepLinkRoute === 'string' && deepLinkRoute.trim().startsWith('/')) {
    let link = deepLinkRoute.trim();
    if (relatedEntityId) {
      link = link.replace(':id', relatedEntityId).replace(':requestId', relatedEntityId).replace(':threadId', relatedEntityId);
    }
    return link;
  }

  const rawType = (eventType || '').trim().toUpperCase();
  const role = (userRole || '').trim().toUpperCase();

  // 2. Exact match in map
  const routeConfig = NOTIFICATION_ROUTE_MAP[rawType as NotificationEventType];
  if (routeConfig) {
    let path = routeConfig.pattern;
    if (routeConfig.idField && relatedEntityId) {
      path = path.replace(':id', relatedEntityId).replace(':requestId', relatedEntityId).replace(':threadId', relatedEntityId);
    } else if (path.includes(':id') || path.includes(':requestId') || path.includes(':threadId')) {
      path = path.split('/:')[0];
    }
    return path;
  }

  // 3. Heuristic Keyword Matching based on eventType & user role
  if (rawType.includes('LEAVE') || rawType.includes('OD') || rawType.includes('ON_DUTY') || rawType.includes('PERMISSION')) {
    if (role.includes('HOD')) {
      return relatedEntityId ? `/hod/leave-approvals/${relatedEntityId}` : '/hod/leave-approvals';
    }
    if (role.includes('PRINCIPAL') || role.includes('VP')) {
      return relatedEntityId ? `/vp/acting-principal/approvals/${relatedEntityId}` : '/vp/acting-principal/approvals';
    }
    if (role.includes('FACULTY') || role.includes('MENTOR')) {
      return relatedEntityId ? `/faculty/mentor/leave-od/${relatedEntityId}` : '/faculty/mentor/leave-od';
    }
    return relatedEntityId ? `/student/leave-od/${relatedEntityId}` : '/student/leave-od';
  }

  if (rawType.includes('CIRCULAR') || rawType.includes('ANNOUNCEMENT') || rawType.includes('NOTICE') || rawType.includes('BROADCAST')) {
    if (role.includes('FACULTY') || role.includes('MENTOR')) {
      return relatedEntityId ? `/faculty/circulars/${relatedEntityId}` : '/faculty/circulars';
    }
    if (role.includes('HOD')) {
      return relatedEntityId ? `/hod/circulars/${relatedEntityId}` : '/hod/circulars';
    }
    return relatedEntityId ? `/student/circulars/${relatedEntityId}` : '/student/circulars';
  }

  if (rawType.includes('TASK') || rawType.includes('ACTION_ITEM')) {
    if (role.includes('HOD')) return '/hod/tasks';
    if (role.includes('FACULTY')) return '/faculty/tasks';
    return '/tasks';
  }

  if (rawType.includes('ASSIGNMENT') || rawType.includes('HOMEWORK')) {
    return role.includes('FACULTY') ? '/faculty/assignments' : '/student/assignments';
  }

  if (rawType.includes('TIMETABLE') || rawType.includes('SUBSTITUTION') || rawType.includes('SCHEDULE')) {
    return role.includes('FACULTY') ? '/faculty/timetable' : '/student/timetable';
  }

  if (rawType.includes('ATTENDANCE') || rawType.includes('ABSEN')) {
    if (role.includes('HOD')) return '/hod/attendance';
    if (role.includes('FACULTY')) return '/faculty/attendance';
    return '/student/attendance';
  }

  if (rawType.includes('EXAM') || rawType.includes('HALL_TICKET') || rawType.includes('TEST')) {
    return '/student/examinations';
  }

  if (rawType.includes('RESULT') || rawType.includes('MARK') || rawType.includes('GRADE')) {
    return role.includes('FACULTY') ? '/faculty/internal-marks' : '/student/results';
  }

  if (rawType.includes('FEE') || rawType.includes('PAYMENT') || rawType.includes('DUES') || rawType.includes('RECEIPT') || rawType.includes('SCHOLARSHIP')) {
    return '/student/fees';
  }

  if (rawType.includes('PLACEMENT') || rawType.includes('JOB') || rawType.includes('INTERNSHIP') || rawType.includes('DRIVE') || rawType.includes('OFFER')) {
    return '/student/placements';
  }

  if (rawType.includes('MESSAGE') || rawType.includes('CHAT') || rawType.includes('ADVISOR')) {
    if (role.includes('PARENT')) return '/parent/messages';
    return '/student/messages';
  }

  if (rawType.includes('COMPLAINT') || rawType.includes('GRIEVANCE')) {
    if (role.includes('HOD')) return '/hod/complaints';
    if (role.includes('PRINCIPAL') || role.includes('VP')) return '/principal/complaints';
    return '/student/complaints';
  }

  if (rawType.includes('DELEGAT') || rawType.includes('ACTING')) {
    return '/vp/acting-principal/approvals';
  }

  if (rawType.includes('IQAC') || rawType.includes('AUDIT') || rawType.includes('ACCREDIT')) {
    return '/iqac/dashboard';
  }

  // 4. Default fallback to the Notifications page
  if (role.includes('FACULTY')) return '/faculty/notifications';
  if (role.includes('HOD')) return '/hod/notifications';
  if (role.includes('PRINCIPAL')) return '/principal/notifications';
  if (role.includes('VP')) return '/vp/notifications';
  if (role.includes('STUDENT')) return '/student/notifications';
  return '/notifications';
}

