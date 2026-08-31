import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Alert, Chip, Stack,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { FieldConfig, ModuleConfig } from "../types/module";

interface Props {
  open: boolean;
  onClose: () => void;
  module: ModuleConfig;
  onImport: (rows: Record<string, unknown>[]) => Promise<void>;
  parseImportFile: (file: File) => Promise<Record<string, unknown>[]>;
}

function normalise(header: string) {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

/**
 * Match a spreadsheet's column headers to backend field names.
 *
 * Spreadsheets are written by people, so the headers are the *labels*
 * ("Company Name"), while the API only accepts field names
 * ("company_name"). Posting the raw parsed rows meant every import was
 * rejected as unknown fields. Matching is case- and separator-insensitive
 * so "Company Name", "company name" and "company_name" all land on the
 * same field.
 */
function buildHeaderMap(headers: string[], fields: FieldConfig[]) {
  const byLabel = new Map(fields.map((f) => [normalise(f.label), f.name]));
  const byName = new Map(fields.map((f) => [normalise(f.name), f.name]));

  const mapped: Record<string, string> = {};
  const unmatched: string[] = [];
  for (const header of headers) {
    const key = normalise(header);
    const target = byName.get(key) ?? byLabel.get(key);
    if (target) mapped[header] = target;
    else unmatched.push(header);
  }
  return { mapped, unmatched };
}

export default function ImportDialog({ open, onClose, module, onImport, parseImportFile }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const formFields = module.fields.filter((f) => f.showInForm);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const { mapped, unmatched } = buildHeaderMap(headers, module.fields);
  const matchedCount = Object.keys(mapped).length;

  async function handleFile(file: File) {
    setError("");
    setFileName(file.name);
    try {
      setRows(await parseImportFile(file));
    } catch {
      setError("That file couldn't be read. Check it's a valid CSV or Excel file.");
      setRows([]);
    }
  }

  async function handleCommit() {
    setImporting(true);
    setError("");
    try {
      // Translate each row's headers to field names, dropping columns that
      // match nothing rather than sending them and having the API reject
      // the whole row.
      const payload = rows.map((row) => {
        const out: Record<string, unknown> = {};
        for (const [header, value] of Object.entries(row)) {
          const field = mapped[header];
          if (field && value !== "" && value !== null && value !== undefined) out[field] = value;
        }
        return out;
      });
      await onImport(payload);
      setRows([]);
      setFileName("");
      onClose();
    } catch {
      setError("The import was rejected. Your role may not allow importing, or a row was invalid.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Import {module.label}</DialogTitle>
      <DialogContent>
        {importing && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box
          sx={{
            border: "2px dashed", borderColor: "divider", borderRadius: 2, p: 3,
            textAlign: "center", mb: 2, cursor: "pointer",
          }}
          onClick={() => document.getElementById("import-file-input")?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <UploadFileIcon sx={{ fontSize: 32, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {fileName || "Drop a CSV or Excel file here, or click to browse"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Column headers should match: {formFields.map((f) => f.label).join(", ")}
          </Typography>
          <input
            id="import-file-input" type="file" accept=".csv,.xlsx,.xls" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </Box>

        {rows.length > 0 && (
          <>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
              <Typography variant="body2">Preview ({rows.length} rows)</Typography>
              <Chip size="small" color="success" label={`${matchedCount} column(s) matched`} />
              {unmatched.length > 0 && (
                <Chip size="small" color="warning" label={`${unmatched.length} ignored: ${unmatched.join(", ")}`} />
              )}
            </Stack>
            {matchedCount === 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                None of the column headers match a field on this screen, so nothing would be imported.
              </Alert>
            )}
            <Box sx={{ maxHeight: 300, overflow: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {headers.map((h) => (
                      <TableCell key={h} sx={{ opacity: mapped[h] ? 1 : 0.45 }}>
                        {h}
                        {mapped[h] && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            → {mapped[h]}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.slice(0, 10).map((r, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h} sx={{ opacity: mapped[h] ? 1 : 0.45 }}>{String(r[h] ?? "")}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!rows.length || !matchedCount || importing} onClick={handleCommit}>
          Import {rows.length > 0 ? `${rows.length} rows` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
