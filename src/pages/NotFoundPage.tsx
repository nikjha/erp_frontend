import { Box, Typography, Button, Stack } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import SearchOffIcon from "@mui/icons-material/SearchOff";

interface Props {
  /** Overrides the default message, e.g. for an unknown module key. */
  title?: string;
  detail?: string;
}

/**
 * The app's own 404.
 *
 * nginx can't produce this one: every unknown path under `/` falls back
 * to index.html so that real client-side routes (`/todos/<uuid>`) survive
 * a refresh or a deep link. That fallback means the server cannot tell an
 * app route from a typo, so the app has to answer for addresses it does
 * not recognise itself.
 *
 * The HTTP status stays 200 — inherent to a client-rendered SPA, and not
 * worth prerendering for an authenticated internal console that search
 * engines never crawl.
 */
export default function NotFoundPage({ title, detail }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ p: 6, textAlign: "center" }}>
      <SearchOffIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title ?? "That page doesn't exist"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {detail ?? "The address you followed doesn't match any screen in this workspace."}
      </Typography>
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: "block", mb: 3, fontFamily: '"IBM Plex Mono", monospace' }}
      >
        {location.pathname}
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" onClick={() => navigate("/")}>Back to Dashboard</Button>
        <Button onClick={() => navigate(-1)}>Go back</Button>
      </Stack>
    </Box>
  );
}
