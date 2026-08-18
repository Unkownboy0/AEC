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
  const isProduction = import.meta.env.VITE_APP_ENV === 'production';

  if (!API_BASE_URL) {
    return {
      isValid: false,
      message: 'Configuration Error: The mobile app could not connect to CampusOS services. API_BASE_URL is missing.',
      details: { apiUrl: '', socketUrl: SOCKET_URL, isNative, platform },
    };
  }

  // Production Build Guard: Production environment MUST use public HTTPS API URL
  const isLocalOrLan = /localhost|127\.0\.0\.1|10\.0\.2\.2|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/i.test(API_BASE_URL);
  const isPlainHttp = API_BASE_URL.startsWith('http://');

  if (isProduction && (isLocalOrLan || isPlainHttp)) {
    console.error('[Production API Build Guard] Invalid API_BASE_URL for production deployment:', API_BASE_URL);
    return {
      isValid: false,
      message: `Production Release Guard: CampusOS Production builds cannot use LAN IP or plain HTTP API URL (${API_BASE_URL}). Configure a valid public HTTPS endpoint in VITE_API_BASE_URL.`,
      details: { apiUrl: API_BASE_URL, socketUrl: SOCKET_URL, isNative, platform },
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
