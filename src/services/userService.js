// import api from './api'; // Will be used when Django backend is connected
import { MOCK_USERS } from '../data/mockData';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const userService = {
  fetchProfile: async (userId) => {
    // Future Integration:
    // const response = await api.get(`/users/profile/`);
    // return response.data;
    await delay();
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (user) return user;
    throw new Error('User profile not found.');
  },

  updateProfile: async (userId, profileData) => {
    // Future Integration:
    // const response = await api.put(`/users/profile/update/`, profileData);
    // return response.data;
    await delay();
    const storedUserStr = localStorage.getItem('pillsync_user');
    if (storedUserStr) {
      const storedUser = JSON.parse(storedUserStr);
      if (storedUser.id === userId) {
        const updatedUser = { ...storedUser, ...profileData };
        localStorage.setItem('pillsync_user', JSON.stringify(updatedUser));
        return updatedUser;
      }
    }
    return { id: userId, ...profileData };
  }
};
