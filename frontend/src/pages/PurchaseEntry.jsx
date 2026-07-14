import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, MenuItem, 
  Button, Divider, Snackbar, Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ClearIcon from '@mui/icons-material/Clear';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useParams, useNavigate } from 'react-router-dom';
import { createTransaction, updateTransaction, getTransactionById } from '../services/api';
import { generateInvoicePDF } from '../utils/exportUtils';
import dayjs from 'dayjs';
import useKeyboardNavigation from '../hooks/useKeyboardNavigation';

export default function PurchaseEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const handleKeyDown = useKeyboardNavigation();
  const transactionTypes = ['PURCHASE', 'SALE', 'SERVICE'];
  const paymentModes = ['CASH', 'BANK', 'UPI', 'CHEQUE'];
  const statuses = ['DRAFT', 'PENDING', 'COMPLETED'];
  
  const [formData, setFormData] = useState({
    date: dayjs(),
    type: 'PURCHASE',
    status: 'PENDING',
    paymentMode: 'CASH',
  });
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      getTransactionById(id).then(res => {
        const data = res.data;
        setFormData({
          ...data,
          date: data.date ? dayjs(data.date) : null,
          paidDate: data.paidDate ? dayjs(data.paidDate) : null,
        });
      }).catch(err => {
        console.error(err);
        setToast({ open: true, message: 'Error fetching transaction details', severity: 'error' });
      });
    }
  }, [id]);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleDateChange = (field) => (val) => {
    setFormData({ ...formData, [field]: val });
  };

  const handlePrint = () => {
    generateInvoicePDF({
      ...formData,
      srNumber: formData.srNumber || 'DRAFT',
      date: formData.date ? formData.date.toISOString() : null
    });
  };

  const handleSave = async () => {
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'date' && formData[key]) {
          data.append(key, formData[key].toISOString());
        } else if (key === 'paidDate' && formData[key]) {
          data.append(key, formData[key].toISOString());
        } else if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });
      
      if (id) {
        await updateTransaction(id, data);
        setToast({ open: true, message: 'Purchase updated successfully!', severity: 'success' });
      } else {
        await createTransaction(data);
        setToast({ open: true, message: 'Purchase saved successfully!', severity: 'success' });
        setTimeout(() => navigate('/purchase'), 1500);
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Error saving purchase', severity: 'error' });
    }
  };

  return (
    <Box onKeyDown={handleKeyDown}>
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {id ? 'Edit Transaction' : 'New Transaction Entry'}
        </Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
          Primary Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="SR Number" disabled value={formData.srNumber || 'AUTO-GEN'} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker 
              label="Date" 
              value={formData.date}
              onChange={handleDateChange('date')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth select label="Transaction Type" value={formData.type} onChange={handleChange('type')} size="small">
              {transactionTypes.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Transaction Number" value={formData.transactionNumber || ''} onChange={handleChange('transactionNumber')} size="small" />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Supplier Invoice Number" value={formData.supplierInvoiceNum || ''} onChange={handleChange('supplierInvoiceNum')} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Part Account Name" value={formData.partAccountName || ''} onChange={handleChange('partAccountName')} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Department" value={formData.department || ''} onChange={handleChange('department')} size="small" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
          Item & Service Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Item Name" value={formData.item || ''} onChange={handleChange('item')} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Detail Number" value={formData.detailNumber || ''} onChange={handleChange('detailNumber')} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Machine Number" value={formData.machineNumber || ''} onChange={handleChange('machineNumber')} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Service Person" value={formData.servicePerson || ''} onChange={handleChange('servicePerson')} size="small" />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Description" value={formData.description || ''} onChange={handleChange('description')} multiline rows={2} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Quantity / Unit" type="number" value={formData.unit || ''} onChange={handleChange('unit')} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Rate (₹)" value={formData.rate || ''} onChange={handleChange('rate')} type="number" size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField 
              fullWidth 
              label="Total Amount (₹)" 
              disabled 
              value={((parseFloat(formData.unit) || 0) * (parseFloat(formData.rate) || 0)).toFixed(2)} 
              size="small" 
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
          Payment & Status
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker 
              label="Paid Date" 
              value={formData.paidDate || null}
              onChange={handleDateChange('paidDate')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth select label="Payment Mode" value={formData.paymentMode} onChange={handleChange('paymentMode')} size="small">
              {paymentModes.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth select label="Status" value={formData.status} onChange={handleChange('status')} size="small">
              {statuses.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="outlined" component="label" fullWidth startIcon={<AttachFileIcon />} sx={{ height: '40px' }}>
              Upload Attachment
              <input 
                type="file" 
                hidden 
                onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
              />
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Remarks" value={formData.remarks || ''} onChange={handleChange('remarks')} multiline rows={2} size="small" />
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, mb: 4, position: 'sticky', bottom: 16, zIndex: 10 }}>
        <Button variant="contained" color="inherit" startIcon={<ClearIcon />} sx={{ bgcolor: 'white', color: 'text.primary', '&:hover': { bgcolor: 'grey.100' } }} onClick={() => setFormData({date: dayjs(), type: 'PURCHASE', status: 'PENDING', paymentMode: 'CASH'})}>
          Clear
        </Button>
        <Button variant="contained" color="info" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print
        </Button>
        <Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />} onClick={handleSave} sx={{ px: 4 }}>
          Save Entry
        </Button>
      </Box>
    </Box>
  );
}
