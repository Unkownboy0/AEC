import { Request, Response, NextFunction } from 'express';

/**
 * ── Enterprise Input Sanitization Middleware ──
 * 
 * Recursively strips dangerous HTML/JS patterns from all string fields
 * in req.body, req.query, and req.params to prevent XSS attacks.
 * 
 * Lightweight, zero-dependency implementation.
 */

// Patterns to strip from user input
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,   // <script>...</script>
  /<script[\s\S]*?>/gi,                       // Opening <script> tags
  /<\/script>/gi,                              // Closing </script> tags
  /on\w+\s*=\s*["'][^"']*["']/gi,            // Event handlers: onclick="...", onerror="..."
  /on\w+\s*=\s*[^\s>]*/gi,                    // Unquoted event handlers
  /javascript\s*:/gi,                          // javascript: protocol
  /data\s*:\s*text\/html/gi,                   // data:text/html
  /vbscript\s*:/gi,                            // vbscript: protocol
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,     // <iframe>
  /<iframe[\s\S]*?>/gi,                        // Opening <iframe>
  /<object[\s\S]*?>[\s\S]*?<\/object>/gi,     // <object>
  /<embed[\s\S]*?>/gi,                         // <embed>
  /<link[\s\S]*?>/gi,                          // <link> (can load external CSS with JS)
  /<style[\s\S]*?>[\s\S]*?<\/style>/gi,       // <style> blocks (CSS injection)
  /expression\s*\(/gi,                         // CSS expression()
  /url\s*\(\s*["']?\s*javascript:/gi,         // url(javascript:)
];

/**
 * Sanitize a single string value by stripping dangerous patterns
 */
function sanitizeString(value: string): string {
  let cleaned = value;
  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}

/**
 * Recursively sanitize all string values in an object/array
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }
  return value;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    // Skip sanitization for base64 file upload payloads (they contain encoded binary data)
    const isFileUpload = req.body.base64 && req.body.mimeType;
    if (!isFileUpload) {
      req.body = sanitizeValue(req.body);
    } else {
      // Sanitize everything except the base64 field itself
      const { base64, ...rest } = req.body;
      req.body = { ...sanitizeValue(rest), base64 };
    }
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
};
