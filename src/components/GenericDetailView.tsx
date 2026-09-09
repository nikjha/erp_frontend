import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Paper, Tabs, Tab, Typography, IconButton, Stack, Breadcrumbs, Link,
  CircularProgress, Chip, Button, Badge, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import CloudIcon from "@mui/icons-material/Cloud";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import type { ModuleConfig } from "../types/module";
import { GenericApi, platformApi } from "../api/genericApi";
import { useContentType } from "../hooks/useContentType";
import { useMyPermissions } from "../hooks/useMyPermissions";
import GenericForm from "./GenericForm";
import LogNotesPanel from "./LogNotesPanel";
import TodosPanel from "./TodosPanel";
import ActivityTimeline from "./ActivityTimeline";
import DocumentLinesEditor from "./DocumentLinesEditor";
import DocumentActionsBar from "./DocumentActionsBar";

interface Props {
  module: ModuleConfig;
}

// Type for record data from API
interface RecordData {
  id: string;
  status?: string | number;
  is_customer?: boolean;
  is_vendor?: boolean;
  party_code?: string;
  code?: string;
  [key: string]: unknown;
}

/**
 * Helper functions to safely access record properties
 */
function getStatusLabel(status: unknown): string {
  if (typeof status === 'string') {
    return status.replace(/_/g, " ");
  }
  return String(status || '');
}

function getTypeLabel(record: RecordData | undefined, module: ModuleConfig): string {
  if (record) {
    if (record.is_customer) return "Customer";
    if (record.is_vendor) return "Vendor";
  }
  return module.labelSingular;
}

