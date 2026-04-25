const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';

// Strips markdown link formatting e.g. "[a@b.com](mailto:a@b.com)" → "a@b.com"
export function cleanEmail(raw) {
  if (!raw) return raw;
  const match = raw.match(/^\[([^\]]+)\]\(mailto:[^)]+\)$/);
  return match ? match[1] : raw;
}

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
      user.email = cleanEmail(user.email);
      const token = btoa(`${user.email}:${user.password}`);
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
      newUser.email = cleanEmail(newUser.email);
      const token = btoa(`${newUser.email}:${newUser.password}`);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_info', JSON.stringify(newUser));
      return { token, user: newUser };
    },
    me() {
      const raw = localStorage.getItem('user_info');
      if (raw) {
        const user = JSON.parse(raw);
        user.email = cleanEmail(user.email);
        return user;
      }

      // Fallback for mock auto-login (e.g. from Google redirect)
      const token = localStorage.getItem('auth_token');
      if (token && token.includes('@')) {
        const email = cleanEmail(token);
        
        // Check for role/signup hints in URL if present
        const params = new URLSearchParams(window.location.search);
        const forcedRole = params.get('role');
        const isSignup = params.get('signup') === 'true';

        const isDoctor = forcedRole === 'doctor' || email === 'doctor@gmail.com';
        const isPatient = forcedRole === 'user' || email === 'patient@gmail.com';

        const mockUser = {
          id: email === 'doctor@gmail.com' ? 2 : (email === 'patient@gmail.com' ? 1 : Math.floor(Math.random() * 1000000)),
          email,
          full_name: email.split('@')[0],
          role: isDoctor ? 'doctor' : 'user',
          // If it's a new signup, mark onboarding as incomplete
          onboarding_complete: isSignup ? false : (email === 'patient@gmail.com' || email === 'doctor@gmail.com'),
        };
        localStorage.setItem('user_info', JSON.stringify(mockUser));
        return mockUser;
      }
      return null;
    },
    googleSync: async (email, role) => {
      try {
        const existing = await http('/users', { query: { email: cleanEmail(email) } });
        if (existing.length === 0) {
          const newUser = await http('/users', { 
            method: 'POST', 
            body: {
              email: cleanEmail(email),
              full_name: email.split('@')[0],
              role,
              onboarding_complete: false,
              password: 'google_oauth_placeholder'
            } 
          });
          localStorage.setItem('user_info', JSON.stringify(newUser));
          return newUser;
        }
        localStorage.setItem('user_info', JSON.stringify(existing[0]));
        return existing[0];
      } catch (error) {
        console.error("Google sync failed:", error);
        return null;
      }
    },
    logout() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
    },
    googleLogin(role = 'user') {
      const isSignup = window.location.pathname === '/signup';
      const email = isSignup ? `newuser_${Math.floor(Math.random() * 10000)}@gmail.com` : 'patient@gmail.com';
      const signupParam = isSignup ? '&signup=true' : '';
      window.location.href = `/login?token=${email}&role=${role}${signupParam}`;
    },
    async updateMe(data) {
      const userInfo = localStorage.getItem('user_info');
      if (!userInfo) throw new Error('User not found in session');
      const user = JSON.parse(userInfo);
      const updatedUser = await http(`/users/${user.id}`, { method: 'PATCH', body: data });
      updatedUser.email = cleanEmail(updatedUser.email);
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      return updatedUser;
    },
    async deleteMe(id) {
      return await http(`/users/${id}`, { method: 'DELETE' });
    }
  },
  entities: new Proxy(
    {},
    {
      get(_target, prop) {
        const entityMap = {
          ConnectionRequest:    'ConnectionRequest',
          MedicationTask:       'MedicationTask',
          HealthForm:           'HealthForm',
          HealthFormSubmission: 'HealthFormSubmission',
          HealthFormResponse:   'HealthFormResponse',
          Appointment:          'Appointment',
          DiaryEntry:           'DiaryEntry',
        };
        return entityApi(entityMap[prop] || prop);
      },
    }
  ),
  sendFeedback(data) {
    return http('/send-feedback', { method: 'POST', body: data });
  },
};