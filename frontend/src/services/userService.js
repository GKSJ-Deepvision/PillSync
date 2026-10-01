import api from './api';

export const userService = {
  fetchProfile: async () => (await api.get('/profile/')).data,

  updateProfile: async (profileData) => (await api.put('/profile/', profileData)).data,
};
