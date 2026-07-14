import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, IconButton, Alert, Snackbar
} from '@mui/material';
import { DataGrid, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { getMasterData, addMasterRecord, updateMasterRecord, deleteMasterRecord } from '../services/api';

const tabsConfig = [
  { label: 'Departments', endpoint: 'departments', fields: [{ name: 'name', label: 'Department Name' }] },
  { label: 'Items', endpoint: 'items', fields: [{ name: 'name', label: 'Item Name' }, { name: 'description', label: 'Description' }] },
  { label: 'Suppliers', endpoint: 'suppliers', fields: [{ name: 'name', label: 'Supplier Name' }, { name: 'contact', label: 'Contact' }, { name: 'email', label: 'Email' }, { name: 'address', label: 'Address' }] },
  { label: 'Customers', endpoint: 'customers', fields: [{ name: 'name', label: 'Customer Name' }, { name: 'contact', label: 'Contact' }, { name: 'email', label: 'Email' }, { name: 'address', label: 'Address' }] },
  { label: 'Machines', endpoint: 'machines', fields: [{ name: 'machineNum', label: 'Machine Number' }, { name: 'name', label: 'Machine Name' }, { name: 'department', label: 'Department' }] },
  { label: 'Units', endpoint: 'units', fields: [{ name: 'name', label: 'Unit Name (e.g. kg, pcs)' }] },
  { label: 'Payment Modes', endpoint: 'paymentModes', fields: [{ name: 'name', label: 'Payment Mode (e.g. CASH, BANK)' }] }
];

export default function MasterData() {
  const [tabIndex, setTabIndex] = useState(0);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMasterData();
      setData(res.data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeTab = tabsConfig[tabIndex];
  const rows = data[activeTab.endpoint] || [];

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleOpenDialog = () => {
    const initialData = {};
    activeTab.fields.forEach(f => initialData[f.name] = '');
    setFormData(initialData);
    setErrorMsg('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveRecord = async () => {
    try {
      setErrorMsg('');
      await addMasterRecord(activeTab.endpoint, formData);
      setSnackbar({ open: true, message: 'Record added successfully!', severity: 'success' });
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to add record');
    }
  };

  const processRowUpdate = async (newRow, oldRow) => {
    try {
      await updateMasterRecord(activeTab.endpoint, newRow.id, newRow);
      setSnackbar({ open: true, message: 'Record updated successfully!', severity: 'success' });
      return newRow;
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update record', severity: 'error' });
      return oldRow;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteMasterRecord(activeTab.endpoint, id);
      setSnackbar({ open: true, message: 'Record deleted!', severity: 'success' });
      fetchData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Cannot delete record, it might be in use.', severity: 'error' });
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    ...activeTab.fields.map(f => ({
      field: f.name,
      headerName: f.label,
      flex: 1,
      editable: true
    })),
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<DeleteIcon color="error" />}
          label="Delete"
          onClick={() => handleDelete(params.id)}
        />,
      ],
    }
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Master Data Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Add {activeTab.label.slice(0, -1)}
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            {tabsConfig.map((tab, idx) => (
              <Tab key={idx} label={tab.label} />
            ))}
          </Tabs>
        </Box>
        
        <Box sx={{ flexGrow: 1, mt: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(error) => console.error(error)}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: { showQuickFilter: true },
            }}
            sx={{ border: 0 }}
          />
        </Box>
      </Paper>

      {/* Add Record Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add New {activeTab.label.slice(0, -1)}</DialogTitle>
        <DialogContent dividers>
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {activeTab.fields.map(f => (
              <TextField
                key={f.name}
                label={f.label}
                fullWidth
                required
                value={formData[f.name] || ''}
                onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSaveRecord} variant="contained">Save Record</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
