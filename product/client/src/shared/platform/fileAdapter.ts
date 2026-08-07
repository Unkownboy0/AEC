import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface SaveFileOptions {
  fileName: string;
  blob: Blob;
  mimeType: string;
  dialogTitle?: string;
}

export class UniversalFileAdapter {
  /**
   * Save or open a file universally across Web browser and Capacitor mobile.
   */
  public async saveAndOpenFile(options: SaveFileOptions): Promise<boolean> {
    const { fileName, blob, mimeType, dialogTitle = 'Open Attachment' } = options;

    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await this.blobToBase64(blob);

        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        if (result.uri && typeof navigator !== 'undefined' && (navigator as any).share) {
          try {
            await (navigator as any).share({
              title: fileName,
              text: dialogTitle,
              url: result.uri,
            });
          } catch {}
        }
        return true;
      } catch (err) {
        console.warn('[FileAdapter] Native file save failed:', err);
        return false;
      }
    }

    // Web Browser fallback: Programmatic Blob URL download
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return true;
    } catch (err) {
      console.warn('[FileAdapter] Web file download failed:', err);
      return false;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:mime/type;base64, prefix
          const base64 = reader.result.split(',')[1] || reader.result;
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.readAsDataURL(blob);
    });
  }
}

export const fileAdapter = new UniversalFileAdapter();
