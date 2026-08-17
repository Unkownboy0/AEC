/// <reference types="node" />
import { CapacitorConfig } from '@capacitor/cli';

/**
 * CampusOS Capacitor Configuration
 *
 * App identity values are read from environment variables so that the same
 * codebase can be deployed for any institution (white-label builds).
 *
 * Per-institution override during CI:
 *   VITE_APP_ID=com.acmecollege.campusos
 *   VITE_APP_DISPLAY_NAME="ACME College CampusOS"
 *   CAPACITOR_DEV_SERVER_URL=https://dev.acmecollege.ac.in
 *
 * androidScheme / Mixed Content explanation:
 *   When androidScheme='https', the Capacitor WebView origin is https://localhost.
 *   Any API call to an http:// LAN server is then treated as Mixed Content and
 *   blocked by Android's WebView. For LAN development the scheme MUST be 'http'
 *   so the WebView origin is http://localhost and http:// API calls are same-scheme.
 *   Production builds: set CAPACITOR_ANDROID_SCHEME=https AND use an HTTPS API endpoint.
 */
const developmentServerUrl = process.env.CAPACITOR_DEV_SERVER_URL?.trim();

// Production: CAPACITOR_ANDROID_SCHEME must be 'https' (and VITE_SERVER_BASE_URL must be https://)
const androidScheme = process.env.CAPACITOR_ANDROID_SCHEME === 'http' ? 'http' : 'https';

// Read institution-specific overrides from environment; fall back to generic CampusOS defaults
const appId = process.env.VITE_APP_ID?.trim() || 'com.campusos.app';
const appName = process.env.VITE_APP_DISPLAY_NAME?.trim() || 'CampusOS';
const brandColor = process.env.VITE_BRAND_COLOR?.trim() || '#020617';
const accentColor = process.env.VITE_ACCENT_COLOR?.trim() || '#4F46E5';

const config: CapacitorConfig = {
  appId,
  appName,
  webDir: 'dist',
  server: developmentServerUrl
    ? {
        url: developmentServerUrl,
        androidScheme: developmentServerUrl.startsWith('https:') ? 'https' : 'http',
        cleartext: true,
      }
    : {
        androidScheme,
        cleartext: true,
        // Production: hostname is optional but helps with deep link handling
        ...(process.env.VITE_API_BASE_URL ? { hostname: new URL(process.env.VITE_API_BASE_URL).hostname } : {}),
      },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: brandColor,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
      // iOS-specific: fade out the splash screen
      iosSpinnerStyle: 'small',
    },
    // Modern system bar API (Capacitor >=8.3). Handles true edge-to-edge insets on
    // Android 15/16, where the legacy StatusBar plugin's overlaysWebView/backgroundColor
    // options are no-ops. insetsHandling: 'css' injects reliable --safe-area-inset-*
    // CSS variables into the WebView (works around the Android WebView <140 env() bug).
    SystemBars: {
      style: 'DARK',
      insetsHandling: 'css',
    },
    // Legacy plugin kept only for backward compatibility with old WebViews / iOS status
    // bar style calls elsewhere. On Android 15+/16 its overlaysWebView/backgroundColor
    // options are ignored by the OS — do not rely on them for layout. See ThemeContext.tsx.
    StatusBar: {
      style: 'DARK',
      backgroundColor: brandColor,
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: accentColor,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    App: {
      // Allow deep links from institution domain
      appUrlOpen: true,
    },
  },
};

export default config;
