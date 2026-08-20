import type { ApiErrorCode } from '../api/api-types';

export interface AppErrorView {
  code: ApiErrorCode;
  title: string;
  message: string;
  status?: number;
  requestId?: string;
  canRetry: boolean;
}

export function classifyAppError(error: any, context = 'content'): AppErrorView {
  const status = Number(error?.status || error?.response?.status || 0);
  const data = error?.response?.data || error?.originalError?.response?.data || {};
  const requestId = data?.requestId || error?.response?.headers?.['x-request-id'];
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const code: ApiErrorCode = data?.code === 'MODULE_DISABLED' ? 'MODULE_DISABLED'
    : offline ? 'OFFLINE'
    : !error?.response && !status ? 'NETWORK_ERROR'
    : status === 401 ? 'UNAUTHORIZED'
    : status === 403 ? 'FORBIDDEN'
    : status === 404 ? 'NOT_FOUND'
    : status >= 500 ? 'SERVER_ERROR'
    : (error?.code as ApiErrorCode) || 'SERVER_ERROR';

  const views: Record<ApiErrorCode, Omit<AppErrorView, 'code' | 'status' | 'requestId'>> = {
    OFFLINE: { title: 'You are offline', message: `Reconnect to load ${context}.`, canRetry: true },
    NETWORK_ERROR: { title: 'CampusOS is unreachable', message: 'Check your connection and server address, then retry.', canRetry: true },
    TIMEOUT: { title: 'Request timed out', message: `CampusOS took too long to load ${context}.`, canRetry: true },
    UNAUTHORIZED: { title: 'Session expired', message: 'Sign in again to continue.', canRetry: false },
    FORBIDDEN: { title: 'Access restricted', message: `Your active workspace is not authorized to view ${context}.`, canRetry: false },
    NOT_FOUND: { title: 'Content not found', message: `The requested ${context} may have moved or been removed.`, canRetry: true },
    MODULE_DISABLED: { title: 'Module unavailable', message: data?.message || 'This module is disabled by your institution administrator.', canRetry: true },
    CONFIG_ERROR: { title: 'Configuration required', message: 'The CampusOS service address is not configured correctly.', canRetry: false },
    VALIDATION_ERROR: { title: 'Request needs attention', message: data?.message || error?.message || 'Review the supplied values and try again.', canRetry: false },
    SERVER_ERROR: { title: 'CampusOS service error', message: data?.message || 'The service could not complete this request. Retry in a moment.', canRetry: true },
  };
  return { code, status, requestId, ...views[code] };
}
