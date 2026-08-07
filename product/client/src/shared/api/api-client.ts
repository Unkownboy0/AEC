import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../../config/api-config';
import { setupAuthInterceptors } from './auth-interceptor';
import { normalizeApiError } from './api-errors';
import { normalizeApiResponse } from './response-normalizer';
import { ApiResponse } from './api-types';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

setupAuthInterceptors(apiClient);

export async function apiGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.get<ApiResponse<T>>(url, config);
    return normalizeApiResponse<T>(res);
  } catch (err) {
    throw normalizeApiError(err);
  }
}

export async function apiPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.post<ApiResponse<T>>(url, data, config);
    return normalizeApiResponse<T>(res);
  } catch (err) {
    throw normalizeApiError(err);
  }
}

export async function apiPut<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.put<ApiResponse<T>>(url, data, config);
    return normalizeApiResponse<T>(res);
  } catch (err) {
    throw normalizeApiError(err);
  }
}

export async function apiPatch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return normalizeApiResponse<T>(res);
  } catch (err) {
    throw normalizeApiError(err);
  }
}

export async function apiDelete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.delete<ApiResponse<T>>(url, config);
    return normalizeApiResponse<T>(res);
  } catch (err) {
    throw normalizeApiError(err);
  }
}

export default apiClient;
