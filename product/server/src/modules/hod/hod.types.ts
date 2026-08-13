export interface HodDepartmentContext {
  userId: string;
  departmentId: string;
  departmentIds: string[];
  departments: Array<{ id: string; name: string; code: string }>;
  departmentName: string;
  departmentCode: string;
  isPrimary: boolean;
}

export interface HodDashboardSummary {
  totalStudents: number;
  activeStudents: number;
  totalFaculty: number;
  activeFaculty: number;
  totalMentors: number;
  unassignedStudents: number;
  pendingLeaveRequests: number;
  pendingOdRequests: number;
  emergencyRequests: number;
  attendanceCorrectionRequests: number;
  facultyLeaveRequests: number;
  pendingTasks: number;
  overdueTasks: number;
  activeComplaints: number;
  upcomingEvents: number;
  lowAttendanceStudentsCount: number;
  facultyWorkloadAlertsCount: number;
  timetableConflictsCount: number;
  unreadNotificationsCount: number;
  charts: {
    studentAttendanceTrend: { label: string; value: number }[];
    leaveRequestTrend: { label: string; value: number }[];
    odRequestTrend: { label: string; value: number }[];
    approvalVsRejection: { approved: number; rejected: number; returned: number; pending: number };
    facultyWorkloadDistribution: { name: string; hours: number; status: string }[];
    subjectPassPercentage: { subjectCode: string; subjectName: string; passPercentage: number }[];
    taskCompletionRate: { completed: number; pending: number; overdue: number };
  };
  recentActivities: any[];
}

export interface HodLeaveOdQueryFilters {
  status?: string;
  requestType?: string;
  search?: string;
  year?: string;
  semesterId?: string;
  sectionId?: string;
  mentorId?: string;
  fromDate?: string;
  toDate?: string;
  priority?: string;
  isEmergency?: boolean;
  page?: number;
  limit?: number;
}

export interface HodReviewActionPayload {
  requestId: string;
  action: 'APPROVE' | 'REJECT' | 'RETURN_TO_MENTOR' | 'RETURN_TO_STUDENT' | 'ESCALATE';
  remarks?: string;
  rejectionReason?: string;
  escalatedToRole?: string;
}

export interface SubjectAllocationPayload {
  subjectId: string;
  primaryFacultyId: string;
  coFacultyIds?: string[];
  substituteFacultyId?: string;
  semesterId: string;
  sectionId: string;
  weeklyHours?: number;
  subjectCoordinatorId?: string;
}

export interface HodTaskCreatePayload {
  title: string;
  description: string;
  assigneeUserIds: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt: string;
  checklist?: string[];
  referenceFileUrls?: string[];
}

export interface HodCircularCreatePayload {
  title: string;
  content: string;
  targetAudience: 'ALL' | 'FACULTY' | 'MENTORS' | 'STUDENTS' | 'SPECIFIC_YEAR' | 'SPECIFIC_SECTION';
  targetYear?: string;
  targetSectionId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isPinned?: boolean;
  publishAt?: string;
  expiryAt?: string;
  attachmentUrls?: string[];
}
