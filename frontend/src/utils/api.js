const rawApiBaseUrl = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : '';

// Prefer env value, fall back to relative /api so host/port are never hardcoded in source.
export const API_BASE_URL = (rawApiBaseUrl || '/api').replace(/\/$/, '');

export function apiUrl(path = '') {
  if (!path) return API_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
