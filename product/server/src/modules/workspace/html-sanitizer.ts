// Allowlist HTML sanitizer for Campus Docs content. No arbitrary HTML is
// trusted: only tags/attributes the doc editor's toolbar can itself produce
// survive. This is defense in depth — the client also restricts execCommand
// output — but the server never trusts what it receives.

const ALLOWED_TAGS = new Set([
  'p', 'div', 'span', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'mark',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'a',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['style', 'class', 'data-checked', 'data-page-break']),
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
};

const ALLOWED_STYLE_PROPS = new Set([
  'color', 'background-color', 'text-align', 'font-weight', 'font-style',
  'text-decoration', 'font-family', 'font-size', 'line-height', 'margin-left',
  'margin-top', 'margin-bottom', 'width', 'height', 'page-break-before',
]);

const sanitizeStyle = (style: string): string =>
  style
    .split(';')
    .map((rule) => {
      const [prop, ...rest] = rule.split(':');
      const name = prop?.trim().toLowerCase();
      const value = rest.join(':').trim();
      if (!name || !value || !ALLOWED_STYLE_PROPS.has(name)) return '';
      if (/url\(|expression\(|javascript:/i.test(value)) return '';
      return `${name}: ${value}`;
    })
    .filter(Boolean)
    .join('; ');

const isSafeUrl = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:text/html') || trimmed.startsWith('vbscript:')) return false;
  return true;
};

// Strips any tag not in the allowlist while keeping its inner text/children,
// then strips disallowed attributes from surviving tags. Regex-based by
// design: the input vocabulary is small and fully controlled by our own
// editor toolbar, so a full DOM parser dependency isn't warranted.
export const sanitizeDocHtml = (rawHtml: string): string => {
  let html = String(rawHtml ?? '');

  // Remove dangerous elements entirely (including their content).
  html = html.replace(/<(script|style|iframe|object|embed|link|meta|form|input|textarea|button|svg|math)[^>]*>[\s\S]*?<\/\1>/gi, '');
  html = html.replace(/<(script|style|iframe|object|embed|link|meta|form|input|textarea|button|svg|math)[^>]*\/?>/gi, '');

  // Drop disallowed tags but keep their inner content.
  html = html.replace(/<\/?([a-zA-Z0-9]+)((?:\s+[^<>]*)?)>/g, (match, tagRaw, attrsRaw) => {
    const tag = String(tagRaw).toLowerCase();
    const closing = match.startsWith('</');
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (closing) return `</${tag}>`;

    const allowedForTag = new Set([...(ALLOWED_ATTRS['*'] ?? []), ...(ALLOWED_ATTRS[tag] ?? [])]);
    const attrs: string[] = [];
    const attrRegex = /([a-zA-Z0-9-]+)\s*=\s*"([^"]*)"|([a-zA-Z0-9-]+)\s*=\s*'([^']*)'/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(attrsRaw)) !== null) {
      const name = (attrMatch[1] || attrMatch[3] || '').toLowerCase();
      const value = attrMatch[2] ?? attrMatch[4] ?? '';
      if (name.startsWith('on')) continue;
      if (!allowedForTag.has(name)) continue;
      if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue;
      const safeValue = name === 'style' ? sanitizeStyle(value) : value.replace(/"/g, '&quot;');
      if (name === 'style' && !safeValue) continue;
      attrs.push(`${name}="${safeValue}"`);
    }
    if (tag === 'a') attrs.push('rel="noopener noreferrer"');
    return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  });

  return html;
};
