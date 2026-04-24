const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

async function http(path, { method = 'GET', body, query } = {}) {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || `Request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function entityApi(entityName) {
  const basePath = `/api/entities/${entityName}`;
  return {
    filter(params = {}) {
      return http(basePath, { query: params });
    },
    create(payload) {
      return http(basePath, { method: 'POST', body: payload });
    },
    update(id, payload) {
      return http(`${basePath}/${id}`, { method: 'PATCH', body: payload });
    },
  };
}

export const apiClient = {
  auth: {
    me() {
      return http('/api/auth/me');
    },
    updateMe(payload) {
      return http('/api/auth/me', { method: 'PATCH', body: payload });
    },
    logout(returnTo) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      if (returnTo) {
        window.location.href = returnTo;
      }
    },
    redirectToLogin(returnTo) {
      const encoded = encodeURIComponent(returnTo || window.location.href);
      window.location.href = `/login?returnTo=${encoded}`;
    },
  },
  entities: new Proxy(
    {},
    {
      get(_target, prop) {
        return entityApi(String(prop));
      },
    }
  ),
};

export const base44 = apiClient;
