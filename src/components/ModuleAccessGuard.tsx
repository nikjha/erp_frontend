import { Box, Typography, Button, Stack } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useNavigate } from "react-router-dom";
import { useModuleStatus } from "../hooks/useModuleStatus";
import { moduleCodeOf, type ModuleConfig } from "../types/module";

interface Props {
  module: ModuleConfig;
  children: React.ReactNode;
}

export default function ModuleAccessGuard({ module, children }: Props) {
  const navigate = useNavigate();
  const { isEnabled, isLoading } = useModuleStatus();

  if (isLoading) return null;

  // Same resolution the nav and the server use, so a screen can't be
  // reachable in one place and blocked in another.
  if (!isEnabled(moduleCodeOf(module))) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <LockIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
        <Typography variant="h6">This app is disabled</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {module.group} is turned off for this workspace. An admin can re-enable it under Apps & Modules.
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="outlined" onClick={() => navigate("/settings/modules")}>Go to Apps & Modules</Button>
          <Button onClick={() => navigate("/")}>Back to Dashboard</Button>
        </Stack>
      </Box>
    );
  }

  return <>{children}</>;
}
