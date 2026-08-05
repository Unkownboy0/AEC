export interface ApiErrorResponse {
  message: string;
  status: number;
  errors?: Record<string, string[]> | null;
  originalError?: any;
}

export function formatErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.response?.data?.message) return error.response.data.message;
  return 'Connection issue. Please check your network and try again.';
}
