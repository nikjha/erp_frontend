import { useEffect, useState, type ReactNode } from "react";
import { apiClient, tokenStore } from "../api/client";
import { AuthContext, type CurrentUser } from "./authContextBase";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const { data } = await apiClient.get<CurrentUser>("/api/auth/me/");
      setUser(data);
      if (data.home_tenant) {
        localStorage.setItem("erp_tenant_id", data.home_tenant);
      }
      if (data.default_company) {
        localStorage.setItem("erp_company_id", data.default_company);
      } else {
        localStorage.removeItem("erp_company_id");
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenStore.getAccess()) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username: string, password: string) {
    const { data } = await apiClient.post("/api/auth/login/", { username, password });
    tokenStore.setTokens(data.access, data.refresh);
    await fetchMe();
  }

  function logout() {
    tokenStore.clear();
    localStorage.removeItem("erp_tenant_id");
    localStorage.removeItem("erp_company_id");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
