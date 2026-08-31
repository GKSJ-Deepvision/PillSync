import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { AuthContext } from './AuthContextValue';
import { decodeJWT, isTokenExpired, generateJWT } from '../utils/jwt';

function getStoredUser() {
  const token = localStorage.getItem('accessToken');
  const storedUser = localStorage.getItem('user');

  if (!token || isTokenExpired(token)) {
    if (storedUser && !token) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  }

  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('user');
    }
  }

  const decoded = decodeJWT(token);
  if (decoded) {
    return {
      id: decoded.id || decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'patient',
    };
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout request completed with local cleanup:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, [logout]);

  const login = async (email, password, role = null) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password, role);

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const result = await authApi.register(data);

      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      setUser(result.user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    return authApi.forgotPassword(email);
  };

  const resetPassword = async (token, newPassword) => {
    return authApi.resetPassword(token, newPassword);
  };

  const switchRole = (role) => {
    let updatedUser = { ...user };
    if (role === 'patient') {
      updatedUser = {
        id: 'u-patient-1',
        email: 'patient@example.com',
        name: 'Ibrahim Kadri',
        role: 'patient',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      };
    } else if (role === 'caregiver') {
      updatedUser = {
        id: 'u-caregiver-1',
        email: 'caregiver@example.com',
        name: 'Dr. Oliver Mitchell',
        role: 'caregiver',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      };
    } else if (role === 'admin') {
      updatedUser = {
        id: 'u-admin-1',
        email: 'admin@example.com',
        name: 'Sarah Jenkins',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      };
    }

    const newToken = generateJWT({
      sub: updatedUser.id,
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    }, 86400);

    localStorage.setItem('accessToken', newToken);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
