import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge, IconButton, Menu, MenuItem, Typography, Stack, Divider, Box, Button, Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/NotificationsNone";
import CircleIcon from "@mui/icons-material/Circle";

import { useNotifications } from "../hooks/useNotifications";

/**
 * Systray bell. Assignment notifications land here — creating a to-do for
 * someone else raises one server-side (todos.views.TodoViewSet), and
 * closing it notifies whoever raised it.
 */
export default function NotificationsMenu() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  async function open(notificationId: string, actionUrl: string) {
    setAnchor(null);
    await markRead(notificationId);
    // action_url is written by the server as an in-app route
    // (e.g. "/todos/<id>"), so route rather than navigate the browser.
    if (actionUrl?.startsWith("/")) navigate(actionUrl);
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton size="small" color="inherit" onClick={(e) => setAnchor(e.currentTarget)}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 480 } } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => markAllRead()}>Mark all read</Button>
          )}
        </Stack>
        <Divider />

        {notifications.length === 0 && (
          <MenuItem disabled sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">You're all caught up.</Typography>
          </MenuItem>
        )}

        {notifications.map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => open(n.id, n.action_url)}
            sx={{ alignItems: "flex-start", whiteSpace: "normal", py: 1.25 }}
          >
            <Box sx={{ width: 18, pt: 0.5, flexShrink: 0 }}>
              {!n.is_read && <CircleIcon sx={{ fontSize: 8, color: "primary.main" }} />}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={n.is_read ? 400 : 600}>{n.title}</Typography>
              {n.body && (
                <Typography variant="caption" color="text.secondary" display="block">{n.body}</Typography>
              )}
              <Typography variant="caption" color="text.disabled">
                {new Date(n.created_date).toLocaleString()}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
