import { Box, Typography, Paper, Stack, Switch, Chip, Divider, Alert } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TuneIcon from "@mui/icons-material/Tune";
import { useSnackbar } from "notistack";
import { useModuleStatus } from "../hooks/useModuleStatus";

const ICONS: Record<string, React.ReactNode> = {
  People: <PeopleIcon />,
  ReceiptLong: <ReceiptLongIcon />,
  ShoppingCart: <ShoppingCartIcon />,
  Tune: <TuneIcon />,
};

const DESCRIPTIONS: Record<string, string> = {
  administration: "Companies, users, and workspace settings. Always on — the platform needs this to function.",
  masters: "Currencies, units of measure, taxes, payment terms, price lists, products, and the customer/vendor directory. Sales and Purchase depend on this data.",
  sales: "Quotations, sales orders, invoices, and returns.",
  purchase: "Requisitions, RFQs, purchase orders, goods receipts, vendor bills, and returns.",
};

export default function ModuleSettingsPage() {
  const { modules, isLoading, toggle } = useModuleStatus();
  const { enqueueSnackbar } = useSnackbar();

  async function handleToggle(code: string, name: string, next: boolean) {
    try {
      await toggle(code, next);
      enqueueSnackbar(`${name} ${next ? "enabled" : "disabled"}`, { variant: "success" });
    } catch {
      enqueueSnackbar(`Couldn't update ${name}`, { variant: "error" });
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>Apps & Modules</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Turn business apps on or off for this workspace. Disabling an app hides it from navigation and
        blocks its API — existing data is kept and reappears if you re-enable it later.
      </Typography>

      {!isLoading && modules.length === 0 && (
        <Alert severity="info">No modules found. Ask an admin to seed the module catalog.</Alert>
      )}

      <Paper variant="outlined">
        <Stack divider={<Divider />}>
          {modules.map((m) => (
            <Stack
              key={m.code} direction="row" alignItems="center" justifyContent="space-between"
              sx={{ p: 2 }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ color: "text.secondary", mt: 0.5 }}>{ICONS[m.icon] ?? <BusinessIcon />}</Box>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">{m.name}</Typography>
                    {m.is_core && <Chip size="small" label="Core" color="secondary" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
                    {DESCRIPTIONS[m.code] ?? ""}
                  </Typography>
                </Box>
              </Stack>
              <Switch
                checked={m.is_enabled}
                disabled={m.is_core}
                onChange={(e) => handleToggle(m.code, m.name, e.target.checked)}
              />
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
