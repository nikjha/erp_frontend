import { type ReactNode, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, AppBar, Toolbar, Avatar, IconButton, Menu, MenuItem, Divider, Alert,
  Button, Typography, Tooltip, Popover, ListItemIcon, ListItemText, Drawer,
  List, ListItem, ListItemButton, Collapse,
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
import MenuIcon from "@mui/icons-material/Menu";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

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

  function toggleGroup(groupName: string) {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Enhanced AppBar with modern design matching the screenshots */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: tokens.rail,
          color: tokens.railInk,
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Toolbar variant="dense" sx={{ gap: 1.5, minHeight: 48, px: { xs: 2, sm: 3 } }}>
          {/* Mobile Hamburger Menu */}
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{
              display: { xs: "inline-flex", md: "none" },
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Desktop Apps Icon */}
          <Tooltip title="All apps">
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => setAppsAnchor(e.currentTarget)}
              sx={{
                display: { xs: "none", md: "inline-flex" },
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <AppsIcon />
            </IconButton>
          </Tooltip>

          <Box
            component="img"
            src={logo}
            alt="NikERP.cloud"
            sx={{
              height: 26,
              width: "auto",
              cursor: "pointer",
              mr: 2,
            }}
            onClick={() => navigate("/")}
          />

          {/* Current app name, then its screens as dropdowns - Desktop only */}
          {activeGroup && !isSettings && (
            <Typography
              variant="subtitle2"
              sx={{
                display: { xs: "none", md: "block" },
                mr: 1.5,
                opacity: 0.95,
                fontWeight: 600,
                fontSize: "0.72rem",
              }}
            >
              {activeGroup.name}
            </Typography>
          )}

          <Button
            size="small"
            color="inherit"
            startIcon={<DashboardIcon fontSize="small" sx={{ display: { xs: "none", sm: "inline-block" } }} />}
            onClick={() => navigate("/")}
            sx={{
              display: { xs: "none", md: "inline-flex" },
              textTransform: "none",
              opacity: location.pathname === "/" ? 1 : 0.8,
              fontWeight: location.pathname === "/" ? 600 : 400,
              fontSize: "0.86rem",
              py: 0.5,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
                opacity: 1,
              },
            }}
          >
            Dashboard
          </Button>

          {activeGroup && (
            <Button
              size="small"
              color="inherit"
              endIcon={<ExpandMoreIcon fontSize="small" />}
              onClick={(e) => setOpenGroup({ name: activeGroup.name, anchor: e.currentTarget })}
              sx={{
                display: { xs: "none", md: "inline-flex" },
                textTransform: "none",
                fontSize: "0.86rem",
                py: 0.5,
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              {activeGroup.name === "Administration" ? "Records" : activeGroup.name}
            </Button>
          )}

          <Button
            size="small"
            color="inherit"
            endIcon={<ExpandMoreIcon fontSize="small" />}
            onClick={(e) => setOpenGroup({ name: "__settings", anchor: e.currentTarget })}
            sx={{
              display: { xs: "none", md: "inline-flex" },
              textTransform: "none",
              opacity: isSettings ? 1 : 0.8,
              fontWeight: isSettings ? 600 : 400,
              fontSize: "0.86rem",
              py: 0.5,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
                opacity: 1,
              },
            }}
          >
            Configuration
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <NotificationsMenu />

          <IconButton
            size="small"
            color="inherit"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
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
        slotProps={{
          paper: {
            sx: {
              minWidth: 240,
              mt: 1,
              borderRadius: 2,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              overflow: "visible",
              "&::before": {
                content: '""',
                position: "absolute",
                top: -8,
                left: "10%",
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: "8px solid white",
              },
            }
          }
        }}
      >
        {openGroup?.name === "__settings"
          ? [
              <MenuItem
                key="modules"
                selected={location.pathname === "/settings/modules"}
                onClick={() => { setOpenGroup(null); navigate("/settings/modules"); }}
                sx={{
                  py: 0.875,
                  px: 1.5,
                  fontSize: "0.86rem",
                  "&:hover": {
                    backgroundColor: "#F3F4F6",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#EEF2FF",
                    "&:hover": {
                      backgroundColor: "#E0E7FF",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <SettingsIcon sx={{ fontSize: 13, color: "#6B7280" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Apps & Modules"
                  primaryTypographyProps={{
                    fontSize: "0.86rem",
                    fontWeight: 500,
                  }}
                />
              </MenuItem>,
            ]
          : groups
              .find((g) => g.name === openGroup?.name)
              ?.modules.map((m) => (
                <MenuItem
                  key={m.key}
                  selected={location.pathname.startsWith(`/${m.key}`)}
                  onClick={() => { setOpenGroup(null); navigate(`/${m.key}`); }}
                  sx={{
                    py: 0.875,
                    px: 1.5,
                    fontSize: "0.86rem",
                    "&:hover": {
                      backgroundColor: "#F3F4F6",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "#EEF2FF",
                      "&:hover": {
                        backgroundColor: "#E0E7FF",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24, "& svg": { fontSize: 13 } }}>
                    {ICONS[m.icon ?? ""] ?? GROUP_ICONS[openGroup?.name ?? ""] ?? <BusinessIcon sx={{ fontSize: 13, color: "#6B7280" }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={m.label}
                    primaryTypographyProps={{
                      fontSize: "0.86rem",
                      fontWeight: 500,
                    }}
                  />
                </MenuItem>
              ))}
      </Menu>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <Box sx={{ width: 280, bgcolor: "background.paper", height: "100%" }}>
          {/* Drawer Header */}
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box component="img" src={logo} alt="NikERP.cloud" sx={{ height: 28, width: "auto" }} />
          </Box>

          <List sx={{ pt: 1 }}>
            {/* Dashboard */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate("/");
                  setMobileDrawerOpen(false);
                }}
                selected={location.pathname === "/"}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {/* Module Groups */}
            {groups.map((group) => (
              <Box key={group.name}>
                <ListItemButton onClick={() => toggleGroup(group.name)}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {GROUP_ICONS[group.name] ?? <BusinessIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={group.name}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: "0.86rem" }}
                  />
                  {expandedGroups.includes(group.name) ? <ExpandLessIcon /> : <ChevronRightIcon />}
                </ListItemButton>

                <Collapse in={expandedGroups.includes(group.name)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {group.modules.map((m) => (
                      <ListItemButton
                        key={m.key}
                        sx={{ pl: 4 }}
                        selected={location.pathname.startsWith(`/${m.key}`)}
                        onClick={() => {
                          navigate(`/${m.key}`);
                          setMobileDrawerOpen(false);
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {ICONS[m.icon ?? ""] ?? <BusinessIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={m.label}
                          primaryTypographyProps={{ fontSize: "0.86rem" }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ))}

            <Divider sx={{ my: 1 }} />

            {/* Configuration */}
            <ListItemButton onClick={() => toggleGroup("__settings")}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Configuration"
                primaryTypographyProps={{ fontWeight: 600, fontSize: "0.86rem" }}
              />
              {expandedGroups.includes("__settings") ? <ExpandLessIcon /> : <ChevronRightIcon />}
            </ListItemButton>

            <Collapse in={expandedGroups.includes("__settings")} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={location.pathname === "/settings/modules"}
                  onClick={() => {
                    navigate("/settings/modules");
                    setMobileDrawerOpen(false);
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Apps & Modules"
                    primaryTypographyProps={{ fontSize: "0.86rem" }}
                  />
                </ListItemButton>
              </List>
            </Collapse>

            <Divider sx={{ my: 1 }} />

            {/* User Account */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  logout();
                  navigate("/login");
                  setMobileDrawerOpen(false);
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: 12 }}>
                    {(user?.employee_name || user?.username || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={user?.employee_name || user?.username}
                  secondary="Sign out"
                  primaryTypographyProps={{ fontSize: "0.86rem" }}
                  secondaryTypographyProps={{ fontSize: "0.75rem" }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

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
