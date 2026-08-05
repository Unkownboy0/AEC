import api from '../../../../lib/axios';

export interface HodTaskSummary {
  newTasks: number;
  unreadTasks: number;
  pendingAcknowledgement: number;
  inProgress: number;
  dueToday: number;
  overdue: number;
  submitted: number;
  revisionRequired: number;
  completedThisMonth: number;
  unreadTaskMessages: number;
}

export interface HodTaskItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status: string;
  dueDate?: string;
  progress?: number;
  submissionUrl?: string;
  submissionNotes?: string;
  queryText?: string;
  creator?: { id: string; firstName: string; lastName: string; role?: { name: string } };
  department?: { id: string; name: string; code: string };
  createdAt: string;
}

export async function fetchHodTaskDashboard(status?: string): Promise<{ summary: HodTaskSummary; queue: HodTaskItem[] }> {
  const { data } = await api.get('/hod/tasks', { params: { status } });
  return { summary: data.summary, queue: data.queue ?? [] };
}

export async function fetchHodTaskById(id: string): Promise<HodTaskItem | null> {
  const { data } = await api.get(`/hod/tasks/${id}`);
  return data.data ?? null;
}

export async function acknowledgeHodTask(id: string) {
  const { data } = await api.post(`/hod/tasks/${id}/acknowledge`);
  return data.data;
}

export async function startHodTask(id: string) {
  const { data } = await api.post(`/hod/tasks/${id}/start`);
  return data.data;
}

export async function updateHodTaskProgress(id: string, progress: number, remarks?: string) {
  const { data } = await api.post(`/hod/tasks/${id}/progress`, { progress, remarks });
  return data.data;
}

export async function raiseHodTaskQuery(id: string, queryText: string) {
  const { data } = await api.post(`/hod/tasks/${id}/query`, { queryText });
  return data.data;
}

export async function submitHodTask(id: string, payload: { submissionUrl?: string; submissionNotes?: string }) {
  const { data } = await api.post(`/hod/tasks/${id}/submit`, payload);
  return data.data;
}
