/**
 * API Helper
 *
 * Centralizes frontend API URL construction and credential handling.
 * This ensures all authenticated fetches use the same base URL and
 * always send cookies when the backend expects them.
 */

const API_BASE =
  import.meta.env.VITE_API_URL?.trim() ||
  'https://crmcis-centralized-raw-materials-cost.onrender.com';

export function buildApiUrl(path) {
  return `${API_BASE}${path}`;
}

const AUTH_TOKEN_KEY = 'crmcis_auth_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (!token) return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const providedHeaders = options.headers || {};
  const headers =
    token && !('Authorization' in providedHeaders) && !('authorization' in providedHeaders)
      ? { ...providedHeaders, Authorization: `Bearer ${token}` }
      : providedHeaders;

  return fetch(buildApiUrl(path), {
    credentials: 'include',
    ...options,
    headers,
  });
}
