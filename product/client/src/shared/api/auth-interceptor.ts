import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getStoredAccessToken, getStoredRefreshToken, setStoredTokens, clearStoredTokens } from '../../auth/token-storage';
import { API_BASE_URL } from '../../config/api-config';
import axios from 'axios';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function setupAuthInterceptors(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getStoredAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;
      const status = error.response?.status;

      // SECURITY: scrub Authorization from config before any further logging/propagation
      if (originalRequest?.headers?.Authorization) {
        originalRequest.headers.Authorization = '[REDACTED]';
      }

      if (status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = await getStoredRefreshToken();

        if (refreshToken) {
          try {
            const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            if (refreshRes.data?.status === 'success' && refreshRes.data.data) {
              const { accessToken, refreshToken: newRefreshToken } = refreshRes.data.data;
              await setStoredTokens(accessToken, newRefreshToken || refreshToken);

              axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }

              processQueue(null, accessToken);
              return axiosInstance(originalRequest);
            }
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            await clearStoredTokens();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
              window.dispatchEvent(new CustomEvent('campusos_auth_expired'));
            }
            return Promise.reject(refreshErr);
          } finally {
            isRefreshing = false;
          }
        } else {
          await clearStoredTokens();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.dispatchEvent(new CustomEvent('campusos_auth_expired'));
          }
        }
      }

      return Promise.reject(error);
    }
  );
}
