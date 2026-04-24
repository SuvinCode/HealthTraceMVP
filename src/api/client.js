const API_BASE_URL = 'http://127.0.0.1:5001';

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
  const basePath = `/${entityName}`;
  return {
    filter(params = {}) {
      return http(basePath, { query: params });
    },
    get(id) {
      return http(`${basePath}/${id}`);
    },
    create(payload) {
      return http(basePath, { method: 'POST', body: payload });
    },
    update(id, payload) {
      return http(`${basePath}/${id}`, { method: 'PATCH', body: payload });
    },
    delete(id) {
      return http(`${basePath}/${id}`, { method: 'DELETE' });
    },
  };
}

export const apiClient = {
  auth: {
    async login(credentials) {
      const user = await http('/login', { method: 'POST', body: credentials });
      const token = btoa(`${user.email}:${user.password}`); // Simple mock token
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_info', JSON.stringify(user));
      return { token, user };
    },
    async register(data) {
      const existing = await http('/users', { query: { email: data.email } });
      if (existing.length > 0) {
        throw new Error('User already exists');
      }
      const newUser = await http('/users', { method: 'POST', body: data });
      const token = btoa(`${newUser.email}:${newUser.password}`);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_info', JSON.stringify(newUser));
      return { token, user: newUser };
    },
    me() {
      const user = localStorage.getItem('user_info');
      return user ? JSON.parse(user) : null;
    },
    logout() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    },
  },
  entities: new Proxy(
    {},
    {
      get(_target, prop) {
        // Handle nested entities from db.json
        const entityMap = {
          ConnectionRequest: 'ConnectionRequest',
          MedicationTask: 'MedicationTask',
          HealthForm: 'HealthForm',
          Appointment: 'Appointment',
          HealthFormSubmission: 'HealthFormSubmission'
        };
        return entityApi(entityMap[prop] || prop);
      },
    }
  ),
};
