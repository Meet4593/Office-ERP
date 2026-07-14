import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, MenuItem, 
  Button, Divider, Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useParams, useNavigate } from 'react-router-dom';
import { createVoucher, updateVoucher, getVoucherById } from '../services/api';
import dayjs from 'dayjs';
import useKeyboardNavigation from '../hooks/useKeyboardNavigation';

export default function VoucherEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleKeyDown = useKeyboardNavigation();
  
  const voucherTypes = ['PAYMENT', 'RECEIPT', 'CONTRA'];
  const transactionModes = ['CASH', 'BANK'];

  const [formData, setFormData] = useState({
    date: dayjs(),
    voucherType: 'PAYMENT',
    transactionMode: 'CASH',
    partyAccountName: '',
    amount: '',
    description: '',
  });
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      getVoucherById(id).then(res => {
        const data = res.data;
        setFormData({
          ...data,
          date: data.date ? dayjs(data.date) : null,
        });
      }).catch(err => {
        console.error(err);
        setToast({ open: true, message: 'Error fetching voucher details', severity: 'error' });
      });
    }
  }, [id]);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleDateChange = (val) => {
    setFormData({ ...formData, date: val });
  };

  const handleClear = () => {
    setFormData({
      date: dayjs(),
      voucherType: 'PAYMENT',
      transactionMode: 'CASH',
      partyAccountName: '',
      amount: '',
      description: '',
    });
  };

  const handleSave = async () => {
    if (!formData.partyAccountName || !formData.amount) {
      setToast({ open: true, message: 'Party Name and Amount are required.', severity: 'error' });
      return;
    }
    
    try {
      const data = {
        ...formData,
        date: formData.date ? formData.date.toISOString() : null,
      };
      
      if (id) {
        await updateVoucher(id, data);
        setToast({ open: true, message: 'Voucher updated successfully!', severity: 'success' });
      } else {
        await createVoucher(data);
        setToast({ open: true, message: 'Voucher saved successfully!', severity: 'success' });
        setTimeout(() => navigate('/vouchers'), 1500);
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Error saving voucher', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 2 }} onKeyDown={handleKeyDown}>
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {id ? `Edit ${formData.voucherType} Voucher` : 'Accounting Voucher Creation'}
        </Typography>
      </Box>

      <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
        {/* Header Section (Tally style top band) */}
        <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 3, py: 1.5, display: 'flex', gap: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ bgcolor: 'white', color: 'primary.main', px: 1, borderRadius: 1 }}>
              {formData.voucherType}
            </Typography>
            <Typography variant="body2">No. {formData.srNumber || 'AUTO'}</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2">Date: {formData.date ? formData.date.format('DD-MMM-YYYY') : ''}</Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <TextField 
                select 
                fullWidth 
                label="Voucher Type" 
                value={formData.voucherType} 
                onChange={handleChange('voucherType')}
                size="small"
              >
                {voucherTypes.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField 
                select 
                fullWidth 
                label="Transaction Mode (Account)" 
                value={formData.transactionMode} 
                onChange={handleChange('transactionMode')}
                size="small"
              >
                {transactionModes.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {/* Grid Section for Particulars */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'primary.light' }}>
                <TableRow>
                  <TableCell><strong>Particulars (Party / Expense Name)</strong></TableCell>
                  <TableCell width="250" align="right"><strong>Amount (₹)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <TextField
                      fullWidth
                      variant="standard"
                      placeholder="Enter party account name..."
                      value={formData.partyAccountName}
                      onChange={handleChange('partyAccountName')}
                      InputProps={{ disableUnderline: true }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      fullWidth
                      variant="standard"
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleChange('amount')}
                      inputProps={{ style: { textAlign: 'right' } }}
                      InputProps={{ disableUnderline: true }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell align="right"><strong>Total:</strong></TableCell>
                  <TableCell align="right">
                    <strong>{formData.amount ? `₹ ${parseFloat(formData.amount).toLocaleString()}` : '₹ 0'}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Narration" 
                multiline
                rows={2}
                value={formData.description} 
                onChange={handleChange('description')} 
                size="small" 
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, position: 'fixed', bottom: 24, right: 24, zIndex: 1000, bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', p: 2, borderRadius: 2, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <Button variant="contained" color="inherit" startIcon={<ClearIcon />} sx={{ bgcolor: 'white', color: 'text.primary', '&:hover': { bgcolor: 'grey.100' } }} onClick={handleClear}>
          Clear
        </Button>
        <Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />} onClick={handleSave} sx={{ px: 4 }}>
          {id ? 'Update Entry' : 'Save Entry'}
        </Button>
      </Box>
    </Box>
  );
}
