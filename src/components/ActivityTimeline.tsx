import { Box, Stack, Typography, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../api/genericApi";

interface Props {
  contentTypeId: number;
  objectId: string;
}

const ACTION_COLOR: Record<string, "success" | "info" | "error" | "warning" | "default"> = {
  create: "success", update: "info", delete: "error", restore: "warning",
  status_change: "warning", approve: "success", login: "default", logout: "default",
};

export default function ActivityTimeline({ contentTypeId, objectId }: Props) {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit", contentTypeId, objectId],
    queryFn: () => platformApi.getAuditLog(String(contentTypeId), objectId),
  });

  if (logs.length === 0) return <Typography variant="body2" color="text.secondary">No activity yet.</Typography>;

  return (
    <Stack spacing={2} sx={{ borderLeft: "2px solid", borderColor: "divider", pl: 2 }}>
      {logs.map((log) => (
        <Box key={log.id} sx={{ position: "relative" }}>
          <Box sx={{ position: "absolute", left: -25, top: 4, width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main" }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={log.action.replace("_", " ")} color={ACTION_COLOR[log.action] ?? "default"} />
            <Typography variant="caption" color="text.secondary">
              {log.user_name ?? (log.user ? "Unknown user" : "System")} · {new Date(log.timestamp).toLocaleString()}
            </Typography>
          </Stack>
          {Object.keys(log.changed_fields || {}).length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              {Object.entries(log.changed_fields).map(([field, change]) => (
                <Typography variant="caption" component="div" key={field} color="text.secondary">
                  <b>{field}</b>: {change.old || "—"} → {change.new}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}
