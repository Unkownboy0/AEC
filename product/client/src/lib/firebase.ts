import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported, Messaging } from 'firebase/messaging';

// CampusOS Firebase Web Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDNmzuZ2ghENWy2_8mtD8m5TE9qU_l-yoU",
  authDomain: "campusos-db831.firebaseapp.com",
  projectId: "campusos-db831",
  storageBucket: "campusos-db831.firebasestorage.app",
  messagingSenderId: "336442577619",
  appId: "1:336442577619:web:46b3ef7b10a1a6f495ba26",
  measurementId: "G-268XQS934Y"
};

// Initialize Firebase App
export const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Analytics
export const initFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window !== 'undefined' && await isAnalyticsSupported()) {
    return getAnalytics(firebaseApp);
  }
  return null;
};

// Initialize and get Firebase Web Messaging instance
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && await isMessagingSupported()) {
    return getMessaging(firebaseApp);
  }
  return null;
};

// Request Web FCM Token
export const requestWebFcmToken = async (vapidKey?: string): Promise<string | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);
    return token;
  } catch (err) {
    console.warn('[Firebase Web] Failed to obtain web FCM token:', err);
    return null;
  }
};

// Listen for foreground web messages
export const onForegroundWebMessage = async (callback: (payload: any) => void): Promise<(() => void) | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (err) {
    console.warn('[Firebase Web] onMessage setup failed:', err);
    return null;
  }
};
