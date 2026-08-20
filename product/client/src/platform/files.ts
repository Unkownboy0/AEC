import type { NativeFileSaveOptions } from './platform.types';
import { saveBlobAndOpen } from './download';

export async function saveNativeFile(options: NativeFileSaveOptions): Promise<string> {
  const blob = options.data instanceof Blob
    ? options.data
    : new Blob([options.data], { type: options.mimeType || 'application/octet-stream' });
  const result = await saveBlobAndOpen(blob, options.filename, options.mimeType, undefined, 'save');
  if (!result.success) throw new Error(result.error || 'Unable to save file');
  return result.uri || '';
}
