export function validateProductionApiUrl(apiUrl: string): boolean {
  if (!apiUrl) return false;
  try {
    const url = new URL(apiUrl);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return !/^(localhost$|127\.|0\.0\.0\.0$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  } catch {
    return false;
  }
}

export type DeploymentMode = 'INTERNET_PRODUCTION' | 'LOCAL_ON_PREM';

export function validateOnPremApiUrl(apiUrl: string): boolean {
  if (!apiUrl) return false;
  try {
    const url = new URL(apiUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (!url.pathname.replace(/\/$/, '').endsWith('/api')) return false;
    const octets = url.hostname.split('.').map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return a === 192 && b === 168;
  } catch {
    return false;
  }
}

export function validateApiUrlForDeployment(apiUrl: string, mode: DeploymentMode): boolean {
  return mode === 'LOCAL_ON_PREM' ? validateOnPremApiUrl(apiUrl) : validateProductionApiUrl(apiUrl);
}
