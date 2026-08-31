import { useState } from "react";
import { Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { useSnackbar } from "notistack";
import { apiClient } from "../api/client";
import type { DocumentAction } from "../types/module";
import type { GenericRecord } from "../types/api";

interface Props {
  endpoint: string;
  recordId: string;
  record: GenericRecord;
  actions: DocumentAction[];
  onDone: () => void;
}

export default function DocumentActionsBar({ endpoint, recordId, record, actions, onDone }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [confirmAction, setConfirmAction] = useState<DocumentAction | null>(null);
  const [inputAction, setInputAction] = useState<DocumentAction | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [running, setRunning] = useState<string | null>(null);

  const visibleActions = actions.filter(
    (a) => !a.visibleForStatus || a.visibleForStatus.includes(String(record.status))
  );

  async function run(action: DocumentAction, body: Record<string, unknown> = {}) {
    setRunning(action.key);
    try {
      const { data } = await apiClient.post(`${endpoint}${recordId}/${action.key}/`, body);
      enqueueSnackbar(data?.status ? `${action.label} — status: ${data.status}` : `${action.label} done`, { variant: "success" });
      onDone();
    } catch (err) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        `${action.label} failed`;
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setRunning(null);
    }
  }

  function handleClick(action: DocumentAction) {
    if (action.requiresConfirmation) return setConfirmAction(action);
    if (action.input) return setInputAction(action);
    run(action);
  }

  if (visibleActions.length === 0) return null;

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {visibleActions.map((a) => (
          <Button
            key={a.key} size="small" variant="outlined" disabled={running === a.key}
            onClick={() => handleClick(a)}
          >
            {running === a.key ? "Working…" : a.label}
          </Button>
        ))}
      </Stack>

      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <DialogTitle>{confirmAction?.label}?</DialogTitle>
        <DialogContent>This action may not be reversible.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button
            variant="contained" color="error"
            onClick={() => { const a = confirmAction!; setConfirmAction(null); run(a); }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!inputAction} onClose={() => setInputAction(null)}>
        <DialogTitle>{inputAction?.label}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus fullWidth size="small" label={inputAction?.input?.label}
            type={inputAction?.input?.type === "number" ? "number" : "text"}
            value={inputValue} onChange={(e) => setInputValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInputAction(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const a = inputAction!;
              setInputAction(null);
              run(a, { [a.input!.name]: inputValue });
              setInputValue("");
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
