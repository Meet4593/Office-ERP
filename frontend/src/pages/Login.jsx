import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Avatar, Alert, Link as MuiLink, Grid } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '../services/api';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await login(formData.email, formData.password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f6f8fb 0%, #e5e9f0 100%)'
    }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2, p: 2, borderRadius: 3, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Nexus Login
          </Typography>
          
          {location.state?.message && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{location.state.message}</Alert>}
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>
            <Grid container>
              <Grid item xs>
                <Link to="/forgot-password" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500, fontSize: '0.875rem' }}>
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link to="/signup" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500, fontSize: '0.875rem' }}>
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
