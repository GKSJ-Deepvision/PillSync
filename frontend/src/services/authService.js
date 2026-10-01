import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { username: email, password });
    const userResponse = await api.get('/auth/me/', {
      headers: { Authorization: `Bearer ${response.data.access}` },
    });
    return { ...response.data, user: userResponse.data };
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', {
      username: userData.username || userData.email,
      email: userData.email,
      password: userData.password,
      role: userData.role,
    });
    return response.data;
  },

  me: async () => (await api.get('/auth/me/')).data,
};
