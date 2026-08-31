import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { platformApi } from "../api/genericApi";

/**
 * In-app notifications for the systray bell.
 *
 * Polled rather than pushed: the platform can deliver over websockets
 * (notifications/consumers.py) but that path needs Redis + Daphne
 * running, and the bell has to be correct even when it isn't. Polling
 * every 60s is the floor; a websocket can layer on top later without
 * changing anything here.
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => platformApi.getNotifications(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    [queryClient]
  );

  const markRead = useCallback(
    async (id: string) => {
      await platformApi.markNotificationRead(id);
      await invalidate();
    },
    [invalidate]
  );

  const markAllRead = useCallback(async () => {
    await platformApi.markAllNotificationsRead();
    await invalidate();
  }, [invalidate]);

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
}
