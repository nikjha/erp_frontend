import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { ModuleConfig } from "../types/module";

export function useContentType(module: ModuleConfig) {
  return useQuery({
    queryKey: ["content-type", module.contentTypeApp, module.contentTypeModel],
    queryFn: async () => {
      const { data } = await apiClient.get<{ id: number }>(
        `/api/core/content-type/?app_label=${module.contentTypeApp}&model=${module.contentTypeModel}`
      );
      return data.id;
    },
    staleTime: Infinity,
  });
}
