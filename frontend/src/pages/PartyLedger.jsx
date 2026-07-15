import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Autocomplete, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DownloadIcon from '@mui/icons-material/Download';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getPartyLedger, getTransactions } from '../services/api';

export default function PartyLedger() {
  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch unique party names from transactions for autocomplete
    getTransactions().then(res => {
      const parties = [...new Set(res.data.map(t => t.partAccountName).filter(Boolean))];
      setPartyOptions(parties.sort());
    }).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!selectedParty) return alert('Please select a party name.');
    
    setLoading(true);
    try {
      const res = await getPartyLedger({
        partyName: selectedParty,
        startDate: startDate ? startDate.toISOString() : '',
        endDate: endDate ? endDate.toISOString() : ''
      });
      setLedgerData(res.data);
    } catch (error) {
      console.error('Error generating ledger:', error);
      alert('Failed to generate ledger report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!ledgerData) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${selectedParty} Ledger`);

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Particulars', key: 'particulars', width: 30 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Debit (₹)', key: 'debit', width: 15 },
      { header: 'Credit (₹)', key: 'credit', width: 15 },
      { header: 'Running Balance (₹)', key: 'balance', width: 20 },
    ];

    // Header row styling
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Opening Balance Row
    sheet.addRow({
      date: '',
      particulars: 'OPENING BALANCE',
      description: '',
      debit: ledgerData.openingBalance > 0 ? ledgerData.openingBalance : '',
      credit: ledgerData.openingBalance < 0 ? Math.abs(ledgerData.openingBalance) : '',
      balance: ledgerData.openingBalance
    }).font = { bold: true };

    // Transactions Rows
    ledgerData.entries.forEach(entry => {
      sheet.addRow({
        date: dayjs(entry.date).format('DD-MM-YYYY'),
        particulars: entry.particulars,
        description: entry.description,
        debit: entry.debit || '',
        credit: entry.credit || '',
        balance: entry.balance
      });
    });

    // Total Row
    const totalDebit = ledgerData.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = ledgerData.entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    
    sheet.addRow({
      date: '',
      particulars: 'TOTAL',
      description: '',
      debit: totalDebit,
      credit: totalCredit,
      balance: ledgerData.closingBalance
    }).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${selectedParty}_Ledger_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  const formatMoney = (amount) => {
    if (!amount) return '—';
    return `₹ ${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Party Ledger</Typography>
        {ledgerData && (
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<DownloadIcon />} 
            onClick={handleExport}
          >
            Export to Excel
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Autocomplete
              freeSolo
              options={partyOptions}
              value={selectedParty}
              onInputChange={(e, newValue) => setSelectedParty(newValue)}
              sx={{ minWidth: 200 }}
              renderInput={(params) => <TextField {...params} label="Party Name" fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button 
              variant="contained" 
              size="large" 
              fullWidth 
              onClick={handleGenerate}
              disabled={loading}
              sx={{ height: 56 }}
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {ledgerData && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Particulars</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Debit (₹)</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Credit (₹)</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Balance (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Opening Balance Row */}
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>OPENING BALANCE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {ledgerData.openingBalance > 0 ? formatMoney(ledgerData.openingBalance) : '—'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {ledgerData.openingBalance < 0 ? formatMoney(ledgerData.openingBalance) : '—'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatMoney(ledgerData.openingBalance)} {ledgerData.openingBalance > 0 ? 'Dr' : (ledgerData.openingBalance < 0 ? 'Cr' : '')}
                </TableCell>
              </TableRow>

              {/* Transactions */}
              {ledgerData.entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>No transactions found for this period.</TableCell>
                </TableRow>
              ) : (
                ledgerData.entries.map((entry, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{dayjs(entry.date).format('DD-MM-YYYY')}</TableCell>
                    <TableCell>{entry.particulars}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{formatMoney(entry.debit)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>{formatMoney(entry.credit)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatMoney(entry.balance)} {entry.balance > 0 ? 'Dr' : (entry.balance < 0 ? 'Cr' : '')}
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Closing Balance Row */}
              <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>CLOSING BALANCE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatMoney(ledgerData.entries.reduce((sum, e) => sum + (e.debit || 0), 0))}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatMoney(ledgerData.entries.reduce((sum, e) => sum + (e.credit || 0), 0))}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatMoney(ledgerData.closingBalance)} {ledgerData.closingBalance > 0 ? 'Dr' : (ledgerData.closingBalance < 0 ? 'Cr' : '')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