function getCode(record: RecordData | undefined): string {
  if (record) {
    return record.party_code || record.code || "Code";
  }
  return "Code";
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function isStatusActive(status: unknown): boolean {
  return status === "active" || status === "Active";
}

/**
 * Record screen: the form on the left, the record's history on the right.
 *
 * Previously everything was a tab, so reading a note meant navigating
 * away from the fields it referred to. Splitting them means the log is
 * *context* — visible while you edit — which is the whole point of
 * keeping notes against a record rather than in an inbox.
 */
export default function GenericDetailView({ module }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const api = useMemo(() => new GenericApi(module.endpoint), [module.endpoint]);
  const { canModule } = useMyPermissions();
  const isNew = id === "new";
  const [sideTab, setSideTab] = useState(0);

  const { data: record, isLoading } = useQuery<RecordData>({
    queryKey: [module.key, "detail", id],
    queryFn: () => api.retrieve(id!),
    enabled: !isNew,
  });

  const { data: contentTypeId } = useContentType(module);

  // Only used for the tab badge, so a cheap count is enough.
  const { data: openTodoCount = 0 } = useQuery({
    queryKey: ["todos-count", contentTypeId, id],
    queryFn: async () => {
      const todos = await platformApi.getTodos(String(contentTypeId), id!);
      return todos.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;
    },
    enabled: !isNew && !!contentTypeId && module.features?.todos !== false,
  });

  const canEdit = canModule(module, isNew ? "can_create" : "can_edit");

  function refreshRecord() {
    queryClient.invalidateQueries({ queryKey: [module.key, "detail", id] });
    queryClient.invalidateQueries({ queryKey: [module.key, "list"] });
  }

  async function handleSave(values: Record<string, unknown>) {
    try {
      if (isNew) {
        const created = await api.create(values);
        enqueueSnackbar(`${module.labelSingular} created`, { variant: "success" });
        navigate(`/${module.key}/${created.id}`);
      } else {
        await api.update(id!, values);
        enqueueSnackbar(`${module.labelSingular} updated`, { variant: "success" });
        refreshRecord();
      }
    } catch {
      enqueueSnackbar(
        `Couldn't save this ${module.labelSingular.toLowerCase()} — check the fields, or your role may not allow it.`,
        { variant: "error" }
      );
    }
  }

  if (!isNew && isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress /></Box>;
  }

  const title = isNew ? `New ${module.labelSingular}` : (record?.[module.titleField] as string) ?? module.labelSingular;
  const showSidebar = !isNew && !!contentTypeId;

  const sidePanels: { label: string; badge?: number; render: () => React.ReactNode }[] = [];
  if (module.features?.notes !== false || module.features?.documents !== false) {
    sidePanels.push({
      label: "Log Notes",
      render: () => <LogNotesPanel contentTypeId={contentTypeId!} objectId={id!} />,
    });
  }
  if (module.features?.todos !== false) {
    sidePanels.push({
      label: "To-Dos",
      badge: openTodoCount,
      render: () => <TodosPanel contentTypeId={contentTypeId!} objectId={id!} />,
    });
  }
  if (module.features?.activityTimeline !== false) {
    sidePanels.push({
      label: "Activity",
      render: () => <ActivityTimeline contentTypeId={contentTypeId!} objectId={id!} />,
    });
  }

  const activePanel = sidePanels[Math.min(sideTab, Math.max(sidePanels.length - 1, 0))];

  return (
    <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ bgcolor: "white", borderBottom: 1, borderColor: "divider" }}>
        {/* Desktop Header */}
        <Box sx={{ display: { xs: "none", md: "block" }, px: 3, py: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton size="small" onClick={() => navigate(`/${module.key}`)}><ArrowBackIcon /></IconButton>
            <Breadcrumbs sx={{ flexGrow: 1 }}>
              <Link underline="hover" color="inherit" onClick={() => navigate(`/${module.key}`)} sx={{ cursor: "pointer", fontSize: "0.86rem" }}>
                {module.label}
              </Link>
              <Typography color="text.primary" sx={{ fontSize: "0.86rem" }}>{isNew ? `New ${module.labelSingular}` : title}</Typography>
            </Breadcrumbs>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`/${module.key}`)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.86rem",
                  py: 0.5,
                  minHeight: 32,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    const event = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(event);
                  }
                }}
                sx={{
                  textTransform: "none",
                  fontSize: "0.86rem",
                  py: 0.5,
                  minHeight: 32,
                }}
              >
                {isNew ? `Create ${module.labelSingular}` : "Save Changes"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Mobile Header */}
        <Box sx={{ display: { xs: "flex", md: "none" }, py: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ width: "100%" }}>
            <IconButton
              size="small"
              onClick={() => navigate(`/${module.key}`)}
              sx={{ px: 0.5 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Breadcrumbs sx={{ flexGrow: 1, px: 0.5 }}>
              <Link underline="hover" color="inherit" onClick={() => navigate(`/${module.key}`)} sx={{ cursor: "pointer", fontSize: "0.86rem" }}>
                {module.label}
              </Link>
              <Typography color="text.primary" sx={{ fontSize: "0.86rem" }}>{isNew ? `New ${module.labelSingular}` : title}</Typography>
            </Breadcrumbs>
            <Stack direction="row" spacing={0.5} sx={{ pr: 1 }}>
              <IconButton
                size="small"
                onClick={() => navigate(`/${module.key}`)}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  width: 32,
                  height: 32
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    const event = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(event);
                  }
                }}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  borderRadius: 1,
                  width: 32,
                  height: 32,
                  "&:hover": {
                    bgcolor: "primary.dark"
                  }
                }}
              >
                <CloudIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ p: "10px", maxWidth: 1600, mx: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: showSidebar ? "minmax(0, 2fr) 0.8fr" : "1fr" },
            gap: "10px",
            alignItems: "start",
          }}
        >
          <Box>
            <Paper sx={{ minWidth: 0 }}>
              {/* Header with avatar - Desktop */}
              {!isNew && (
                <Box sx={{ display: { xs: "none", md: "block" }, p: 2, pb: 1.5, bgcolor: "#fafbfc", borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 43,
                        height: 43,
                        bgcolor: "#5e35b1",
                        fontSize: 16,
                        fontWeight: 600
                      }}
                    >
                      {getInitials(title)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
                          {title}
                        </Typography>
                        {record?.status && (
                          <Chip
                            label={getStatusLabel(record.status)}
                            size="small"
                            sx={{
                              bgcolor: isStatusActive(record.status) ? "#e8f5e9" : undefined,
                              color: isStatusActive(record.status) ? "#2e7d32" : undefined,
                              textTransform: "capitalize",
                              fontSize: "0.75rem",
                              height: 22
                            }}
                          />
                        )}
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={getTypeLabel(record, module)}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem", height: 22 }}
                        />
                        <Chip
                          label={getCode(record)}
                          size="small"
                          sx={{ fontSize: "0.75rem", height: 22 }}
                        />
                      </Stack>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        component="span"
                        sx={{
                          fontSize: 28,
                          lineHeight: 1,
                          color: "text.secondary"
                        }}
                      >
                        🏢
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.75rem" }}>
                          Since 2024
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.75rem" }}>
                          Valued Customer
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Header with avatar - Mobile */}
              {!isNew && (
                <Box sx={{ display: { xs: "block", md: "none" }, p: 2, pb: 1.5, bgcolor: "#fafbfc", borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "#5e35b1",
                        fontSize: 15,
                        fontWeight: 600
                      }}
                    >
                      {getInitials(title)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem", mb: 0.5 }}>
                        {title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.7rem", mb: 1 }}>
                        Since 2024 Valued Customer
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        {record?.status && (
                          <Chip
                            label={getStatusLabel(record.status)}
                            size="small"
                            sx={{
                              bgcolor: isStatusActive(record.status) ? "#e8f5e9" : undefined,
                              color: isStatusActive(record.status) ? "#2e7d32" : undefined,
                              textTransform: "capitalize",
                              fontSize: "0.7rem",
                              height: 20
                            }}
                          />
                        )}
                        <Chip
                          label={getTypeLabel(record, module)}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                        <Chip
                          label={getCode(record)}
                          size="small"
                          sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              )}

              {!isNew && module.actions && module.actions.length > 0 && record && (
                <Box sx={{ px: 3, pt: 2 }}>
                  <DocumentActionsBar
                    endpoint={module.endpoint}
                    recordId={id!}
                    record={record}
                    actions={module.actions}
                    onDone={refreshRecord}
                  />
                </Box>
              )}

              {!isNew && module.customLinks && module.customLinks.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ px: 3, pt: 2 }}>
                  {module.customLinks.map((link) => (
                    <Button
                      key={link.suffix} size="small" variant="outlined"
                      onClick={() => navigate(`/${module.key}/${id}/${link.suffix}`)}
                    >
                      {link.label}
                    </Button>
                  ))}
                </Stack>
              )}

              <Box sx={{ p: 3 }}>
                <GenericForm
                  module={module}
                  initialValues={record}
                  onSubmit={handleSave}
                  submitLabel={isNew ? `Create ${module.labelSingular}` : "Save Changes"}
                  readOnlyFields={canEdit ? [] : module.fields.map((f) => f.name)}
                  onCancel={() => navigate(`/${module.key}`)}
                />
              </Box>

              {!isNew && module.totalsFields && module.totalsFields.length > 0 && record && (
                <Stack direction="row" spacing={4} sx={{ px: 3, pb: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                  {module.totalsFields.map((fieldName) => {
                    const field = module.fields.find((f) => f.name === fieldName);
                    if (!field) return null;
                    return (
                      <Box key={fieldName}>
                        <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                        <Typography variant="subtitle1" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                          {String(record[fieldName] ?? "0.00")}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {!isNew && module.lineItems && (
                <Box sx={{ px: 3, pb: 3 }}>
                  <DocumentLinesEditor
                    config={module.lineItems}
                    parentId={id!}
                    parentRecord={record}
                    onLinesChanged={refreshRecord}
                  />
                </Box>
              )}
            </Paper>
          </Box>

          {showSidebar && sidePanels.length > 0 && (
            <Paper
              sx={{
                p: 2,
                // Sticky so the log stays beside a long form as you scroll.
                position: { lg: "sticky" },
                top: { lg: 16 },
                maxHeight: { lg: "calc(100vh - 120px)" },
                overflowY: "auto",
              }}
            >
              <Tabs
                value={Math.min(sideTab, sidePanels.length - 1)}
                onChange={(_, v) => setSideTab(v)}
                variant="fullWidth"
                sx={{ mb: 2, minHeight: 36 }}
              >
                {sidePanels.map((panel) => (
                  <Tab
                    key={panel.label}
                    sx={{ minHeight: 36, fontSize: 13 }}
                    label={
                      panel.badge ? (
                        <Badge badgeContent={panel.badge} color="primary" sx={{ pr: 1.5 }}>
                          {panel.label}
                        </Badge>
                      ) : (
                        panel.label
                      )
                    }
                  />
                ))}
              </Tabs>
              {activePanel?.render()}
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}