import { useEffect, useState } from "react";
import {
  Box, TextField, MenuItem, Checkbox, FormControlLabel, Button, Stack, Typography, Tooltip,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import type { FieldConfig, ModuleConfig } from "../types/module";
import type { GenericRecord } from "../types/api";
import RelationSelect from "./RelationSelect";

interface Props {
  module: ModuleConfig;
  initialValues?: Partial<GenericRecord>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  /** Field names the caller's role may see but not change. */
  readOnlyFields?: string[];
  onCancel?: () => void;
}

/**
 * Every field is rendered as an explicit `label · control` row rather than
 * relying on MUI's floating placeholder label.
 *
 * A floating label disappears into the border once a field has a value,
 * so a filled-in form becomes a wall of unlabelled values — fine for a
 * three-field dialog, unreadable on a 20-field master record. A standing
 * label column keeps every value identifiable at a glance, which is how
 * ERP forms are read: scanned, not filled in top to bottom.
 */
function FieldRow({
  field, children, dense,
}: {
  field: FieldConfig;
  children: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "minmax(140px, 190px) 1.3fr" },
        alignItems: "start",
        columnGap: 2,
        rowGap: 0.5,
        py: dense ? 0.5 : 0.75,
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pt: { sm: 1 }, minWidth: 0 }}>
        <Typography
          component="label"
          htmlFor={`field-${field.name}`}
          variant="body2"
          sx={{ fontWeight: 600, color: "text.secondary", lineHeight: 1.3, fontSize: "0.86rem" }}
        >
          {field.label}
          {field.required && (
            <Box component="span" sx={{ color: "error.main", ml: 0.25 }} aria-hidden>*</Box>
          )}
        </Typography>
        {field.helpText && (
          <Tooltip title={field.helpText}>
            <HelpOutlineIcon sx={{ fontSize: 14, color: "text.disabled" }} />
          </Tooltip>
        )}
      </Stack>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export default function GenericForm({
  module, initialValues, onSubmit, submitLabel = "Save", readOnlyFields = [], onCancel,
}: Props) {
  const formFields = module.fields.filter((f) => f.showInForm);
  const [values, setValues] = useState<Record<string, unknown>>(initialValues ?? {});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // The record arrives after the first render (the detail page mounts the
  // form while the fetch is still in flight on a refetch), so seed the
  // fields when it lands instead of leaving the form empty.
  useEffect(() => {
    if (initialValues) setValues(initialValues);
  }, [initialValues]);

  function setField(name: string, val: unknown) {
    setValues((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const f of formFields) {
      if (f.required && !values[f.name]) next[f.name] = `${f.label} is required`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  }

  function renderControl(f: FieldConfig) {
    const disabled = f.readOnly || readOnlyFields.includes(f.name);
    const shared = {
      id: `field-${f.name}`,
      fullWidth: true,
      size: "small" as const,
      error: !!errors[f.name],
      helperText: errors[f.name] || undefined,
      disabled,
      sx: { "& .MuiInputBase-input": { fontSize: "0.86rem" }, "& .MuiInputLabel-root": { fontSize: "0.86rem" } }
    };

    if (f.type === "boolean") {
      return (
        <FormControlLabel
          sx={{ ml: 0 }}
          control={
            <Checkbox
              id={`field-${f.name}`}
              size="small"
              disabled={disabled}
              checked={Boolean(values[f.name])}
              onChange={(e) => setField(f.name, e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              {values[f.name] ? "Yes" : "No"}
            </Typography>
          }
        />
      );
    }

    if (f.type === "relation") {
      return (
        <RelationSelect
          moduleKey={f.relationModule}
          labelField={f.relationLabelField}
          // The standing label above already names the field; repeating it
          // inside the control would print it twice.
          label=""
          required={f.required}
          disabled={disabled}
          value={(values[f.name] as string) ?? null}
          onChange={(v) => setField(f.name, v)}
          error={!!errors[f.name]}
          helperText={errors[f.name] || undefined}
        />
      );
    }

    if (f.type === "select") {
      return (
        <TextField
          {...shared}
          select
          value={(values[f.name] as string) ?? ""}
          onChange={(e) => setField(f.name, e.target.value)}
        >
          <MenuItem value=""><em>Not set</em></MenuItem>
          {(f.options ?? []).map((o) => (
            <MenuItem key={String(o.value)} value={o.value as string}>{o.label}</MenuItem>
          ))}
        </TextField>
      );
    }

    if (f.type === "textarea" || f.type === "richtext") {
      return (
        <TextField
          {...shared}
          multiline
          minRows={3}
          value={(values[f.name] as string) ?? ""}
          onChange={(e) => setField(f.name, e.target.value)}
        />
      );
    }

    if (f.type === "date" || f.type === "datetime") {
      return (
        <TextField
          {...shared}
          type={f.type === "date" ? "date" : "datetime-local"}
          slotProps={{ inputLabel: { shrink: true } }}
          value={(values[f.name] as string) ?? ""}
          onChange={(e) => setField(f.name, e.target.value)}
        />
      );
    }

    return (
      <TextField
        {...shared}
        type={f.type === "number" || f.type === "decimal" ? "number" : f.type === "email" ? "email" : "text"}
        value={(values[f.name] as string) ?? ""}
        onChange={(e) => setField(f.name, e.target.value)}
      />
    );
  }

  return (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <Box
        sx={{
          display: "grid",
          // Two columns of label+control on wide screens, one when narrow.
          // Long-form fields always take the full width.
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          columnGap: 4,
        }}
      >
        {formFields.map((f) => {
          const fullWidth = f.type === "textarea" || f.type === "richtext";
          return (
            <Box key={f.name} sx={{ gridColumn: fullWidth ? { lg: "1 / -1" } : undefined }}>
              <FieldRow field={f}>{renderControl(f)}</FieldRow>
            </Box>
          );
        })}
      </Box>

      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3, display: "none" }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}
