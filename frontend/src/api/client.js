import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Every backend error response uses the standard envelope
// { success: false, error: { code, message, details } } (see
// backend/config/exceptions.py). Unwrap it here so features can just read
// `err.message` / `err.code` instead of digging into `err.response.data`.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const envelope = error.response?.data?.error;
    if (envelope) {
      return Promise.reject({
        code: envelope.code,
        message: envelope.message,
        details: envelope.details,
        status: error.response.status,
      });
    }
    return Promise.reject({
      code: "NETWORK_ERROR",
      message: error.message || "Could not reach the server.",
      status: null,
    });
  },
);
