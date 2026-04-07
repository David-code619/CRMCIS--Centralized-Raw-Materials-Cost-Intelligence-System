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

export async function apiFetch(path, options = {}) {
  return fetch(buildApiUrl(path), {
    credentials: 'include',
    ...options,
  });
}
