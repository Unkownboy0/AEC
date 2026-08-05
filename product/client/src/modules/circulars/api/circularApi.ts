import api from '../../../lib/axios';
import {
  Circular,
  CircularRecipient,
  CircularAnalytics,
  CreateCircularPayload,
} from '../types/circular.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch all circulars visible to the logged-in user.
 */
export async function fetchCirculars(): Promise<Circular[]> {
  const { data } = await api.get<ApiResponse<Circular[]>>('/circulars');
  return data.data ?? [];
}

/**
 * Fetch a single circular by ID (also marks it as opened).
 */
export async function fetchCircularById(id: string): Promise<Circular | null> {
  const { data } = await api.get<ApiResponse<Circular>>(`/circulars/${id}`);
  return data.data ?? null;
}

export interface PublishResultResponse {
  success: boolean;
  circular: Circular;
  recipients?: {
    total: number;
    faculty: number;
    mentors: number;
    students: number;
    parents?: number;
  };
  notifications?: {
    inAppCreated: number;
    pushQueued: number;
    pushUnavailable: number;
  };
  error?: string;
  code?: string;
}

export async function createCircular(payload: CreateCircularPayload): Promise<PublishResultResponse> {
  const { data } = await api.post<PublishResultResponse>('/circulars', payload);
  if (!data.success) throw new Error((data as any).error ?? 'Failed to create circular');
  return data;
}

export async function createHodCircular(payload: CreateCircularPayload): Promise<PublishResultResponse> {
  const { data } = await api.post<PublishResultResponse>('/hod/circulars', payload);
  if (!data.success) throw new Error((data as any).error ?? 'Failed to create circular');
  return data;
}

/**
 * Publish a draft circular.
 */
export async function publishCircular(id: string): Promise<Circular> {
  const { data } = await api.post<ApiResponse<Circular>>(`/circulars/${id}/publish`);
  if (!data.success) throw new Error(data.error ?? 'Failed to publish circular');
  return data.data;
}

/**
 * Archive a circular.
 */
export async function archiveCircular(id: string): Promise<Circular> {
  const { data } = await api.post<ApiResponse<Circular>>(`/circulars/${id}/archive`);
  if (!data.success) throw new Error(data.error ?? 'Failed to archive circular');
  return data.data;
}

/**
 * Acknowledge a circular as the current user.
 */
export async function acknowledgeCircular(id: string): Promise<void> {
  await api.post(`/circulars/${id}/acknowledge`);
}

/**
 * Fetch recipient list for a circular (HOD/admin view).
 */
export async function fetchCircularRecipients(
  id: string,
  page = 1,
  limit = 50
): Promise<PaginatedResponse<CircularRecipient>> {
  const { data } = await api.get(`/circulars/${id}/recipients`, {
    params: { page, limit },
  });
  return data;
}

/**
 * Fetch analytics for a circular.
 */
export async function fetchCircularAnalytics(id: string): Promise<CircularAnalytics> {
  const { data } = await api.get<ApiResponse<{ metrics: CircularAnalytics }>>(`/circulars/${id}/analytics`);
  return data.data?.metrics ?? { totalRecipients: 0, readCount: 0, acknowledgedCount: 0, unreadCount: 0, readPercentage: 0, acknowledgedPercentage: 0 };
}

/**
 * Send reminder to unread recipients.
 */
export async function remindCircularRecipients(id: string, message?: string): Promise<{ reminded: number }> {
  const { data } = await api.post<ApiResponse<{ reminded: number }>>(`/circulars/${id}/remind`, { message });
  return data.data;
}
