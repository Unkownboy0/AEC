import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import type { CameraPickOptions, CameraPickResult } from './platform.types';

export async function pickPhoto(options?: CameraPickOptions): Promise<CameraPickResult | null> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback - input element trigger
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return resolve(null);
        const url = URL.createObjectURL(file);
        resolve({
          webPath: url,
          format: file.type.split('/')[1] || 'jpeg',
        });
      };
      input.click();
    });
  }

  try {
    const photo = await Camera.getPhoto({
      quality: options?.quality || 85,
      allowEditing: options?.allowEditing ?? false,
      resultType: CameraResultType.Uri,
      source: options?.source === 'PHOTOS' ? CameraSource.Photos : CameraSource.Camera,
    });

    return {
      path: photo.path,
      webPath: photo.webPath,
      format: photo.format,
    };
  } catch (err) {
    console.warn('[Platform] Camera pick cancelled or error:', err);
    return null;
  }
}
