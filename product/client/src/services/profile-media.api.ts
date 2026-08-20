import api from '../lib/axios';
import { prepareFileUpload } from './file-upload';

export const PROFILE_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadProfileImage(file: File) {
  const payload = await prepareFileUpload(file, { allowedMimeTypes: PROFILE_IMAGE_MIME_TYPES, maximumBytes: MAX_PROFILE_IMAGE_BYTES, label: 'Profile image' });
  const response = await api.put('/users/profile/avatar', payload);
  return response.data.data as { fileId: string; url: string; thumbnailUrl: string; version: string };
}

export async function removeProfileImage() {
  const response = await api.delete('/users/profile/avatar');
  return response.data.data as { fileId: null; url: null; thumbnailUrl: null; version: null };
}
