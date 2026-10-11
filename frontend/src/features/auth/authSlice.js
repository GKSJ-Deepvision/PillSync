import { createSlice } from '@reduxjs/toolkit';

const getInitialAuth = () => {
  const token = localStorage.getItem('pillsync_token');
  const refreshToken = localStorage.getItem('pillsync_refresh_token');
  const savedUser = localStorage.getItem('pillsync_user');
  let user = null;
  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
    } catch {
      user = null;
    }
  }

  return {
    token: token || null,
    refreshToken: refreshToken || null,
    user: user || null,
    role: user?.role?.toLowerCase() || 'patient',
    isAuthenticated: Boolean(token),
    status: 'idle',
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuth(),
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.role = user?.role ? user.role.toLowerCase() : state.role;
      state.isAuthenticated = true;

      if (token) localStorage.setItem('pillsync_token', token);
      if (refreshToken) localStorage.setItem('pillsync_refresh_token', refreshToken);
      if (user) localStorage.setItem('pillsync_user', JSON.stringify(user));
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('pillsync_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.role = 'patient';

      localStorage.removeItem('pillsync_token');
      localStorage.removeItem('pillsync_refresh_token');
      localStorage.removeItem('pillsync_user');
    },
  },
});

export const { setCredentials, setRole, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
