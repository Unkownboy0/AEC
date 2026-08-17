export type AppPlatform = 'web' | 'android' | 'ios';

export type PermissionState = 
  | 'NOT_REQUESTED'
  | 'GRANTED'
  | 'DENIED'
  | 'PERMANENTLY_DENIED'
  | 'UNAVAILABLE'
  | 'DISABLED_BY_SUPER_ADMIN';

export type DeviceCapabilityKey =
  | 'push'
  | 'camera'
  | 'qrScanner'
  | 'docScanner'
  | 'voiceNotes'
  | 'biometricLock'
  | 'location'
  | 'transportDriverGps'
  | 'haptics'
  | 'nativeSharing'
  | 'nativeDownloads'
  | 'nativePrinting'
  | 'offlineCache'
  | 'digitalSignature'
  | 'calendarSync'
  | 'nfc'
  | 'ble'
  | 'screenSecurity';

export interface DeviceCapabilities {
  push: boolean;
  camera: boolean;
  qrScanner: boolean;
  docScanner: boolean;
  voiceNotes: boolean;
  biometricLock: boolean;
  location: boolean;
  transportDriverGps: boolean;
  haptics: boolean;
  nativeSharing: boolean;
  nativeDownloads: boolean;
  nativePrinting: boolean;
  offlineCache: boolean;
  digitalSignature: boolean;
  calendarSync: boolean;
  nfc: boolean;
  ble: boolean;
  screenSecurity: boolean;
  filesystem: boolean;
}

export interface NetworkStatusInfo {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export interface CameraPickOptions {
  source?: 'CAMERA' | 'PHOTOS';
  quality?: number;
  allowEditing?: boolean;
}

export interface CameraPickResult {
  path?: string;
  webPath?: string;
  format: string;
  base64?: string;
}

export interface NativeFileSaveOptions {
  filename: string;
  data: string | Blob | ArrayBuffer;
  directory?: 'DOCUMENTS' | 'DATA' | 'CACHE';
  mimeType?: string;
}

export interface QrScanResult {
  token: string;
  format?: string;
  scannedAt: string;
}

export interface VoiceRecordingResult {
  blob: Blob;
  durationMs: number;
  url: string;
  mimeType: string;
}

export interface SignatureCaptureResult {
  dataUrl: string;
  sha256Hash: string;
  signedAt: string;
}

export interface CalendarEventPayload {
  title: string;
  description?: string;
  location?: string;
  startTime: Date | string;
  endTime: Date | string;
  allDay?: boolean;
}

export interface DriverGpsLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

