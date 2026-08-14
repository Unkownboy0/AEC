export type RequestType = 'LEAVE' | 'OD';

export type LeaveCategory =
  | 'Casual Leave'
  | 'Medical Leave'
  | 'Earned Leave'
  | 'Emergency Leave'
  | 'Compensatory Leave'
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Half-Day Leave'
  | 'Permission'
  | 'Other Leave';

export type OdCategory =
  | 'Examination Duty'
  | 'Academic Duty'
  | 'Conference'
  | 'Workshop'
  | 'Seminar'
  | 'Faculty Development Programme'
  | 'Industrial Visit'
  | 'Placement Duty'
  | 'Admission Duty'
  | 'IQAC Duty'
  | 'Research Presentation'
  | 'University Duty'
  | 'Official Meeting'
  | 'Other On Duty';

export interface SubstituteCandidate {
  facultyId: string;
  employeeId: string;
  name: string;
  designation: string;
  department: { id: string; name: string; code: string };
  isHomeDept: boolean;
  weeklyLoadHours: number;
  maxWeeklyHours: number;
  workloadDisplay: string;
  subjectMatch: 'SAME_SUBJECT' | 'TAUGHT_SUBJECT' | 'RELATED_DOMAIN' | 'DEPARTMENT_FACULTY' | 'CROSS_DEPARTMENT';
  subjectMatchLabel: string;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
  score: number;
}

export interface AffectedClassSession {
  sessionId: string;
  date: string;
  dayOfWeek: string;
  periodDisplay: string;
  periodStart: number;
  periodEnd: number;
  startTime: string;
  endTime: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  isHomeDepartment: boolean;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  sectionId?: string;
  sectionName?: string;
  venue?: string;
  roomNo?: string;
  slotType: string;
  isLab: boolean;
  slotIds: string[];
  eligibleSubstitutes: SubstituteCandidate[];
  assignedSubstituteId?: string;
  assignedSubstituteName?: string;
  assignedSubstituteDept?: string;
  assignedSubstituteWorkload?: string;
  subjectMatch?: string;
}

export interface WorkflowHistory {
  id: string;
  requestId: string;
  stage: string;
  action: string;
  comment?: string;
  actionByName: string;
  performedByRole?: string;
  performedAsRole?: string;
  createdAt: string;
}

export interface FacultyLeaveOdRequest {
  id: string;
  requestNumber?: string;
  type: RequestType;
  title: string;
  category: string;
  reason: string;
  description?: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  startTime?: string;
  endTime?: string;
  totalDays: number;
  isEmergency: boolean;
  status: string;
  currentStep: string;
  attachments?: string;
  workHandoverDetails?: string;
  substitutions?: string;
  substitutionsList?: AffectedClassSession[];
  preferredSubstituteId?: string;
  confirmedSubstituteId?: string;
  preferredSubstitute?: { id: string; firstName: string; lastName: string; designation?: string };
  confirmedSubstitute?: { id: string; firstName: string; lastName: string; designation?: string };
  department?: { id: string; name: string; code: string };
  facultyRequester?: {
    id: string;
    firstName: string;
    lastName: string;
    designation?: string;
    user?: { id: string; firstName: string; lastName: string; email: string; avatar?: string; employeeId?: string };
  };
  history?: WorkflowHistory[];
  createdAt: string;
}

export interface CreateFacultyLeavePayload {
  requestType: RequestType;
  category: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
  startTime?: string;
  endTime?: string;
  totalDays: number;
  reason: string;
  description?: string;
  isEmergency?: boolean;
  contactNumber?: string;
  supportingDocumentUrl?: string;
  supportingDocumentName?: string;
  affectedPeriods?: any[];
  substitutionsList?: AffectedClassSession[];
  workHandoverDetails?: string;
  preferredSubstituteId?: string;
  remarks?: string;

  // OD specific
  eventName?: string;
  organization?: string;
  venue?: string;
  eventDate?: string;
  invitationLetterUrl?: string;
  expectedOutcome?: string;

  // Medical specific
  medicalCertificateUrl?: string;
  hospitalDetails?: string;
}

export interface HodSummaryCards {
  pendingFacultyLeave: number;
  pendingFacultyOd: number;
  emergencyRequests: number;
  awaitingClarification: number;
  recommendedToday: number;
  rejectedToday: number;
  returnedRequests: number;
  forwardedToPrincipal: number;
  facultyCurrentlyOnLeave: number;
  facultyCurrentlyOnOd: number;
  substituteFacultyRequired: number;
  unreadNotifications: number;
}
