import { Capacitor } from '@capacitor/core';
import api from '../lib/axios';
import type { DeviceCapabilityKey, PermissionState, DeviceCapabilities } from './platform.types';

class DeviceCapabilitiesManager {
  private policyCache: Partial<Record<DeviceCapabilityKey, boolean>> | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 60_000; // 1 minute

  /**
   * Loads the effective capability policy from the backend.
   * Returns fallback defaults if offline or unauthenticated.
   */
  public async loadEffectivePolicy(forceRefresh = false): Promise<Record<string, boolean>> {
    const now = Date.now();
    if (!forceRefresh && this.policyCache && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.policyCache as Record<string, boolean>;
    }

    try {
      const res = await api.get('/settings/device-capabilities');
      if (res.data?.data?.effectivePolicy) {
        this.policyCache = res.data.data.effectivePolicy;
        this.lastFetchTime = now;
        return this.policyCache as Record<string, boolean>;
      }
    } catch {
      // Fallback: If offline or unauthorized, use permissive defaults for local hardware
    }

    // Default local hardware capabilities if server unreachable
    const isNative = Capacitor.isNativePlatform();
    const defaults: Record<string, boolean> = {
      push: true,
      camera: true,
      qrScanner: true,
      docScanner: true,
      voiceNotes: true,
      biometricLock: isNative,
      location: false,
      transportDriverGps: true,
      haptics: true,
      nativeSharing: true,
      nativeDownloads: true,
      nativePrinting: true,
      offlineCache: true,
      digitalSignature: true,
      calendarSync: true,
      nfc: false,
      ble: false,
      screenSecurity: true,
      filesystem: isNative,
    };
    this.policyCache = defaults;
    return defaults;
  }

  /**
   * Synchronously checks if a capability is currently permitted (or defaults true).
   */
  public isCapabilityPermitted(key: DeviceCapabilityKey): boolean {
    if (this.policyCache && typeof this.policyCache[key] === 'boolean') {
      return this.policyCache[key]!;
    }
    return true; // Default permitted until policy loaded
  }

  /**
   * Contextually checks & requests Camera permission at the exact moment of use.
   */
  public async requestCameraPermission(): Promise<PermissionState> {
    if (!this.isCapabilityPermitted('camera') && !this.isCapabilityPermitted('qrScanner')) {
      return 'DISABLED_BY_SUPER_ADMIN';
    }

    if (!Capacitor.isNativePlatform()) {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return 'UNAVAILABLE';
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        return 'GRANTED';
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          return 'DENIED';
        }
        return 'UNAVAILABLE';
      }
    }

    try {
      const { Camera } = await import('@capacitor/camera');
      const status = await Camera.checkPermissions();
      if (status.camera === 'granted') return 'GRANTED';
      if (status.camera === 'denied') return 'PERMANENTLY_DENIED';

      const requested = await Camera.requestPermissions({ permissions: ['camera'] });
      if (requested.camera === 'granted') return 'GRANTED';
      if (requested.camera === 'denied') return 'DENIED';
      return 'DENIED';
    } catch {
      return 'UNAVAILABLE';
    }
  }

  /**
   * Contextually checks & requests Microphone permission for Voice Notes.
   */
  public async requestMicrophonePermission(): Promise<PermissionState> {
    if (!this.isCapabilityPermitted('voiceNotes')) {
      return 'DISABLED_BY_SUPER_ADMIN';
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return 'UNAVAILABLE';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return 'GRANTED';
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'DENIED';
      }
      return 'UNAVAILABLE';
    }
  }

  /**
   * Contextually checks & requests Location permission (for Authorized Drivers / Transport only).
   */
  public async requestLocationPermission(): Promise<PermissionState> {
    if (!this.isCapabilityPermitted('transportDriverGps') && !this.isCapabilityPermitted('location')) {
      return 'DISABLED_BY_SUPER_ADMIN';
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return 'UNAVAILABLE';
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('GRANTED'),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            resolve('DENIED');
          } else {
            resolve('UNAVAILABLE');
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  /**
   * Opens Android Application Settings if a permission is permanently denied.
   */
  public openAppSettingsGuide(featureName: string, requiredPermission: string): void {
    const message = `CampusOS needs ${requiredPermission} permission for ${featureName}.\n\nPlease enable it in Android Settings → Apps → CampusOS → Permissions.`;
    alert(message);
  }
}

export const deviceCapabilities = new DeviceCapabilitiesManager();
