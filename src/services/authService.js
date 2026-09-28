// import api from './api'; // Will be used when Django backend is connected
import { MOCK_USERS } from '../data/mockData';

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  login: async (email, password) => {
    // Future Integration:
    // const response = await api.post('/auth/login/', { email, password });
    // return response.data;
    await delay();
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (user && password === 'password123') {
      const mockToken = `mock_jwt_token_${user.role}_${Date.now()}`;
      return { token: mockToken, user };
    }
    throw new Error('Invalid email or password. Use credentials like patient@pillsync.com / password123.');
  },

  register: async (userData) => {
    // Future Integration:
    // const response = await api.post('/auth/register/', userData);
    // return response.data;
    await delay();
    const emailExists = MOCK_USERS.some(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (emailExists) {
      throw new Error('User with this email already exists.');
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      role: userData.role,
      dob: userData.dob || '',
      address: userData.address || '',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
    };

    const mockToken = `mock_jwt_token_${newUser.role}_${Date.now()}`;
    return { token: mockToken, user: newUser };
  },

  forgotPassword: async (email) => {
    // Future Integration:
    // const response = await api.post('/auth/forgot-password/', { email });
    // return response.data;
    await delay();
    const userExists = MOCK_USERS.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!userExists) {
      throw new Error('No account found with this email address.');
    }
    return { success: true, message: 'Password reset link sent to your email.' };
  },

  // eslint-disable-next-line no-unused-vars
  resetPassword: async (_token, _password) => {
    // Future Integration:
    // const response = await api.post('/auth/reset-password/', { token: _token, password: _password });
    // return response.data;
    await delay();
    return { success: true, message: 'Password has been reset successfully.' };
  },

  logout: async () => {
    // Future Integration:
    // await api.post('/auth/logout/');
    await delay(200);
    return { success: true };
  }
};
