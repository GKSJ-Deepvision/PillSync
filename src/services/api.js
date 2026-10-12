import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('pillsync_token');
      localStorage.removeItem('pillsync_user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
