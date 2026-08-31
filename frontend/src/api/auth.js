import { apiClient, USE_MOCK_API } from './client';

// Mock implementation
const mockAuthApi = {
  login: async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === 'patient@example.com' && password === 'password') {
      return {
        accessToken: 'mock-access-token-patient',
        refreshToken: 'mock-refresh-token-patient',
        user: {
          id: '1',
          email,
          name: 'John Patient',
          role: 'patient',
          avatar:
            'https://ui-avatars.com/api/?name=John+Patient&background=0D8ABC&color=fff',
        },
      };
    }

    if (email === 'caregiver@example.com' && password === 'password') {
      return {
        accessToken: 'mock-access-token-caregiver',
        refreshToken: 'mock-refresh-token-caregiver',
        user: {
          id: '2',
          email,
          name: 'Jane Caregiver',
          role: 'caregiver',
          avatar:
            'https://ui-avatars.com/api/?name=Jane+Caregiver&background=7C3AED&color=fff',
        },
      };
    }

    if (email === 'admin@example.com' && password === 'password') {
      return {
        accessToken: 'mock-access-token-admin',
        refreshToken: 'mock-refresh-token-admin',
        user: {
          id: '3',
          email,
          name: 'Admin User',
          role: 'admin',
          avatar:
            'https://ui-avatars.com/api/?name=Admin+User&background=DC2626&color=fff',
        },
      };
    }

    throw new Error('Invalid credentials');
  },

  register: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      accessToken: 'mock-access-token-new',
      refreshToken: 'mock-refresh-token-new',
      user: {
        id: Date.now(),
        email: data.email,
        name: data.name,
        role: 'patient',
        avatar: `https://ui-avatars.com/api/?name=${data.name}&background=0D8ABC&color=fff`,
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

  register: (data) =>
    apiClient.post('/auth/register', data).then((res) => res.data),

  forgotPassword: (email) =>
    apiClient
      .post('/auth/forgot-password', { email })
      .then((res) => res.data),

  resetPassword: (token, newPassword) =>
    apiClient
      .post('/auth/reset-password', { token, newPassword })
      .then((res) => res.data),

  me: () => apiClient.get('/auth/me').then((res) => res.data),

  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
};

export const authApi = USE_MOCK_API ? mockAuthApi : realAuthApi;
