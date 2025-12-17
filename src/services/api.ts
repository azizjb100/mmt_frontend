import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api: AxiosInstance = axios.create({
  baseURL: '/api',     // ⬅️ PENTING
  withCredentials: true
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore();

    if (error.response?.status === 401) {
      // Hindari false expired untuk endpoint tertentu
      if (!error.config?.url?.includes('/auth-pin/validate')) {
        authStore.handleSessionExpired();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
