import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface PickedFile {
  name: string;
  type: string;
  dataUrl?: string;
  blob?: Blob;
  file?: File;
}

export async function pickNativeImage(source: 'camera' | 'gallery' = 'gallery'): Promise<PickedFile | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      });

      if (image.dataUrl) {
        const format = image.format || 'jpeg';
        const name = `photo_${Date.now()}.${format}`;
        const mimeType = `image/${format}`;

        // Convert DataURL to Blob for Form Uploads
        const res = await fetch(image.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], name, { type: mimeType });

        return {
          name,
          type: mimeType,
          dataUrl: image.dataUrl,
          blob,
          file,
        };
      }
    } catch (err) {
      console.warn('[NativeFileHandler] Camera / Gallery pick cancelled or failed:', err);
      return null;
    }
  }

  // Web Fallback input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          type: file.type,
          dataUrl: reader.result as string,
          file,
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export async function downloadNativeFile(url: string, filename: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Fetch file arrayBuffer
      const response = await fetch(url);
      const blob = await response.blob();
      
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          try {
            const result = await Filesystem.writeFile({
              path: filename,
              data: base64data,
              directory: Directory.Documents,
            });
            console.log('[NativeFileHandler] Saved file to Documents:', result.uri);
            resolve(result.uri);
          } catch (writeErr) {
            console.error('[NativeFileHandler] Error saving file to Filesystem:', writeErr);
            reject(writeErr);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('[NativeFileHandler] Error downloading file on native device:', err);
      return null;
    }
  }

  // Browser download fallback
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return url;
}
