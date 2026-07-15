import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, MenuItem, 
  Button, Divider, Snackbar, Alert, Autocomplete, Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ClearIcon from '@mui/icons-material/Clear';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useParams, useNavigate } from 'react-router-dom';
import { createTransaction, updateTransaction, getTransactionById, getMasterData } from '../services/api';
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
  
  const [masterData, setMasterData] = useState({
    suppliers: [], customers: [], departments: [], items: [], machines: [], paymentModes: []
  });
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    getMasterData().then(res => setMasterData(res.data)).catch(console.error);
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

  const partyOptions = formData.type === 'SALE' ? masterData.customers : masterData.suppliers;

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
      
      // Ensure totalAmount is calculated and appended
      const unit = parseFloat(formData.unit) || 0;
      const rate = parseFloat(formData.rate) || 0;
      data.append('totalAmount', (unit * rate).toFixed(2));

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
            <Autocomplete
              fullWidth
              size="small"
              freeSolo
              forcePopupIcon={true}
              options={partyOptions?.map(o => o.name) || []}
              value={formData.partAccountName || ''}
              onChange={(e, newValue) => setFormData({ ...formData, partAccountName: newValue || '' })}
              onInputChange={(e, newInputValue) => setFormData({ ...formData, partAccountName: newInputValue || '' })}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Party Account Name" 
                  size="small" 
                  fullWidth 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        <Tooltip title="Add New Party">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleAddNewMasterData(formData.type === 'PURCHASE' ? 'suppliers' : 'customers'); }}
                            sx={{ mr: -1 }}
                          >
                            <AddIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              fullWidth
              size="small"
              freeSolo
              forcePopupIcon={true}
              options={masterData.departments?.map(o => o.name) || []}
              value={formData.department || ''}
              onChange={(e, newValue) => setFormData({ ...formData, department: newValue || '' })}
              onInputChange={(e, newInputValue) => setFormData({ ...formData, department: newInputValue || '' })}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Department" 
                  size="small" 
                  fullWidth 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        <Tooltip title="Add New Department">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleAddNewMasterData('departments'); }}
                            sx={{ mr: -1 }}
                          >
                            <AddIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
          Item & Service Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              fullWidth
              size="small"
              freeSolo
              forcePopupIcon={true}
              options={masterData.items?.map(o => o.name) || []}
              value={formData.item || ''}
              onChange={(e, newValue) => setFormData({ ...formData, item: newValue || '' })}
              onInputChange={(e, newInputValue) => setFormData({ ...formData, item: newInputValue || '' })}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Item Name" 
                  size="small" 
                  fullWidth 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        <Tooltip title="Add New Item">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleAddNewMasterData('items'); }}
                            sx={{ mr: -1 }}
                          >
                            <AddIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Detail Number" value={formData.detailNumber || ''} onChange={handleChange('detailNumber')} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              fullWidth
              size="small"
              freeSolo
              forcePopupIcon={true}
              options={masterData.machines?.filter(m => !formData.department || m.department === formData.department).map(o => `${o.machineNum} ${o.name ? `(${o.name})` : ''}`.trim()) || []}
              value={formData.machineNumber || ''}
              onChange={(e, newValue) => setFormData({ ...formData, machineNumber: newValue || '' })}
              onInputChange={(e, newInputValue) => setFormData({ ...formData, machineNumber: newInputValue || '' })}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Machine Number" 
                  size="small" 
                  fullWidth 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        <Tooltip title="Add New Machine">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleAddNewMasterData('machines'); }}
                            sx={{ mr: -1 }}
                          >
                            <AddIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
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
              {(masterData.paymentModes?.length > 0 ? masterData.paymentModes.map(p => p.name) : paymentModes).map((option) => (
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
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, mb: 4 }}>
        <Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />} onClick={handleSave} sx={{ px: 4 }}>
          Save Entry
        </Button>
        <Button variant="contained" color="info" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print
        </Button>
        <Button variant="contained" color="inherit" startIcon={<ClearIcon />} sx={{ bgcolor: 'white', color: 'text.primary', '&:hover': { bgcolor: 'grey.100' } }} onClick={() => setFormData({date: dayjs(), type: 'PURCHASE', status: 'PENDING', paymentMode: 'CASH'})}>
          Clear
        </Button>
      </Box>
    </Box>
  );
}
