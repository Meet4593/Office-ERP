import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Autocomplete, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getPartyLedger, getMasterData, getTransactions } from '../services/api';

export default function PartyLedger() {
  const [partyOptions, setPartyOptions] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load from BOTH Master Data AND existing transaction party names for a complete list
    Promise.all([getMasterData(), getTransactions()])
      .then(([masterRes, txRes]) => {
        const suppliers = (masterRes.data.suppliers || []).map(s => s.name);
        const customers = (masterRes.data.customers || []).map(c => c.name);
        const fromTx = (txRes.data || []).map(t => t.partAccountName).filter(Boolean);
        const all = [...new Set([...suppliers, ...customers, ...fromTx])].filter(Boolean).sort();
        setPartyOptions(all);
      })
      .catch(console.error);
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
        date: dayjs(entry.date).format('DD/MM/YYYY'),
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

  const handlePrintPDF = () => {
    if (!ledgerData) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    const fmt = (n) => {
      if (!n && n !== 0) return '-';
      return 'Rs. ' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const fmtBal = (n) => {
      if (n === undefined || n === null) return '-';
      return fmt(n) + (n > 0 ? ' Dr' : n < 0 ? ' Cr' : '');
    };

    // ── Blue Header Banner ──────────────────────────────
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTY LEDGER', pageW / 2, 11, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedParty, pageW / 2, 20, { align: 'center' });

    // ── Sub-header info ─────────────────────────────────
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    const period = `Period: ${startDate ? startDate.format('DD/MM/YYYY') : 'All'} to ${endDate ? endDate.format('DD/MM/YYYY') : 'All'}`;
    const printed = `Printed: ${dayjs().format('DD/MM/YYYY hh:mm A')}`;
    doc.text(period, 14, 33);
    doc.text(printed, pageW - 14, 33, { align: 'right' });

    // ── Opening Balance ─────────────────────────────────
    const ob = ledgerData.openingBalance || 0;
    doc.setFont('helvetica', 'bold');
    doc.text(`Opening Balance:  ${fmtBal(ob)}`, 14, 40);
    doc.setFont('helvetica', 'normal');

    // ── Build table rows ────────────────────────────────
    const tableBody = ledgerData.entries.map(entry => [
      dayjs(entry.date).format('DD/MM/YYYY'),
      entry.particulars || '',
      entry.description || '',
      entry.debit  ? fmt(entry.debit)  : '-',
      entry.credit ? fmt(entry.credit) : '-',
      fmtBal(entry.balance),
    ]);

    const totalDebit  = ledgerData.entries.reduce((s, e) => s + (e.debit  || 0), 0);
    const totalCredit = ledgerData.entries.reduce((s, e) => s + (e.credit || 0), 0);
    const cb = ledgerData.closingBalance;

    autoTable(doc, {
      startY: 44,
      head: [['Date', 'Particulars', 'Description', 'Debit (Rs.)', 'Credit (Rs.)', 'Balance (Rs.)']],
      body: tableBody,
      foot: [['', 'CLOSING BALANCE', '', fmt(totalDebit), fmt(totalCredit), fmtBal(cb)]],
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        font: 'helvetica',
        textColor: [30, 30, 30],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      footStyles: {
        fillColor: [227, 242, 253],
        textColor: [20, 20, 20],
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 26, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 65 },
        3: { cellWidth: 38, halign: 'right' },
        4: { cellWidth: 38, halign: 'right' },
        5: { cellWidth: 42, halign: 'right' },
      },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      margin: { left: 10, right: 10 },
      showFoot: 'lastPage',
      didDrawPage: (data) => {
        // Page footer
        const pCount = doc.internal.getNumberOfPages();
        const pCurr  = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `Page ${pCurr} of ${pCount}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );
      },
    });

    doc.save(`${selectedParty}_Ledger_${dayjs().format('YYYYMMDD')}.pdf`);
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained"
              color="error"
              startIcon={<PrintIcon />}
              onClick={handlePrintPDF}
            >
              Print PDF
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<DownloadIcon />} 
              onClick={handleExport}
            >
              Export Excel
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={partyOptions}
              value={selectedParty || null}
              onChange={(e, newValue) => setSelectedParty(newValue || '')}
              onInputChange={(e, newValue, reason) => { if (reason === 'input') setSelectedParty(newValue || ''); }}
              isOptionEqualToValue={(opt, val) => opt === val}
              sx={{ minWidth: 200 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Party Name"
                  fullWidth
                  placeholder={partyOptions.length ? `Choose from ${partyOptions.length} parties...` : 'Loading...'}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <DatePicker format="DD/MM/YYYY"
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <DatePicker format="DD/MM/YYYY"
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
                    <TableCell>{dayjs(entry.date).format('DD/MM/YYYY')}</TableCell>
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
