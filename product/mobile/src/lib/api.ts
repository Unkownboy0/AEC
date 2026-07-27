import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { clearSession, readSession, updateTokens } from './session';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { accessToken } = await readSession();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const { refreshToken } = await readSession();
    if (!refreshToken) {
      await clearSession();
      return Promise.reject(error);
    }

    refreshPromise ??= api
      .post('/auth/refresh', { refreshToken })
      .then(async (response) => {
        const next = response.data?.data;
        if (!next?.accessToken) throw new Error('Refresh response did not include an access token');
        await updateTokens(next.accessToken, next.refreshToken);
        return next.accessToken as string;
      })
      .catch(async (refreshError) => {
        await clearSession();
        throw refreshError;
      })
      .finally(() => {
        refreshPromise = null;
      });

    try {
      const accessToken = await refreshPromise;
      if (accessToken) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      }
    } catch {
      // The caller receives the original request failure and can return to sign-in.
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || (error as Error)?.message || fallback;
}