import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Avatar } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { forgotPassword } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const res = await forgotPassword(email);
      setStatus({ type: 'success', msg: res.data?.message || 'Password reset link sent! Check your email.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to request password reset' });
    } finally {
      setLoading(false);
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
            <LockResetIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
          
          {status.msg && <Alert severity={status.type} sx={{ width: '100%', mb: 2 }}>{status.msg}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
                Back to Login
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
