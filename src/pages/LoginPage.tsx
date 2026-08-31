import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography, Alert } from "@mui/material";
import { useAuth } from "../context/useAuth";
import { tokens } from "../theme";
import logo from "../assets/nikerp-logo.png";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: tokens.rail }}>
      <Paper sx={{ p: 4, width: 380 }} component="form" onSubmit={handleSubmit}>
        <Box component="img" src={logo} alt="NikERP.cloud" sx={{ height: 40, width: "auto", mb: 1.5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sign in to your workspace</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth size="small" label="Username" sx={{ mb: 2 }}
          value={username} onChange={(e) => setUsername(e.target.value)} autoFocus
        />
        <TextField
          fullWidth size="small" label="Password" type="password" sx={{ mb: 3 }}
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <Button fullWidth variant="contained" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </Paper>
    </Box>
  );
}
