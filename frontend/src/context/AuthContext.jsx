import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('pillsync_token');
        if (storedToken) {
          const currentUser = await authService.me();
          setToken(storedToken);
          setUser(currentUser);
          localStorage.setItem('pillsync_user', JSON.stringify(currentUser));
        }
      } catch {
        localStorage.removeItem('pillsync_token');
        localStorage.removeItem('pillsync_refresh_token');
        localStorage.removeItem('pillsync_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const handleGlobalLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => window.removeEventListener('auth-logout', handleGlobalLogout);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('pillsync_token', data.access);
      localStorage.setItem('pillsync_refresh_token', data.refresh);
      localStorage.setItem('pillsync_user', JSON.stringify(data.user));
      setToken(data.access);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      await authService.register(userData);
      const data = await authService.login(userData.email, userData.password);
      localStorage.setItem('pillsync_token', data.access);
      localStorage.setItem('pillsync_refresh_token', data.refresh);
      localStorage.setItem('pillsync_user', JSON.stringify(data.user));
      setToken(data.access);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // JWT logout is handled by clearing the local credentials.
    } finally {
      localStorage.removeItem('pillsync_token');
      localStorage.removeItem('pillsync_refresh_token');
      localStorage.removeItem('pillsync_user');
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  };

  const updateUserProfile = (profileData) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...profileData };
      localStorage.setItem('pillsync_user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
