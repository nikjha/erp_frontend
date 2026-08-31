import { type ReactNode, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, AppBar, Toolbar, Avatar, IconButton, Menu, MenuItem, Divider, Alert,
  Button, Typography, Tooltip, Popover, ListItemIcon, ListItemText,
} from "@mui/material";
import AppsIcon from "@mui/icons-material/Apps";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TuneIcon from "@mui/icons-material/Tune";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

import { moduleRegistry } from "../config/registry";
import { useAuth } from "../context/useAuth";
import { useModuleStatus } from "../hooks/useModuleStatus";
import { tokens } from "../theme";
import type { ModuleConfig } from "../types/module";
import NotificationsMenu from "./NotificationsMenu";
import logo from "../assets/nikerp-logo.png";

const ICONS: Record<string, ReactNode> = {
  Business: <BusinessIcon fontSize="small" />,
  People: <PeopleIcon fontSize="small" />,
  TaskAlt: <TaskAltIcon fontSize="small" />,
};

const GROUP_ORDER = ["Sales", "Purchase", "Masters", "Administration", "General"];
const GROUP_ICONS: Record<string, ReactNode> = {
  Sales: <ReceiptLongIcon />,
  Purchase: <ShoppingCartIcon />,
  Masters: <TuneIcon />,
  Administration: <PeopleIcon />,
  General: <Inventory2Icon />,
};

const GROUP_BLURBS: Record<string, string> = {
  Sales: "Quotations, orders, invoices",
  Purchase: "Requisitions, POs, bills",
  Masters: "Products, partners, tax setup",
  Administration: "Companies, users, settings",
  General: "Everything else",
};

interface AppGroup {
  name: string;
  modules: ModuleConfig[];
}

function groupModules(modules: ModuleConfig[], isEnabled: (code: string) => boolean): AppGroup[] {
  const groups: Record<string, ModuleConfig[]> = {};
  for (const m of modules) {
    if (m.hideFromNav) continue;
    const g = m.group || "General";
    if (!isEnabled((m.moduleCode ?? g).toLowerCase())) continue;
    groups[g] = groups[g] || [];
    groups[g].push(m);
  }
  return GROUP_ORDER.filter((g) => groups[g]?.length).map((g) => ({ name: g, modules: groups[g] }));
}

