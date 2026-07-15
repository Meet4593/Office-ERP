import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Snackbar, Alert, Menu, MenuItem } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/api';
import { exportToCSV, exportDetailedExcel, exportDetailedPDF, generateInvoicePDF } from '../utils/exportUtils';

const getStatusColor = (status) => {
  switch(status) {
    case 'COMPLETED': return 'success';
    case 'PENDING': return 'warning';
    case 'DRAFT': return 'default';
    default: return 'primary';
  }
};

export default function TransactionList({ type, title, newRoute }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const userPerms = user.permissions || [];
  const canEdit = userRole === 'ADMIN';
  const canDelete = userRole === 'ADMIN';
  const canAdd = true; // Everyone can add (create) entries

  const [rows, setRows] = useState([]);
  const [rawTransactions, setRawTransactions] = useState([]);
  
  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Status Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);

  // Party Filter State
  const [partyFilter, setPartyFilter] = useState('ALL');
  const [partyAnchorEl, setPartyAnchorEl] = useState(null);

  // Month Filter State
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [monthAnchorEl, setMonthAnchorEl] = useState(null);

  const fetchTransactions = () => {
    getTransactions().then(res => {
      const rawData = res.data.map(item => ({
        ...item,
        amount: (parseFloat(item.unit || 0) * parseFloat(item.rate || 0)) || item.rate || 0,
        supplierCustomer: item.partAccountName || item.servicePerson || 'N/A'
      }));
      setRawTransactions(rawData);

      const filteredData = type === 'ALL' ? rawData : rawData.filter(r => r.type === type);

      // Group multiple items belonging to the same bill into a single row
      const groupedMap = new Map();
      filteredData.forEach(item => {
        const dateStr = item.date ? item.date.substring(0, 10) : 'nodate';
        const inv = item.supplierInvoiceNum || 'noinv';
        const key = `${item.type}_${dateStr}_${item.supplierCustomer}_${inv}`;
        
        if (!groupedMap.has(key)) {
          groupedMap.set(key, { ...item, groupedIds: [item.id] });
        } else {
          const group = groupedMap.get(key);
          group.amount += item.amount;
          group.paidAmount += (item.paidAmount || 0);
          group.groupedIds.push(item.id);
        }
      });

      setRows(Array.from(groupedMap.values()));
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTransactions();
  }, [type]);

  const handleEdit = (id, rowType, groupedIds) => {
    let routePrefix = '';
    if (rowType === 'PURCHASE') routePrefix = '/purchase/edit';
    else if (rowType === 'SALE') routePrefix = '/sales/edit';
    else if (rowType === 'SERVICE') routePrefix = '/services/edit';
    
    navigate(`${routePrefix}/${id}`, { state: { groupedIds } });
  };

  const openDeleteDialog = (groupedIds) => {
    setTransactionToDelete(groupedIds);
    setDeletePassword('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePassword) {
      setToast({ open: true, message: 'Password is required', severity: 'error' });
      return;
    }
    
    try {
      const idsToDelete = Array.isArray(transactionToDelete) ? transactionToDelete : [transactionToDelete];
      for (const id of idsToDelete) {
        await deleteTransaction(id, deletePassword);
      }
      setToast({ open: true, message: 'Transaction deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      setToast({ 
        open: true, 
        message: err.response?.data?.message || 'Error deleting transaction', 
        severity: 'error' 
      });
    }
  };

  const processRowUpdate = async (newRow, oldRow) => {
    if (newRow.status !== oldRow.status) {
      try {
        const idsToUpdate = newRow.groupedIds || [newRow.id];
        for (const id of idsToUpdate) {
          const originalTx = rawTransactions.find(t => t.id === id);
          if (originalTx) {
            await updateTransaction(id, { ...originalTx, status: newRow.status });
          }
        }
        setToast({ open: true, message: 'Status updated successfully', severity: 'success' });
        return newRow;
      } catch (err) {
        console.error(err);
        setToast({ open: true, message: 'Failed to update status', severity: 'error' });
        return oldRow;
      }
    }
    return newRow;
  };

  const columns = [
    { field: 'srNumber', headerName: 'SR Number', width: 160 },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 140, 
      renderHeader: () => (
        <Box 
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }} 
          onClick={(e) => setMonthAnchorEl(e.currentTarget)}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Date (Month)</Typography>
          <ArrowDropDownIcon sx={{ ml: 0.5 }} />
        </Box>
      ),
      renderCell: (params) => params.value ? dayjs(params.value).format('DD/MM/YYYY') : '' 
    },
    { 
      field: 'supplierCustomer', 
      headerName: 'Party Name', 
      flex: 1, 
      minWidth: 200,
      renderHeader: () => (
        <Box 
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }} 
          onClick={(e) => setPartyAnchorEl(e.currentTarget)}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Party Name</Typography>
          <ArrowDropDownIcon sx={{ ml: 0.5 }} />
        </Box>
      )
    },
    { 
      field: 'amount', 
      headerName: 'Total (₹)', 
      width: 130,
      type: 'number',
      renderCell: (params) => params.value ? `₹ ${params.value.toLocaleString()}` : ''
    },
    {
      field: 'balance',
      headerName: 'Balance (₹)',
      width: 130,
      type: 'number',
      renderCell: (params) => {
        const total = params.row.amount || 0;
        const paid = params.row.paidAmount || 0;
        const balance = total - paid;
        return balance > 0 ? `₹ ${balance.toLocaleString()}` : '₹ 0';
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderHeader: () => (
        <Box 
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }} 
          onClick={(e) => setStatusAnchorEl(e.currentTarget)}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Status</Typography>
          <ArrowDropDownIcon sx={{ ml: 0.5 }} />
        </Box>
      ),
      editable: true,
      type: 'singleSelect',
      valueOptions: ['DRAFT', 'PENDING', 'COMPLETED'],
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value)} 
          size="small" 
          variant="outlined" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          {canEdit && (
            <IconButton 
              size="small" 
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(params.row.id, params.row.type, params.row.groupedIds || [params.row.id]);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {canDelete && (
            <IconButton 
              size="small" 
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteDialog(params.row.groupedIds || [params.row.id]);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          {userRole === 'ADMIN' && (
            <IconButton 
              size="small"
              color="success"
              title="Make Payment / Receipt"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/vouchers', { 
                  state: { 
                    autoFill: { 
                      transactionId: params.row.id,
                      transactionData: params.row,
                      partyAccountName: params.row.supplierCustomer, 
                      amount: params.row.amount, 
                      description: `${params.row.type === 'PURCHASE' ? 'Payment' : 'Receipt'} for ${params.row.srNumber}`, 
                      voucherType: params.row.type === 'PURCHASE' ? 'PAYMENT' : 'RECEIPT' 
                    } 
                  } 
                });
              }}
            >
              <CurrencyRupeeIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton 
            size="small"
            color="info"
            onClick={(e) => {
              e.stopPropagation();
              generateInvoicePDF(params.row);
            }}
          >
            <PrintIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const handleExport = () => {
    exportDetailedPDF(filteredRows, type, `${title}_Report.pdf`);
  };

  const filteredRows = rows.filter(r => {
    const rMonth = r.date ? dayjs(r.date).format('MMMM YYYY') : '';
    const matchMonth = monthFilter === 'ALL' || rMonth === monthFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchParty = partyFilter === 'ALL' || r.supplierCustomer === partyFilter;
    return matchMonth && matchStatus && matchParty;
  });

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to delete this transaction? This action cannot be undone. Please enter your password to confirm.
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleDeleteConfirm();
              }
            }}
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
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export PDF Report
          </Button>
          {canAdd && (
            <Button 
              variant="contained"
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => navigate(newRoute)}
            >
              New {title.replace('List', '')}
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ width: '100%', flexGrow: 1, p: 2, display: 'flex' }}>
        <DataGrid
          rows={filteredRows}
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
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) => console.error(error)}
          sx={{ border: 0 }}
        />
      </Paper>

      <Menu
        anchorEl={statusAnchorEl}
        open={Boolean(statusAnchorEl)}
        onClose={() => setStatusAnchorEl(null)}
      >
        <MenuItem onClick={() => { setStatusFilter('ALL'); setStatusAnchorEl(null); }}>All Statuses</MenuItem>
        <MenuItem onClick={() => { setStatusFilter('DRAFT'); setStatusAnchorEl(null); }}>DRAFT</MenuItem>
        <MenuItem onClick={() => { setStatusFilter('PENDING'); setStatusAnchorEl(null); }}>PENDING</MenuItem>
        <MenuItem onClick={() => { setStatusFilter('COMPLETED'); setStatusAnchorEl(null); }}>COMPLETED</MenuItem>
      </Menu>

      <Menu
        anchorEl={monthAnchorEl}
        open={Boolean(monthAnchorEl)}
        onClose={() => setMonthAnchorEl(null)}
        PaperProps={{ style: { maxHeight: 300 } }}
      >
        <MenuItem onClick={() => { setMonthFilter('ALL'); setMonthAnchorEl(null); }}>
          <em>All Months</em>
        </MenuItem>
        {[...new Set(rows.map(r => r.date ? dayjs(r.date).format('MMMM YYYY') : ''))]
          .filter(Boolean)
          .sort((a, b) => new Date(b) - new Date(a))
          .map((monthStr) => (
          <MenuItem 
            key={monthStr} 
            onClick={() => { setMonthFilter(monthStr); setMonthAnchorEl(null); }}
          >
            {monthStr}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={partyAnchorEl}
        open={Boolean(partyAnchorEl)}
        onClose={() => setPartyAnchorEl(null)}
        PaperProps={{ style: { maxHeight: 300 } }}
      >
        <MenuItem onClick={() => { setPartyFilter('ALL'); setPartyAnchorEl(null); }}>
          <em>All Parties</em>
        </MenuItem>
        {[...new Set(rows.map(r => r.supplierCustomer))].filter(Boolean).sort().map((partyName) => (
          <MenuItem 
            key={partyName} 
            onClick={() => { setPartyFilter(partyName); setPartyAnchorEl(null); }}
          >
            {partyName}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
