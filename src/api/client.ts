import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const TOKEN_KEY = "erp_access_token";
const REFRESH_KEY = "erp_refresh_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh?: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const apiClient: AxiosInstance = axios.create({ baseURL: BASE_URL });

/**
 * Marks a request as an import or an export.
 *
 * Neither is its own HTTP verb — an import is a stream of ordinary
 * creates and an export is an ordinary list — so the server cannot tell
 * them apart from normal traffic on method alone. This header lets it
 * check `can_import` / `can_export` instead of `can_create` / `can_view`
 * (see `core.viewsets.BaseModelViewSet._enforce_rbac`). Omitting it only
 * ever results in the *looser* check, so it can't be used to gain access.
 */
export const intentHeaders = (intent: "import" | "export") => ({
  headers: { "X-ERP-Intent": intent },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  const tenantId = localStorage.getItem("erp_tenant_id");
  if (tenantId) config.headers.set("X-Tenant-ID", tenantId);
  const companyId = localStorage.getItem("erp_company_id");
  if (companyId) config.headers.set("X-Company-ID", companyId);
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh });
    tokenStore.setTokens(data.access);
    return data.access as string;
  } catch {
    tokenStore.clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing || refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
