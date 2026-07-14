import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Avatar } from '@mui/material';
import PasswordIcon from '@mui/icons-material/Password';
import { resetPassword } from '../services/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;
  const securityQuestion = location.state?.securityQuestion;

  useEffect(() => {
    if (!email || !securityQuestion) {
      setStatus({ type: 'error', msg: 'Missing email or security question. Please restart the reset process.' });
    }
  }, [email, securityQuestion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !securityQuestion) return;

    if (password !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Passwords do not match!' });
      return;
    }

    if (password.length < 6) {
      setStatus({ type: 'error', msg: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const res = await resetPassword(email, securityAnswer, password);
      setStatus({ type: 'success', msg: res.data?.message || 'Password reset successfully!' });
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successfully. Please log in.' }});
      }, 2000);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to reset password' });
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
          <Avatar sx={{ m: 1, bgcolor: 'success.main', width: 56, height: 56 }}>
            <PasswordIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
            Answer Security Question
          </Typography>
          {securityQuestion && (
            <Typography variant="body1" color="primary" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
              Q: {securityQuestion}
            </Typography>
          )}
          
          {status.msg && <Alert severity={status.type} sx={{ width: '100%', mb: 2 }}>{status.msg}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }} autoComplete="off">
            {/* Hidden fields to trick browser autofill */}
            <input type="text" style={{ display: 'none' }} />
            <input type="password" style={{ display: 'none' }} />
            <TextField
              margin="normal"
              required
              fullWidth
              name="securityAnswer"
              label="Security Answer"
              type="text"
              id="securityAnswer"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              disabled={loading || !email || !securityQuestion}
              autoComplete="off"
              inputProps={{ autoComplete: 'off' }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !email || !securityQuestion}
              autoComplete="new-password"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmNewPassword"
              label="Confirm New Password"
              type="password"
              id="confirmNewPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || !email || !securityQuestion}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="success"
              sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
              disabled={loading || !email || !securityQuestion}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
