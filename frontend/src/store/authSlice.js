import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import authApi from '../api/auth.js';
import { tokenStorage } from '../api/client.js';

/**
 * Session state.
 *
 * `status` starts as 'restoring' rather than 'idle' on purpose: on a page
 * reload there may be a token in storage, and rendering the login screen for
 * the moment it takes to check would sign the user out in front of their eyes.
 */

const initialState = {
  user: null,
  status: tokenStorage.getAccess() ? 'restoring' : 'anonymous',
  error: null,
};

export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_arg, { rejectWithValue }) => {
    if (!tokenStorage.getAccess()) return null;
    try {
      return await authApi.me();
    } catch (error) {
      tokenStorage.clear();
      return rejectWithValue(error);
    }
  }
);

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authApi.login(credentials);
  } catch (error) {
    return rejectWithValue(error);
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.register(payload);
  } catch (error) {
    return rejectWithValue(error);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.updateMe(payload);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    sessionExpired(state) {
      state.user = null;
      state.status = 'anonymous';
      state.error = { message: 'Your session expired. Please sign in again.' };
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = 'loading';
      state.error = null;
    };
    const authenticated = (state, action) => {
      state.user = action.payload;
      state.status = 'authenticated';
      state.error = null;
    };
    const failed = (state, action) => {
      state.user = null;
      state.status = 'anonymous';
      state.error = action.payload ?? { message: 'Sign in failed.' };
    };

    builder
      .addCase(restoreSession.pending, (state) => {
        state.status = 'restoring';
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'anonymous';
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.status = 'anonymous';
      })
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, authenticated)
      .addCase(login.rejected, failed)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, authenticated)
      .addCase(register.rejected, failed)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'anonymous';
        state.error = null;
      });
  },
});

export const { clearError, sessionExpired } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
export const selectRole = (state) => state.auth.user?.role ?? null;

export default authSlice.reducer;
