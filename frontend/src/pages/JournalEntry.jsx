import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, MenuItem, 
  Button, Divider, Snackbar, Alert, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useParams, useNavigate } from 'react-router-dom';
import { createJournal, updateJournal, getJournalById } from '../services/api';
import dayjs from 'dayjs';

export default function JournalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    date: dayjs(),
    description: '',
  });

  const [details, setDetails] = useState([
    { type: 'BY', accountName: '', debit: '', credit: '' },
    { type: 'TO', accountName: '', debit: '', credit: '' },
  ]);
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      getJournalById(id).then(res => {
        const data = res.data;
        setFormData({
          srNumber: data.srNumber,
          date: data.date ? dayjs(data.date) : null,
          description: data.description || '',
        });
        if (data.details && data.details.length > 0) {
          setDetails(data.details.map(d => ({
            type: d.type,
            accountName: d.accountName,
            debit: d.debit || '',
            credit: d.credit || '',
          })));
        }
      }).catch(err => {
        console.error(err);
        setToast({ open: true, message: 'Error fetching journal details', severity: 'error' });
      });
    }
  }, [id]);

  const handleFormChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleDateChange = (val) => {
    setFormData({ ...formData, date: val });
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index][field] = value;
    
    // Auto-clear opposite amount
    if (field === 'debit' && value !== '') {
      newDetails[index].credit = '';
      newDetails[index].type = 'BY';
    } else if (field === 'credit' && value !== '') {
      newDetails[index].debit = '';
      newDetails[index].type = 'TO';
    } else if (field === 'type') {
      if (value === 'BY') newDetails[index].credit = '';
      if (value === 'TO') newDetails[index].debit = '';
    }
    
    setDetails(newDetails);
  };

  const addRow = () => {
    setDetails([...details, { type: 'BY', accountName: '', debit: '', credit: '' }]);
  };

  const removeRow = (index) => {
    if (details.length > 2) {
      const newDetails = details.filter((_, i) => i !== index);
      setDetails(newDetails);
    } else {
      setToast({ open: true, message: 'A journal must have at least 2 lines.', severity: 'warning' });
    }
  };

  const handleClear = () => {
    if (!id) {
      setFormData({
        date: dayjs(),
        description: '',
      });
      setDetails([
        { type: 'BY', accountName: '', debit: '', credit: '' },
        { type: 'TO', accountName: '', debit: '', credit: '' },
      ]);
    }
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    details.forEach(d => {
      totalDebit += parseFloat(d.debit) || 0;
      totalCredit += parseFloat(d.credit) || 0;
    });
    return { debit: totalDebit.toFixed(2), credit: totalCredit.toFixed(2) };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    // Validate empty accounts
    if (details.some(d => !d.accountName.trim())) {
      setToast({ open: true, message: 'Please provide Particulars (Account Name) for all lines.', severity: 'error' });
      return;
    }
    
    try {
      const data = {
        ...formData,
        date: formData.date ? formData.date.toISOString() : null,
        details: details.map(d => ({
          ...d,
          debit: d.debit === '' ? null : parseFloat(d.debit),
          credit: d.credit === '' ? null : parseFloat(d.credit),
        }))
      };
      
      if (id) {
        await updateJournal(id, data);
        setToast({ open: true, message: 'Journal updated successfully!', severity: 'success' });
      } else {
        await createJournal(data);
        setToast({ open: true, message: 'Journal saved successfully!', severity: 'success' });
        setTimeout(() => navigate('/journal'), 1500);
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Error saving journal', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {id ? 'Accounting Voucher Alteration (Journal)' : 'Accounting Voucher Creation (Journal)'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="secondary" startIcon={<ClearIcon />} onClick={handleClear}>
            Clear
          </Button>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave}>
            {id ? 'Update Entry' : 'Save Entry'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField 
              fullWidth 
              label="Journal No." 
              value={formData.srNumber || 'AUTO-GEN'} 
              disabled 
              size="small" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'primary.light' }}>
              <TableRow>
                <TableCell width="120"><strong>By / To</strong></TableCell>
                <TableCell><strong>Particulars</strong></TableCell>
                <TableCell width="180" align="right"><strong>Debit (₹)</strong></TableCell>
                <TableCell width="180" align="right"><strong>Credit (₹)</strong></TableCell>
                <TableCell width="50" align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      select
                      fullWidth
                      variant="standard"
                      value={row.type}
                      onChange={(e) => handleDetailChange(index, 'type', e.target.value)}
                      InputProps={{ disableUnderline: true }}
                    >
                      <MenuItem value="BY">By (Dr)</MenuItem>
                      <MenuItem value="TO">To (Cr)</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      variant="standard"
                      placeholder="Account Name"
                      value={row.accountName}
                      onChange={(e) => handleDetailChange(index, 'accountName', e.target.value)}
                      InputProps={{ disableUnderline: true }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      fullWidth
                      variant="standard"
                      type="number"
                      placeholder="0.00"
                      value={row.debit}
                      onChange={(e) => handleDetailChange(index, 'debit', e.target.value)}
                      disabled={row.type === 'TO'}
                      inputProps={{ style: { textAlign: 'right' } }}
                      InputProps={{ disableUnderline: true }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      fullWidth
                      variant="standard"
                      type="number"
                      placeholder="0.00"
                      value={row.credit}
                      onChange={(e) => handleDetailChange(index, 'credit', e.target.value)}
                      disabled={row.type === 'BY'}
                      inputProps={{ style: { textAlign: 'right' } }}
                      InputProps={{ disableUnderline: true }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => removeRow(index)}>
                      <RemoveCircleIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5}>
                  <Button size="small" startIcon={<AddCircleIcon />} onClick={addRow}>
                    Add Line
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell colSpan={2} align="right"><strong>Total:</strong></TableCell>
                <TableCell align="right"><strong>{totals.debit}</strong></TableCell>
                <TableCell align="right"><strong>{totals.credit}</strong></TableCell>
                <TableCell></TableCell>
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
              onChange={handleFormChange('description')} 
              size="small" 
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
