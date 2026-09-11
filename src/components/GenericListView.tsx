import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel,
  type GridSortModel,
  type GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import {
  Box, Typography, TextField, IconButton, Button, Menu, MenuItem,
  Chip, Checkbox, ListItemText, ListItemIcon, Tooltip, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Accordion, AccordionSummary,
  AccordionDetails, FormControlLabel, Switch, Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import FilterListIcon from "@mui/icons-material/FilterList";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BusinessIcon from "@mui/icons-material/Business";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Avatar from "@mui/material/Avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import type { ModuleConfig, SavedView, FilterCondition, FieldConfig } from "../types/module";
import { GenericApi } from "../api/genericApi";
import { intentHeaders } from "../api/client";
import { useSavedViews } from "../hooks/useSavedViews";
import { useMyPermissions } from "../hooks/useMyPermissions";
import { exportRecords, parseImportFile } from "../utils/importExport";
import { buildFilterParams, describeCondition, newCondition } from "../utils/filters";
import BulkActionsToolbar from "./BulkActionsToolbar";
import ImportDialog from "./ImportDialog";
import FilterBuilder from "./FilterBuilder";
import QuickLinksBar from "./QuickLinksBar";

/**
 * Generate consistent color for a given string using hash
 */
function stringToColor(str: string): string {
  const colors = [
    "#6366F1", // Indigo
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#3B82F6", // Blue
    "#F97316", // Orange
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Converts a module field configuration to a DataGrid column definition.
 * Handles different field types (boolean, datetime, date, select) with custom rendering.
 * Enhanced with improved status chip styling and color coding.
 */
function fieldToColumn(field: ModuleConfig["fields"][number]): GridColDef {
  const base: GridColDef = {
    field: field.name,
    headerName: field.label,
    width: field.width ?? 150,
    sortable: field.sortable ?? false,
    filterable: false, // filtering handled by our own dynamic filter builder (server-side)
    align: "left",
    headerAlign: "left",
  };

  // Special handling for name/company field - add avatar with initials
  if (field.name === "name" || field.label.toLowerCase().includes("company")) {
    return {
      ...base,
      width: field.width ?? 250,
      renderCell: (params) => {
        const name = String(params.value ?? "");
        if (!name) return "";
        const initials = getInitials(name);
        const bgColor = stringToColor(name);

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 26,
                height: 26,
                backgroundColor: bgColor,
                fontSize: "0.7rem",
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <Box component="span" sx={{ fontWeight: 500 }}>
              {name}
            </Box>
          </Box>
        );
      },
    };
  }

  // Add icon for type field
  if (field.name === "type" || field.label.toLowerCase() === "type") {
    return {
      ...base,
      renderCell: (params) => {
        const value = params.value;
        if (!value) return "";
        const isCustomer = String(value).toLowerCase().includes("customer");
        const isVendor = String(value).toLowerCase().includes("vendor");

        return (
          <Chip
            label={String(value)}
            size="small"
            variant="outlined"
            sx={{
              borderRadius: "16px",
              backgroundColor: isCustomer ? "#E0E7FF" : isVendor ? "#F3E8FF" : "#F3F4F6",
              borderColor: isCustomer ? "#818CF8" : isVendor ? "#C084FC" : "#D1D5DB",
              color: isCustomer ? "#4338CA" : isVendor ? "#7C3AED" : "#6B7280",
              fontWeight: 500,
              fontSize: "0.75rem",
            }}
          />
        );
      },
    };
  }

  // Add icon for location field
  if (field.name === "location" || field.label.toLowerCase().includes("location") || field.label.toLowerCase().includes("address")) {
    return {
      ...base,
      renderCell: (params) => {
        if (!params.value) return "";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 16, color: "#6B7280" }} />
            <Box component="span" sx={{ color: "text.secondary" }}>
              {String(params.value)}
            </Box>
          </Box>
        );
      },
    };
  }

  // Add icon for email field
  if (field.name === "email" || field.label.toLowerCase() === "email") {
    return {
      ...base,
      renderCell: (params) => {
        if (!params.value) return "";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <EmailOutlinedIcon sx={{ fontSize: 16, color: "#6B7280" }} />
            <Box component="span" sx={{ color: "text.secondary" }}>
              {String(params.value)}
            </Box>
          </Box>
        );
      },
    };
  }

  if (field.type === "boolean") {
    // Enhanced boolean rendering with "Yes"/"No" chips
    return {
      ...base,
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) return "";
        const isYes = Boolean(params.value);
        return (
          <Chip
            size="small"
            label={isYes ? "Yes" : "No"}
            sx={{
              backgroundColor: isYes ? "#D1FAE5" : "#FEE2E2",
              color: isYes ? "#065F46" : "#991B1B",
              fontWeight: 600,
            }}
          />
        );
      },
    };
  }

  if (field.type === "datetime" || field.type === "date") {
    return {
      ...base,
      valueFormatter: (value: unknown) => (value ? new Date(value as string).toLocaleString() : ""),
    };
  }

  // Enhanced select field rendering with color-coded status chips with dot indicator
  if (field.type === "select") {
    return {
      ...base,
      renderCell: (params) => {
        const opt = field.options?.find((o) => o.value === params.value);
        const label = opt?.label ?? String(params.value ?? "");
        const value = String(params.value ?? "").toLowerCase();

        // Color mapping for common status values based on the design screenshots
        let dotColor = "#6366F1"; // Default purple/indigo

        // Status-specific color schemes matching the design
        if (value === "active" || value === "completed" || value === "confirmed" || value === "paid" || value === "shipped") {
          dotColor = "#10B981"; // Green
        } else if (value === "inactive" || value === "pending" || value === "pending_approval") {
          dotColor = "#F59E0B"; // Orange/Yellow
        } else if (value === "blocked" || value === "cancelled" || value === "rejected" || value === "overdue") {
          dotColor = "#EF4444"; // Red
        } else if (value === "draft") {
          dotColor = "#6B7280"; // Gray
        } else if (value === "processing" || value === "partially_paid" || value === "partially_delivered") {
          dotColor = "#3B82F6"; // Blue
        }

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: dotColor,
                flexShrink: 0,
              }}
            />
            <Box component="span">
              {label}
            </Box>
          </Box>
        );
      },
    };
  }

  return base;
}

