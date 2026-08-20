import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import api from '../lib/axios';

/*
  CAMPUSOS UNIVERSAL DOWNLOAD & FILE HANDLER SERVICE

  The single canonical way to download and open files from the API.
  - Authenticated via Axios bearer token
  - Detects and unwraps JSON error responses
  - Extracts Content-Disposition filenames
  - Modern Android content:// FileProvider stream sharing/opening via @capacitor/share
  - Clean web browser download fallback
*/

export interface DownloadOptions {
  resourceId?: string;
  endpoint?: string;
  filename?: string;
  mimeType?: string;
  action?: 'open' | 'save' | 'share';
  dialogTitle?: string;
}

export interface DownloadResult {
  success: boolean;
  uri?: string;
  error?: string;
}

export function sanitizeFilename(name?: string, defaultName = 'CampusOS_Document.pdf'): string {
  if (!name || name.trim() === '') return defaultName;
  // Remove invalid path characters and control characters
  let clean = name.trim().replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  if (!clean.startsWith('CampusOS_') && !clean.startsWith('campusos_')) {
    clean = `CampusOS_${clean}`;
  }
  return clean;
}

export function guessMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.ics')) return 'text/calendar';
  if (lower.endsWith('.zip')) return 'application/zip';
  return 'application/octet-stream';
}

export async function blobToBase64(blob: Blob): Promise<string> {
  if (blob.size < 5 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Universal Mobile + Web Download Service.
 * Fetches endpoint (authenticated), checks for error JSON bodies, writes bytes to native storage,
 * and launches the Android/iOS system sheet or saves persistently.
 */
export async function downloadFile(options: DownloadOptions | string, fallbackFilename?: string): Promise<DownloadResult> {
  const opts: DownloadOptions = typeof options === 'string' ? { endpoint: options, filename: fallbackFilename } : options;
  let endpoint = opts.endpoint || (opts.resourceId ? `/files/${opts.resourceId}/download` : '');

  if (!endpoint) {
    return { success: false, error: 'No download endpoint specified.' };
  }

  // Prevent double /api/ prefixing if endpoint was passed with /api/
  if (endpoint.startsWith('/api/')) {
    endpoint = endpoint.slice(4);
  }

  let blob: Blob;
  let serverFilename = opts.filename;

  try {
    const res = await api.get(endpoint, {
      responseType: 'blob',
    });

    const contentType = String(res.headers?.['content-type'] || '').toLowerCase();
    if (contentType.includes('application/json')) {
      try {
        const text = await (res.data as Blob).text();
        const json = JSON.parse(text);
        return { success: false, error: json.message || 'The requested file could not be found.' };
      } catch (_) {
        return { success: false, error: 'Failed to download file from server.' };
      }
    }

    const disposition = String(res.headers?.['content-disposition'] || '');
    if (disposition && !serverFilename) {
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const standardMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (utf8Match && utf8Match[1]) {
        serverFilename = decodeURIComponent(utf8Match[1]);
      } else if (standardMatch && standardMatch[1]) {
        serverFilename = standardMatch[1];
      }
    }

    blob = res.data;
  } catch (err: any) {
    if (err?.response?.data instanceof Blob && err.response.data.type?.includes('json')) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        return { success: false, error: json.message || 'Unable to download file.' };
      } catch (_) {}
    }
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || 'Unable to reach CampusOS server to download document.',
    };
  }

  const finalFilename = sanitizeFilename(serverFilename || opts.filename || 'CampusOS_Document.pdf');
  const mimeType = opts.mimeType || guessMimeType(finalFilename);

  return saveBlobAndOpen(blob, finalFilename, mimeType, opts.dialogTitle, opts.action || 'open');
}

/** Legacy alias for backward compatibility */
export async function downloadAndOpen(url: string, filename: string): Promise<DownloadResult> {
  return downloadFile({ endpoint: url, filename, action: 'open' });
}

/** Save Blob to storage, supporting persistent device save vs temporary cache open */
export async function saveBlobAndOpen(
  blob: Blob,
  filename: string,
  mimeType?: string,
  dialogTitle?: string,
  action: 'open' | 'save' | 'share' = 'open'
): Promise<DownloadResult> {
  if (!blob || blob.size === 0) {
    return { success: false, error: 'The document file is empty.' };
  }

  const safeFilename = sanitizeFilename(filename);
  const resolvedMime = mimeType || guessMimeType(safeFilename);

  // 1. Web Browser Fallback
  if (!Capacitor.isNativePlatform()) {
    try {
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = safeFilename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Unable to start browser download.' };
    }
  }

  // 2. Mobile Native (Android / iOS)
  try {
    const base64Data = await blobToBase64(blob);
    const targetDirectory = action === 'save' ? Directory.Documents : Directory.Cache;

    let writeResult;
    try {
      writeResult = await Filesystem.writeFile({
        path: safeFilename,
        data: base64Data,
        directory: targetDirectory,
        recursive: true,
      });
    } catch (dirErr) {
      // Fallback to Directory.Cache if Directory.Documents write fails
      writeResult = await Filesystem.writeFile({
        path: safeFilename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });
    }

    const fileUri = writeResult.uri;

    if (action === 'save') {
      return { success: true, uri: fileUri };
    }

    // For 'open' or 'share', trigger native Share/Open Intent via FileProvider
    try {
      const capability = await Share.canShare();
      if (!capability.value) {
        return { success: false, uri: fileUri, error: 'No compatible app is available to open or share this file.' };
      }
      await Share.share({
        title: safeFilename,
        dialogTitle: dialogTitle || `Open or Share ${safeFilename}`,
        files: [fileUri],
      });
    } catch (shareErr: any) {
      return {
        success: false,
        uri: fileUri,
        error: shareErr?.message || 'The device could not open the native share sheet.',
      };
    }

    return { success: true, uri: fileUri };
  } catch (err: any) {
    console.error('[Download] Native save/open error:', err);
    return { success: false, error: 'Unable to save or open document on this device.' };
  }
}
