import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Grid, Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getVouchers, deleteVoucher, createVoucher, getTransactions, updateTransaction } from '../services/api';

export default function VoucherList() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const [rows, setRows] = useState([]);
  const [partyOptions, setPartyOptions] = useState([]);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [monthFilter, setMonthFilter] = useState(dayjs());

  const [formData, setFormData] = useState({
    date: dayjs(),
    voucherType: 'RECEIPT',
    transactionMode: 'CASH',
    partyAccountName: '',
    description: '',
    month: '',
    amount: '',
  });

  const handleFormChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleDateChange = (val) => {
    setFormData({ ...formData, date: val });
  };

  const handleQuickSave = async () => {
    if (!formData.partyAccountName || !formData.amount) {
      setToast({ open: true, message: 'Particulars and Amount are required', severity: 'error' });
      return;
    }
    
    try {
      const data = {
        ...formData,
        date: formData.date ? formData.date.toISOString() : null,
      };
      await createVoucher(data);

      setToast({ open: true, message: 'Entry added to Cash Book successfully!', severity: 'success' });
      
      // Reset form
      setFormData({
        ...formData,
        partyAccountName: '',
        description: '',
        month: '',
        amount: '',
        transactionId: undefined,
        transactionData: undefined,
      });
      fetchVouchers();
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Error saving entry', severity: 'error' });
    }
  };

  const fetchVouchers = () => {
    getVouchers().then(res => {
      setRows(res.data);
    }).catch(err => console.error(err));
  };

  const fetchPartyNames = () => {
    getTransactions().then(res => {
      const uniqueParties = [...new Set(res.data.map(t => t.partAccountName).filter(Boolean))];
      setPartyOptions(uniqueParties);
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    fetchVouchers();
    fetchPartyNames();
    
    // Auto-fill form if navigating from another page (like Payment action from Purchases list)
    if (location.state?.autoFill) {
      setFormData(prev => ({
        ...prev,
        ...location.state.autoFill,
      }));
      // Clear state so it doesn't stay if user refreshes
      window.history.replaceState({}, document.title);
    }
  }, []);

  const openDeleteDialog = (id) => {
    setVoucherToDelete(id);
    setDeletePassword('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePassword) {
      setToast({ open: true, message: 'Password is required', severity: 'error' });
      return;
    }
    
    try {
      await deleteVoucher(voucherToDelete, deletePassword);
      setToast({ open: true, message: 'Voucher deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchVouchers();
    } catch (err) {
      console.error(err);
      setToast({ 
        open: true, 
        message: err.response?.data?.message || 'Error deleting voucher', 
        severity: 'error' 
      });
    }
  };

  // Filter rows by selected month
  const filteredRows = rows.filter(r => {
    if (!monthFilter) return true; // Show all if no filter
    return dayjs(r.date).format('YYYY-MM') === monthFilter.format('YYYY-MM');
  });

  // Split into receipts (Debit/Inward) and payments (Credit/Outward)
  const receipts = filteredRows.filter(r => r.voucherType === 'RECEIPT');
  const payments = filteredRows.filter(r => r.voucherType === 'PAYMENT');
  
  const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalPayments = payments.reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalReceipts - totalPayments;

  let currentBalance = 0;
  const ledgerRows = [];
  
  // Group by date to ensure debits and credits on the same row share the same date
  const uniqueDates = [...new Set(filteredRows.map(r => dayjs(r.date).format('YYYY-MM-DD')))].sort();
  
  uniqueDates.forEach((dateStr, index) => {
    // Add a blank separator row before starting a new date (except for the very first one)
    if (index > 0) {
      ledgerRows.push({
        receipt: null,
        payment: null,
        runningBalance: currentBalance,
        isSeparator: true
      });
    }

    const receiptsOnDate = receipts.filter(r => dayjs(r.date).format('YYYY-MM-DD') === dateStr);
    const paymentsOnDate = payments.filter(r => dayjs(r.date).format('YYYY-MM-DD') === dateStr);
    const maxRowsForDate = Math.max(receiptsOnDate.length, paymentsOnDate.length);
    
    for (let i = 0; i < maxRowsForDate; i++) {
      const receipt = receiptsOnDate[i] || null;
      const payment = paymentsOnDate[i] || null;
      const recAmt = receipt?.amount || 0;
      const payAmt = payment?.amount || 0;
      currentBalance = currentBalance + recAmt - payAmt;
      
      ledgerRows.push({
        receipt,
        payment,
        runningBalance: currentBalance
      });
    }
  });

  const ActionButtons = ({ id }) => (
    <Box sx={{ display: 'inline-flex', opacity: 0.6, '&:hover': { opacity: 1 }, ml: 1 }}>
      {userRole === 'ADMIN' && (
        <>
          <IconButton size="small" onClick={() => navigate(`/vouchers/edit/${id}`)} sx={{ p: 0.5 }}>
            <EditIcon sx={{ fontSize: 14 }} color="primary" />
          </IconButton>
          <IconButton size="small" onClick={() => openDeleteDialog(id)} sx={{ p: 0.5 }}>
            <DeleteIcon sx={{ fontSize: 14 }} color="error" />
          </IconButton>
        </>
      )}
    </Box>
  );

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Cash & Bank Book');
    
    // Set column widths for better readability (Now 11 columns)
    sheet.columns = [
      { width: 12 }, { width: 25 }, { width: 25 }, { width: 15 }, { width: 12 }, // Debit
      { width: 12 }, { width: 25 }, { width: 25 }, { width: 15 }, { width: 12 }, // Credit
      { width: 20 }, { width: 15 } // Balance and Closing amount
    ];
    
    // Add First Row
    const row1 = sheet.addRow(['Debit/Inward', '', '', '', '', 'Credit/Outward', '', '', '', '', 'Closing balance', netBalance]);
    sheet.mergeCells('A1:E1');
    sheet.mergeCells('F1:J1');
    
    // Center the first line and make it bold
    row1.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { bold: true, size: 12 };
    });
    
    // Add Second Row
    const row2 = sheet.addRow(['Date', 'Particulars', 'Description', 'Month', 'Amount Rs.', 'Date', 'Particulars', 'Description', 'Month', 'Amount Rs.', 'Running Balance']);
    row2.eachCell((cell) => {
      cell.font = { bold: true };
    });
    
    // Add Data Rows
    ledgerRows.forEach(row => {
      if (row.isSeparator) {
        sheet.addRow([]);
      } else {
        const recDate = row.receipt?.date ? dayjs(row.receipt.date).format('DD-MM-YYYY') : '';
        const recName = row.receipt?.partyAccountName || '';
        const recDesc = row.receipt?.description || '';
        const recMonth = row.receipt?.month || '';
        const recAmt = row.receipt?.amount || '';
        
        const payDate = row.payment?.date ? dayjs(row.payment.date).format('DD-MM-YYYY') : '';
        const payName = row.payment?.partyAccountName || '';
        const payDesc = row.payment?.description || '';
        const payMonth = row.payment?.month || '';
        const payAmt = row.payment?.amount || '';
        
        const rBalance = row.runningBalance || 0;
        const showBalance = (row.receipt || row.payment) ? rBalance : '';
        
        sheet.addRow([recDate, recName, recDesc, recMonth, recAmt, payDate, payName, payDesc, payMonth, payAmt, showBalance]);
      }
    });
    
    // Add Totals Row
    const totalRow = sheet.addRow(['Total Receipts', '', '', '', totalReceipts, 'Total Payments', '', '', '', totalPayments, netBalance]);
    
    // Make the Totals row bold
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
    });
    
    // Write and save the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Cash_Bank_Book.xlsx');
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Voucher</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to delete this voucher? Please enter your password to confirm.
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
          Cash & Bank Book
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <DatePicker
            views={['year', 'month']}
            label="Filter by Month"
            value={monthFilter}
            onChange={(newValue) => setMonthFilter(newValue)}
            slotProps={{ textField: { size: 'small', sx: { width: 180, bgcolor: 'white' } } }}
          />
          <Button 
            variant="outlined" 
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ height: 40 }}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>

      {/* Quick Entry Form */}
      {userRole === 'ADMIN' && (
        <Paper sx={{ p: 2, mb: 3, border: '1px solid #ccc' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
            Quick Entry
          </Typography>
          <Grid container spacing={2} alignItems="center">
            {/* Row 1 */}
            <Grid item xs={12} sm={4}>
              <TextField 
                select 
                fullWidth 
                label="Type" 
                value={formData.voucherType} 
                onChange={handleFormChange('voucherType')}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="RECEIPT">Receipt (Inward)</MenuItem>
                <MenuItem value="PAYMENT">Payment (Outward)</MenuItem>
                <MenuItem value="CONTRA">Contra</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField 
                select 
                fullWidth 
                label="Account" 
                value={formData.transactionMode} 
                onChange={handleFormChange('transactionMode')}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK">Bank</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} sm={3}>
              <Autocomplete
                fullWidth
                size="small"
                freeSolo
                forcePopupIcon={true}
                options={partyOptions}
                value={formData.partyAccountName}
                onInputChange={(e, newValue) => setFormData({ ...formData, partyAccountName: newValue })}
                sx={{ minWidth: 150 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Party"
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Month"
                size="small"
                value={formData.month}
                onChange={handleFormChange('month')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Description"
                size="small"
                value={formData.description}
                onChange={handleFormChange('description')}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Amount (₹)"
                size="small"
                type="number"
                value={formData.amount}
                onChange={handleFormChange('amount')}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={handleQuickSave}
                sx={{ height: '40px' }}
              >
                Add Entry
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Ledger UI matching the screenshot */}
      <Paper sx={{ width: '100%', overflow: 'hidden', border: '1px solid #ccc', borderRadius: 0 }}>
        {/* Top Header */}
        <Box sx={{ bgcolor: 'primary.main', p: 1, display: 'flex', borderBottom: '1px solid #555' }}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              Cash & Bank Book
            </Typography>
          </Box>
          <Box sx={{ bgcolor: '#e3f2fd', border: '1px solid #555', px: 2, py: 0.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Closing balance</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₹ {netBalance.toLocaleString()}</Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small" sx={{ 
            '& .MuiTableCell-root': { 
              border: '1px solid #ccc', 
              p: 0.5, 
              px: 1,
              fontSize: '0.85rem'
            },
            '& .MuiTableCell-head': {
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 'bold'
            },
            '& .MuiTableCell-body': {
              bgcolor: '#f5f5f5'
            }
          }}>
            <TableHead>
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Debit/Inward
                </TableCell>
                <TableCell colSpan={5} align="center">
                  Credit/Outward
                </TableCell>
                <TableCell align="center">
                  Balance
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ width: '8%' }}>Date</TableCell>
                <TableCell sx={{ width: '12%' }}>Particulars</TableCell>
                <TableCell sx={{ width: '12%' }}>Description</TableCell>
                <TableCell sx={{ width: '8%' }}>Month</TableCell>
                <TableCell sx={{ width: '10%' }}>Amount Rs.</TableCell>
                <TableCell sx={{ width: '8%' }}>Date</TableCell>
                <TableCell sx={{ width: '12%' }}>Particulars</TableCell>
                <TableCell sx={{ width: '12%' }}>Description</TableCell>
                <TableCell sx={{ width: '8%' }}>Month</TableCell>
                <TableCell sx={{ width: '10%' }}>Amount Rs.</TableCell>
                <TableCell sx={{ width: '10%' }}>Running Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerRows.map((row, index) => (
                <TableRow key={index} sx={{ '& td': { border: '1px solid #555' } }}>
                  {/* DEBIT / RECEIPT SIDE */}
                  <TableCell sx={{ bgcolor: 'white' }}>
                    {row.receipt?.date ? dayjs(row.receipt.date).format('DD-MM-YY') : ''}
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {row.receipt?.partyAccountName || ''}
                      {row.receipt && <ActionButtons id={row.receipt.id} />}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'white' }}>
                    {row.receipt?.description || ''}
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'white' }}>
                    {row.receipt?.month || ''}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'white' }}>
                    {row.receipt ? `₹ ${row.receipt.amount.toLocaleString()}` : ''}
                  </TableCell>

                  {/* CREDIT / PAYMENT SIDE */}
                  <TableCell sx={{ bgcolor: 'white' }}>
                    {row.payment?.date ? dayjs(row.payment.date).format('DD-MM-YY') : ''}
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {row.payment?.partyAccountName || ''}
                      {row.payment && <ActionButtons id={row.payment.id} />}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'white' }}>
                    {row.payment?.description || ''}
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'white' }}>
                    {row.payment?.month || ''}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'white' }}>
                    {row.payment ? `₹ ${row.payment.amount.toLocaleString()}` : ''}
                  </TableCell>
                  
                  {/* RUNNING BALANCE */}
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {(row.receipt || row.payment) ? `₹ ${row.runningBalance.toLocaleString()}` : ''}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totals Row */}
              <TableRow>
                <TableCell colSpan={4} align="right" sx={{ bgcolor: (theme) => `${theme.palette.primary.main} !important`, color: 'white !important', fontWeight: 'bold !important' }}>Total Receipts</TableCell>
                <TableCell align="right" sx={{ bgcolor: (theme) => `${theme.palette.primary.main} !important`, color: 'white !important', fontWeight: 'bold !important' }}>₹ {totalReceipts.toLocaleString()}</TableCell>
                <TableCell colSpan={4} align="right" sx={{ bgcolor: (theme) => `${theme.palette.primary.main} !important`, color: 'white !important', fontWeight: 'bold !important' }}>Total Payments</TableCell>
                <TableCell align="right" sx={{ bgcolor: (theme) => `${theme.palette.primary.main} !important`, color: 'white !important', fontWeight: 'bold !important' }}>₹ {totalPayments.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ bgcolor: (theme) => `${theme.palette.primary.main} !important`, color: 'white !important', fontWeight: 'bold !important' }}>₹ {netBalance.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
