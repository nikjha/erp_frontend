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
  Box, Toolbar, Typography, TextField, IconButton, Button, Menu, MenuItem,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import type { ModuleConfig, SavedView, FilterCondition } from "../types/module";
import { GenericApi } from "../api/genericApi";
import { intentHeaders } from "../api/client";
import { useSavedViews } from "../hooks/useSavedViews";
import { useMyPermissions } from "../hooks/useMyPermissions";
import { exportRecords, parseImportFile } from "../utils/importExport";
import { buildFilterParams, describeCondition, newCondition } from "../utils/filters";
import BulkActionsToolbar from "./BulkActionsToolbar";
import ImportDialog from "./ImportDialog";
import FilterBuilder from "./FilterBuilder";

function fieldToColumn(field: ModuleConfig["fields"][number]): GridColDef {
  const base: GridColDef = {
    field: field.name,
    headerName: field.label,
    width: field.width ?? 150,
    sortable: field.sortable ?? false,
    filterable: false, // filtering handled by our own dynamic filter builder (server-side)
  };
  if (field.type === "boolean") {
    return { ...base, type: "boolean" };
  }
  if (field.type === "datetime" || field.type === "date") {
    return {
      ...base,
      valueFormatter: (value: unknown) => (value ? new Date(value as string).toLocaleString() : ""),
    };
  }
  if (field.type === "select") {
    return {
      ...base,
      renderCell: (params) => {
        const opt = field.options?.find((o) => o.value === params.value);
        return <Chip size="small" label={opt?.label ?? String(params.value ?? "")} />;
      },
    };
  }
  return base;
}

interface Props {
  module: ModuleConfig;
}

const UNGROUPED = "— None —";

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
  const filterableFields = useMemo(() => module.fields.filter((f) => f.filterable), [module.fields]);
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
  const [colMenuAnchor, setColMenuAnchor] = useState<null | HTMLElement>(null);
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
  const columns: GridColDef[] = useMemo(() => listFields.map(fieldToColumn), [listFields]);

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
    density: "compact" as const,
    sx: { backgroundColor: "background.paper", cursor: "pointer" },
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar disableGutters sx={{ px: 2, py: 1.5, gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h6" sx={{ mr: 2 }}>{module.label}</Typography>

        <TextField
          size="small"
          placeholder={`Search ${module.label.toLowerCase()}...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 240 }}
        />

        <Button
          size="small"
          startIcon={<FilterListIcon />}
          onClick={() => {
            // Seed the dialog with the live filters, plus an empty row so
            // there is always something to type into.
            setPendingConditions(
              conditions.length ? conditions : [newCondition(filterableFields[0])]
            );
            setFilterDialogOpen(true);
          }}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>

        <Button
          size="small"
          startIcon={<WorkspacesIcon />}
          onClick={(e) => setGroupMenuAnchor(e.currentTarget)}
        >
          Group by{groupBy.length > 0 ? ` (${groupBy.length})` : ""}
        </Button>

        <Tooltip title="Saved views">
          <IconButton size="small" onClick={(e) => setViewsMenuAnchor(e.currentTarget)}>
            <BookmarkBorderIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Refresh">
          <IconButton size="small" onClick={() => refetch()}><RefreshIcon /></IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        {/* Right-hand action cluster: columns, settings, then the primary
            create button — the column picker sits next to New, where the
            things that change what you're looking at belong. */}
        <Tooltip title="Show / hide columns">
          <IconButton size="small" onClick={(e) => setColMenuAnchor(e.currentTarget)}>
            <ViewColumnIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Settings">
          <IconButton size="small" onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/${module.key}/new`)}>
            New {module.labelSingular}
          </Button>
        )}
      </Toolbar>

      {activeFilterCount > 0 && (
        <Stack direction="row" spacing={1} sx={{ px: 2, pb: 1, flexWrap: "wrap", gap: 1 }}>
          {conditions.map((condition) => (
            <Chip
              key={condition.id}
              size="small"
              label={describeCondition(condition, module.fields.find((f) => f.name === condition.field))}
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

      <Box sx={{ flexGrow: 1, px: 2, pb: 2, overflow: "auto" }}>
        {groupedRows ? (
          <Box>
            <Alert severity="info" variant="outlined" sx={{ mb: 1.5, py: 0 }}>
              Grouped by {groupBy.map((g) => module.fields.find((f) => f.name === g)?.label ?? g).join(" · ")} —
              across the {rows.length} record(s) loaded on this page. Ungroup to select rows.
            </Alert>
            {groupedRows.map(([key, groupRows]) => (
              <Accordion key={key} defaultExpanded disableGutters sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">{key}</Typography>
                    <Chip size="small" label={groupRows.length} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <DataGrid {...gridProps} rows={groupRows} autoHeight hideFooter />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
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
        )}
      </Box>

      {/* Column visibility menu */}
      <Menu anchorEl={colMenuAnchor} open={!!colMenuAnchor} onClose={() => setColMenuAnchor(null)}>
        {module.fields.map((f) => (
          <MenuItem
            key={f.name}
            dense
            onClick={() => setColVisibility((prev) => ({ ...prev, [f.name]: prev[f.name] === false }))}
          >
            <Checkbox size="small" checked={colVisibility[f.name] !== false} />
            <ListItemText primary={f.label} />
          </MenuItem>
        ))}
      </Menu>

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
      <Menu anchorEl={groupMenuAnchor} open={!!groupMenuAnchor} onClose={() => setGroupMenuAnchor(null)}>
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
        <DialogContent sx={{ pt: 1 }}>
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
