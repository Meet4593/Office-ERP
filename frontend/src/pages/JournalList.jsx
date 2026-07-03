import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Snackbar, Alert } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getJournals, deleteJournal } from '../services/api';
import { exportToCSV } from '../utils/exportUtils';

export default function JournalList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const fetchJournals = () => {
    getJournals().then(res => {
      // Calculate total amount for list view
      const mapped = res.data.map(j => {
        const totalDebit = j.details?.reduce((sum, d) => sum + (d.debit || 0), 0) || 0;
        return {
          ...j,
          amount: totalDebit
        };
      });
      setRows(mapped);
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const openDeleteDialog = (id) => {
    setJournalToDelete(id);
    setDeletePassword('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePassword) {
      setToast({ open: true, message: 'Password is required', severity: 'error' });
      return;
    }
    
    try {
      await deleteJournal(journalToDelete, deletePassword);
      setToast({ open: true, message: 'Journal entry deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchJournals();
    } catch (err) {
      console.error(err);
      setToast({ 
        open: true, 
        message: err.response?.data?.message || 'Error deleting journal entry', 
        severity: 'error' 
      });
    }
  };

  const columns = [
    { field: 'srNumber', headerName: 'Journal No.', width: 160 },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 130, 
      renderCell: (params) => params.value ? dayjs(params.value).format('DD-MMM-YYYY') : '' 
    },
    { field: 'description', headerName: 'Narration', flex: 1, minWidth: 200 },
    { 
      field: 'amount', 
      headerName: 'Total Amount (₹)', 
      width: 150,
      type: 'number',
      renderCell: (params) => params.value ? `₹ ${params.value.toLocaleString()}` : '₹ 0'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton 
            size="small" 
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/journal/edit/${params.row.id}`);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(params.row.id);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const handleExport = () => {
    const exportColumns = columns.filter(c => c.field !== 'actions');
    exportToCSV(rows, exportColumns, `Journal_Export.csv`);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Journal Entry</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to delete this journal entry? Please enter your password to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Journal Vouchers
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export to Excel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/journal/new')}
          >
            New Journal
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', flexGrow: 1, p: 2, display: 'flex' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>
    </Box>
  );
}
