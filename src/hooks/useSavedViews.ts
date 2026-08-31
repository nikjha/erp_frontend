import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { savedViewApi } from "../api/genericApi";
import type { SavedView } from "../types/module";

/**
 * Saved list views, backed by `core.SavedView` on the server.
 *
 * These used to live in one global localStorage key, which meant every
 * user on a shared machine saw the same views and nobody's views
 * followed them to another browser. They are now scoped server-side to
 * (tenant, company, owner): the API only ever returns the caller's own
 * views plus ones a colleague explicitly shared with the company, so the
 * scoping can't be bypassed by the client.
 */
export function useSavedViews(moduleKey: string) {
  const queryClient = useQueryClient();
  const queryKey = ["saved-views", moduleKey];

  const { data: views = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => savedViewApi.list(moduleKey),
    staleTime: 30_000,
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, moduleKey]
  );

  const save = useCallback(
    async (view: Omit<SavedView, "id" | "module_key">) => {
      const created = await savedViewApi.create({ ...view, module_key: moduleKey });
      await invalidate();
      return created;
    },
    [moduleKey, invalidate]
  );

  const update = useCallback(
    async (id: string, patch: Partial<SavedView>) => {
      const updated = await savedViewApi.update(id, patch);
      await invalidate();
      return updated;
    },
    [invalidate]
  );

  const remove = useCallback(
    async (id: string) => {
      await savedViewApi.remove(id);
      await invalidate();
    },
    [invalidate]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      await savedViewApi.toggleFavorite(id);
      await invalidate();
    },
    [invalidate]
  );

  return { views, isLoading, save, update, remove, toggleFavorite };
}

// Recent + saved search terms (global search history) — genuinely a
// per-browser convenience, so this one stays in localStorage.
const SEARCH_HISTORY_KEY = "erp_search_history";

export function pushSearchHistory(term: string) {
  if (!term.trim()) return;
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
    const updated = [term, ...existing.filter((t) => t !== term)].slice(0, 10);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    /* private browsing / storage disabled — history is optional */
  }
}

export function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
