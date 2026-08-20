import axios from 'axios';
import { API_BASE_URL } from '../config/api-config';
import { getStoredRefreshToken, setStoredTokens, clearStoredTokens } from './token-storage';

// Single-flight in-progress refresh promise to prevent concurrent rotation collisions
let inFlightRefreshPromise: Promise<string | null> | null = null;

export async function refreshAuthSession(): Promise<string | null> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 10000 });
      if (res.data?.status === 'success' && res.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        await setStoredTokens(accessToken, newRefreshToken || refreshToken);
        return accessToken;
      }
    } catch (err: any) {
      const status = err?.response?.status;
      console.warn('[SessionRefresh] Refresh attempt status:', status || err?.message || 'Network/Server Error');

      // CRITICAL: Only wipe stored session when server explicitly rejects with 401 or 403 (revoked/expired/invalid)
      // Never wipe tokens on temporary network failure, timeouts, DNS issues, or 500 server errors!
      if (status === 401 || status === 403) {
        await clearStoredTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos_auth_expired'));
        }
      }
    }

    return null;
  })();

  try {
    return await inFlightRefreshPromise;
  } finally {
    inFlightRefreshPromise = null;
  }
}
