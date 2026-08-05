/**
 * Deep Link Map — campusos:// → web route
 *
 * Validated before being injected into push notification payloads.
 * All routes must have a corresponding React Router registration.
 */
export const DEEP_LINK_SCHEME = 'campusos://';

export const DEEP_LINK_MAP: Record<string, string> = {
  // Faculty
  'faculty/circulars': '/faculty/circulars',
  'faculty/circulars/:id': '/faculty/circulars/:id',
  'faculty/notifications': '/faculty/notifications',
  'faculty/dashboard': '/faculty/dashboard',
  // HOD
  'hod/circulars': '/hod/circulars',
  'hod/circulars/:id': '/hod/circulars/:id',
  'hod/notifications': '/hod/notifications',
  'hod/dashboard': '/hod/dashboard',
  // Academic Dean
  'academic-dean/circulars': '/academic-dean/circulars',
  'academic-dean/circulars/:id': '/academic-dean/circulars/:id',
  'academic-dean/notifications': '/academic-dean/notifications',
  // Admission Dean
  'admission-dean/circulars': '/admission-dean/circulars',
  'admission-dean/circulars/:id': '/admission-dean/circulars/:id',
  'admission-dean/notifications': '/admission-dean/notifications',
  // IQAC
  'iqac/circulars': '/iqac/circulars',
  'iqac/circulars/:id': '/iqac/circulars/:id',
  'iqac/notifications': '/iqac/notifications',
  // Vice Principal
  'vp/circulars': '/vp/circulars',
  'vp/circulars/:id': '/vp/circulars/:id',
  'vp/notifications': '/vp/notifications',
  // Principal
  'principal/circulars': '/principal/circulars',
  'principal/circulars/:id': '/principal/circulars/:id',
  'principal/notifications': '/principal/notifications',
  // Generic fallback
  'circulars/:id': '/circulars/:id',
};

/**
 * Resolve a native deep link URL to a web path.
 * Returns null if the scheme is unknown.
 */
export function resolveDeepLink(nativeUrl: string): string | null {
  if (!nativeUrl.startsWith(DEEP_LINK_SCHEME)) return null;
  const path = nativeUrl.replace(DEEP_LINK_SCHEME, '');
  // Direct match
  if (DEEP_LINK_MAP[path]) return DEEP_LINK_MAP[path];
  // Parameterized match (replace last segment with :id)
  const parts = path.split('/');
  const paramKey = parts.slice(0, -1).join('/') + '/:id';
  if (DEEP_LINK_MAP[paramKey]) {
    return DEEP_LINK_MAP[paramKey].replace(':id', parts[parts.length - 1]);
  }
  return `/${path}`;
}

/**
 * Build a validated native deep link for push notification data payload.
 */
export function buildNativeDeepLink(role: string, section: string, id?: string): string {
  const rolePrefix = role
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace('vice-principal', 'vp')
    .replace('head-of-department', 'hod')
    .replace('academic-dean', 'academic-dean')
    .replace('admission-dean', 'admission-dean')
    .replace('iqac-dean', 'iqac');

  const path = id ? `${rolePrefix}/${section}/${id}` : `${rolePrefix}/${section}`;
  return `${DEEP_LINK_SCHEME}${path}`;
}
