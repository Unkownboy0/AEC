import { Capacitor } from '@capacitor/core';
import type { AppPlatform } from './platform.types';

export function getPlatformName(): AppPlatform {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() as AppPlatform;
  }
  return 'web';
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function isWebPlatform(): boolean {
  return !Capacitor.isNativePlatform();
}

export function isAndroidPlatform(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export function isIOSPlatform(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function isTabletViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

export function isDesktopViewport(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= 1024;
}
