/**
 * API Helper & Client
 *
 * Centralizes frontend API URL construction, credential handling, query string building,
 * and standard CRUD requests.
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

/**
 * Builds a clean query string, stripping out undefined, null, and empty string parameters.
 * Prevents URL parameter pollution like ?category=&search=
 */
export function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

/**
 * Raw fetch wrapper with automatic auth header injection, JSON body detection,
 * and 401 session broadcast.
 */
export async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const providedHeaders = options.headers || {};
  const isJsonBody =
    options.body &&
    typeof options.body === 'string' &&
    !('Content-Type' in providedHeaders) &&
    !('content-type' in providedHeaders);

  const headers = {
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...providedHeaders,
    ...(token && !providedHeaders.Authorization && !providedHeaders.authorization
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };

  const response = await fetch(buildApiUrl(path), {
    credentials: 'include',
    ...options,
    headers,
  });

  if (response.status === 401 && !path.includes('/api/auth/login')) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}

/**
 * High-level API client with automatic JSON parsing and typed error handling.
 */
async function request(path, options = {}) {
  const res = await apiFetch(path, options);
  
  if (res.status === 204) {
    return null;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const error = new Error(
      (data && typeof data === 'object' && (data.error || data.message)) ||
      `Request failed with status ${res.status}`
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, params = {}, options = {}) => {
    const qs = buildQueryString(params);
    return request(`${path}${qs}`, { method: 'GET', ...options });
  },
  post: (path, body, options = {}) => {
    return request(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },
  patch: (path, body, options = {}) => {
    return request(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },
  put: (path, body, options = {}) => {
    return request(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },
  delete: (path, options = {}) => {
    return request(path, { method: 'DELETE', ...options });
  },
};

/**
 * Resource-specific API services
 */
export const materialsApi = {
  list: (params) => api.get('/api/materials', params),
  get: (id) => api.get(`/api/materials/${id}`),
  create: (data) => api.post('/api/materials', data),
  update: (id, data) => api.patch(`/api/materials/${id}`, data),
  delete: (id) => api.delete(`/api/materials/${id}`),
};

export const branchesApi = {
  list: () => api.get('/api/branches'),
  get: (id) => api.get(`/api/branches/${id}`),
  create: (data) => api.post('/api/branches', data),
};

export const inventoryApi = {
  list: (params) => api.get('/api/inventory', params),
  getStats: (branchId) => api.get('/api/inventory/stats', branchId ? { branchId } : {}),
  getHistory: (params) => api.get('/api/inventory/history', params),
};

export const usersApi = {
  list: (params) => api.get('/api/users', params),
  get: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.patch(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
  toggleStatus: (id, isActive) => api.patch(`/api/users/${id}/status`, { isActive }),
};

export const reportsApi = {
  getKpis: (params) => api.get('/api/reports/kpis', params),
  getValueTrend: (params) => api.get('/api/reports/value-trend', params),
  getTopConsumed: (params) => api.get('/api/reports/top-consumed', params),
  getBranchComparison: (params) => api.get('/api/reports/branch-comparison', params),
};
