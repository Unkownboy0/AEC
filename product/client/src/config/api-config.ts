import { Capacitor } from '@capacitor/core';
import { env } from '../shared/config/environment';

export const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return env.apiUrl;
})();

export const SOCKET_URL = (() => {
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (envSocketUrl && envSocketUrl.trim() !== '') {
    return envSocketUrl;
  }
  return env.socketUrl;
})();

export interface ApiConfigValidationResult {
  isValid: boolean;
  message?: string;
  details?: {
    apiUrl: string;
    socketUrl: string;
    isNative: boolean;
    platform: string;
  };
}

export function validateApiConfig(): ApiConfigValidationResult {
  const isNative = Capacitor.isNativePlatform();
  const platform = isNative ? Capacitor.getPlatform() : 'web';

  if (!API_BASE_URL) {
    return {
      isValid: false,
      message: 'Configuration Error: The mobile app could not connect to CampusOS services. API_BASE_URL is missing.',
      details: { apiUrl: '', socketUrl: SOCKET_URL, isNative, platform },
    };
  }

  // Prevent calling localhost on native devices without custom LAN IP
  if (isNative && API_BASE_URL.includes('localhost') && typeof window !== 'undefined') {
    const customLanIp = localStorage.getItem('campusos_api_lan_ip');
    if (!customLanIp) {
      console.warn('[API Config Warning] Native app is using localhost base URL. Ensure host loopback or LAN IP is configured.');
    }
  }

  return {
    isValid: true,
    details: {
      apiUrl: API_BASE_URL,
      socketUrl: SOCKET_URL,
      isNative,
      platform,
    },
  };
}
