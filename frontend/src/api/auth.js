import api, { tokenStorage } from './client.js';

/** Everything under /api/v1/auth/ and /api/v1/users/me/. */
export const authApi = {
  async register(payload) {
    const { data } = await api.post('/auth/register/', payload);
    tokenStorage.set(data.tokens);
    return data.user;
  },

  async login({ email, password }) {
    const { data } = await api.post('/auth/login/', { email, password });
    tokenStorage.set({ access: data.access, refresh: data.refresh });
    return data.user;
  },

  async loginWithGoogle({ idToken, role }) {
    const { data } = await api.post('/auth/google/', { id_token: idToken, role });
    tokenStorage.set(data.tokens);
    return data.user;
  },

  async logout() {
    const refresh = tokenStorage.getRefresh();
    try {
      if (refresh) await api.post('/auth/logout/', { refresh });
    } finally {
      // Even if the server rejects the token, this device must forget it.
      tokenStorage.clear();
    }
  },

  async me() {
    const { data } = await api.get('/users/me/');
    return data;
  },

  async updateMe(payload) {
    const { data } = await api.patch('/users/me/', payload);
    return data;
  },

  async changePassword(payload) {
    const { data } = await api.post('/auth/password/change/', payload);
    return data;
  },

  async requestPasswordReset(email) {
    const { data } = await api.post('/auth/password/reset/', { email });
    return data;
  },

  async confirmPasswordReset(payload) {
    const { data } = await api.post('/auth/password/reset/confirm/', payload);
    return data;
  },
};

export default authApi;
