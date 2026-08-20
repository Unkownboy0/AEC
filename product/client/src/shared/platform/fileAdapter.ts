import { saveBlobAndOpen } from '../../platform/download';

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
    const result = await saveBlobAndOpen(blob, fileName, mimeType, dialogTitle, 'open');
    return result.success;
  }
}

export const fileAdapter = new UniversalFileAdapter();
