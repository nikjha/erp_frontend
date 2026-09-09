import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography, Alert, InputAdornment, IconButton } from "@mui/material";
import { useAuth } from "../context/useAuth";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupsIcon from '@mui/icons-material/Groups';
import SecurityIcon from '@mui/icons-material/Security';
import logo from "../assets/nikerp-logo.png";
import loginBg from "../assets/loginbg.jpg";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <Box sx={{
      height: "100vh",
      display: "flex",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Left Panel - Features */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 6,
        color: 'white',
        position: 'relative',
        zIndex: 1,
        backgroundImage: `linear-gradient(rgba(44, 77, 111, 0.85), rgba(44, 77, 111, 0.85)), url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Logo */}
        <Box>
          <Box component="img" src={logo} alt="NikERP.cloud" sx={{ height: 50, width: "auto", mb: 6 }} />
        </Box>

        {/* Main Content */}
        <Box sx={{ maxWidth: 500 }}>
          <Typography variant="h3" sx={{
            fontWeight: 400,
            mb: 0.5,
            color: 'white',
            lineHeight: 1.2
          }}>
            Your Business
          </Typography>
          <Typography variant="h3" sx={{
            fontWeight: 600,
            mb: 4,
            background: 'linear-gradient(90deg, #64b5f6 0%, #42a5f5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.2
          }}>
            in Smarter Hands
          </Typography>

          <Box sx={{ width: 60, height: 3, bgcolor: '#42a5f5', mb: 4 }} />

          <Typography variant="body1" sx={{ mb: 5, opacity: 0.9, lineHeight: 1.6 }}>
            Manage customers, vendors, sales, purchases<br />
            and more — all in one powerful platform.
          </Typography>

          {/* Features */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(100, 181, 246, 0.15)',
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChartIcon sx={{ fontSize: 28, color: '#64b5f6' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Streamline Operations
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Save time and increase productivity
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(100, 181, 246, 0.15)',
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GroupsIcon sx={{ fontSize: 28, color: '#64b5f6' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Better Collaboration
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Keep your team connected
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(100, 181, 246, 0.15)',
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SecurityIcon sx={{ fontSize: 28, color: '#64b5f6' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Secure & Reliable
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Your data is always protected
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer Quote */}
        <Box>
          <Box sx={{ width: 40, height: 2, bgcolor: 'rgba(255,255,255,0.3)', mb: 2 }} />
          <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
            "Simpler tools. Stronger businesses."
          </Typography>
        </Box>
      </Box>

      {/* Right Panel - Login Form */}
      <Box sx={{
        width: 550,
        bgcolor: '#f5f7fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4
      }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            width: '100%',
            maxWidth: 420,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
          component="form"
          onSubmit={handleSubmit}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Box component="img" src={logo} alt="NikERP.cloud" sx={{ height: 50, width: "auto" }} />
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <TextField
            fullWidth
            placeholder="Username"
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#f8f9fa',
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#2196f3',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2196f3',
                }
              }
            }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: '#757575', fontSize: 22 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            sx={{
              mb: 3.5,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#f8f9fa',
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#2196f3',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2196f3',
                }
              }
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: '#757575', fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ?
                      <VisibilityOffOutlinedIcon sx={{ fontSize: 20, color: '#757575' }} /> :
                      <VisibilityOutlinedIcon sx={{ fontSize: 20, color: '#757575' }} />
                    }
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: '#2196f3',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                bgcolor: '#1976d2',
                boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
              },
              '&:disabled': {
                bgcolor: '#e0e0e0',
              }
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
