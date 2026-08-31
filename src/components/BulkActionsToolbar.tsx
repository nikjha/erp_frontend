import { Box, Typography, Button, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  count: number;
  /** Omitted when the caller's role has no delete permission — the button
   *  is then hidden rather than shown-and-refused. */
  onDelete?: () => void;
  onClear: () => void;
}

export default function BulkActionsToolbar({ count, onDelete, onClear }: Props) {
  return (
    <Box
      sx={{
        mx: 2, mb: 1, px: 2, py: 1, borderRadius: 1,
        bgcolor: "secondary.main", color: "secondary.contrastText",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <Typography variant="body2">{count} selected</Typography>
      <Stack direction="row" gap={1}>
        {onDelete && (
          <Button size="small" color="inherit" startIcon={<DeleteIcon />} onClick={onDelete}>
            Delete
          </Button>
        )}
        <Button size="small" color="inherit" startIcon={<CloseIcon />} onClick={onClear}>
          Clear
        </Button>
      </Stack>
    </Box>
  );
}
