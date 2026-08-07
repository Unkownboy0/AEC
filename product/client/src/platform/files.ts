import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import type { NativeFileSaveOptions } from './platform.types';

export async function saveNativeFile(options: NativeFileSaveOptions): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback - Blob download link
    const blob =
      options.data instanceof Blob
        ? options.data
        : new Blob([options.data], { type: options.mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.filename;
    a.click();
    URL.revokeObjectURL(url);
    return url;
  }

  let base64Data = '';
  if (typeof options.data === 'string') {
    base64Data = options.data;
  } else if (options.data instanceof ArrayBuffer) {
    const bytes = new Uint8Array(options.data);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64Data = btoa(binary);
  }

  const result = await Filesystem.writeFile({
    path: options.filename,
    data: base64Data,
    directory: Directory.Documents,
  });

  return result.uri;
}
