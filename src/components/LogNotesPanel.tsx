import { useMemo, useRef, useState } from "react";
import {
  Box, TextField, Button, Stack, Typography, Chip, FormControlLabel, Switch,
  Divider, IconButton, Avatar, Tooltip, LinearProgress, Link,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import { platformApi } from "../api/genericApi";
import type { DocumentEntry, NoteEntry } from "../types/api";

interface Props {
  contentTypeId: number;
  objectId: string;
}

/**
 * "Log Notes" — the record's conversation.
 *
 * Notes and attachments used to be two separate tabs, which forced a
 * choice nobody wants to make: a note explaining a document and the
 * document itself lived in different places, in different orders, with
 * no link between them. They're one feed here, sorted by time, and the
 * composer posts both at once — write a note, attach the file it's
 * about, send once.
 */

type FeedItem =
  | { kind: "note"; at: string; note: NoteEntry }
  | { kind: "document"; at: string; document: DocumentEntry };

function initialsOf(name: string) {
  return (name || "?").trim().slice(0, 1).toUpperCase();
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LogNotesPanel({ contentTypeId, objectId }: Props) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", contentTypeId, objectId],
    queryFn: () => platformApi.getNotes(String(contentTypeId), objectId),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", contentTypeId, objectId],
    queryFn: () => platformApi.getDocuments(String(contentTypeId), objectId),
  });

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...notes.map((note) => ({ kind: "note" as const, at: note.created_date, note })),
      ...documents.map((document) => ({ kind: "document" as const, at: document.created_date, document })),
    ];
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [notes, documents]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["notes", contentTypeId, objectId] });
    queryClient.invalidateQueries({ queryKey: ["documents", contentTypeId, objectId] });
  }

  async function handleSend() {
    if (!body.trim() && pendingFiles.length === 0) return;
    setBusy(true);
    try {
      if (body.trim()) {
        await platformApi.addNote({
          content_type: String(contentTypeId),
          object_id: objectId,
          body: body.trim(),
          is_internal: isInternal,
        });
      }
      for (const file of pendingFiles) {
        await platformApi.uploadDocument({
          contentTypeId: String(contentTypeId),
          objectId,
          file,
        });
      }
      setBody("");
      setPendingFiles([]);
      refresh();
    } catch {
      enqueueSnackbar("Couldn't post that — please try again.", { variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <TextField
          multiline minRows={2} size="small"
          placeholder="Log a note... use @name to mention someone"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {pendingFiles.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {pendingFiles.map((file, index) => (
              <Chip
                key={`${file.name}-${index}`}
                size="small"
                icon={<DescriptionIcon />}
                label={`${file.name} (${formatBytes(file.size)})`}
                onDelete={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                deleteIcon={<CloseIcon />}
              />
            ))}
          </Stack>
        )}

        {busy && <LinearProgress />}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Attach files to this note">
              <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <input
              ref={fileInputRef} type="file" multiple hidden
              onChange={(e) => {
                setPendingFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
                // Reset so picking the same file twice still fires onChange.
                e.target.value = "";
              }}
            />
            <FormControlLabel
              control={
                <Switch size="small" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
              }
              label={
                <Typography variant="caption">{isInternal ? "Internal only" : "Visible to customer"}</Typography>
              }
            />
          </Stack>
          <Button
            size="small" variant="contained" disabled={busy || (!body.trim() && pendingFiles.length === 0)}
            onClick={handleSend}
          >
            {pendingFiles.length > 0 && !body.trim() ? "Attach" : "Log note"}
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        {feed.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Nothing logged yet. Notes and attachments you add appear here.
          </Typography>
        )}

        {feed.map((item) =>
          item.kind === "note" ? (
            <Stack key={`note-${item.note.id}`} direction="row" spacing={1.5}>
              <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: "primary.main" }}>
                {initialsOf(item.note.created_by_name || "")}
              </Avatar>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25, flexWrap: "wrap" }}>
                  <Typography variant="caption" fontWeight={600}>
                    {item.note.created_by_name || "Unknown"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.note.created_date).toLocaleString()}
                  </Typography>
                  {!item.note.is_internal && <Chip size="small" label="Public" color="secondary" />}
                  {item.note.tags?.map((t) => <Chip key={t} size="small" label={t} variant="outlined" />)}
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.note.body}</Typography>
              </Box>
            </Stack>
          ) : (
            <Stack key={`doc-${item.document.id}`} direction="row" spacing={1.5}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: "action.selected", color: "text.secondary" }}>
                <DescriptionIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25, flexWrap: "wrap" }}>
                  <Typography variant="caption" fontWeight={600}>Attachment</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.document.created_date).toLocaleString()}
                  </Typography>
                  {item.document.category && (
                    <Chip size="small" variant="outlined" label={item.document.category} />
                  )}
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{item.document.title}</Typography>
                  {item.document.latest_version?.file_url ? (
                    <Link
                      href={item.document.latest_version.file_url}
                      target="_blank" rel="noopener"
                      sx={{ display: "inline-flex", alignItems: "center" }}
                    >
                      <DownloadIcon fontSize="small" />
                    </Link>
                  ) : null}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  v{item.document.latest_version?.version_number ?? 1}
                  {item.document.latest_version?.file_size_bytes
                    ? ` · ${formatBytes(item.document.latest_version.file_size_bytes)}`
                    : ""}
                </Typography>
              </Box>
            </Stack>
          )
        )}
      </Stack>
    </Box>
  );
}
