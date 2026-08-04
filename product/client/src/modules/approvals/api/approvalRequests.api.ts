import api from '@/lib/axios';

export interface TimelineActor {
  id?: string;
  name: string;
  role: string;
  displayRole: string;
  performedAsRole?: string;
}

export interface TimelineEventItem {
  id: string;
  requestId: string;
  eventType: string;
  title: string;
  fromStage?: string | null;
  toStage?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  actor: TimelineActor;
  delegationId?: string | null;
  remarks?: string | null;
  attachmentId?: string | null;
  metadata?: any;
  sequenceNumber: number;
  createdAt: string;
}

export interface ApprovalAttachmentItem {
  id: string;
  requestId: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  uploadedAt: string;
  uploadedBy?: {
    id?: string;
    name: string;
    role: string;
  };
  canPreview: boolean;
  canDownload: boolean;
  downloadUrl?: string;
}

export interface ApprovalRequestDetails {
  id: string;
  requestNumber?: string;
  requestType: string;
  title: string;
  leaveType?: string;
  reason?: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  totalDays?: number;
  status: string;
  currentStage: string;
  assignedRole: string;
  actionByRole?: string | null;
  actionAsRole?: string | null;
  applicant: {
    id?: string;
    name: string;
    departmentName: string;
    submittedAsRole: string;
    primaryEmploymentRole?: string;
    additionalResponsibility?: string | null;
    employeeId?: string;
  };
  submittedAt: string;
  warning?: string | null;
}

export const approvalRequestsApi = {
  getRequestDetails: async (requestId: string): Promise<ApprovalRequestDetails> => {
    const res = await api.get(`/approval-requests/${requestId}/details`);
    return res.data.data;
  },

  getTimelineEvents: async (requestId: string): Promise<TimelineEventItem[]> => {
    const res = await api.get(`/approval-requests/${requestId}/timeline`);
    return res.data.events || [];
  },

  getAttachments: async (requestId: string): Promise<ApprovalAttachmentItem[]> => {
    const res = await api.get(`/approval-requests/${requestId}/attachments`);
    return res.data.attachments || [];
  },
};
