import { AxiosError } from 'axios';
import { ApiErrorCode, NormalizedApiError } from './api-types';

export function normalizeApiError(error: any): NormalizedApiError {
  if (!error) {
    return {
      code: 'SERVER_ERROR',
      message: 'An unknown error occurred.',
      status: 500,
    };
  }

  // Already normalized error
  if (error.code && error.status && typeof error.message === 'string' && !error.isAxiosError) {
    return error as NormalizedApiError;
  }

  const axiosErr = error as AxiosError;
  const status = axiosErr.response?.status || 500;
  const data = axiosErr.response?.data as any;

  let code: ApiErrorCode = 'SERVER_ERROR';

  if (!axiosErr.response) {
    code = typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'NETWORK_ERROR';
  } else if (status === 401) {
    code = 'UNAUTHORIZED';
  } else if (status === 403) {
    code = 'FORBIDDEN';
  } else if (status === 404) {
    code = 'NOT_FOUND';
  } else if (status === 422 || status === 400) {
    code = 'VALIDATION_ERROR';
  } else if (axiosErr.code === 'ECONNABORTED') {
    code = 'TIMEOUT';
  }

  const userFacingMessage =
    data?.message ||
    (code === 'OFFLINE'
      ? 'You are offline. Please check your network connection.'
      : code === 'NETWORK_ERROR'
      ? 'Unable to connect to CampusOS services. Please verify network access.'
      : code === 'UNAUTHORIZED'
      ? 'Your session has expired. Please sign in again.'
      : code === 'FORBIDDEN'
      ? 'You do not have permission to perform this action.'
      : axiosErr.message || 'CampusOS encountered an error processing your request.');

  return {
    code,
    message: userFacingMessage,
    status,
    errors: data?.errors || null,
    originalError: error,
  };
}
