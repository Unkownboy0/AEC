import { API_BASE_URL, SOCKET_URL, validateApiConfig } from './api-config';

export interface RuntimeConfig {
  apiUrl: string;
  socketUrl: string;
  environment: string;
  appName: string;
  enableDemoMode: boolean;
}

export const runtimeConfig: RuntimeConfig = {
  apiUrl: API_BASE_URL,
  socketUrl: SOCKET_URL,
  environment: import.meta.env.VITE_APP_ENV || 'production',
  appName: import.meta.env.VITE_APP_NAME || 'GEETORUS CAMPUSOS',
  enableDemoMode: import.meta.env.VITE_ENABLE_DEMO_MODE === 'true',
};

export function validateRuntimeConfig() {
  return validateApiConfig();
}

export default runtimeConfig;
