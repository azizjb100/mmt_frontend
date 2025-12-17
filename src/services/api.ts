import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';


// --- AWAL PERUBAHAN ---

// 1. Dapatkan 'base' path dari environment variable.
//    Vite secara otomatis menyediakan ini dari 'base' di vite.config.ts
//    Misal: '/' (untuk release) atau '/trial/' (untuk trial)
const APP_BASE_PATH = import.meta.env.BASE_URL;

// 2. Bersihkan trailing slash (/) jika ada
const cleanBase = APP_BASE_PATH.endsWith('/')
  ? APP_BASE_PATH.slice(0, -1)
  : APP_BASE_PATH;

// 3. Buat baseURL API yang dinamis
//    - Jika build:trial, hasilnya: '/trial/api'
//    - Jika build, hasilnya: '/api'
const API_BASE_URL = `${cleanBase}/api`;

// --- AKHIR PERUBAHAN ---

// Buat instance Axios dengan tipe yang jelas
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export default api;