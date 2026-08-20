import { Capacitor } from '@capacitor/core';

export interface EnvironmentConfig {
  appName: string;
  appEnv: 'development' | 'staging' | 'production';
  apiUrl: string;
  socketUrl: string;
  vapidKey: string;
  isNative: boolean;
  platform: 'web' | 'android' | 'ios';
  deploymentMode: 'INTERNET_PRODUCTION' | 'LOCAL_ON_PREM';
}

function resolveApiBaseUrl(): string {
  const appEnv = (import.meta.env.VITE_APP_ENV || 'production').toLowerCase();

  // 1. Native Capacitor resolution: custom LAN IP explicitly set by user on device
  if (appEnv !== 'production' && Capacitor.isNativePlatform() && typeof window !== 'undefined') {
    const customLanIp = localStorage.getItem('campusos_api_lan_ip');
    if (customLanIp && customLanIp.trim() !== '') {
      const cleaned = customLanIp.trim();
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
      }
      return `http://${cleaned}:5000/api`;
    }
  }

  // 2. Canonical environment variable override
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== 'undefined' && envUrl !== '') {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // Production native builds fail closed when no API endpoint is configured.
  if (Capacitor.isNativePlatform()) {
    return '';
  }

  // 3. Browser development/production fallback
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    
    // In dev server proxy mode (port 5173 / 3000), relative '/api' works cleanly
    if (port === '5173' || port === '3000' || port === '4173') {
      return '/api';
    }

    // Same-origin production or LAN testing
    if (port && port !== '80' && port !== '443') {
      return `${protocol}//${hostname}:5000/api`;
    }

    return `${protocol}//${hostname}/api`;
  }

  return '/api';
}

function resolveSocketUrl(apiUrl: string): string {
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (envSocketUrl && envSocketUrl !== 'undefined' && envSocketUrl !== '') {
    return envSocketUrl;
  }

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    // Strip trailing /api
    const origin = apiUrl.replace(/\/api\/?$/, '');
    return origin;
  }

  if (typeof window !== 'undefined' && window.location) {
    const { protocol, host } = window.location;
    const wsProtocol = protocol === 'https:' ? 'https:' : 'http:';
    return `${wsProtocol}//${host}`;
  }

  return '';
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const apiUrl = resolveApiBaseUrl();
  const socketUrl = resolveSocketUrl(apiUrl);
  const appName = import.meta.env.VITE_APP_NAME || 'CampusOS';
  const appEnv = (import.meta.env.VITE_APP_ENV || 'production') as EnvironmentConfig['appEnv'];
  const deploymentMode = (import.meta.env.VITE_DEPLOYMENT_MODE || 'INTERNET_PRODUCTION') as EnvironmentConfig['deploymentMode'];
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
  
  const isNative = Capacitor.isNativePlatform();
  const platform = isNative ? (Capacitor.getPlatform() as 'android' | 'ios') : 'web';

  return {
    appName,
    appEnv,
    apiUrl,
    socketUrl,
    vapidKey,
    isNative,
    platform,
    deploymentMode,
  };
}

export const env = getEnvironmentConfig();
