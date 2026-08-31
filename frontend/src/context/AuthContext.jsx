import { useState } from 'react';
import { authApi } from '../api/auth';
import { AuthContext } from './AuthContextValue';

function getStoredUser() {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    setUser(data.user);

    return data;
  };

  const register = async (data) => {
    const result = await authApi.register(data);

    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));

    setUser(result.user);

    return result;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
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
        id: '1',
        email: 'patient@example.com',
        name: 'Ibrahim Kadri',
        role: 'patient',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      };
    } else if (role === 'caregiver') {
      updatedUser = {
        id: '2',
        email: 'caregiver@example.com',
        name: 'Dr. Oliver Mitchell',
        role: 'caregiver',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      };
    } else if (role === 'admin') {
      updatedUser = {
        id: '3',
        email: 'admin@example.com',
        name: 'Sarah Jenkins (Director)',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      };
    }
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    loading: false,
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
