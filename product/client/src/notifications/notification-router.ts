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
  LEAVE_SUBMITTED:             { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  OD_SUBMITTED:                { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
  LEAVE_MENTOR_REVIEWED:       { pattern: '/hod/approvals',                   idField: undefined },
  LEAVE_SENT_TO_HOD:           { pattern: '/student/leave-od/:id',            idField: 'relatedEntityId' },
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

  // Assignments
  ASSIGNMENT_PUBLISHED:        { pattern: '/student/assignments',              idField: undefined },
  ASSIGNMENT_DUE_SOON:         { pattern: '/student/assignments',              idField: undefined },
  ASSIGNMENT_SUBMISSION_RECEIVED: { pattern: '/faculty/assignments',          idField: undefined },
  ASSIGNMENT_GRADED:           { pattern: '/student/assignments',              idField: undefined },
  MARKS_PUBLISHED:             { pattern: '/student/results',                 idField: undefined },

  // Exams
  EXAM_TIMETABLE_PUBLISHED:    { pattern: '/student/examinations',            idField: undefined },
  HALL_TICKET_AVAILABLE:       { pattern: '/student/examinations',            idField: undefined },
  EXAM_RESULT_PUBLISHED:       { pattern: '/student/results',                 idField: undefined },
  REVALUATION_UPDATE:          { pattern: '/student/results',                 idField: undefined },
  EXAM_DUTY_ASSIGNED:          { pattern: '/faculty/timetable',              idField: undefined },

  // Fees
  FEE_BILL_CREATED:            { pattern: '/student/fees',                    idField: undefined },
  FEE_PAYMENT_DUE:             { pattern: '/student/fees',                    idField: undefined },
  FEE_PAYMENT_SUCCESS:         { pattern: '/student/fees',                    idField: undefined },
  FEE_RECEIPT_AVAILABLE:       { pattern: '/student/fees',                    idField: undefined },
  SCHOLARSHIP_UPDATE:          { pattern: '/student/fees',                    idField: undefined },

  // Circulars
  CIRCULAR_PUBLISHED:          { pattern: '/student/circulars',               idField: undefined },
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

  // Delegation
  PRINCIPAL_BUSY:              { pattern: '/vp/dashboard',                    idField: undefined },
  PRINCIPAL_OFFLINE:           { pattern: '/vp/dashboard',                    idField: undefined },
  DELEGATION_ACTIVATED:        { pattern: '/vp/acting-principal/approvals',   idField: undefined },
  DELEGATION_ENDING:           { pattern: '/principal/delegation',            idField: undefined },
  DELEGATION_COMPLETED:        { pattern: '/principal/delegation',            idField: undefined },
  HANDOVER_AVAILABLE:          { pattern: '/principal/delegation',            idField: undefined },

  // Attendance
  ATTENDANCE_MARKED:           { pattern: '/student/attendance',              idField: undefined },
  LOW_ATTENDANCE_WARNING:      { pattern: '/student/attendance',              idField: undefined },
  CONTINUOUS_ABSENCE_ALERT:    { pattern: '/student/attendance',              idField: undefined },
  ATTENDANCE_CORRECTION_APPROVED: { pattern: '/student/attendance',          idField: undefined },
  ATTENDANCE_CORRECTION_REJECTED: { pattern: '/student/attendance',          idField: undefined },
};

/**
 * Resolve a notification to its target route path.
 * Returns null if no route is found or if the deep link is invalid.
 */
export function resolveNotificationRoute(
  eventType: NotificationEventType,
  relatedEntityId?: string | null,
  deepLinkRoute?: string | null
): string | null {
  // Backend-provided deepLinkRoute takes priority
  if (deepLinkRoute && deepLinkRoute.startsWith('/')) {
    return deepLinkRoute;
  }

  const routeConfig = NOTIFICATION_ROUTE_MAP[eventType];
  if (!routeConfig) return null;

  let path = routeConfig.pattern;

  if (routeConfig.idField && relatedEntityId) {
    path = path.replace(':id', relatedEntityId).replace(':threadId', relatedEntityId);
  } else if (path.includes(':id') || path.includes(':threadId')) {
    // Pattern needs an ID but none provided — fall back to list view
    path = path.split('/:')[0];
  }

  return path;
}
