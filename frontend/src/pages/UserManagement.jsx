import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormGroup, FormControlLabel, Checkbox, Alert, Snackbar, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getMasterData, getUsers, updateUser, createUser, resetUserPassword, deleteUser } from '../services/api';

const DEFAULT_PERMS = { VIEW: true, ADD: false, EDIT: false, DELETE: false };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // --- User create/edit dialog state ---
  const [userDialog, setUserDialog] = useState({ open: false, isEdit: false });
  const [formData, setFormData] = useState({
    id: null, name: '', email: '', password: '', role: 'EMPLOYEE', department: '', permissions: { ...DEFAULT_PERMS }
  });

  // --- Reset password dialog state ---
  const [resetDialog, setResetDialog] = useState({ open: false, userId: null, name: '' });
  const [newPassword, setNewPassword] = useState('');

  // --- Delete confirmation dialog state ---
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, name: '' });

  useEffect(() => {
    fetchUsers();
    getMasterData().then(res => setDepartments(res.data.departments || [])).catch(console.error);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      if (Array.isArray(res.data)) setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const showSnack = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  // --- Open create or edit dialog ---
  const openCreateDialog = () => {
    setFormData({ id: null, name: '', email: '', password: '', role: 'EMPLOYEE', department: '', permissions: { ...DEFAULT_PERMS } });
    setUserDialog({ open: true, isEdit: false });
  };

  const openEditDialog = (user) => {
    const permsObj = { ...DEFAULT_PERMS };
    (user.permissions || []).forEach(p => { permsObj[p] = true; });
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      permissions: permsObj
    });
    setUserDialog({ open: true, isEdit: true });
  };

  const handleSave = async () => {
    try {
      const permsArray = Object.keys(formData.permissions).filter(k => formData.permissions[k]);

      if (formData.id) {
        // Edit mode - update name, username, role, department, permissions
        await updateUser(formData.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department || null,
          permissions: permsArray
        });
        showSnack('User updated successfully!');
      } else {
        // Create mode - validate required fields
        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
          showSnack('Name, Username, and Password are all required.', 'error');
          return;
        }
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department || null,
          permissions: permsArray
        });
        showSnack('User created successfully!');
      }
      setUserDialog({ open: false, isEdit: false });
      fetchUsers();
    } catch (err) {
      console.error(err);
      showSnack(err.response?.data?.message || 'Failed to save user. Please try again.', 'error');
    }
  };

  // --- Reset password ---
  const openResetDialog = (user) => {
    setNewPassword('');
    setResetDialog({ open: true, userId: user.id, name: user.name });
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 4) {
      showSnack('Password must be at least 4 characters.', 'error');
      return;
    }
    try {
      await resetUserPassword(resetDialog.userId, newPassword);
      showSnack(`Password for "${resetDialog.name}" reset successfully!`);
      setResetDialog({ open: false, userId: null, name: '' });
    } catch (err) {
      console.error(err);
      showSnack(err.response?.data?.message || 'Failed to reset password.', 'error');
    }
  };

  // --- Delete user ---
  const openDeleteDialog = (user) => {
    setDeleteDialog({ open: true, userId: user.id, name: user.name });
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(deleteDialog.userId);
      showSnack(`User "${deleteDialog.name}" deleted successfully.`);
      setDeleteDialog({ open: false, userId: null, name: '' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      showSnack(err.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Add New User
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Username</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Permissions</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.name}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: '#1565c0' }}>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    color={user.role === 'ADMIN' ? 'error' : 'primary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{user.department || '—'}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', color: '#555' }}>
                  {(user.permissions || []).join(', ') || '—'}
                </TableCell>
                <TableCell>
                  <IconButton color="primary" title="Edit user" onClick={() => openEditDialog(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="warning" title="Reset password" onClick={() => openResetDialog(user)}>
                    <LockResetIcon />
                  </IconButton>
                  <IconButton color="error" title="Delete user" onClick={() => openDeleteDialog(user)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                  No users found or loading...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit User Dialog */}
      <Dialog open={userDialog.open} onClose={() => setUserDialog({ open: false, isEdit: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {userDialog.isEdit ? `Edit User: ${formData.name}` : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Username"
              fullWidth
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              helperText={userDialog.isEdit ? "You can change the username here" : "This is what the user will type to log in"}
            />
            {!userDialog.isEdit && (
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                helperText="Minimum 4 characters"
              />
            )}
            <TextField
              label="Role"
              select
              fullWidth
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="EMPLOYEE">EMPLOYEE</MenuItem>
            </TextField>

            {formData.role !== 'ADMIN' && (
              <>
                <TextField
                  label="Department"
                  select
                  fullWidth
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {departments.map(d => (
                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                  ))}
                </TextField>

                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold', color: '#555' }}>
                  Permissions
                </Typography>
                <FormGroup row>
                  {Object.keys(DEFAULT_PERMS).map(perm => (
                    <FormControlLabel
                      key={perm}
                      control={
                        <Checkbox
                          checked={!!formData.permissions[perm]}
                          onChange={e => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, [perm]: e.target.checked }
                          })}
                        />
                      }
                      label={perm}
                    />
                  ))}
                </FormGroup>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUserDialog({ open: false, isEdit: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {userDialog.isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, userId: null, name: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Reset Password — {resetDialog.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Enter a new password for this user. They can log in with it immediately.
            </Alert>
            <TextField
              label="New Password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              helperText="Minimum 4 characters"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetDialog({ open: false, userId: null, name: '' })}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleResetPassword}>
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: null, name: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Are you sure you want to permanently delete <strong>{deleteDialog.name}</strong>? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null, name: '' })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser}>
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
