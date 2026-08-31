import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { useRelationOptions } from "../hooks/useRelationOptions";

interface Props {
  moduleKey?: string;
  labelField?: string;
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  size?: "small" | "medium";
  extraFilters?: Record<string, unknown>;
}

export default function RelationSelect({
  moduleKey, labelField, label, value, onChange, required, error, helperText, disabled, size = "small", extraFilters,
}: Props) {
  const { options, isLoading } = useRelationOptions(moduleKey, labelField, extraFilters);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Autocomplete
      size={size}
      options={options}
      loading={isLoading}
      disabled={disabled}
      value={selected}
      onChange={(_, newValue) => onChange(newValue ? newValue.value : null)}
      isOptionEqualToValue={(opt, val) => opt.value === val.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
