const API_BASE = '/api/accounts';

export const authService = {
  async register(data) {
    const res = await fetch(`${API_BASE}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid credentials');
    }
    return res.json();
  },

  async refreshToken(refresh) {
    const res = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) throw new Error('Token refresh failed');
    return res.json();
  },

  async logout(refreshToken) {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Ignore network errors on logout
    }
  },

  async googleExchange(idToken, role = 'PATIENT') {
    const res = await fetch(`${API_BASE}/google/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken, role }),
    });
    if (!res.ok) throw new Error('Google authentication failed');
    return res.json();
  },

  async changePassword(oldPassword, newPassword, token) {
    const res = await fetch(`${API_BASE}/password/change/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Password change failed');
    }
    return res.json();
  },

  async requestPasswordReset(email) {
    const res = await fetch(`${API_BASE}/password/reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async confirmPasswordReset(uid, token, newPassword) {
    const res = await fetch(`${API_BASE}/password/reset/confirm/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, new_password: newPassword }),
    });
    if (!res.ok) throw new Error('Password reset confirmation failed');
    return res.json();
  },

  async getCurrentUser(token) {
    const res = await fetch(`${API_BASE}/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },
};
