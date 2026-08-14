const TOKEN_RE = /\{\{\s*([a-zA-Z.]+)\s*\}\}/g;
const FIELD_SPAN_RE = /<span data-field="([a-zA-Z.]+)">[^<]*<\/span>/g;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Idempotent: handles both first insertion ({{token}} -> span) and refresh
// (existing span -> re-resolved span) in one pass. Pure/no I/O so it's
// testable without a database.
export const applyMergeFields = (html: string, fields: Record<string, string>): string => {
  const withSpans = html.replace(TOKEN_RE, (match, key) => {
    if (!(key in fields)) return match;
    return `<span data-field="${key}">${escapeHtml(fields[key])}</span>`;
  });
  return withSpans.replace(FIELD_SPAN_RE, (match, key) => {
    if (!(key in fields)) return match;
    return `<span data-field="${key}">${escapeHtml(fields[key])}</span>`;
  });
};
