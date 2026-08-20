import { API_BASE_URL } from '../config/api-config';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Universal Asset & Media URL Resolver for CampusOS
 *
 * Normalizes relative paths, UUID media file IDs, and legacy URLs (e.g. localhost, old LAN IPs)
 * into fully qualified, routable URLs against the active configured backend origin.
 *
 * Guarantees that native Android/iOS WebViews and Web clients always fetch from the canonical API.
 */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  const trimmed = String(path).trim();
  if (!trimmed) return '';

  // Inline data / blob URLs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Local client assets (should remain relative/local)
  if (
    trimmed.startsWith('/branding/') ||
    trimmed.startsWith('/avatars/') ||
    trimmed.startsWith('/favicon.ico') ||
    trimmed.startsWith('/logo.png') ||
    trimmed.startsWith('branding/') ||
    trimmed.startsWith('avatars/')
  ) {
    return trimmed;
  }

  // Extract base backend origin by stripping /api and trailing slashes
  const serverOrigin = (API_BASE_URL || '')
    .replace(/\/api(\/v\d+)?\/?$/, '')
    .replace(/\/+$/, '');

  // Check for UUID file ID
  if (UUID_REGEX.test(trimmed)) {
    return `${serverOrigin}/api/files/${trimmed}/content`;
  }

  // If already absolute HTTP(S) URL:
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      // If URL points to localhost, 127.0.0.1, 10.0.2.2 or media path, rewrite to current serverOrigin
      if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '10.0.2.2' ||
        url.pathname.startsWith('/uploads/') ||
        url.pathname.startsWith('/api/files/')
      ) {
        return `${serverOrigin}${url.pathname}${url.search}`;
      }
      return trimmed;
    } catch (_) {
      return trimmed;
    }
  }

  // If path is an upload path, route through /api/files/content for inline delivery
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanUploadPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${serverOrigin}/api/files/content?path=${encodeURIComponent(cleanUploadPath)}`;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${serverOrigin}${normalizedPath}`;
}

export default resolveAssetUrl;
