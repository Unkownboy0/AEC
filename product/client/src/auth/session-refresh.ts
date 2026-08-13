import axios from 'axios';
import { API_BASE_URL } from '../config/api-config';
import { getStoredRefreshToken, setStoredTokens, clearStoredTokens } from './token-storage';

export async function refreshAuthSession(): Promise<string | null> {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    if (res.data?.status === 'success' && res.data.data) {
      const { accessToken, refreshToken: newRefreshToken } = res.data.data;
      await setStoredTokens(accessToken, newRefreshToken || refreshToken);
      return accessToken;
    }
  } catch (err) {
    console.error('[SessionRefresh] Failed refreshing session token:', err);
    await clearStoredTokens();
  }

  return null;
}
