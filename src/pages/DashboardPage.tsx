import { Box, Grid, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { moduleRegistry } from "../config/registry";
import { GenericApi } from "../api/genericApi";

export default function DashboardPage() {
  const counts = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const results = await Promise.all(
        moduleRegistry.map(async (m) => {
          try {
            const res = await new GenericApi(m.endpoint).list({ page: 1, pageSize: 1 });
            return { key: m.key, label: m.label, count: res.count };
          } catch {
            return { key: m.key, label: m.label, count: 0 };
          }
        })
      );
      return results;
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Dashboard</Typography>
      <Grid container spacing={2}>
        {(counts.data ?? moduleRegistry.map((m) => ({ key: m.key, label: m.label, count: undefined }))).map((c) => (
          <Grid key={c.key} item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h4" sx={{ fontFamily: '"IBM Plex Mono", monospace', mt: 0.5 }}>
                {c.count ?? "—"}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