/**
 * Odoo-style chrome: an app switcher on the left of a single top bar, the
 * current app's screens as dropdown menus beside it, and the systray
 * (notifications, account) on the right.
 *
 * The left rail is gone deliberately — with 18+ registered modules it had
 * become a scrolling list of every screen in the product, and it spent
 * 230px of every page on navigation the user wasn't using. Picking an app
 * first and its screens second keeps the menu proportional to what you're
 * actually doing, and hands the width back to the data.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isEnabled } = useModuleStatus();

  const [appsAnchor, setAppsAnchor] = useState<null | HTMLElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [openGroup, setOpenGroup] = useState<{ name: string; anchor: HTMLElement } | null>(null);

  const groups = useMemo(() => groupModules(moduleRegistry, isEnabled), [isEnabled]);

  // Which app the current URL belongs to — that's the one whose menus the
  // bar shows, so navigating to a record keeps its app's menu in place.
  const activeGroup = useMemo(() => {
    const segment = location.pathname.split("/")[1];
    const match = groups.find((g) => g.modules.some((m) => m.key === segment));
    return match ?? groups[0];
  }, [location.pathname, groups]);

  const isSettings = location.pathname.startsWith("/settings");

  function openApp(group: AppGroup) {
    setAppsAnchor(null);
    if (group.modules[0]) navigate(`/${group.modules[0].key}`);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: tokens.rail, color: tokens.railInk }}>
        <Toolbar variant="dense" sx={{ gap: 1, minHeight: 48 }}>
          <Tooltip title="All apps">
            <IconButton size="small" color="inherit" onClick={(e) => setAppsAnchor(e.currentTarget)}>
              <AppsIcon />
            </IconButton>
          </Tooltip>

          <Box
            component="img" src={logo} alt="NikERP.cloud"
            sx={{ height: 24, width: "auto", cursor: "pointer", mr: 1 }}
            onClick={() => navigate("/")}
          />

          {/* Current app name, then its screens as dropdowns. */}
          {activeGroup && !isSettings && (
            <Typography variant="subtitle2" sx={{ mr: 1.5, opacity: 0.9 }}>
              {activeGroup.name}
            </Typography>
          )}

          <Button
            size="small" color="inherit" startIcon={<DashboardIcon fontSize="small" />}
            onClick={() => navigate("/")}
            sx={{ textTransform: "none", opacity: location.pathname === "/" ? 1 : 0.75 }}
          >
            Dashboard
          </Button>

          {activeGroup && (
            <Button
              size="small" color="inherit" endIcon={<ExpandMoreIcon fontSize="small" />}
              onClick={(e) => setOpenGroup({ name: activeGroup.name, anchor: e.currentTarget })}
              sx={{ textTransform: "none" }}
            >
              {activeGroup.name === "Administration" ? "Records" : activeGroup.name}
            </Button>
          )}

          <Button
            size="small" color="inherit" endIcon={<ExpandMoreIcon fontSize="small" />}
            onClick={(e) => setOpenGroup({ name: "__settings", anchor: e.currentTarget })}
            sx={{ textTransform: "none", opacity: isSettings ? 1 : 0.75 }}
          >
            Configuration
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <NotificationsMenu />

          <IconButton size="small" color="inherit" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: 13 }}>
              {(user?.employee_name || user?.username || "?").slice(0, 1).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled>{user?.employee_name || user?.username}</MenuItem>
            <Divider />
            <MenuItem onClick={() => { setMenuAnchor(null); navigate("/settings/modules"); }}>
              Apps &amp; Modules
            </MenuItem>
            <MenuItem onClick={() => { logout(); navigate("/login"); }}>Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* App switcher grid */}
      <Popover
        open={!!appsAnchor}
        anchorEl={appsAnchor}
        onClose={() => setAppsAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { p: 2, width: 420 } } }}
      >
        <Typography variant="overline" color="text.secondary">Apps</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 1 }}>
          {groups.map((group) => (
            <Box
              key={group.name}
              onClick={() => openApp(group)}
              sx={{
                display: "flex", gap: 1.5, alignItems: "flex-start", p: 1.5, borderRadius: 1,
                cursor: "pointer", "&:hover": { bgcolor: "action.hover" },
                bgcolor: activeGroup?.name === group.name ? "action.selected" : undefined,
              }}
            >
              <Box sx={{ color: "primary.main", mt: 0.25 }}>{GROUP_ICONS[group.name] ?? <BusinessIcon />}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">{group.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {GROUP_BLURBS[group.name] ?? `${group.modules.length} screens`}
                </Typography>
              </Box>
            </Box>
          ))}
          <Box
            onClick={() => { setAppsAnchor(null); navigate("/settings/modules"); }}
            sx={{
              display: "flex", gap: 1.5, alignItems: "flex-start", p: 1.5, borderRadius: 1,
              cursor: "pointer", "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ color: "text.secondary", mt: 0.25 }}><SettingsIcon /></Box>
            <Box>
              <Typography variant="subtitle2">Settings</Typography>
              <Typography variant="caption" color="text.secondary">Turn apps on or off</Typography>
            </Box>
          </Box>
        </Box>
      </Popover>

      {/* The active app's screens, and the Configuration menu. */}
      <Menu
        anchorEl={openGroup?.anchor}
        open={!!openGroup}
        onClose={() => setOpenGroup(null)}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        {openGroup?.name === "__settings"
          ? [
              <MenuItem
                key="modules"
                selected={location.pathname === "/settings/modules"}
                onClick={() => { setOpenGroup(null); navigate("/settings/modules"); }}
              >
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Apps & Modules" />
              </MenuItem>,
            ]
          : groups
              .find((g) => g.name === openGroup?.name)
              ?.modules.map((m) => (
                <MenuItem
                  key={m.key}
                  selected={location.pathname.startsWith(`/${m.key}`)}
                  onClick={() => { setOpenGroup(null); navigate(`/${m.key}`); }}
                >
                  <ListItemIcon>
                    {ICONS[m.icon ?? ""] ?? GROUP_ICONS[openGroup?.name ?? ""] ?? <BusinessIcon fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary={m.label} />
                </MenuItem>
              ))}
      </Menu>

      <Box sx={{ flexGrow: 1, overflow: "auto", bgcolor: "background.default" }}>
        {!user?.home_tenant && (
          <Alert severity="warning" sx={{ borderRadius: 0 }}>
            Your account has no tenant assigned (<code>home_tenant</code> is empty), so create/update
            requests will be rejected. Ask an admin to set it under Django Admin → Accounts → Users,
            then sign out and back in here.
          </Alert>
        )}
        {children}
      </Box>
    </Box>
  );
}
