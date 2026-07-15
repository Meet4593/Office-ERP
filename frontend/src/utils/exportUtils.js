import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const generateInvoicePDF = (transaction) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('OFFICE ERP PRO', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`${transaction.type} INVOICE`, 105, 30, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);
  
  // Transaction Details
  doc.setFontSize(10);
  doc.text(`SR Number: ${transaction.srNumber || 'N/A'}`, 14, 45);
  doc.text(`Date: ${transaction.date ? dayjs(transaction.date).format('DD/MM/YYYY') : 'N/A'}`, 14, 52);
  doc.text(`Status: ${transaction.status || 'N/A'}`, 14, 59);

  // Party Details
  const partyName = transaction.partAccountName || transaction.servicePerson || 'N/A';
  doc.text(`Party Name: ${partyName}`, 120, 45);
  doc.text(`Invoice Num: ${transaction.supplierInvoiceNum || 'N/A'}`, 120, 52);
  doc.text(`Payment: ${transaction.paymentMode || 'N/A'}`, 120, 59);

  // Table
  const tableData = [
    [
      transaction.item || 'N/A', 
      transaction.description || 'N/A',
      transaction.unit || '-',
      transaction.rate ? `Rs. ${transaction.rate}` : '-'
    ]
  ];

  autoTable(doc, {
    startY: 70,
    head: [['Item Name', 'Description', 'Unit', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [25, 118, 210] }, // Primary color
  });
  
  const finalY = doc.lastAutoTable?.finalY || 100;
  
  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const total = transaction.rate || 0;
  doc.text(`Total Amount: Rs. ${total}`, 14, finalY + 15);
  
  // Save PDF
  doc.save(`${transaction.type}_${transaction.srNumber || 'Invoice'}.pdf`);
};

export const exportToCSV = (rows, columns, filename = 'export.csv') => {
  const headers = columns.map(c => c.headerName).join(',');
  const csvRows = rows.map(row => {
    return columns.map(col => {
      let val = row[col.field];
      if (val === null || val === undefined) val = '';
      // Escape commas
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  const csvContent = [headers, ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDetailedExcel = async (rows, type, filename = 'Detailed_Report.xlsx') => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${type} Report`);

  // Common Headers
  let headers = [
    'SR Number', 'Date', 'Party Name', 'Invoice Num', 'Item', 'Description', 
    'Unit', 'Rate', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 'Remarks'
  ];

  if (type === 'SERVICE') {
    headers = [
      'SR Number', 'Date', 'Party Name', 'Machine Number', 'Department', 'Service Person',
      'Detail Number', 'Item', 'Description', 'Unit', 'Rate', 'Total Amount', 
      'Paid Amount', 'Balance', 'Status', 'Remarks'
    ];
  }

  // Add Headers
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  // Add Data
  rows.forEach(row => {
    const totalAmount = row.amount || 0;
    const paidAmount = row.paidAmount || 0;
    const balance = totalAmount - paidAmount;

    if (type === 'SERVICE') {
      sheet.addRow([
        row.srNumber || '',
        row.date ? dayjs(row.date).format('DD/MM/YYYY') : '',
        row.supplierCustomer || '',
        row.machineNumber || '',
        row.department || '',
        row.servicePerson || '',
        row.detailNumber || '',
        row.item || '',
        row.description || '',
        row.unit || '',
        row.rate || 0,
        totalAmount,
        paidAmount,
        balance,
        row.status || '',
        row.remarks || ''
      ]);
    } else {
      sheet.addRow([
        row.srNumber || '',
        row.date ? dayjs(row.date).format('DD/MM/YYYY') : '',
        row.supplierCustomer || '',
        row.supplierInvoiceNum || '',
        row.item || '',
        row.description || '',
        row.unit || '',
        row.rate || 0,
        totalAmount,
        paidAmount,
        balance,
        row.status || '',
        row.remarks || ''
      ]);
    }
  });

  // Adjust column widths
  sheet.columns.forEach(col => {
    col.width = 15;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

export const exportDetailedPDF = (rows, type, filename = 'Detailed_Report.pdf') => {
  const doc = new jsPDF('landscape');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('OFFICE ERP PRO', 148, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`${type} REPORT`, 148, 25, { align: 'center' });
  
  // Table Data
  let head = [];
  let body = [];

  if (type === 'SERVICE') {
    head = [['SR Num', 'Date', 'Party Name', 'Machine No.', 'Department', 'Service Person', 'Detail No.', 'Item', 'Amount', 'Status']];
    body = rows.map(row => [
      row.srNumber || '-',
      row.date ? dayjs(row.date).format('DD/MM/YYYY') : '-',
      row.supplierCustomer || '-',
      row.machineNumber || '-',
      row.department || '-',
      row.servicePerson || '-',
      row.detailNumber || '-',
      row.item || '-',
      row.amount ? `Rs. ${row.amount}` : '-',
      row.status || '-'
    ]);
  } else {
    head = [['SR Num', 'Date', 'Party Name', 'Invoice', 'Item', 'Unit', 'Rate', 'Amount', 'Status']];
    body = rows.map(row => [
      row.srNumber || '-',
      row.date ? dayjs(row.date).format('DD/MM/YYYY') : '-',
      row.supplierCustomer || '-',
      row.supplierInvoiceNum || '-',
      row.item || '-',
      row.unit || '-',
      row.rate || '-',
      row.amount ? `Rs. ${row.amount}` : '-',
      row.status || '-'
    ]);
  }

  autoTable(doc, {
    startY: 35,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [25, 118, 210], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
  });
  
  doc.save(filename);
};
