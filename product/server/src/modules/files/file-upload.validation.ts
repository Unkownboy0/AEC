import path from 'path';
import { BadRequestException } from '../../utils/exceptions';

export const COMMON_UPLOAD_MIME_TYPES = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/zip', 'application/x-zip-compressed',
  'text/csv', 'text/plain',
]);

export const COMMON_UPLOAD_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.xlsx', '.docx', '.pptx', '.xls', '.zip', '.csv', '.txt',
]);

const EXTENSION_MIME: Record<string, Set<string>> = {
  '.pdf': new Set(['application/pdf']),
  '.png': new Set(['image/png']),
  '.jpg': new Set(['image/jpeg']),
  '.jpeg': new Set(['image/jpeg']),
  '.webp': new Set(['image/webp']),
  '.xlsx': new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  '.docx': new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  '.pptx': new Set(['application/vnd.openxmlformats-officedocument.presentationml.presentation']),
  '.xls': new Set(['application/vnd.ms-excel']),
  '.zip': new Set(['application/zip', 'application/x-zip-compressed']),
  '.csv': new Set(['text/csv', 'text/plain']),
  '.txt': new Set(['text/plain']),
};

function hasPrefix(buffer: Buffer, bytes: number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

export function hasMatchingFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
  if (mimeType === 'image/png') return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimeType === 'image/webp') return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mimeType === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (mimeType === 'application/vnd.ms-excel') return hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (mimeType.includes('openxmlformats') || mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') {
    return hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04]) || hasPrefix(buffer, [0x50, 0x4b, 0x05, 0x06]) || hasPrefix(buffer, [0x50, 0x4b, 0x07, 0x08]);
  }
  if (mimeType === 'text/plain' || mimeType === 'text/csv') return !buffer.includes(0);
  return false;
}

function decodeBase64Strict(base64: string): Buffer {
  const clean = String(base64 || '').replace(/\s/g, '');
  if (!clean || clean.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) {
    throw new BadRequestException('The uploaded file payload is not valid base64 data');
  }
  const buffer = Buffer.from(clean, 'base64');
  if (!buffer.length || buffer.toString('base64').replace(/=+$/, '') !== clean.replace(/=+$/, '')) {
    throw new BadRequestException('The uploaded file payload is corrupt');
  }
  return buffer;
}

export function validateCommonUpload(input: {
  name: string;
  mimeType: string;
  base64: string;
  maximumBytes: number;
  allowedMimeTypes?: Set<string>;
  allowedExtensions?: Set<string>;
}): { originalName: string; extension: string; mimeType: string; buffer: Buffer } {
  const originalName = path.basename(String(input.name || '')).replace(/[\0\r\n"\\/]/g, '_').trim();
  const extension = path.extname(originalName).toLowerCase();
  const mimeType = String(input.mimeType || '').split(';', 1)[0].trim().toLowerCase();
  const allowedMimeTypes = input.allowedMimeTypes || COMMON_UPLOAD_MIME_TYPES;
  const allowedExtensions = input.allowedExtensions || COMMON_UPLOAD_EXTENSIONS;

  if (!originalName || !allowedExtensions.has(extension) || !allowedMimeTypes.has(mimeType)) {
    throw new BadRequestException('Unsupported file type');
  }
  if (!EXTENSION_MIME[extension]?.has(mimeType)) {
    throw new BadRequestException('The filename extension does not match the declared file type');
  }

  const buffer = decodeBase64Strict(input.base64);
  if (buffer.length > input.maximumBytes) throw new BadRequestException('File size exceeds the allowed limit');
  if (!hasMatchingFileSignature(buffer, mimeType)) {
    throw new BadRequestException('The file content does not match its declared type');
  }
  return { originalName, extension, mimeType, buffer };
}
