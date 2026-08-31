import { apiClient, USE_MOCK_API } from './client';

const createMockToken = (type) =>
  `mock-${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Mock implementation
const mockAuthApi = {
  login: async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (
      (email === 'patient@example.com' && password === 'password') ||
      (email === 'caregiver@example.com' && password === 'password') ||
      (email === 'admin@example.com' && password === 'password')
    ) {
      const isPatient = email.startsWith('patient');
      const isCaregiver = email.startsWith('caregiver');

      return {
        accessToken: createMockToken('access'),
        refreshToken: createMockToken('refresh'),
        user: {
          id: isPatient ? '1' : isCaregiver ? '2' : '3',
          email,
          name: isPatient ? 'John Patient' : isCaregiver ? 'Jane Caregiver' : 'Admin User',
          role: isPatient ? 'patient' : isCaregiver ? 'caregiver' : 'admin',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            isPatient ? 'John Patient' : isCaregiver ? 'Jane Caregiver' : 'Admin User'
          )}`,
        },
      };
    }

    throw new Error('Invalid credentials');
  },

  register: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      accessToken: createMockToken('access'),
      refreshToken: createMockToken('refresh'),
      user: {
        id: Date.now(),
        email: data.email,
        name: data.name,
        role: 'patient',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}`,
      },
    };
  },

  forgotPassword: async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      message: `Reset link sent to ${email}`,
    };
  },

  resetPassword: async (token, newPassword) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      message: 'Password reset successfully',
      token,
      passwordUpdated: Boolean(newPassword),
    };
  },

  me: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      return JSON.parse(storedUser);
    }

    throw new Error('Not authenticated');
  },

  logout: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      message: 'Logged out successfully',
    };
  },
};

// Real API implementation
const realAuthApi = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }).then((res) => res.data),

  register: (data) => apiClient.post('/auth/register', data).then((res) => res.data),

  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }).then((res) => res.data),

  resetPassword: (token, newPassword) =>
    apiClient.post('/auth/reset-password', { token, newPassword }).then((res) => res.data),

  me: () => apiClient.get('/auth/me').then((res) => res.data),

  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
};

export const authApi = USE_MOCK_API ? mockAuthApi : realAuthApi;
