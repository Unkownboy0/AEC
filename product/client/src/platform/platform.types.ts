export type AppPlatform = 'web' | 'android' | 'ios';

export interface DeviceCapabilities {
  camera: boolean;
  pushNotifications: boolean;
  filesystem: boolean;
  haptics: boolean;
  biometrics: boolean;
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
