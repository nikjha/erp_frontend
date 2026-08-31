import { useState } from "react";
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody, TextField, IconButton,
  Button, Typography, Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import type { LineItemConfig, FieldConfig } from "../types/module";
import type { GenericRecord } from "../types/api";
import { GenericApi } from "../api/genericApi";
import RelationSelect from "./RelationSelect";
import { useRelationOptions } from "../hooks/useRelationOptions";

interface Props {
  config: LineItemConfig;
  parentId: string;
  /** The header record — used to resolve filterBy constraints on relation columns. */
  parentRecord?: GenericRecord;
  onLinesChanged?: () => void;
}

type DraftRow = Record<string, unknown> & { _isNew?: boolean };

function emptyDraft(): DraftRow {
  return { _isNew: true };
}

function relationFilters(field: FieldConfig, parentRecord?: GenericRecord): Record<string, unknown> | undefined {
  if (!field.filterBy || !parentRecord) return undefined;
  const value = parentRecord[field.filterBy.parentField];
  if (!value) return undefined;
  return { [field.filterBy.relatedField]: value };
}

function RelationDisplay({ moduleKey, labelField, id, extraFilters }: {
  moduleKey?: string; labelField?: string; id: unknown; extraFilters?: Record<string, unknown>;
}) {
  const { options } = useRelationOptions(moduleKey, labelField, extraFilters);
  if (!id) return null;
  const match = options.find((o) => o.value === String(id));
  return <span>{match?.label ?? String(id)}</span>;
}

function LineCell({ field, value, onChange, extraFilters, blockedReason }: {
  field: FieldConfig; value: unknown; onChange: (v: unknown) => void;
  extraFilters?: Record<string, unknown>; blockedReason?: string;
}) {
  if (field.readOnly) {
    return <span>{value != null ? String(value) : ""}</span>;
  }
  if (field.type === "relation") {
    if (field.filterBy && !extraFilters) {
      return <span style={{ color: "#999", fontSize: 12 }}>{blockedReason}</span>;
    }
    return (
      <RelationSelect
        moduleKey={field.relationModule}
        labelField={field.relationLabelField}
        label=""
        value={(value as string) ?? null}
        onChange={onChange}
        size="small"
        extraFilters={extraFilters}
      />
    );
  }
  if (field.type === "select") {
    return (
      <TextField
        select size="small" fullWidth value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)} SelectProps={{ native: true }}
      >
        <option value="" />
        {field.options?.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
      </TextField>
    );
  }
  return (
    <TextField
      size="small" fullWidth
      type={field.type === "number" || field.type === "decimal" ? "number" : "text"}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function DocumentLinesEditor({ config, parentId, parentRecord, onLinesChanged }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const api = new GenericApi(config.endpoint);

  const { data, isLoading } = useQuery({
    queryKey: ["lines", config.endpoint, parentId],
    queryFn: async () => {
      const res = await api.list({ filters: { [config.parentField]: parentId }, pageSize: 200 });
      return res.results;
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRow>({});
  const [newRow, setNewRow] = useState<DraftRow | null>(null);

  const lines = data ?? [];

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["lines", config.endpoint, parentId] });
    onLinesChanged?.();
  }

  function startEdit(row: GenericRecord) {
    setEditingId(row.id);
    setDraft({ ...row });
  }

  async function saveEdit() {
    if (!editingId) return;
    await api.update(editingId, draft);
    setEditingId(null);
    refresh();
    enqueueSnackbar("Line updated", { variant: "success" });
  }

  async function saveNewRow() {
    if (!newRow) return;
    await api.create({ ...newRow, [config.parentField]: parentId });
    setNewRow(null);
    refresh();
    enqueueSnackbar("Line added", { variant: "success" });
  }

  async function deleteRow(id: string) {
    await api.remove(id);
    refresh();
    enqueueSnackbar("Line removed", { variant: "success" });
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Line Items</Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {config.fields.map((f) => <TableCell key={f.name}>{f.label}</TableCell>)}
              <TableCell align="right" width={90}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={config.fields.length + 1}>Loading…</TableCell></TableRow>
            )}
            {!isLoading && lines.length === 0 && !newRow && (
              <TableRow><TableCell colSpan={config.fields.length + 1}>
                <Typography variant="body2" color="text.secondary">No lines yet.</Typography>
              </TableCell></TableRow>
            )}
            {lines.map((row) => (
              <TableRow key={row.id}>
                {config.fields.map((f) => (
                  <TableCell key={f.name}>
                    {editingId === row.id ? (
                      <LineCell
                        field={f} value={draft[f.name]}
                        onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
                        extraFilters={relationFilters(f, parentRecord)}
                      />
                    ) : f.type === "relation" ? (
                      <RelationDisplay
                        moduleKey={f.relationModule} labelField={f.relationLabelField} id={row[f.name]}
                        extraFilters={relationFilters(f, parentRecord)}
                      />
                    ) : (
                      String(row[f.name] ?? "")
                    )}
                  </TableCell>
                ))}
                <TableCell align="right">
                  {editingId === row.id ? (
                    <>
                      <IconButton size="small" onClick={saveEdit}><CheckIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setEditingId(null)}><CloseIcon fontSize="small" /></IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton size="small" onClick={() => startEdit(row)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => deleteRow(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {newRow && (
              <TableRow>
                {config.fields.map((f) => (
                  <TableCell key={f.name}>
                    <LineCell
                      field={f} value={newRow[f.name]}
                      onChange={(v) => setNewRow((d) => ({ ...(d ?? {}), [f.name]: v }))}
                      extraFilters={relationFilters(f, parentRecord)}
                      blockedReason={f.filterBy ? `Set ${f.filterBy.parentField.replace(/_/g, " ")} in Details first` : undefined}
                    />
                  </TableCell>
                ))}
                <TableCell align="right">
                  <IconButton size="small" onClick={saveNewRow}><CheckIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setNewRow(null)}><CloseIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      {!newRow && (
        <Button size="small" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => setNewRow(emptyDraft())}>
          Add Line
        </Button>
      )}
    </Box>
  );
}
