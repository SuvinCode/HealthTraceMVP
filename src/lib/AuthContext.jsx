import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkAppState = async () => {
    return checkUserAuth();
  };

  const checkUserAuth = async () => {
    setIsLoadingPublicSettings(false);
    setAuthError(null);
    try {
      setIsLoadingAuth(true);
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    // Always clear local auth state/token first.
    apiClient.auth.logout();

    if (shouldRedirect) {
      apiClient.auth.redirectToLogin(window.location.href);
      return;
    }
  };

  const navigateToLogin = () => {
    // We already updated apiClient.auth.redirectToLogin to point to /login in the frontend
    apiClient.auth.redirectToLogin(window.location.href);
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
