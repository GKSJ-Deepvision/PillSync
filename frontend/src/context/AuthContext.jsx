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

  const value = {
    user,
    loading: false,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
