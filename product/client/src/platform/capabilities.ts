import { Capacitor } from '@capacitor/core';
import type { DeviceCapabilities } from './platform.types';

export function getDeviceCapabilities(): DeviceCapabilities {
  const isNative = Capacitor.isNativePlatform();

  return {
    push: isNative || (typeof window !== 'undefined' && 'Notification' in window),
    camera: isNative || (typeof navigator !== 'undefined' && !!navigator.mediaDevices),
    qrScanner: isNative || (typeof navigator !== 'undefined' && !!navigator.mediaDevices),
    docScanner: isNative || (typeof navigator !== 'undefined' && !!navigator.mediaDevices),
    voiceNotes: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    biometricLock: isNative,
    location: typeof navigator !== 'undefined' && !!navigator.geolocation,
    transportDriverGps: typeof navigator !== 'undefined' && !!navigator.geolocation,
    haptics: isNative || (typeof navigator !== 'undefined' && 'vibrate' in navigator),
    nativeSharing: isNative || (typeof navigator !== 'undefined' && !!navigator.share),
    nativeDownloads: true,
    nativePrinting: typeof window !== 'undefined' && !!window.print,
    offlineCache: true,
    digitalSignature: true,
    calendarSync: true,
    nfc: isNative && typeof window !== 'undefined' && 'NDEFReader' in window,
    ble: isNative && typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    screenSecurity: true,
    filesystem: isNative,
  };
}

export function supportsCamera(): boolean {
  return getDeviceCapabilities().camera;
}

export function supportsPushNotifications(): boolean {
  return getDeviceCapabilities().push;
}

export function supportsFileSystem(): boolean {
  return getDeviceCapabilities().filesystem;
}

