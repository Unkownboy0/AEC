import { AxiosResponse } from 'axios';
import { ApiResponse } from './api-types';

export function normalizeApiResponse<T = any>(response: AxiosResponse<ApiResponse<T>>): T {
  const data = response.data;
  if (!data) {
    return response.data as any;
  }
  
  if (data.status === 'success' && data.data !== undefined) {
    return data.data;
  }
  
  return data as any;
}
