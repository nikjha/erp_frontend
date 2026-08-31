import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface ModuleStatus {
  id: string;
  code: string;
  name: string;
  icon: string;
  is_core: boolean;
  is_enabled: boolean;
}

export function useModuleStatus() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["module-status"],
    queryFn: async () => {
      const { data } = await apiClient.get<ModuleStatus[]>("/api/rbac/module-status/");
      return data;
    },
    staleTime: 30_000,
  });

  async function toggle(code: string, isEnabled: boolean) {
    await apiClient.post(`/api/rbac/module-status/${code}/toggle/`, { is_enabled: isEnabled });
    queryClient.invalidateQueries({ queryKey: ["module-status"] });
  }

  function isEnabled(code: string): boolean {
    const entry = query.data?.find((m) => m.code === code);
    return entry ? entry.is_enabled : true; // default open while loading / unknown
  }

  return { modules: query.data ?? [], isLoading: query.isLoading, isEnabled, toggle };
}
