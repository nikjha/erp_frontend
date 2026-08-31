import { useQuery } from "@tanstack/react-query";
import { GenericApi } from "../api/genericApi";
import { getModule } from "../config/registry";

export function useRelationOptions(
  moduleKey?: string,
  labelField?: string,
  extraFilters?: Record<string, unknown>
) {
  const module = moduleKey ? getModule(moduleKey) : undefined;
  const effectiveLabelField = labelField || module?.titleField || "name";
  const filterKey = extraFilters ? JSON.stringify(extraFilters) : "";

  const query = useQuery({
    queryKey: ["relation-options", moduleKey, filterKey],
    queryFn: async () => {
      if (!module) return [];
      const api = new GenericApi(module.endpoint);
      const res = await api.list({ pageSize: 500, filters: extraFilters });
      return res.results.map((r) => ({
        value: String(r.id),
        label: String(r[effectiveLabelField] ?? r.id),
      }));
    },
    enabled: !!module,
    staleTime: 60_000,
  });

  return { options: query.data ?? [], isLoading: query.isLoading };
}
