import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { getDataMode } from "@/services/dataMode";

const api = axios.create({
  //baseURL: "https://103.94.238.252/api",
  //baseURL: "https://127.0.0.1/api",
  baseURL: "http://localhost:8003/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }

  // Kirim mode data aktif ke backend (real / trial).
  // Autentikasi selalu memakai DB real.
  const url = String(config.url || "");
  const isAuthRequest = url.startsWith("/auth") || url.includes("/auth/");
  if (!isAuthRequest) {
    config.headers["X-Data-Mode"] = getDataMode();
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
    }
    return Promise.reject(err);
  },
);

export default api;
