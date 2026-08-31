import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { MyPermissionsResponse, ModulePermissions } from "../types/api";
import { moduleCodeOf, type ModuleConfig } from "../types/module";

export type PermissionFlag = keyof Pick<
  ModulePermissions,
  "can_view" | "can_create" | "can_edit" | "can_delete" | "can_export" | "can_import" | "can_approve" | "can_print"
>;

/**
 * The current user's effective RBAC flags, used to decide which actions a
 * screen offers.
 *
 * `is_restricted: false` means this workspace hasn't configured RBAC for
 * the user (superuser, no role, or a role with no permission rows) and
 * everything is allowed. That default matters: enforcing an empty
 * permission set would lock every existing user out of every screen the
 * day this shipped.
 *
 * Hiding a button is a usability decision, not a security boundary — the
 * same rules are enforced server-side in
 * `core.viewsets.BaseModelViewSet._enforce_rbac`.
 */
export function useMyPermissions() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-permissions"],
    queryFn: async () => {
      const { data } = await apiClient.get<MyPermissionsResponse>("/api/rbac/my-permissions/");
      return data;
    },
    staleTime: 5 * 60_000,
  });

  const can = useCallback(
    (moduleCode: string, flag: PermissionFlag): boolean => {
      // While loading, assume allowed. The server is the real gate, and
      // flashing every button off on each page load is worse than briefly
      // showing one the API would refuse.
      if (!data || !data.is_restricted) return true;
      return Boolean(data.modules[moduleCode]?.[flag]);
    },
    [data]
  );

  const canModule = useCallback(
    (module: ModuleConfig, flag: PermissionFlag) => can(moduleCodeOf(module), flag),
    [can]
  );

  return { permissions: data, isLoading, can, canModule };
}
