import axios from 'axios';

/**
 * The single axios instance every feature calls through.
 *
 * It owns two things nobody else should have to think about:
 *  1. attaching the access token to each request, and
 *  2. transparently refreshing that token once it expires, replaying the
 *     request that triggered the refresh.
 *
 * Concurrent 401s share one refresh call - without the queue below, ten
 * requests firing after a token expires would each start their own refresh and
 * nine of them would race.
 */

export const ACCESS_TOKEN_KEY = 'pillsync.access';
export const REFRESH_TOKEN_KEY = 'pillsync.refresh';

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api/v1';

export const tokenStorage = {
  getAccess() {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefresh() {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set({ access, refresh }) {
    try {
      if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
      if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    } catch {
      // Private browsing with site data blocked: the session simply lasts
      // until the tab is closed.
    }
  },
  clear() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;
let onUnauthenticated = () => {};

/** Let the app decide what happens when the session cannot be recovered. */
export function setUnauthenticatedHandler(handler) {
  onUnauthenticated = typeof handler === 'function' ? handler : () => {};
}

async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error('No refresh token');

  // A bare axios call, so this request cannot be intercepted into a loop.
  const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
  tokenStorage.set({ access: data.access, refresh: data.refresh });
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isRefreshCall = original?.url?.includes('/auth/token/refresh/');
    if (status !== 401 || !original || original._retried || isRefreshCall) {
      return Promise.reject(normaliseError(error));
    }

    original._retried = true;
    try {
      refreshPromise = refreshPromise || refreshAccessToken();
      const access = await refreshPromise;
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (refreshError) {
      tokenStorage.clear();
      onUnauthenticated();
      return Promise.reject(normaliseError(refreshError));
    } finally {
      refreshPromise = null;
    }
  }
);

/**
 * Flatten the backend's error envelope into something a component can render.
 *
 * The API always answers with `{error: {code, message, details}}`, so this
 * turns any failure - including a network drop - into the same shape.
 */
export function normaliseError(error) {
  const payload = error.response?.data?.error;
  if (payload) {
    return {
      code: payload.code || 'error',
      message: payload.message || 'Something went wrong.',
      details: payload.details || {},
      status: error.response.status,
    };
  }
  if (error.response) {
    return {
      code: 'error',
      message: error.response.data?.detail || 'Something went wrong.',
      details: {},
      status: error.response.status,
    };
  }
  return {
    code: 'network_error',
    message: 'Could not reach the server. Check your connection and try again.',
    details: {},
    status: 0,
  };
}

/** First field-level message, for showing an error next to the input it belongs to. */
export function fieldError(error, field) {
  const value = error?.details?.[field];
  if (!value) return null;
  return Array.isArray(value) ? value[0] : String(value);
}

export default api;
