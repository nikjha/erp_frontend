import { useState } from "react";
import {
  Box, Stack, TextField, Button, Chip, MenuItem, Typography, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import { platformApi } from "../api/genericApi";
import type { TodoEntry } from "../types/api";

interface Props {
  contentTypeId: number;
  objectId: string;
}

const PRIORITY_COLOR: Record<string, "default" | "warning" | "error" | "info"> = {
  low: "default", medium: "info", high: "warning", urgent: "error",
};

const PRIORITIES = ["low", "medium", "high", "urgent"];

/**
 * To-dos attached to a record.
 *
 * Two things the platform's task model always supported but this panel
 * never surfaced: a **category** (what kind of work this is) and an
 * explicit **assignee**. Both matter because assigning a task now
 * notifies the person it lands on — an unassigned task notified nobody
 * and quietly became the creator's own.
 *
 * Closing is deliberately not a free-for-all: the server only accepts a
 * close from the assignee (or the person who raised it), and `can_close`
 * on each row is the server's own verdict, so the button matches what
 * the API will actually allow.
 */
export default function TodosPanel({ contentTypeId, objectId }: Props) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categoryId, setCategoryId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [closing, setClosing] = useState<TodoEntry | null>(null);
  const [closingRemarks, setClosingRemarks] = useState("");

  const todosKey = ["todos", contentTypeId, objectId];

  const { data: todos = [] } = useQuery({
    queryKey: todosKey,
    queryFn: () => platformApi.getTodos(String(contentTypeId), objectId),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["todo-categories"],
    queryFn: () => platformApi.getTodoCategories(),
    staleTime: 5 * 60_000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["user-options"],
    queryFn: () => platformApi.getUsers(),
    staleTime: 5 * 60_000,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: todosKey });
    // A new assignment raises a notification for someone; refresh the bell
    // so the person assigning sees the system reacted.
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function handleAdd() {
    if (!title.trim()) return;
    try {
      await platformApi.createTodo({
        title: title.trim(),
        priority,
        category: categoryId || null,
        assigned_to: assigneeId || undefined,
        due_date: dueDate || null,
        related_content_type: String(contentTypeId),
        related_object_id: objectId,
      } as never);
      setTitle("");
      setCategoryId("");
      setAssigneeId("");
      setDueDate("");
      setPriority("medium");
      setShowForm(false);
      refresh();
      enqueueSnackbar(
        assigneeId ? "Task assigned — they've been notified." : "Task added.",
        { variant: "success" }
      );
    } catch {
      enqueueSnackbar("Couldn't create that task.", { variant: "error" });
    }
  }

  async function handleClose() {
    if (!closing) return;
    try {
      await platformApi.closeTodo(closing.id, closingRemarks);
      setClosing(null);
      setClosingRemarks("");
      refresh();
      enqueueSnackbar("Task closed.", { variant: "success" });
    } catch {
      enqueueSnackbar("Only the person this task is assigned to can close it.", { variant: "error" });
    }
  }

  async function handleReopen(todo: TodoEntry) {
    try {
      await platformApi.reopenTodo(todo.id);
      refresh();
    } catch {
      enqueueSnackbar("Couldn't reopen that task.", { variant: "error" });
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {todos.length} task{todos.length === 1 ? "" : "s"}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
          Add task
        </Button>
      </Stack>

      <Stack divider={<Divider flexItem />}>
        {todos.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            No tasks linked to this record.
          </Typography>
        )}

        {todos.map((todo) => {
          const isClosed = todo.status === "completed";
          return (
            <Stack key={todo.id} direction="row" spacing={1} alignItems="flex-start" sx={{ py: 1 }}>
              <Tooltip
                title={
                  isClosed
                    ? `Closed by ${todo.closed_by_name || "someone"}`
                    : todo.can_close
                      ? "Mark complete"
                      : "Only the assignee can close this"
                }
              >
                {/* span keeps the tooltip working while the button is disabled */}
                <span>
                  <IconButton
                    size="small"
                    disabled={!isClosed && !todo.can_close}
                    onClick={() => (isClosed ? handleReopen(todo) : setClosing(todo))}
                  >
                    {isClosed
                      ? <CheckCircleIcon fontSize="small" color="success" />
                      : <CheckCircleOutlineIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ textDecoration: isClosed ? "line-through" : undefined, opacity: isClosed ? 0.6 : 1 }}
                >
                  {todo.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25, flexWrap: "wrap", gap: 0.5 }}>
                  {todo.category_name && (
                    <Chip
                      size="small" variant="outlined" label={todo.category_name}
                      sx={todo.category_color ? { borderColor: todo.category_color, color: todo.category_color } : undefined}
                    />
                  )}
                  <Chip size="small" label={todo.priority} color={PRIORITY_COLOR[todo.priority] ?? "default"} />
                  <Typography variant="caption" color="text.secondary">
                    {todo.assigned_to_name || "Unassigned"}
                    {todo.assigned_by_name ? ` · by ${todo.assigned_by_name}` : ""}
                    {todo.due_date ? ` · due ${new Date(todo.due_date).toLocaleDateString()}` : ""}
                  </Typography>
                </Stack>
                {isClosed && todo.closing_remarks && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    “{todo.closing_remarks}”
                  </Typography>
                )}
                {isClosed && todo.closed_by_name && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Closed by {todo.closed_by_name}
                    {todo.closed_date ? ` on ${new Date(todo.closed_date).toLocaleDateString()}` : ""}
                  </Typography>
                )}
              </Box>

              {isClosed && todo.can_close && (
                <Tooltip title="Reopen">
                  <IconButton size="small" onClick={() => handleReopen(todo)}>
                    <ReplayIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        })}
      </Stack>

      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              size="small" fullWidth label="What needs doing?"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select size="small" fullWidth label="Category"
                value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                helperText={categories.length === 0 ? "No categories defined yet" : undefined}
              >
                <MenuItem value=""><em>Uncategorised</em></MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" fullWidth label="Assign to"
                value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
                helperText="They'll be notified"
              >
                <MenuItem value=""><em>Myself</em></MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.employee_name || u.username}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select size="small" fullWidth label="Priority"
                value={priority} onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small" fullWidth label="Due" type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Cancel</Button>
          <Button variant="contained" disabled={!title.trim()} onClick={handleAdd}>
            Create task
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!closing} onClose={() => setClosing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Close "{closing?.title}"</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline minRows={2} size="small" sx={{ mt: 1 }}
            label="Closing remarks (optional)"
            value={closingRemarks} onChange={(e) => setClosingRemarks(e.target.value)}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {closing?.assigned_by_name
              ? `${closing.assigned_by_name} will be notified that this is done.`
              : "The person who raised this will be notified."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClosing(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleClose}>Close task</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
