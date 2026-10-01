import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  if (!data) {
    return error?.message === 'Network Error'
      ? 'Unable to connect to PillSync. Check that the Django API is running.'
      : fallback;
  }
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    return Object.entries(data)
      .flatMap(([field, messages]) => {
        const values = Array.isArray(messages) ? messages : [messages];
        return values.map((message) => `${field === 'non_field_errors' ? '' : `${field}: `}${message}`);
      })
      .join(' ') || fallback;
  }
  return fallback;
};

// Request interceptor to append authorization token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pillsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (e.g., unauthorized 401 redirection triggers)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config) {
      localStorage.removeItem('pillsync_token');
      localStorage.removeItem('pillsync_refresh_token');
      localStorage.removeItem('pillsync_user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
