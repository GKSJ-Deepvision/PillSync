import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const MOCK_PATIENT = {
  id: 'usr-101',
  name: 'Alex Morgan',
  email: 'alex.patient@pillsync.com',
  role: 'patient', // 'patient' | 'caregiver' | 'admin'
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  caregiver: 'Dr. Sarah Jenkins',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pillsync_user');
    return savedUser ? JSON.parse(savedUser) : MOCK_PATIENT;
  });

  const [token, setToken] = useState(() => localStorage.getItem('pillsync_token') || 'mock-jwt-token-xyz');

  const login = (userData, authToken = 'mock-jwt-token-xyz') => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('pillsync_user', JSON.stringify(userData));
    localStorage.setItem('pillsync_token', authToken);
  };

  const switchRole = (newRole) => {
    const updated = {
      ...user,
      role: newRole,
      name: newRole === 'caregiver' ? 'Dr. Sarah Jenkins' : newRole === 'admin' ? 'System Administrator' : 'Alex Morgan',
      email: newRole === 'caregiver' ? 'sarah.caregiver@pillsync.com' : newRole === 'admin' ? 'admin@pillsync.com' : 'alex.patient@pillsync.com',
    };
    setUser(updated);
    localStorage.setItem('pillsync_user', JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pillsync_user');
    localStorage.removeItem('pillsync_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
