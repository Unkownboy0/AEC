import { Capacitor } from '@capacitor/core';
import type { DeviceCapabilities } from './platform.types';

export function getDeviceCapabilities(): DeviceCapabilities {
  const isNative = Capacitor.isNativePlatform();

  return {
    camera: isNative || (typeof navigator !== 'undefined' && !!navigator.mediaDevices),
    pushNotifications: isNative || (typeof window !== 'undefined' && 'Notification' in window),
    filesystem: isNative,
    haptics: isNative || (typeof navigator !== 'undefined' && 'vibrate' in navigator),
    biometrics: isNative,
  };
}

export function supportsCamera(): boolean {
  return getDeviceCapabilities().camera;
}

export function supportsPushNotifications(): boolean {
  return getDeviceCapabilities().pushNotifications;
}

export function supportsFileSystem(): boolean {
  return getDeviceCapabilities().filesystem;
}
