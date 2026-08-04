import api from '@/lib/axios';
import { PrincipalAvailabilityContext, UpdateAvailabilityDto, ApprovalRequestItem, HandoverSummary } from '../types/availability.types';

export const availabilityApi = {
  getAvailabilityContext: async (): Promise<PrincipalAvailabilityContext> => {
    const res = await api.get('/principal/availability/context');
    return res.data.data;
  },

  updateAvailabilityStatus: async (dto: UpdateAvailabilityDto): Promise<PrincipalAvailabilityContext> => {
    const res = await api.post('/principal/availability', dto);
    return res.data.data;
  },

  getPrincipalApprovalCenterQueue: async (): Promise<{
    context: PrincipalAvailabilityContext;
    summaryCards: {
      pendingCount: number;
      approvedTodayCount: number;
      rejectedTodayCount: number;
      returnedCount: number;
      urgentCount: number;
    };
    requests: ApprovalRequestItem[];
  }> => {
    const res = await api.get('/principal/approval-center');
    return res.data.data;
  },

  getVpDelegatedQueue: async (): Promise<{
    context: PrincipalAvailabilityContext;
    pendingRequests: ApprovalRequestItem[];
    processedRequests: ApprovalRequestItem[];
    requests: ApprovalRequestItem[];
  }> => {
    const res = await api.get('/vp/acting-principal/approval-center');
    return res.data.data;
  },

  approveDelegatedRequest: async (assignmentId: string, remarks?: string) => {
    const res = await api.post(
      `/vp/acting-principal/approvals/${assignmentId}/approve`,
      { remarks }
    );
    return res.data;
  },

  rejectDelegatedRequest: async (assignmentId: string, remarks?: string) => {
    const res = await api.post(
      `/vp/acting-principal/approvals/${assignmentId}/reject`,
      { remarks }
    );
    return res.data;
  },

  getLatestHandover: async (): Promise<HandoverSummary | null> => {
    const res = await api.get('/principal/handover/latest');
    return res.data.data;
  },

  acknowledgeHandover: async (handoverId: string) => {
    const res = await api.post(`/principal/handover/${handoverId}/acknowledge`, {});
    return res.data;
  },
};
