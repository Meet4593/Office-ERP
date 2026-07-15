import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, MenuItem, 
  Button, Divider, Snackbar, Alert, Autocomplete, Tooltip, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ClearIcon from '@mui/icons-material/Clear';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createTransaction, updateTransaction, getTransactionById, getMasterData, deleteTransaction } from '../services/api';
import { generateInvoicePDF } from '../utils/exportUtils';
import dayjs from 'dayjs';
import useKeyboardNavigation from '../hooks/useKeyboardNavigation';

const emptyItemRow = () => ({ item: '', detailNumber: '', machineNumber: '', servicePerson: '', description: '', unit: '', rate: '' });

export default function PurchaseEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const handleKeyDown = useKeyboardNavigation();
  const transactionTypes = ['PURCHASE', 'SALE', 'SERVICE'];
  const paymentModes = ['CASH', 'BANK', 'UPI', 'CHEQUE'];
  const statuses = ['DRAFT', 'PENDING', 'COMPLETED'];
  
  const [formData, setFormData] = useState({
    date: dayjs(),
    type: 'PURCHASE',
    status: 'PENDING',
    paymentMode: 'CASH',
    transactionNumber: '',
    supplierInvoiceNum: '',
    partAccountName: '',
    department: '',
    paidDate: null,
    remarks: '',
  });

  // Multi-row items
  const [itemRows, setItemRows] = useState([emptyItemRow()]);
  
  const [masterData, setMasterData] = useState({
    suppliers: [], customers: [], departments: [], items: [], machines: [], paymentModes: []
  });
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [initialGroupedIds, setInitialGroupedIds] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;
  const userDept = user.department;
  const canSave = userRole === 'ADMIN' || !id;

  useEffect(() => {
    if (userRole !== 'ADMIN' && userDept && !id) {
      setFormData(prev => ({ ...prev, department: userDept }));
    }
  }, [userRole, userDept, id]);

  useEffect(() => {
    getMasterData().then(res => setMasterData(res.data)).catch(console.error);
    if (id) {
      const groupedIds = location.state?.groupedIds || [id];
      setInitialGroupedIds(groupedIds);
      
      Promise.all(groupedIds.map(gid => getTransactionById(gid)))
        .then(responses => {
          const itemsData = responses.map(res => res.data);
          const firstData = itemsData[0];
          
          setFormData({
            date: firstData.date ? dayjs(firstData.date) : null,
            type: firstData.type || 'PURCHASE',
            status: firstData.status || 'PENDING',
            paymentMode: firstData.paymentMode || 'CASH',
            transactionNumber: firstData.transactionNumber || '',
            supplierInvoiceNum: firstData.supplierInvoiceNum || '',
            partAccountName: firstData.partAccountName || '',
            department: firstData.department || '',
            paidDate: firstData.paidDate ? dayjs(firstData.paidDate) : null,
            remarks: firstData.remarks || '',
          });

          setItemRows(itemsData.map(data => ({
            id: data.id,
            item: data.item || '',
            detailNumber: data.detailNumber || '',
            machineNumber: data.machineNumber || '',
            servicePerson: data.servicePerson || '',
            description: data.description || '',
            unit: data.unit || '',
            rate: data.rate || '',
          })));
        })
        .catch(err => {
          console.error(err);
          setToast({ open: true, message: 'Error fetching transactions', severity: 'error' });
        });
    }
  }, [id]);

  const partyOptions = formData.type === 'SALE' ? masterData.customers : masterData.suppliers;

  const handleAddNewMasterData = (tab) => {
    navigate('/master-data', { state: { openDialog: true, tab } });
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleDateChange = (field) => (val) => {
    setFormData({ ...formData, [field]: val });
  };

  // Item row handlers
  const handleItemRowChange = (index, field, value) => {
    const updated = [...itemRows];
    updated[index] = { ...updated[index], [field]: value };
    setItemRows(updated);
  };

  const handleAddRow = () => {
    setItemRows([...itemRows, emptyItemRow()]);
  };

  const handleRemoveRow = (index) => {
    if (itemRows.length === 1) return; // Keep at least one row
    setItemRows(itemRows.filter((_, i) => i !== index));
  };

  const getRowTotal = (row) => {
    const qty = parseFloat(row.unit) || 0;
    const rate = parseFloat(row.rate) || 0;
    return qty * rate;
  };

  const grandTotal = itemRows.reduce((sum, row) => sum + getRowTotal(row), 0);

  const handlePrint = () => {
    generateInvoicePDF({
      ...formData,
      srNumber: formData.srNumber || 'DRAFT',
      date: formData.date ? formData.date.toISOString() : null,
      ...itemRows[0],
    });
  };

  const handleSave = async () => {
    try {
      if (id) {
        // Edit mode: Handle updates, additions, and deletions
        const currentItemIds = itemRows.filter(r => r.id).map(r => r.id);
        const idsToDelete = initialGroupedIds.filter(gid => !currentItemIds.includes(gid));
        
        for (const deleteId of idsToDelete) {
          await deleteTransaction(deleteId, ''); 
        }

        const newRowsData = [];
        for (const row of itemRows) {
          if (row.id) {
            const data = new FormData();
            const allData = { ...formData, ...row };
            Object.keys(allData).forEach(key => {
              const val = allData[key];
              if (val === null || val === undefined) return;
              if ((key === 'date' || key === 'paidDate') && val?.isValid) {
                if (val.isValid()) data.append(key, val.toISOString());
              } else if (key !== 'attachment') {
                data.append(key, val);
              }
            });
            if (formData.attachment) data.append('attachment', formData.attachment);
            await updateTransaction(row.id, data);
          } else {
            // New row added in edit mode
            newRowsData.push(row);
          }
        }
        
        if (newRowsData.length > 0) {
          const data = new FormData();
          Object.keys(formData).forEach(key => {
            const val = formData[key];
            if (val === null || val === undefined) return;
            if ((key === 'date' || key === 'paidDate') && val?.isValid) {
              if (val.isValid()) data.append(key, val.toISOString());
            } else if (key !== 'attachment') {
              data.append(key, val);
            }
          });
          if (formData.attachment) data.append('attachment', formData.attachment);
          data.append('items', JSON.stringify(newRowsData.filter(r => r.item || r.rate)));
          await createTransaction(data);
        }

        setToast({ open: true, message: 'Transaction updated successfully!', severity: 'success' });
        setTimeout(() => navigate(-1), 1500);
      } else {
        // Create mode: send header + items array via FormData
        const data = new FormData();
        Object.keys(formData).forEach(key => {
          const val = formData[key];
          if (val === null || val === undefined) return;
          if ((key === 'date' || key === 'paidDate') && val?.isValid) {
            if (val.isValid()) data.append(key, val.toISOString());
          } else if (key !== 'attachment') {
            data.append(key, val);
          }
        });
        if (formData.attachment) data.append('attachment', formData.attachment);
        data.append('items', JSON.stringify(itemRows.filter(r => r.item || r.rate)));
        
        await createTransaction(data);
        setToast({ open: true, message: `${itemRows.length} item(s) saved successfully!`, severity: 'success' });
        setTimeout(() => navigate(0), 1500); // reload form
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: err.response?.data?.message || 'An error occurred', severity: 'error' });
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
        {/* ---- Primary Details ---- */}
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
          Primary Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="SR Number" disabled value={formData.srNumber || 'AUTO-GEN'} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker format="DD/MM/YYYY"
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
            <TextField fullWidth label="Transaction Number" value={formData.transactionNumber} onChange={handleChange('transactionNumber')} size="small" />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Supplier Invoice Number" value={formData.supplierInvoiceNum} onChange={handleChange('supplierInvoiceNum')} size="small" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              fullWidth size="small" freeSolo autoHighlight autoSelect forcePopupIcon={true}
              options={partyOptions?.map(o => o.name) || []}
              sx={{ minWidth: 200 }}
              value={formData.partAccountName}
              onChange={(e, v) => setFormData({ ...formData, partAccountName: v || '' })}
              onInputChange={(e, v) => setFormData({ ...formData, partAccountName: v || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Party Account Name" size="small" fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        <Tooltip title="Add New Party">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleAddNewMasterData(formData.type === 'PURCHASE' ? 'suppliers' : 'customers'); }} sx={{ mr: -1 }}>
                            <AddIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        {params.InputProps?.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              fullWidth size="small"
              freeSolo={userRole === 'ADMIN' || !userDept}
              autoHighlight autoSelect forcePopupIcon={true}
              readOnly={userRole !== 'ADMIN' && !!userDept}
              options={masterData.departments?.map(o => o.name) || []}
              sx={{ minWidth: 200 }}
              value={formData.department}
              onChange={(e, v) => setFormData({ ...formData, department: v || '' })}
              onInputChange={(e, v) => setFormData({ ...formData, department: v || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Department" size="small" fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {(userRole === 'ADMIN' || !userDept) && (
                          <Tooltip title="Add New Department">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleAddNewMasterData('departments'); }} sx={{ mr: -1 }}>
                              <AddIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {params.InputProps?.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* ---- Item Rows ---- */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Item & Service Details
          </Typography>
          <Button variant="outlined" color="primary" size="small" startIcon={<AddCircleOutlineIcon />} onClick={handleAddRow}>
            Add Row
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', minWidth: 150 }}>Item Name</TableCell>
                <TableCell sx={{ color: 'white', minWidth: 110 }}>Detail No.</TableCell>
                <TableCell sx={{ color: 'white', minWidth: 150 }}>Machine No.</TableCell>
                <TableCell sx={{ color: 'white', minWidth: 130 }}>Service Person</TableCell>
                <TableCell sx={{ color: 'white', minWidth: 150 }}>Description</TableCell>
                <TableCell sx={{ color: 'white', minWidth: 90 }}>Qty/Unit</TableCell>
                <TableCell sx={{ color: 'white', minWidth: 100 }}>Rate (₹)</TableCell>
                <TableCell align="right" sx={{ color: 'white', minWidth: 100 }}>Total (₹)</TableCell>
                <TableCell sx={{ color: 'white', width: 40 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemRows.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ p: 0.5 }}>
                    <Autocomplete
                      size="small" freeSolo autoHighlight autoSelect forcePopupIcon={true}
                      options={masterData.items?.map(o => o.name) || []}
                      value={row.item}
                      onChange={(e, v) => handleItemRowChange(index, 'item', v || '')}
                      onInputChange={(e, v) => handleItemRowChange(index, 'item', v || '')}
                      renderInput={(params) => <TextField {...params} size="small" placeholder="Item" />}
                    />
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <TextField size="small" fullWidth placeholder="Detail No." value={row.detailNumber}
                      onChange={(e) => handleItemRowChange(index, 'detailNumber', e.target.value)} />
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <Autocomplete
                      size="small" freeSolo autoHighlight autoSelect forcePopupIcon={true}
                      options={(masterData.machines || []).filter(m => !formData.department || m.department === formData.department).map(o => `${o.machineNum}${o.name ? ` (${o.name})` : ''}`)}
                      value={row.machineNumber}
                      onChange={(e, v) => handleItemRowChange(index, 'machineNumber', v || '')}
                      onInputChange={(e, v) => handleItemRowChange(index, 'machineNumber', v || '')}
                      renderInput={(params) => <TextField {...params} size="small" placeholder="Machine No." />}
                    />
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <TextField size="small" fullWidth placeholder="Service Person" value={row.servicePerson}
                      onChange={(e) => handleItemRowChange(index, 'servicePerson', e.target.value)} />
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <TextField size="small" fullWidth placeholder="Description" value={row.description}
                      onChange={(e) => handleItemRowChange(index, 'description', e.target.value)} />
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <TextField size="small" fullWidth type="number" placeholder="Qty" value={row.unit}
                      onChange={(e) => handleItemRowChange(index, 'unit', e.target.value)} />
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <TextField size="small" fullWidth type="number" placeholder="Rate" value={row.rate}
                      onChange={(e) => handleItemRowChange(index, 'rate', e.target.value)} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, pr: 1 }}>
                    {getRowTotal(row).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    {itemRows.length > 1 && (
                      <IconButton size="small" color="error" onClick={() => handleRemoveRow(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {/* Grand Total Row */}
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell colSpan={7} sx={{ fontWeight: 'bold', textAlign: 'right', pr: 2 }}>
                  Grand Total:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', pr: 1 }}>
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="text" color="primary" startIcon={<AddCircleOutlineIcon />} onClick={handleAddRow}>
            + Add Another Item
          </Button>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* ---- Payment & Status ---- */}
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
          Payment & Status
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker format="DD/MM/YYYY"
              label="Paid Date" 
              value={formData.paidDate}
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
              <input type="file" hidden onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })} />
            </Button>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Remarks" value={formData.remarks} onChange={handleChange('remarks')} multiline rows={2} size="small" />
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, mb: 4 }}>
        <Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />} onClick={handleSave} sx={{ px: 4 }} disabled={!canSave}>
          Save Entry
        </Button>
        <Button variant="contained" color="info" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print
        </Button>
        <Button variant="contained" color="inherit" startIcon={<ClearIcon />} 
          sx={{ bgcolor: 'white', color: 'text.primary', '&:hover': { bgcolor: 'grey.100' } }} 
          onClick={() => { setFormData({ date: dayjs(), type: 'PURCHASE', status: 'PENDING', paymentMode: 'CASH', transactionNumber: '', supplierInvoiceNum: '', partAccountName: '', department: '', paidDate: null, remarks: '' }); setItemRows([emptyItemRow()]); }}>
          Clear
        </Button>
      </Box>
    </Box>
  );
}
