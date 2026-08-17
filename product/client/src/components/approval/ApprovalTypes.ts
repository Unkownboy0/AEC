export type ApprovalStatusType =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'PENDING_MENTOR'
  | 'PENDING_ADVISER'
  | 'PENDING_HOD'
  | 'PENDING_DEAN'
  | 'PENDING_PRINCIPAL'
  | 'PENDING_VP'
  | 'PENDING_DIRECTOR'
  | 'IN_REVIEW'
  | 'RECOMMENDED'
  | 'FORWARDED'
  | 'RETURNED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ESCALATED'
  | 'NEEDS_INFORMATION';

export type ApprovalPriorityType = 'LOW' | 'NORMAL' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'EMERGENCY';

export type ApprovalActionType =
  | 'APPROVE'
  | 'RECOMMEND'
  | 'FORWARD'
  | 'RETURN'
  | 'REJECT'
  | 'REQUEST_INFO'
  | 'REASSIGN'
  | 'HOLD'
  | 'CANCEL';

export interface ApprovalRequester {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string; // e.g. 'Student', 'Assistant Professor', 'HOD'
  departmentName?: string;
  departmentCode?: string;
  admissionNo?: string;
  employeeId?: string;
  classSection?: string; // e.g. 'II B.Tech CSE - A'
  email?: string;
  phone?: string;
}

export interface ApprovalMetadataField {
  label: string;
  value: React.ReactNode;
  hint?: string;
  isHighlight?: boolean;
}

export interface ApprovalContextCard {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: { label: string; variant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'red' | 'gray' };
  description?: string;
  items?: Array<{
    label: string;
    value: React.ReactNode;
    subValue?: string;
    tag?: string;
  }>;
  customContent?: React.ReactNode;
}

export interface ApprovalAttachmentItem {
  id: string;
  name: string;
  url: string;
  type?: 'image' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'url' | 'other';
  sizeBytes?: number;
  uploadedAt?: string;
}

export interface ApprovalTimelineStep {
  id: string;
  stage: string;
  action?: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'REJECTED' | 'RETURNED';
  actorName?: string;
  actorRole?: string;
  performedAsRole?: string; // e.g. 'Vice Principal — Acting Principal'
  timestamp?: string | Date;
  comment?: string;
}

export interface ApprovalCommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  avatarUrl?: string;
  content: string;
  timestamp: string | Date;
  type?: 'REMARK' | 'RETURN_REASON' | 'REJECTION_REASON' | 'CLARIFICATION' | 'SYSTEM';
}

export interface ApprovalActionDef {
  action: ApprovalActionType;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'info' | 'ghost';
  requiresRemarks?: boolean;
  remarksPlaceholder?: string;
  nextStagePreview?: string;
  confirmationTitle?: string;
  confirmationDescription?: string;
  isDestructive?: boolean;
}

export interface ApprovalViewModel {
  id: string;
  requestNumber?: string;
  requestType: string; // e.g. 'FACULTY_LEAVE', 'STUDENT_LEAVE', 'ON_DUTY', 'PURCHASE', 'APPRAISAL'
  typeBadgeLabel?: string; // e.g. 'LEAVE', 'OD', 'PURCHASE', 'CERTIFICATE'
  typeVariant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'sky';
  title: string;
  reason?: string;
  status: ApprovalStatusType;
  statusLabel?: string;
  priority?: ApprovalPriorityType;
  isEmergency?: boolean;
  currentStep?: string;
  submittedAt: string | Date;
  updatedAt?: string | Date;

  // Requester Identity Block
  requester: ApprovalRequester;

  // Key-Value Metadata Grid
  metadata: ApprovalMetadataField[];

  // Pluggable Context Sections (Substitutions, Attendance, Quotations, Appraisal)
  contextSections?: ApprovalContextCard[];

  // Evidence / Supporting Files
  attachments?: ApprovalAttachmentItem[];

  // Timeline / Workflow Stages
  timeline?: ApprovalTimelineStep[];

  // Comments / Discussion
  comments?: ApprovalCommentItem[];

  // Actions permitted for current user
  availableActions?: ApprovalActionDef[];

  // Custom Raw Data for extensions
  rawData?: any;
}

export interface ApprovalFilterState {
  tab: string; // 'PENDING' | 'EMERGENCY' | 'RECOMMENDED' | 'FORWARDED' | 'RETURNED' | 'REJECTED' | 'ALL'
  searchQuery: string;
  requestType?: string;
  departmentId?: string;
  dateRange?: { start?: string; end?: string };
}
