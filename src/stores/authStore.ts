import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";
import api from "@/services/api";

/* =======================
   INTERFACES
======================= */
interface User {
  kode: string;
  nama: string;
  cabang: string;
  cabangNama: string;
  canApproveCorrection?: boolean;
  canApprovePrice?: boolean;
}

interface Permission {
  id: number;
  name: string;
  path: string;
  view: boolean;
  insert: boolean;
  edit: boolean;
  delete: boolean;
}

interface LoginResponse {
  token: string;
  user: User;
  permissions: Permission[];
}

interface JwtPayload {
  exp?: number;
}

/* =======================
   STORE
======================= */
export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();

  /* =======================
     HELPERS
  ======================= */
  function safeParse<T>(value: string | null, defaultValue: T): T {
    if (!value || value === "undefined" || value === "null") return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  /* =======================
     STATE
  ======================= */
  const token = ref<string | null>(localStorage.getItem("authToken"));
  const user = ref<User | null>(
    safeParse<User | null>(localStorage.getItem("userData"), null)
  );
  const permissions = ref<Permission[]>(
    safeParse<Permission[]>(localStorage.getItem("userPermissions"), [])
  );

  const isSessionExpired = ref(false);

  /* =======================
     GETTERS
  ======================= */
  const isTokenExpired = computed(() => {
    if (!token.value) return true;
    try {
      const decoded = jwtDecode<JwtPayload>(token.value);
      if (!decoded.exp) return true;
      return Date.now() > decoded.exp * 1000;
    } catch {
      return true;
    }
  });

  const isAuthenticated = computed(() => {
    return !!token.value && !isTokenExpired.value;
  });

  const userName = computed(() => user.value?.nama ?? "User");
  const userInitial = computed(() =>
    userName.value.charAt(0).toUpperCase()
  );
  const userCabang = computed(() => user.value?.cabang ?? "-");

  const allowedMenus = computed(() =>
    permissions.value.filter(p => p.view).map(p => p.id.toString())
  );

  /* =======================
     ACTIONS
  ======================= */
  function setLoginData(data: LoginResponse) {
    token.value = data.token;
    user.value = data.user;
    permissions.value = data.permissions;

    localStorage.setItem("authToken", data.token);
    localStorage.setItem("userData", JSON.stringify(data.user));
    localStorage.setItem(
      "userPermissions",
      JSON.stringify(data.permissions)
    );

    router.replace("/");
  }

  // 🔥 LOGIN FIX — TANPA FETCH, TANPA IP
  async function login(username: string, password: string) {
    try {
      const { data } = await api.post<LoginResponse>(
        "/auth/login",
        { username, password }
      );

      setLoginData(data);
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message || "Login gagal"
      );
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    permissions.value = [];
    isSessionExpired.value = false;

    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userPermissions");

    router.replace("/login");
  }

  function checkAuthStatus() {
    if (!token.value) return;

    if (isTokenExpired.value) {
      handleSessionExpired();
    }
  }

  function handleSessionExpired() {
    if (isSessionExpired.value) return;
    isSessionExpired.value = true;
    logout();
  }

  function can(
    menuId: string,
    action: "view" | "insert" | "edit" | "delete"
  ): boolean {
    const id = Number(menuId);
    const permission = permissions.value.find(p => p.id === id);
    return permission ? permission[action] : false;
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    userName,
    userInitial,
    userCabang,
    allowedMenus,
    isTokenExpired,
    isSessionExpired,

    login,
    logout,
    checkAuthStatus,
    handleSessionExpired,
    can,
  };
});
