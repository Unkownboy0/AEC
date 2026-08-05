import api from '../../../../lib/axios';
import { FacultyLeaveOdRequest, CreateFacultyLeavePayload, HodSummaryCards } from '../types/facultyLeave.types';

export async function fetchFacultyRequests(): Promise<FacultyLeaveOdRequest[]> {
  const { data } = await api.get('/faculty/leave-od');
  return data.data ?? [];
}

export async function fetchFacultyRequestById(id: string): Promise<FacultyLeaveOdRequest | null> {
  const { data } = await api.get(`/faculty/leave-od/${id}`);
  return data.data ?? null;
}

export async function submitFacultyLeaveOd(payload: CreateFacultyLeavePayload): Promise<FacultyLeaveOdRequest> {
  const { data } = await api.post('/faculty/leave-od', payload);
  if (!data.success) throw new Error(data.error ?? 'Failed to submit request');
  return data.data;
}

// HOD API
export async function fetchHodDashboard(status?: string): Promise<{ summary: HodSummaryCards; queue: FacultyLeaveOdRequest[] }> {
  const { data } = await api.get('/hod/faculty-requests', { params: { status } });
  return { summary: data.summary, queue: data.queue ?? [] };
}

export async function hodRecommendRequest(id: string, payload: { remarks?: string; confirmedSubstituteId?: string; handoverInstructions?: string }) {
  const { data } = await api.post(`/hod/faculty-requests/${id}/recommend`, payload);
  if (!data.success) throw new Error(data.error ?? 'Failed to recommend request');
  return data.data;
}

export async function hodRejectRequest(id: string, reason: string) {
  const { data } = await api.post(`/hod/faculty-requests/${id}/reject`, { reason });
  if (!data.success) throw new Error(data.error ?? 'Failed to reject request');
  return data.data;
}

export async function hodReturnRequest(id: string, reason: string) {
  const { data } = await api.post(`/hod/faculty-requests/${id}/return`, { reason });
  if (!data.success) throw new Error(data.error ?? 'Failed to return request');
  return data.data;
}
