/*
  CAMPUSOS NOTIFICATION TYPES
  
  Matches the backend notification.service.ts SendNotificationDto schema.
  Do NOT modify these to match backend — they already do.
*/

export type NotificationDeliveryChannel = 'IN_APP' | 'PUSH' | 'EMAIL';
export type NotificationDeliveryState = 'PENDING' | 'DELIVERED' | 'FAILED';

/** Event types matching backend notification event sources */
export type NotificationEventType =
  // Attendance
  | 'ATTENDANCE_MARKED'
  | 'ATTENDANCE_CORRECTION_REQUESTED'
  | 'ATTENDANCE_CORRECTION_APPROVED'
  | 'ATTENDANCE_CORRECTION_REJECTED'
  | 'LOW_ATTENDANCE_WARNING'
  | 'CONTINUOUS_ABSENCE_ALERT'
  // Leave & OD
  | 'LEAVE_SUBMITTED'
  | 'OD_SUBMITTED'
  | 'LEAVE_MENTOR_REVIEWED'
  | 'LEAVE_SENT_TO_HOD'
  | 'LEAVE_HOD_APPROVED'
  | 'LEAVE_HOD_REJECTED'
  | 'LEAVE_SENT_TO_PRINCIPAL'
  | 'LEAVE_PRINCIPAL_APPROVED'
  | 'LEAVE_PRINCIPAL_REJECTED'
  | 'LEAVE_RETURNED'
  | 'LEAVE_DELEGATED_TO_VP'
  // Tasks
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_DEADLINE_APPROACHING'
  | 'TASK_SUBMITTED'
  | 'TASK_REVISION_REQUESTED'
  | 'TASK_COMPLETED'
  | 'TASK_OVERDUE'
  // Assignments
  | 'ASSIGNMENT_PUBLISHED'
  | 'ASSIGNMENT_DUE_SOON'
  | 'ASSIGNMENT_SUBMISSION_RECEIVED'
  | 'ASSIGNMENT_GRADED'
  | 'MARKS_PUBLISHED'
  // Exams
  | 'EXAM_TIMETABLE_PUBLISHED'
  | 'HALL_TICKET_AVAILABLE'
  | 'EXAM_RESULT_PUBLISHED'
  | 'REVALUATION_UPDATE'
  | 'EXAM_DUTY_ASSIGNED'
  // Fees
  | 'FEE_BILL_CREATED'
  | 'FEE_PAYMENT_DUE'
  | 'FEE_PAYMENT_SUCCESS'
  | 'FEE_RECEIPT_AVAILABLE'
  | 'SCHOLARSHIP_UPDATE'
  // Circulars
  | 'CIRCULAR_PUBLISHED'
  | 'EMERGENCY_NOTICE'
  | 'CIRCULAR_ACKNOWLEDGEMENT_REQUIRED'
  // Messages
  | 'MESSAGE_RECEIVED'
  | 'MENTOR_MESSAGE_RECEIVED'
  | 'PARENT_COMMUNICATION'
  | 'ADMIN_MESSAGE'
  // Complaints
  | 'COMPLAINT_SUBMITTED'
  | 'COMPLAINT_ASSIGNED'
  | 'COMPLAINT_STATUS_UPDATED'
  | 'COMPLAINT_ESCALATED'
  | 'COMPLAINT_RESOLVED'
  // Placement & Internship
  | 'PLACEMENT_OPPORTUNITY'
  | 'PLACEMENT_ELIGIBILITY_UPDATE'
  | 'INTERVIEW_SCHEDULED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'OFFER_AVAILABLE'
  | 'INTERNSHIP_REPORT_DUE'
  // Delegation
  | 'PRINCIPAL_BUSY'
  | 'PRINCIPAL_OFFLINE'
  | 'DELEGATION_ACTIVATED'
  | 'APPROVAL_DELEGATED'
  | 'DELEGATION_ENDING'
  | 'DELEGATION_COMPLETED'
  | 'HANDOVER_AVAILABLE'
  // Fallback
  | string;

export interface AppNotification {
  id: string;
  recipientId: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  deepLinkRoute?: string | null;
  deliveryChannel: NotificationDeliveryChannel;
  deliveryState: NotificationDeliveryState;
  createdAt: string;
}

export interface NotificationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationListResponse {
  data: AppNotification[];
  meta: NotificationMeta;
}

/** Payload sent to backend when registering a device push token */
export interface DeviceTokenRegistration {
  token: string;
  platform: 'android' | 'ios';
  deviceId: string;
}
