/**
 * Single Axios instance for the whole frontend.
 * Token storage keys (do not change without updating auth flows):
 *   - access_token
 *   - refresh_token
 *   - user
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENDPOINTS } from './endpoints';

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (!refresh) {
        clearAuthStorage();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session_expired=true';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${API_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          { refresh }
        );
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
        }
        return api(originalRequest);
      } catch {
        clearAuthStorage();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session_expired=true';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export function clearAuthStorage() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  // legacy key cleanup
  localStorage.removeItem('auth_token');
}

export default api;
