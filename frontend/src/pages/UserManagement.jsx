import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getMasterData, getUsers, updateUser, createUser } from '../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const defaultPerms = { VIEW: true, ADD: false, EDIT: false, DELETE: false };
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'EMPLOYEE', department: '', permissions: defaultPerms
  });

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

  const handleOpen = (user = null) => {
    if (user) {
      const permsObj = { ...defaultPerms };
      (user.permissions || []).forEach(p => permsObj[p] = true);
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        permissions: permsObj
      });
    } else {
      setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE', department: '', permissions: defaultPerms });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const permsArray = Object.keys(formData.permissions).filter(k => formData.permissions[k]);
      
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department || null,
        permissions: permsArray
      };

      if (formData.id) {
        await updateUser(formData.id, {
          role: formData.role,
          department: formData.department || null,
          permissions: permsArray
        });
      } else {
        if (!formData.name || !formData.email || !formData.password) {
          alert('Name, Email, and Password are required to create a new user.');
          return;
        }
        await createUser({ ...payload, password: formData.password });
      }
      setOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>User Management (Admin)</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add New User
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white' }}>Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Username</TableCell>
              <TableCell sx={{ color: 'white' }}>Role</TableCell>
              <TableCell sx={{ color: 'white' }}>Department</TableCell>
              <TableCell sx={{ color: 'white' }}>Permissions</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.department || 'N/A'}</TableCell>
                <TableCell>{(user.permissions || []).join(', ')}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpen(user)}><EditIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No users found or loading...</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formData.id ? 'Edit User' : 'New User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {!formData.id && (
              <>
                <TextField label="Name" fullWidth value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <TextField label="Username" type="text" fullWidth value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <TextField label="Password" type="password" fullWidth value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </>
            )}
            
            <TextField label="Role" select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="EMPLOYEE">EMPLOYEE</MenuItem>
            </TextField>

            {formData.role !== 'ADMIN' && (
              <>
                <TextField label="Department" select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {departments.map(d => (
                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                  ))}
                </TextField>

                <Typography variant="subtitle1" sx={{ mt: 1 }}>Permissions</Typography>
                <FormGroup row>
                  {Object.keys(defaultPerms).map(perm => (
                    <FormControlLabel 
                      key={perm}
                      control={
                        <Checkbox 
                          checked={formData.permissions[perm]} 
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
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
