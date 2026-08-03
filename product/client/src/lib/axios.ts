import axios, { AxiosError } from 'axios';

const rawServerUrl = import.meta.env.VITE_SERVER_BASE_URL;
const serverBaseUrl = (rawServerUrl && rawServerUrl !== 'undefined') ? rawServerUrl : '';

const api = axios.create({
  baseURL: `${serverBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('geetorus_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeRole = localStorage.getItem('geetorus_active_role');
    if (activeRole && config.headers) {
      config.headers['X-Active-Role'] = activeRole;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const status = error.response?.status;
    const data = error.response?.data as any;

    // If 401 Unauthorized and request has not been retried
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('geetorus_refresh_token');

      if (refreshToken) {
        try {
          // Perform silent refresh
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          
          if (response.data?.status === 'success') {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            localStorage.setItem('geetorus_access_token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('geetorus_refresh_token', newRefreshToken);
            }
            
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            processQueue(null, accessToken);
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          
          // Clear session on refresh failure
          localStorage.removeItem('geetorus_access_token');
          localStorage.removeItem('geetorus_refresh_token');
          
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?session_expired=true';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available, force logout
        localStorage.removeItem('geetorus_access_token');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Extract message
    const message = data?.message || error.message || 'An unexpected error occurred';
    
    const customError = {
      message,
      status: status || 500,
      errors: data?.errors || null,
      originalError: error,
    };

    return Promise.reject(customError);
  }
);

export { api };
export default api;