interface Props {
  module: ModuleConfig;
}

const UNGROUPED = "— None —";

/**
 * Filter fields every screen gets for free.
 *
 * Both columns come from `core.models.AuditModel`, so every record in the
 * product has them, and "show me what came in between these two dates" is
 * asked of every list there is. Offering them here rather than repeating
 * them in twenty ModuleConfigs means no screen can be missing date
 * filtering — and a module that declares `created_date` itself still wins,
 * so it can relabel or re-type the field on its own terms.
 */
const AUDIT_DATE_FILTERS: FieldConfig[] = [
  { name: "created_date", label: "Created On", type: "datetime", filterable: true },
  { name: "modified_date", label: "Last Modified", type: "datetime", filterable: true },
];

export default function GenericListView({ module }: Props) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const api = useMemo(() => new GenericApi(module.endpoint), [module.endpoint]);
  const { views, save: saveView, remove: removeView, toggleFavorite } = useSavedViews(module.key);
  const { canModule } = useMyPermissions();

  const canImport = canModule(module, "can_import");
  const canExport = canModule(module, "can_export");
  const canDelete = canModule(module, "can_delete");
  const canCreate = canModule(module, "can_create");

  const listFields = useMemo(() => module.fields.filter((f) => f.showInList), [module.fields]);
  const filterableFields = useMemo(() => {
    const declared = module.fields.filter((f) => f.filterable);
    const extras = AUDIT_DATE_FILTERS.filter(
      (audit) => !declared.some((f) => f.name === audit.name)
    ).map((audit) => {
      // A module that lists the column itself (Companies shows "Created")
      // keeps its own label and type — it just becomes filterable too, so
      // the filter and the column can't disagree about what they name.
      const own = module.fields.find((f) => f.name === audit.name);
      return own ? { ...own, filterable: true } : audit;
    });
    return [...declared, ...extras];
  }, [module.fields]);
  const groupableFields = useMemo(
    // A field is groupable when it's marked so, or when it's a low-cardinality
    // type where grouping is obviously meaningful anyway.
    () => module.fields.filter((f) => f.groupable || f.type === "select" || f.type === "boolean"),
    [module.fields]
  );

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortModel, setSortModel] = useState<GridSortModel>(
    module.defaultOrdering
      ? [{ field: module.defaultOrdering.replace("-", ""), sort: module.defaultOrdering.startsWith("-") ? "desc" : "asc" }]
      : []
  );
  const [search, setSearch] = useState("");
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [selection, setSelection] = useState<GridRowSelectionModel>([]);
  const [colVisibility, setColVisibility] = useState<GridColumnVisibilityModel>({});
  const [colDialogOpen, setColDialogOpen] = useState(false);
  const [pendingColVisibility, setPendingColVisibility] = useState<GridColumnVisibilityModel>({});
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewsMenuAnchor, setViewsMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [pendingConditions, setPendingConditions] = useState<FilterCondition[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewShared, setNewViewShared] = useState(false);

  const ordering = sortModel.length ? `${sortModel[0].sort === "desc" ? "-" : ""}${sortModel[0].field}` : module.defaultOrdering;
  const filterParams = useMemo(() => buildFilterParams(conditions), [conditions]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [module.key, "list", page, pageSize, ordering, search, filterParams],
    queryFn: () => api.list({ page: page + 1, pageSize, ordering, search, filters: filterParams }),
  });

  const rows = useMemo(() => data?.results ?? [], [data]);
  const columns: GridColDef[] = useMemo(() => [
    ...listFields.map(fieldToColumn),
  ], [listFields]);

  const handleBulkDelete = useCallback(async () => {
    const ids = selection.map(String);
    if (!ids.length) return;
    await api.bulkDelete(ids);
    enqueueSnackbar(`Deleted ${ids.length} record(s)`, { variant: "success" });
    setSelection([]);
    setDeleteConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: [module.key, "list"] });
  }, [selection, api, enqueueSnackbar, queryClient, module.key]);

  const handleExport = async (format: "csv" | "xlsx" | "json") => {
    setExportMenuAnchor(null);
    try {
      // Re-fetch with the export intent header so the server can check
      // can_export, and pull a full page rather than exporting only the
      // rows that happen to be on screen.
      const full = await api.list(
        { page: 1, pageSize: 1000, ordering, search, filters: filterParams },
        intentHeaders("export")
      );
      exportRecords(full.results, listFields, format, module.key);
      enqueueSnackbar(`Exported ${full.results.length} record(s)`, { variant: "success" });
    } catch {
      enqueueSnackbar("Export was refused — your role may not allow it.", { variant: "error" });
    }
  };

  const applySavedView = (view: SavedView) => {
    setColVisibility(
      Object.fromEntries(module.fields.map((f) => [f.name, view.columns.includes(f.name)]))
    );
    setConditions(view.filters ?? []);
    setGroupBy(view.group_by ?? []);
    setSortModel(view.sort_model ?? []);
    setPage(0);
    setViewsMenuAnchor(null);
  };

  const activeFilterCount = conditions.length;
  const selectedCount = selection.length;

  /** Rows bucketed by the current group-by fields (client-side, over the loaded page). */
  const groupedRows = useMemo(() => {
    if (groupBy.length === 0) return null;
    const buckets = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = groupBy
        .map((name) => {
          const field = module.fields.find((f) => f.name === name);
          const raw = row[name];
          if (raw === null || raw === undefined || raw === "") return UNGROUPED;
          if (field?.type === "boolean") return raw ? "Yes" : "No";
          const option = field?.options?.find((o) => String(o.value) === String(raw));
          return option?.label ?? String(raw);
        })
        .join(" · ");
      const bucket = buckets.get(key);
      if (bucket) bucket.push(row);
      else buckets.set(key, [row]);
    }
    return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows, groupBy, module.fields]);

  const isGrouped = groupBy.length > 0;

  // Enhanced DataGrid configuration with improved styling matching reference design
  const gridProps = {
    columns,
    // One selection model can't span several grids coherently, so grouped
    // mode is browse-only; ungroup to select and bulk-act on rows.
    checkboxSelection: !isGrouped,
    rowSelectionModel: isGrouped ? [] : selection,
    onRowSelectionModelChange: isGrouped ? undefined : setSelection,
    columnVisibilityModel: colVisibility,
    onColumnVisibilityModelChange: setColVisibility,
    onRowClick: (params: { id: string | number }) => navigate(`/${module.key}/${params.id}`),
    disableRowSelectionOnClick: true,
    disableColumnMenu: true,
    sx: {
      border: "none",
      backgroundColor: "background.paper",
      cursor: "pointer",
      "& .MuiDataGrid-cell": {
        display: "flex",
        alignItems: "center",
        py: 0,
        px: 2,
        borderBottom: "none",
        borderTop: "none",
      },
      "& .MuiDataGrid-columnHeaders": {
        backgroundColor: "#FAFAFA",
        borderBottom: "1px solid #E5E7EB",
        borderRadius: 0,
      },
      "& .MuiDataGrid-columnHeader": {
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: "none",
        padding: "0 12px",
        "&:focus": {
          outline: "none",
        },
        "&:focus-within": {
          outline: "none",
        },
      },
      "& .MuiDataGrid-columnHeader.MuiDataGrid-columnHeaderCheckbox": {
        padding: "0 5px",
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        fontWeight: 600,
      },
      "& .MuiDataGrid-columnSeparator": {
        display: "none",
      },
      "& .MuiDataGrid-columnSeparator--resizable": {
        height: "40px !important",
      },
      "& .MuiDataGrid-row": {
        minHeight: "36px !important",
        maxHeight: "36px !important",
        alignItems: "center",
        borderBottom: "1px solid #F3F4F6",
        "&:hover": {
          backgroundColor: "#F9FAFB",
        },
        "&.Mui-selected": {
          backgroundColor: "#EEF2FF",
          "&:hover": {
            backgroundColor: "#E0E7FF",
          },
        },
      },
      "& .MuiDataGrid-filler": {
        display: "none",
      },
      "& .MuiDataGrid-footerContainer": {
        borderTop: "1px solid #E5E7EB",
        backgroundColor: "#FFFFFF",
        minHeight: "40px !important",
        maxHeight: "40px !important",
        height: "40px !important",
        paddingRight: { sm: "2px" },
      },
      "& .MuiTablePagination-root": {
        color: "#6B7280",
      },
      "& .MuiTablePagination-toolbar": {
        minHeight: "40px !important",
        maxHeight: "40px !important",
        height: "40px !important",
      },
      "& .MuiTablePagination-select": {
        fontSize: "0.86rem",
      },
      "& .MuiTablePagination-selectLabel": {
        fontSize: "0.86rem",
        lineHeight: 1,
        margin: 0,
      },
      "& .MuiTablePagination-displayedRows": {
        fontSize: "0.86rem",
        color: "#6B7280",
        lineHeight: 1,
        margin: 0,
      },
      "& .MuiDataGrid-scrollbarFiller": {
        minHeight: "0 !important",
      },
      "& .MuiDataGrid-scrollbar--vertical .MuiDataGrid-scrollbarContent": {
        height: "calc(100% - 10px) !important",
      },
    },
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <QuickLinksBar />

      {/* Main Toolbar */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 3 },
          py: { xs: 0.75, sm: 1.25 },
          backgroundColor: "background.paper",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        {/* Desktop Layout */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 1, md: 1.5 }}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{
            justifyContent: "space-between",
            display: { xs: "none", md: "flex" }
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <BusinessIcon sx={{ color: "#6366F1", fontSize: { xs: 20, sm: 22 } }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                fontSize: { xs: "1rem", sm: "1.125rem" },
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {module.label}
              <Chip
                label={data?.count ?? 0}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "#F3F4F6",
                  color: "#6B7280",
                }}
              />
            </Typography>
          </Stack>

          <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center" sx={{ flex: { md: 1 }, justifyContent: { xs: "space-between", md: "flex-end" }, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
          <TextField
            size="small"
            placeholder={`Search ${module.label.toLowerCase()}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />,
            }}
            sx={{
              width: { xs: "100%", sm: 280, md: 380 },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#FFFFFF",
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "#F9FAFB",
                },
                "& fieldset": {
                  borderColor: "#E5E7EB",
                },
                "&:hover fieldset": {
                  borderColor: "#D1D5DB",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#6366F1",
                  borderWidth: "1px",
                },
              },
            }}
          />

          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: { sm: 1, md: 1.5 } }}>
            <Button
              size="medium"
              startIcon={<FilterListIcon sx={{ fontSize: 18 }} />}
              endIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
              variant="outlined"
              onClick={() => {
                setPendingConditions(
                  conditions.length ? conditions : [newCondition(filterableFields[0])]
                );
                setFilterDialogOpen(true);
              }}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                borderColor: "#E5E7EB",
                color: "#374151",
                fontWeight: 500,
                px: 2,
                fontSize: "0.86rem",
                "&:hover": {
                  borderColor: "#D1D5DB",
                  backgroundColor: "#F9FAFB",
                },
              }}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>

            <Button
              size="medium"
              startIcon={<WorkspacesIcon sx={{ fontSize: 18 }} />}
              endIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
              variant="outlined"
              onClick={(e) => setGroupMenuAnchor(e.currentTarget)}
              sx={{
                display: { xs: "none", md: "flex" },
                borderRadius: 2,
                textTransform: "none",
                borderColor: "#E5E7EB",
                color: "#374151",
                fontWeight: 500,
                px: 2,
                fontSize: "0.86rem",
                "&:hover": {
                  borderColor: "#D1D5DB",
                  backgroundColor: "#F9FAFB",
                },
              }}
            >
              Group by
            </Button>

            <Tooltip title="Saved Views">
              <IconButton
                size="small"
                onClick={(e) => setViewsMenuAnchor(e.currentTarget)}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #E5E7EB",
                  "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                }}
              >
                <BookmarkBorderIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Refresh">
              <IconButton
                size="small"
                onClick={() => refetch()}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #E5E7EB",
                  "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Show / hide columns">
              <IconButton
                size="small"
                onClick={() => {
                  setPendingColVisibility(colVisibility);
                  setColDialogOpen(true);
                }}
                sx={{
                  display: { xs: "none", lg: "inline-flex" },
                  borderRadius: 2,
                  border: "1px solid #E5E7EB",
                  "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                }}
              >
                <ViewColumnIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton
                size="small"
                onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #E5E7EB",
                  "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/${module.key}/new`)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                fontSize: "0.86rem",
                backgroundColor: "#6366F1",
                color: "#FFFFFF",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  backgroundColor: "#4F46E5",
                  boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
                },
              }}
            >
              New {module.labelSingular}
            </Button>
          )}
          </Stack>
        </Stack>

        {/* Mobile Layout */}
        <Stack
          direction="column"
          spacing={1}
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          {/* Title Row with Icons */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <BusinessIcon sx={{ color: "#6366F1", fontSize: 19 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {module.label}
                <Chip
                  label={data?.count ?? 0}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: "#F3F4F6",
                    color: "#6B7280",
                  }}
                />
              </Typography>
            </Stack>

            {/* Icon Buttons Row */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="Filters">
                <IconButton
                  size="small"
                  onClick={() => {
                    setPendingConditions(
                      conditions.length ? conditions : [newCondition(filterableFields[0])]
                    );
                    setFilterDialogOpen(true);
                  }}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid #E5E7EB",
                    width: 30,
                    height: 30,
                    "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                  }}
                >
                  <FilterListIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Group by">
                <IconButton
                  size="small"
                  onClick={(e) => setGroupMenuAnchor(e.currentTarget)}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid #E5E7EB",
                    width: 30,
                    height: 30,
                    "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                  }}
                >
                  <WorkspacesIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Saved Views">
                <IconButton
                  size="small"
                  onClick={(e) => setViewsMenuAnchor(e.currentTarget)}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid #E5E7EB",
                    width: 30,
                    height: 30,
                    "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                  }}
                >
                  <BookmarkBorderIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={() => refetch()}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid #E5E7EB",
                    width: 30,
                    height: 30,
                    "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                  }}
                >
                  <RefreshIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Settings">
                <IconButton
                  size="small"
                  onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid #E5E7EB",
                    width: 30,
                    height: 30,
                    "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
                  }}
                >
                  <SettingsIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Search and Button Row */}
          <Stack direction="row" spacing={0.75} alignItems="center">
            <TextField
              size="small"
              placeholder={`Search ${module.label.toLowerCase()}...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />,
              }}
              sx={{
                flexGrow: 1,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#FFFFFF",
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: "#F9FAFB",
                  },
                  "& fieldset": {
                    borderColor: "#E5E7EB",
                  },
                  "&:hover fieldset": {
                    borderColor: "#D1D5DB",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366F1",
                    borderWidth: "1px",
                  },
                },
              }}
            />

            {canCreate && (
              <Button
                variant="contained"
                onClick={() => navigate(`/${module.key}/new`)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  fontSize: "0.86rem",
                  backgroundColor: "#6366F1",
                  color: "#FFFFFF",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  minWidth: "auto",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: "#4F46E5",
                    boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                New
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {activeFilterCount > 0 && (
        <Stack direction="row" spacing={1} sx={{ px: 2, pb: 1, flexWrap: "wrap", gap: 1 }}>
          {conditions.map((condition) => (
            <Chip
              key={condition.id}
              size="small"
              // Look the field up in the same list the builder offered, or
              // a filter on a field the module doesn't declare (the audit
              // dates) would print its raw column name in the chip.
              label={describeCondition(condition, filterableFields.find((f) => f.name === condition.field))}
              onDelete={() => { setConditions(conditions.filter((c) => c.id !== condition.id)); setPage(0); }}
            />
          ))}
          <Chip size="small" variant="outlined" label="Clear all" onClick={() => { setConditions([]); setPage(0); }} />
        </Stack>
      )}

      {selectedCount > 0 && (
        <BulkActionsToolbar
          count={selectedCount}
          onDelete={canDelete ? () => setDeleteConfirmOpen(true) : undefined}
          onClear={() => setSelection([])}
        />
      )}

      <Box sx={{ flexGrow: 1, px: { xs: 0, sm: 2 }, pb: { xs: 0, sm: 2 } }}>
        {groupedRows ? (
          <Box sx={{ height: "100%" }}>
            <Alert severity="info" variant="outlined" sx={{ mb: 1.5, py: 0, mx: { xs: 2, sm: 0 } }}>
              Grouped by {groupBy.map((g) => module.fields.find((f) => f.name === g)?.label ?? g).join(" · ")} —
              across the {rows.length} record(s) loaded on this page. Ungroup to select rows.
            </Alert>

            {groupedRows.map(([key, groupRows]) => (
              <Accordion key={key} defaultExpanded disableGutters sx={{ mb: 1, boxShadow: "none", border: "1px solid #E5E7EB", borderRadius: 1, mx: { xs: 2, sm: 0 } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: "#FAFAFA",
                    borderBottom: "1px solid #E5E7EB",
                    minHeight: "40px !important",
                    maxHeight: "40px !important",
                    height: "40px !important",
                    "&.Mui-expanded": {
                      minHeight: "40px !important",
                      maxHeight: "40px !important",
                      height: "40px !important",
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>{key}</Typography>
                    <Chip size="small" label={groupRows.length} sx={{ height: 20, fontSize: "0.75rem" }} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, overflowX: { xs: "auto", md: "visible" } }}>
                  <Box sx={{ minWidth: { xs: "100%", md: "auto" } }}>
                    <DataGrid
                      {...gridProps}
                      rows={groupRows}
                      autoHeight
                      hideFooter
                      sx={{
                        ...gridProps.sx,
                        border: "none",
                        "& .MuiDataGrid-columnHeaders": {
                          display: "flex",
                        },
                        "& .MuiDataGrid-virtualScroller": {
                          overflowX: "visible !important",
                        },
                        "& .MuiDataGrid-main": {
                          overflowX: "visible !important",
                        },
                      }}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          <Box sx={{
            height: "100%",
            width: "100%",
            overflowX: { xs: "auto", md: "visible" },
            overflowY: "visible",
            "& .MuiDataGrid-root": { minWidth: { xs: "100%", md: "auto" } },
            "& .MuiDataGrid-virtualScroller": {
              overflowX: { xs: "visible !important", md: "auto !important" },
            },
            "& .MuiDataGrid-main": {
              overflowX: { xs: "visible !important", md: "auto !important" },
            },
          }}>
            <Box sx={{ minWidth: { xs: "100%", md: "auto" } }}>
              <DataGrid
                {...gridProps}
                rows={rows}
                rowCount={data?.count ?? 0}
                loading={isLoading || isFetching}
                paginationMode="server"
                sortingMode="server"
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
                pageSizeOptions={[10, 25, 50, 100]}
                sortModel={sortModel}
                onSortModelChange={setSortModel}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Column visibility dialog */}
      <Dialog
        open={colDialogOpen}
        onClose={() => setColDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: 400,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
            Select Columns
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
            Choose the columns to display in the table.
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
            }}
          >
            {module.fields.map((f) => (
              <Box
                key={f.name}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "#F9FAFB",
                  },
                }}
                onClick={() =>
                  setPendingColVisibility((prev) => ({
                    ...prev,
                    [f.name]: prev[f.name] === false,
                  }))
                }
              >
                <DragIndicatorIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
                <Checkbox
                  size="small"
                  checked={pendingColVisibility[f.name] !== false}
                  sx={{
                    padding: 0.5,
                    "& .MuiSvgIcon-root": {
                      fontSize: 18,
                    },
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "0.86rem", userSelect: "none" }}>
                  {f.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button
            onClick={() => {
              setPendingColVisibility({});
              setColVisibility({});
              setColDialogOpen(false);
            }}
            sx={{
              textTransform: "none",
              color: "#6366F1",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "#EEF2FF",
              },
            }}
          >
            Reset to default
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={() => setColDialogOpen(false)}
              sx={{
                textTransform: "none",
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "#F3F4F6",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setColVisibility(pendingColVisibility);
                setColDialogOpen(false);
              }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#6366F1",
                color: "#FFFFFF",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  backgroundColor: "#4F46E5",
                  boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
                },
              }}
            >
              Apply
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Settings menu — Import, Export and Delete live here, each gated by
          the caller's RBAC flags (and re-checked server-side). */}
      <Menu anchorEl={settingsMenuAnchor} open={!!settingsMenuAnchor} onClose={() => setSettingsMenuAnchor(null)}>
        {module.features?.import !== false && (
          <MenuItem
            disabled={!canImport}
            onClick={() => { setSettingsMenuAnchor(null); setImportOpen(true); }}
          >
            <ListItemIcon><UploadFileIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary={`Import ${module.label}`}
              secondary={canImport ? undefined : "Your role doesn't allow importing"}
            />
          </MenuItem>
        )}
        {module.features?.export !== false && (
          <MenuItem
            disabled={!canExport}
            onClick={() => { setExportMenuAnchor(settingsMenuAnchor); setSettingsMenuAnchor(null); }}
          >
            <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary={`Export ${module.label}`}
              secondary={canExport ? undefined : "Your role doesn't allow exporting"}
            />
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          disabled={!canDelete || selectedCount === 0}
          onClick={() => { setSettingsMenuAnchor(null); setDeleteConfirmOpen(true); }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary={selectedCount > 0 ? `Delete ${selectedCount} selected` : "Delete selected"}
            secondary={
              !canDelete
                ? "Your role doesn't allow deleting"
                : selectedCount === 0
                  ? "Select rows first"
                  : undefined
            }
          />
        </MenuItem>
      </Menu>

      {/* Export format menu */}
      <Menu anchorEl={exportMenuAnchor} open={!!exportMenuAnchor} onClose={() => setExportMenuAnchor(null)}>
        <MenuItem onClick={() => handleExport("csv")}>Export as CSV</MenuItem>
        <MenuItem onClick={() => handleExport("xlsx")}>Export as Excel</MenuItem>
        <MenuItem onClick={() => handleExport("json")}>Export as JSON</MenuItem>
      </Menu>

      {/* Dynamic group-by menu */}
      <Menu
        anchorEl={groupMenuAnchor}
        open={!!groupMenuAnchor}
        onClose={() => setGroupMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              minWidth: groupMenuAnchor?.offsetWidth || 'auto',
            }
          }
        }}
      >
        {groupableFields.length === 0 && <MenuItem disabled>Nothing to group by on this screen</MenuItem>}
        {groupableFields.map((f) => (
          <MenuItem
            key={f.name}
            dense
            onClick={() =>
              setGroupBy((prev) =>
                prev.includes(f.name) ? prev.filter((g) => g !== f.name) : [...prev, f.name]
              )
            }
          >
            <Checkbox size="small" checked={groupBy.includes(f.name)} />
            <ListItemText primary={f.label} />
          </MenuItem>
        ))}
        {groupBy.length > 0 && [
          <Divider key="div" />,
          <MenuItem key="clear" onClick={() => { setGroupBy([]); setGroupMenuAnchor(null); }}>
            Clear grouping
          </MenuItem>,
        ]}
      </Menu>

      {/* Saved views menu — own views and views colleagues shared, labelled
          with who saved them and which company they belong to. */}
      <Menu
        anchorEl={viewsMenuAnchor} open={!!viewsMenuAnchor} onClose={() => setViewsMenuAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 320 } } }}
      >
        {views.length === 0 && <MenuItem disabled>No saved views yet</MenuItem>}
        {views.map((v) => (
          <MenuItem key={v.id} onClick={() => applySavedView(v)} sx={{ justifyContent: "space-between", gap: 2 }}>
            <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
              <IconButton
                size="small"
                disabled={!v.is_mine}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(v.id); }}
              >
                {v.is_favorite ? <BookmarkIcon fontSize="small" color="primary" /> : <BookmarkBorderIcon fontSize="small" />}
              </IconButton>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>{v.name}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {v.is_mine ? (
                    <PersonIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                  ) : (
                    <GroupsIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                  )}
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {v.is_mine ? "You" : v.owner_name || v.owner_username}
                    {v.company_name ? ` · ${v.company_name}` : ""}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            {v.is_mine && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeView(v.id); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => { setViewsMenuAnchor(null); setSaveViewOpen(true); }}>
          + Save current view...
        </MenuItem>
      </Menu>

      {/* Dynamic filter dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Filter {module.label}</DialogTitle>
        <DialogContent sx={{ pt: "10px !important" }}>
          <FilterBuilder
            fields={filterableFields}
            conditions={pendingConditions}
            onChange={setPendingConditions}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingConditions([])}>Clear</Button>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => { setConditions(pendingConditions); setPage(0); setFilterDialogOpen(false); }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save view dialog */}
      <Dialog open={saveViewOpen} onClose={() => setSaveViewOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Save current view</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth size="small" label="View name" sx={{ mt: 1 }}
            value={newViewName} onChange={(e) => setNewViewName(e.target.value)}
          />
          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Switch size="small" checked={newViewShared} onChange={(e) => setNewViewShared(e.target.checked)} />}
            label={
              <Typography variant="caption">
                {newViewShared
                  ? "Shared with everyone in this company"
                  : "Private to you"}
              </Typography>
            }
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Saves the current columns, {conditions.length} filter(s), grouping and sort order.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveViewOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!newViewName.trim()}
            onClick={async () => {
              try {
                await saveView({
                  name: newViewName.trim(),
                  columns: module.fields.filter((f) => colVisibility[f.name] !== false).map((f) => f.name),
                  filters: conditions,
                  sort_model: sortModel.map((s) => ({ field: s.field, sort: s.sort ?? "asc" })),
                  group_by: groupBy,
                  is_favorite: false,
                  is_shared: newViewShared,
                  is_default: false,
                });
                setNewViewName("");
                setNewViewShared(false);
                setSaveViewOpen(false);
                enqueueSnackbar("View saved", { variant: "success" });
              } catch {
                enqueueSnackbar("Couldn't save the view", { variant: "error" });
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete {selectedCount} {selectedCount === 1 ? module.labelSingular : module.label}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            These records are archived rather than erased, and an administrator can restore them.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        module={module}
        onImport={async (rows) => {
          let imported = 0;
          for (const row of rows) {
            // The import intent header lets the server check can_import
            // rather than plain can_create.
            await api.create(row, intentHeaders("import"));
            imported += 1;
          }
          queryClient.invalidateQueries({ queryKey: [module.key, "list"] });
          enqueueSnackbar(`Imported ${imported} record(s)`, { variant: "success" });
        }}
        parseImportFile={parseImportFile}
      />
    </Box>
  );
}
