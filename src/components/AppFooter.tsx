import { Box, Divider, Stack, Tooltip, Typography } from "@mui/material";

/**
 * The build stamp, on every authenticated screen.
 *
 * Its job is to answer "which build am I looking at?" without anyone
 * having to open devtools — the first question asked of any bug report,
 * and the one that decides whether a report is about code that is still
 * deployed. All four values are compile-time literals injected by
 * `define` in vite.config.ts, so this costs no request and cannot drift
 * from the bundle it ships inside.
 */

/** ISO timestamp -> "09 Sep 2026, 14:32" in the reader's own timezone. */
function formatBuildTime(iso: string): string {
  const built = new Date(iso);
  if (Number.isNaN(built.getTime())) return iso;
  return built.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppFooter() {
  const isRelease = __BUILD_MODE__ === "production";
  const buildTime = formatBuildTime(__BUILD_TIME__);

  return (
    <Box
      component="footer"
      sx={{
        flexShrink: 0,
        px: { xs: 2, sm: 3 },
        py: 0.75,
        backgroundColor: "#F9FAFB",
        borderTop: "1px solid #E5E7EB",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ flexWrap: "wrap", gap: 1 }}
      >
        <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
          © {new Date().getFullYear()} NikERP.cloud
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          divider={<Divider orientation="vertical" flexItem sx={{ borderColor: "#D1D5DB" }} />}
          spacing={1.25}
          sx={{ flexWrap: "wrap", rowGap: 0.5 }}
        >
          <Typography
            sx={{
              fontSize: "0.7rem",
              color: "text.secondary",
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            v{__APP_VERSION__}
          </Typography>

          <Tooltip title={`Commit ${__GIT_COMMIT__}`}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: "text.secondary",
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              build {__GIT_COMMIT__}
            </Typography>
          </Tooltip>

          <Tooltip title={`Built ${__BUILD_TIME__}`}>
            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
              {buildTime}
            </Typography>
          </Tooltip>

          {/* Only shown off production: on a release build the absence of a
              badge is the signal, and a permanent "production" label is
              noise on every screen. */}
          {!isRelease && (
            <Typography
              sx={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                color: "warning.main",
              }}
            >
              {__BUILD_MODE__}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
