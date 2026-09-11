import {
  Box, Stack, TextField, MenuItem, IconButton, Button, Typography, Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";

import type { FieldConfig, FilterCondition, FilterOperator } from "../types/module";
import { OPERATOR_LABELS, operatorsFor, defaultOperatorFor, newCondition } from "../utils/filters";
import RelationSelect from "./RelationSelect";
import { useRelationOptions } from "../hooks/useRelationOptions";

/**
 * Relation value picker that reports the chosen record's display text
 * alongside its id, so the filter chip can name it.
 */
function RelationValueSelect({
  field, value, onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string, valueLabel?: string) => void;
}) {
  const { options } = useRelationOptions(field.relationModule, field.relationLabelField);
  return (
    <RelationSelect
      moduleKey={field.relationModule}
      labelField={field.relationLabelField}
      label="Value"
      value={value || null}
      onChange={(v) => onChange(v ?? "", options.find((o) => o.value === v)?.label)}
    />
  );
}

interface Props {
  fields: FieldConfig[];
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
}

/**
 * Dynamic, key/value filter builder: rows of `field · operator · value`
 * that the user adds and removes, rather than one fixed input per
 * configured field.
 *
 * The operator list adapts to the chosen field's type (dates get
 * before/after/between, choices get "is any of", text gets contains), so
 * the builder works for any module in the registry without per-module
 * configuration.
 */
export default function FilterBuilder({ fields, conditions, onChange }: Props) {
  const fieldByName = (name: string) => fields.find((f) => f.name === name);

  function patch(id: string, changes: Partial<FilterCondition>) {
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }

  function changeField(id: string, fieldName: string) {
    const field = fieldByName(fieldName);
    // The old operator and value rarely survive a field change (a date
    // range makes no sense on a status dropdown), so reset both.
    patch(id, { field: fieldName, operator: defaultOperatorFor(field), value: "", value2: "", valueLabel: undefined });
  }

  function renderValue(condition: FilterCondition) {
    const field = fieldByName(condition.field);
    if (!field || condition.operator === "isnull") return null;

    const commonProps = {
      size: "small" as const,
      fullWidth: true,
      label: "Value",
      value: (condition.value as string) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => patch(condition.id, { value: e.target.value }),
    };

    if (condition.operator === "in") {
      const selected = Array.isArray(condition.value) ? (condition.value as string[]) : [];
      return (
        <TextField
          select size="small" fullWidth label="Values"
          SelectProps={{
            multiple: true,
            value: selected,
            onChange: (e) => patch(condition.id, { value: e.target.value as unknown as string[] }),
            renderValue: (v) =>
              (v as string[])
                .map((val) => field.options?.find((o) => String(o.value) === val)?.label ?? val)
                .join(", "),
          }}
        >
          {(field.options ?? []).map((o) => (
            <MenuItem key={String(o.value)} value={String(o.value)}>{o.label}</MenuItem>
          ))}
        </TextField>
      );
    }

    if (condition.operator === "range") {
      const isDate = field.type === "date" || field.type === "datetime";
      const from = (condition.value as string) ?? "";
      const to = (condition.value2 as string) ?? "";
      return (
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <TextField
            size="small" fullWidth label="From" type={isDate ? "date" : "number"}
            slotProps={{
              inputLabel: { shrink: true },
              // Each bound caps the other, so a backwards window — a "to"
              // before its "from" — can't be picked in the first place.
              // A backwards range isn't an error server-side, it just
              // silently returns nothing, which reads as "no data".
              htmlInput: isDate && to ? { max: to } : undefined,
            }}
            value={from}
            onChange={(e) => patch(condition.id, { value: e.target.value })}
          />
          <TextField
            size="small" fullWidth label="To" type={isDate ? "date" : "number"}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: isDate && from ? { min: from } : undefined,
            }}
            value={to}
            onChange={(e) => patch(condition.id, { value2: e.target.value })}
          />
        </Stack>
      );
    }

    if (field.type === "relation") {
      return (
        <RelationValueSelect
          field={field}
          value={(condition.value as string) ?? ""}
          onChange={(value, valueLabel) => patch(condition.id, { value, valueLabel })}
        />
      );
    }

    if (field.type === "select" || field.type === "boolean") {
      const options = field.type === "boolean"
        ? [{ value: "true", label: "Yes" }, { value: "false", label: "No" }]
        : (field.options ?? []).map((o) => ({ value: String(o.value), label: o.label }));
      return (
        <TextField {...commonProps} select>
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      );
    }

    if (field.type === "date" || field.type === "datetime") {
      return <TextField {...commonProps} type="date" slotProps={{ inputLabel: { shrink: true } }} />;
    }

    if (field.type === "number" || field.type === "decimal") {
      return <TextField {...commonProps} type="number" />;
    }

    return <TextField {...commonProps} />;
  }

  if (fields.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No filterable fields are configured for this screen.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {conditions.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No filters yet — add one to narrow the list.
        </Typography>
      )}

      {conditions.map((condition) => {
        const field = fieldByName(condition.field);
        return (
          <Stack key={condition.id} direction="row" spacing={1} alignItems="flex-start">
            <TextField
              select size="small" label="Field" sx={{ minWidth: 170 }}
              value={condition.field}
              onChange={(e) => changeField(condition.id, e.target.value)}
            >
              {fields.map((f) => (
                <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select size="small" label="Condition" sx={{ minWidth: 150 }}
              value={condition.operator}
              onChange={(e) => patch(condition.id, { operator: e.target.value as FilterOperator, value: "", value2: "", valueLabel: undefined })}
            >
              {operatorsFor(field).map((op) => (
                <MenuItem key={op} value={op}>{OPERATOR_LABELS[op]}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ flexGrow: 1, minWidth: 160 }}>{renderValue(condition)}</Box>

            <Tooltip title="Remove this filter">
              <IconButton
                size="small" sx={{ mt: 0.5 }}
                onClick={() => onChange(conditions.filter((c) => c.id !== condition.id))}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      })}

      <Box>
        <Button
          size="small" startIcon={<AddIcon />}
          onClick={() => onChange([...conditions, newCondition(fields[0])])}
        >
          Add filter
        </Button>
      </Box>
    </Stack>
  );
}
