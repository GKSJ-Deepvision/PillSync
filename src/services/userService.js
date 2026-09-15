import api from './api';

export const userService = {
  fetchProfile: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },

  updateProfile: async (userId, profileData) => {
    const response = await api.patch('/profile/', profileData);
    return response.data;
  }
};
