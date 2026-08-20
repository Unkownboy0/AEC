import { Capacitor } from '@capacitor/core';
import { env } from '../shared/config/environment';
import { validateApiUrlForDeployment, validateProductionApiUrl, type DeploymentMode } from './api-url-policy';
export { validateOnPremApiUrl, validateProductionApiUrl } from './api-url-policy';

export const API_BASE_URL = (() => {
  const isProduction = (import.meta.env.VITE_APP_ENV || 'production') === 'production';
  if (!isProduction && Capacitor.isNativePlatform() && typeof window !== 'undefined') {
    const customLanIp = localStorage.getItem('campusos_api_lan_ip');
    if (customLanIp && customLanIp.trim() !== '') {
      const cleaned = customLanIp.trim();
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
      }
      return `http://${cleaned}:5000/api`;
    }
  }

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
  const deploymentMode = (import.meta.env.VITE_DEPLOYMENT_MODE || 'INTERNET_PRODUCTION') as DeploymentMode;

  if (!API_BASE_URL) {
    return {
      isValid: false,
      message: 'Configuration Error: The mobile app could not connect to CampusOS services. API_BASE_URL is missing.',
      details: { apiUrl: '', socketUrl: SOCKET_URL, isNative, platform },
    };
  }

  // Production Build Guard: Production environment MUST use public HTTPS API URL
  if (isProduction && !validateApiUrlForDeployment(API_BASE_URL, deploymentMode)) {
    console.error('[Production API Build Guard] Invalid API_BASE_URL for production deployment:', API_BASE_URL);
    return {
      isValid: false,
      message: deploymentMode === 'LOCAL_ON_PREM'
        ? 'Local on-premise configuration requires an explicit private-LAN IPv4 API endpoint ending in /api.'
        : 'Internet production requires an explicit public HTTPS API endpoint ending in /api.',
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
