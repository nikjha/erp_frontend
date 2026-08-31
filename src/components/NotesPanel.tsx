import { useState } from "react";
import { Box, TextField, Button, Stack, Typography, Chip, FormControlLabel, Switch, Divider } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { platformApi } from "../api/genericApi";

interface Props {
  contentTypeId: number;
  objectId: string;
}

export default function NotesPanel({ contentTypeId, objectId }: Props) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", contentTypeId, objectId],
    queryFn: () => platformApi.getNotes(String(contentTypeId), objectId),
  });

  async function handleAdd() {
    if (!body.trim()) return;
    await platformApi.addNote({ content_type: String(contentTypeId), object_id: objectId, body, is_internal: isInternal });
    setBody("");
    queryClient.invalidateQueries({ queryKey: ["notes", contentTypeId, objectId] });
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <TextField
          multiline minRows={2} size="small" placeholder="Add a note... use @name to mention someone"
          value={body} onChange={(e) => setBody(e.target.value)}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <FormControlLabel
            control={<Switch size="small" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />}
            label={<Typography variant="caption">{isInternal ? "Internal only" : "Visible to customer"}</Typography>}
          />
          <Button size="small" variant="contained" onClick={handleAdd}>Add Note</Button>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={2}>
        {notes.length === 0 && <Typography variant="body2" color="text.secondary">No notes yet.</Typography>}
        {notes.map((n) => (
          <Box key={n.id}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>{n.created_by}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(n.created_date).toLocaleString()}
              </Typography>
              {!n.is_internal && <Chip size="small" label="Public" color="secondary" />}
              {n.tags?.map((t) => <Chip key={t} size="small" label={t} variant="outlined" />)}
            </Stack>
            <Typography variant="body2">{n.body}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
