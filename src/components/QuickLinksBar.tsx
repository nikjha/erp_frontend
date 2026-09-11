import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { getModule } from "../config/registry";
import { moduleCodeOf } from "../types/module";
import { useModuleStatus } from "../hooks/useModuleStatus";

/**
 * One shortcut in the bar.
 *
 * `module` is a registry key rather than a URL so a link can never point
 * at a screen that doesn't exist or at an app the workspace has switched
 * off — both are checked before it renders. `create: true` opens that
 * module's new-record form instead of its list.
 *
 * A link with no `module` is a shortcut we've named but have nowhere to
 * send yet (there is no Leads or Reports module in the registry). It is
 * kept here deliberately, and simply doesn't render: when those modules
 * land, filling in the key is the whole change.
 */
interface QuickLink {
  label: string;
  module?: string;
  create?: boolean;
}

const QUICK_LINKS: QuickLink[] = [
  { label: "New Customers", module: "parties", create: true },
  { label: "New Leads" },
  { label: "Quotations", module: "sales-quotations" },
  { label: "Invoices", module: "sales-invoices" },
  { label: "Products", module: "products" },
  { label: "Reports" },
  { label: "Activities", module: "todos" },
];

interface Resolved {
  label: string;
  path: string;
}

/**
 * The row of shortcuts under the app bar.
 *
 * These were seven identically-styled buttons with no `onClick` — they
 * looked like navigation and did nothing when clicked. Driving them from
 * one list means each has a real destination, the destination is checked
 * against the registry, and the desktop and mobile rows can't drift apart
 * (they were separate copies of the same seven buttons before).
 */
export default function QuickLinksBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isEnabled } = useModuleStatus();

  const links = useMemo<Resolved[]>(
    () =>
      QUICK_LINKS.flatMap((link) => {
        if (!link.module) return [];
        const target = getModule(link.module);
        // Unregistered, hidden, or switched off for this workspace: a
        // shortcut to a screen the user can't open is worse than none.
        if (!target || target.hideFromNav) return [];
        if (!isEnabled(moduleCodeOf(target))) return [];
        return [{ label: link.label, path: `/${target.key}${link.create ? "/new" : ""}` }];
      }),
    [isEnabled]
  );

  if (links.length === 0) return null;

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 0.45,
          backgroundColor: "#F9FAFB",
          borderBottom: "1px solid #E5E7EB",
          display: { xs: "none", md: "flex" },
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography sx={{ color: "text.primary", fontSize: "0.75rem", fontWeight: 700, pl: 1 }}>
            Quick Links
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "#D1D5DB", borderWidth: 1 }} />
          {links.map((link) => (
            <Button
              key={link.label}
              size="small"
              onClick={() => navigate(link.path)}
              sx={{
                textTransform: "none",
                color: isCurrent(link.path) ? "primary.main" : "text.secondary",
                fontSize: "0.75rem",
                fontWeight: isCurrent(link.path) ? 600 : 400,
                minHeight: 0,
                py: 0.3,
                "&:hover": { backgroundColor: "transparent", color: "primary.main" },
              }}
            >
              {link.label}
            </Button>
          ))}
          <Divider orientation="vertical" flexItem sx={{ borderColor: "#D1D5DB", borderWidth: 1 }} />
        </Stack>
        {/* Left inert on purpose: there is no help or documentation screen
            in the product yet, and the API's Swagger page (a) lives on
            another origin and (b) isn't end-user help. Give it a
            destination the day one exists. */}
        <Button
          size="small"
          startIcon={<HelpOutlineIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: "none",
            color: "text.secondary",
            fontSize: "0.75rem",
            fontWeight: 400,
            minHeight: 0,
            py: 0.3,
            "&:hover": { backgroundColor: "transparent", color: "primary.main" },
          }}
        >
          Need Help?
        </Button>
      </Box>

      {/* Mobile — the same links, scrolled sideways rather than wrapped. */}
      <Box
        sx={{
          backgroundColor: "#F9FAFB",
          borderBottom: "1px solid #E5E7EB",
          display: { xs: "flex", md: "none" },
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            color: "text.primary",
            fontSize: "0.7rem",
            fontWeight: 700,
            pl: 1.5,
            pr: 1,
            py: 0.75,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          Quick Links
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ borderColor: "#D1D5DB" }} />
        <Box
          sx={{
            overflowX: "auto",
            display: "flex",
            alignItems: "center",
            flexGrow: 1,
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {links.map((link) => (
            <Button
              key={link.label}
              size="small"
              onClick={() => navigate(link.path)}
              sx={{
                textTransform: "none",
                color: isCurrent(link.path) ? "primary.main" : "text.secondary",
                fontSize: "0.7rem",
                fontWeight: isCurrent(link.path) ? 600 : 400,
                minWidth: "auto",
                minHeight: 0,
                py: 0.75,
                px: 1.5,
                whiteSpace: "nowrap",
                borderRadius: 0,
                "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)", color: "primary.main" },
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>
      </Box>
    </>
  );
}
