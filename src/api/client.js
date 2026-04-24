const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || '/login';

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
  const token = localStorage.getItem('auth_token');
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
    async login(credentials) {
      const response = await http('/api/auth/login', { method: 'POST', body: credentials });
      if (response && response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      return response;
    },
    async register(data) {
      const response = await http('/api/auth/register', { method: 'POST', body: data });
      if (response && response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      return response;
    },
    googleLogin() {
      window.location.href = buildUrl('/api/auth/google');
    },
    logout(returnTo) {
      localStorage.removeItem('auth_token');
      // Clear legacy token key from older app versions.
      localStorage.removeItem('token');
      if (returnTo) {
        window.location.href = returnTo;
      }
    },
    redirectToLogin(returnTo) {
      // In a SPA, we usually navigate to /login via router, 
      // but if the backend handles login, this stays as is.
      // We will update App.jsx to handle routing to /login page.
      window.location.href = `${window.location.origin}/login?returnTo=${encodeURIComponent(returnTo || window.location.href)}`;
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
