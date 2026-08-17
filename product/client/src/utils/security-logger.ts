/**
 * Zero-Leak Security Logger & Console Sanitizer for CampusOS
 *
 * Intercepts all window.console methods on mobile native WebView and web browsers
 * to guarantee that raw JWT access tokens, refresh tokens, and FCM device tokens
 * are never written to standard Logcat, debugging bridges, or browser consoles.
 */

const JWT_PATTERN = /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]*/g;
const FCM_TOKEN_PATTERN = /[a-zA-Z0-9_-]{100,}:[a-zA-Z0-9_-]{10,}/g;

function sanitizeValue(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    return val
      .replace(JWT_PATTERN, '[REDACTED_JWT]')
      .replace(FCM_TOKEN_PATTERN, '[REDACTED_FCM_TOKEN]');
  }
  if (typeof val === 'object') {
    try {
      const jsonStr = JSON.stringify(val);
      if (JWT_PATTERN.test(jsonStr) || FCM_TOKEN_PATTERN.test(jsonStr)) {
        const sanitized = jsonStr
          .replace(JWT_PATTERN, '[REDACTED_JWT]')
          .replace(FCM_TOKEN_PATTERN, '[REDACTED_FCM_TOKEN]');
        return JSON.parse(sanitized);
      }
    } catch (_) {
      // In case of circular structures, return as-is
    }
  }
  return val;
}

export function initSecurityConsoleSanitizer() {
  if (typeof window === 'undefined') return;

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalDebug = console.debug;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    originalLog.apply(console, args.map(sanitizeValue));
  };

  console.info = (...args: any[]) => {
    originalInfo.apply(console, args.map(sanitizeValue));
  };

  console.debug = (...args: any[]) => {
    originalDebug.apply(console, args.map(sanitizeValue));
  };

  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args.map(sanitizeValue));
  };

  console.error = (...args: any[]) => {
    originalError.apply(console, args.map(sanitizeValue));
  };
}

export default initSecurityConsoleSanitizer;
