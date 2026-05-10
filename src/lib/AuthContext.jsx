import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user_info');
    return raw ? JSON.parse(raw) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('auth_token'));
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    handleUrlToken();
    checkUserAuth();
  }, []);

  const handleUrlToken = () => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const token = params.get('token') || hashParams.get('access_token');
    
    if (token) {
      localStorage.setItem('auth_token', token);
      // Clean up URL
      const newUrl = window.location.pathname + (window.location.hash || '');
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  const checkAppState = async () => {
    return checkUserAuth();
  };

  const checkUserAuth = async () => {
    setIsLoadingPublicSettings(false);
    setAuthError(null);
    // Only show loading if we don't have a cached user yet
    if (!user) {
      setIsLoadingAuth(true);
    }
    try {
      // Handle Google sync if needed
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const role = params.get('role');
      
      if (token && token.includes('@')) {
        await apiClient.auth.googleSync(token, role || 'user');
      }

      const cachedUser = apiClient.auth.me();
      if (cachedUser?.id) {
        // Fetch fresh data from server
        const freshUser = await apiClient.entities.users.get(cachedUser.id);
        if (freshUser) {
          localStorage.setItem('user_info', JSON.stringify(freshUser));
          setUser(freshUser);
        }
      } else {
        const currentUser = apiClient.auth.me();
        setUser(currentUser);
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Auth sync failed:", error);
      const currentUser = apiClient.auth.me();
      if (currentUser) setUser(currentUser);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    apiClient.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      // Force a full clean reload to land on the homepage
      window.location.hash = '#/';
      window.location.reload();
    }
  };

  const navigateToLogin = () => {
    window.location.hash = '#/login';
  };

  const login = async (credentials) => {
    try {
      await apiClient.auth.login(credentials);
      await checkUserAuth();
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      await apiClient.auth.register(data);
      await checkUserAuth();
    } catch (error) {
      throw error;
    }
  };

  const googleLogin = (role = 'user') => {
    apiClient.auth.googleLogin(role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      login,
      register,
      googleLogin,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
