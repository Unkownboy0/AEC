export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:5000/api';

export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');