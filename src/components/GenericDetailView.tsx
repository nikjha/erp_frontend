import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Paper, Tabs, Tab, Typography, IconButton, Stack, Breadcrumbs, Link,
  CircularProgress, Chip, Button, Badge,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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

  const { data: record, isLoading } = useQuery({
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
    <Box sx={{ p: 3, maxWidth: 1600, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(`/${module.key}`)}><ArrowBackIcon /></IconButton>
        <Breadcrumbs sx={{ flexGrow: 1 }}>
          <Link underline="hover" color="inherit" onClick={() => navigate(`/${module.key}`)} sx={{ cursor: "pointer" }}>
            {module.label}
          </Link>
          <Typography color="text.primary">{title}</Typography>
        </Breadcrumbs>
        {!isNew && record?.status ? <Chip size="small" label={String(record.status).replace(/_/g, " ")} /> : null}
      </Stack>

      <Box
        sx={{
          display: "grid",
          // Form left, record history right. The log collapses beneath the
          // form on narrow screens rather than squeezing both.
          gridTemplateColumns: { xs: "1fr", lg: showSidebar ? "minmax(0, 1fr) 400px" : "1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Paper sx={{ p: 3, minWidth: 0 }}>
          {!isNew && module.actions && module.actions.length > 0 && record && (
            <DocumentActionsBar
              endpoint={module.endpoint}
              recordId={id!}
              record={record}
              actions={module.actions}
              onDone={refreshRecord}
            />
          )}

          {!isNew && module.customLinks && module.customLinks.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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

          <GenericForm
            module={module}
            initialValues={record}
            onSubmit={handleSave}
            submitLabel={isNew ? `Create ${module.labelSingular}` : "Save changes"}
            readOnlyFields={canEdit ? [] : module.fields.map((f) => f.name)}
          />

          {!isNew && module.totalsFields && module.totalsFields.length > 0 && record && (
            <Stack direction="row" spacing={4} sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
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
            <DocumentLinesEditor
              config={module.lineItems}
              parentId={id!}
              parentRecord={record}
              onLinesChanged={refreshRecord}
            />
          )}
        </Paper>

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
  );
}
