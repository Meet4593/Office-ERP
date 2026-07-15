import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const {
      date, transactionNumber, supplierInvoiceNum, partAccountName,
      type, item, detailNumber, department, machineNumber, servicePerson,
      description, unit, rate, paidDate, paymentMode, status, remarks
    } = req.body;

    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Auto-generate SR Number (e.g. SR-20260702-001)
    const srCount = await prisma.transaction.count();
    const srNumber = `SR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(srCount + 1).padStart(4, '0')}`;

    const transaction = await prisma.transaction.create({
      data: {
        srNumber,
        date: new Date(date),
        transactionNumber,
        supplierInvoiceNum,
        partAccountName,
        type: type || 'PURCHASE',
        item,
        detailNumber,
        department,
        machineNumber,
        servicePerson,
        description,
        unit,
        rate: rate ? parseFloat(rate) : null,
        paidDate: paidDate ? new Date(paidDate) : null,
        paymentMode,
        status: status || 'PENDING',
        remarks,
        attachmentUrl,
        createdByUserId: req.user?.userId || 1, // Fallback if auth is skipped for dev
      }
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Error in createTransaction:', error);
    res.status(500).json({ message: error.message || 'Error creating transaction' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id as string) }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching transaction' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      date, transactionNumber, supplierInvoiceNum, partAccountName,
      type, item, detailNumber, department, machineNumber, servicePerson,
      description, unit, rate, paidDate, paymentMode, status, remarks, paidAmount
    } = req.body;

    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const transaction = await prisma.transaction.update({
      where: { id: parseInt(id as string) },
      data: {
        date: date ? new Date(date) : undefined,
        transactionNumber,
        supplierInvoiceNum,
        partAccountName,
        type,
        item,
        detailNumber,
        department,
        machineNumber,
        servicePerson,
        description,
        unit,
        rate: rate ? parseFloat(rate) : null,
        paidDate: paidDate ? new Date(paidDate) : null,
        paymentMode,
        status,
        paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : undefined,
        remarks,
        ...(attachmentUrl && { attachmentUrl })
      }
    });

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const masterPassword = process.env.DELETE_PASSWORD || 'admin123';
    
    if (password !== masterPassword) {
      return res.status(401).json({ message: 'Invalid password for deletion' });
    }

    await prisma.transaction.delete({
      where: { id: parseInt(id as string) }
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};
