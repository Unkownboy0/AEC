export type CircularStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CircularPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type BroadcastLevel =
  | 'ALL_CAMPUS'
  | 'FACULTY_ONLY'
  | 'STUDENT_ONLY'
  | 'DEPARTMENT_SPECIFIC'
  | 'HOD_ONLY'
  | 'MENTOR_ONLY'
  | 'PARENT_ONLY'
  | 'SELECTED_USERS';

export type CircularCategory =
  | 'GENERAL' | 'ACADEMIC' | 'EXAMINATION' | 'ADMISSION' | 'IQAC'
  | 'PLACEMENT' | 'INTERNSHIP' | 'FEES' | 'TRANSPORT' | 'EMERGENCY'
  | 'EVENT' | 'DEPARTMENT' | 'STAFF' | 'STUDENT' | 'PARENT';

export interface CircularAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface CircularDepartment {
  id: string;
  name: string;
  code: string;
}

export interface Circular {
  id: string;
  circularNumber: string;
  title: string;
  category: CircularCategory;
  priority: CircularPriority;
  description?: string;
  content: string;
  broadcastLevel: BroadcastLevel;
  status: CircularStatus;
  authorId: string;
  authorRole: string;
  publishedAs: string;
  departmentId?: string;
  department?: CircularDepartment;
  author?: CircularAuthor;
  attachmentUrl?: string;
  attachmentName?: string;
  referenceLink?: string;
  publishDate?: string;
  expiryDate?: string;
  isPinned: boolean;
  isEmergency: boolean;
  acknowledgementRequired: boolean;
  publishedAt?: string;
  createdAt: string;
  // Targeting
  targetDepartments: string[];
  targetRoles: string[];
  targetYears: string[];
  targetSemesters: string[];
  targetSections: string[];
  selectedUserIds: string[];
  // Per-user status (from CircularRecipient)
  userStatus?: string;
  userReadAt?: string;
  userAcknowledgedAt?: string;
  isRead: boolean;
  isAcknowledged: boolean;
  totalRecipients: number;
}

export interface CircularRecipient {
  id: string;
  circularId: string;
  userId: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'READ' | 'ACKNOWLEDGED' | 'FAILED';
  deliveredAt?: string;
  openedAt?: string;
  readAt?: string;
  acknowledgedAt?: string;
  user?: CircularAuthor;
}

export interface CircularAnalytics {
  totalRecipients: number;
  readCount: number;
  acknowledgedCount: number;
  unreadCount: number;
  readPercentage: number;
  acknowledgedPercentage: number;
}

export interface CreateCircularPayload {
  title: string;
  category?: CircularCategory;
  priority?: CircularPriority;
  description?: string;
  content: string;
  broadcastLevel?: BroadcastLevel;
  targetDepartments?: string[];
  targetRoles?: string[];
  targetYears?: string[];
  targetSemesters?: string[];
  targetSections?: string[];
  selectedUserIds?: string[];
  attachmentUrl?: string;
  attachmentName?: string;
  referenceLink?: string;
  publishDate?: string;
  expiryDate?: string;
  isPinned?: boolean;
  isEmergency?: boolean;
  acknowledgementRequired?: boolean;
}
