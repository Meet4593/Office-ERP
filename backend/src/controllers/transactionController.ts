import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

const syncMasterData = async (data: any) => {
  try {
    const { partAccountName, type, item, department, machineNumber } = data;
    const dbType = type || 'PURCHASE';
    
    if (partAccountName) {
      if (dbType === 'PURCHASE') {
        const exist = await prisma.supplier.findUnique({ where: { name: partAccountName } });
        if (!exist) await prisma.supplier.create({ data: { name: partAccountName } });
      } else {
        const exist = await prisma.customer.findUnique({ where: { name: partAccountName } });
        if (!exist) await prisma.customer.create({ data: { name: partAccountName } });
      }
    }

    if (item) {
      const exist = await prisma.item.findUnique({ where: { name: item } });
      if (!exist) await prisma.item.create({ data: { name: item } });
    }

    if (department) {
      const exist = await prisma.department.findUnique({ where: { name: department } });
      if (!exist) await prisma.department.create({ data: { name: department } });
    }

    if (machineNumber) {
      const exist = await prisma.machine.findUnique({ where: { machineNum: machineNumber } });
      if (!exist) await prisma.machine.create({ data: { machineNum: machineNumber, department: department || null } });
    }
  } catch (error) {
    console.error('Failed to sync master data:', error);
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userDept = req.user?.department;

    const {
      date, transactionNumber, supplierInvoiceNum, partAccountName,
      type, item, detailNumber, department, machineNumber, servicePerson,
      description, unit, rate, paidDate, paymentMode, status, remarks
    } = req.body;

    if (userRole !== 'ADMIN' && userDept && department !== userDept) {
      return res.status(403).json({ message: 'You can only create transactions for your assigned department' });
    }

    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Auto-generate SR Number robustly using the last inserted ID so deletions don't cause duplicates
    const lastTransaction = await prisma.transaction.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = lastTransaction ? lastTransaction.id + 1 : 1;
    const srNumber = `SR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextId).padStart(4, '0')}`;

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

    // Auto-sync any newly typed entries to Master Data
    await syncMasterData(req.body);

    res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Error in createTransaction:', error);
    res.status(500).json({ message: error.message || 'Error creating transaction' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userDept = req.user?.department;
    
    let whereClause = {};
    if (userRole !== 'ADMIN' && userDept) {
      whereClause = { department: userDept };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userDept = req.user?.department;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id as string) }
    });

    if (transaction && userRole !== 'ADMIN' && userDept && transaction.department !== userDept) {
      return res.status(403).json({ message: 'Access denied to this department transaction' });
    }

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
    const userRole = req.user?.role;
    const userDept = req.user?.department;

    const existing = await prisma.transaction.findUnique({ where: { id: parseInt(id as string) } });
    if (!existing) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (userRole !== 'ADMIN' && userDept && existing.department !== userDept) {
      return res.status(403).json({ message: 'Cannot edit transactions outside your department' });
    }

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

    // Auto-sync any newly typed entries to Master Data
    await syncMasterData(req.body);

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userDept = req.user?.department;
    const { password } = req.body;
    
    const existing = await prisma.transaction.findUnique({ where: { id: parseInt(id as string) } });
    if (!existing) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (userRole !== 'ADMIN' && userDept && existing.department !== userDept) {
      return res.status(403).json({ message: 'Cannot delete transactions outside your department' });
    }
    
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
