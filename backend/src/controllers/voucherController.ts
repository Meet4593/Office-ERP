import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createVoucher = async (req: AuthRequest, res: Response) => {
  try {
    const { date, voucherType, transactionMode, partyAccountName, amount, description, month, transactionId } = req.body;
    
    const srCount = await prisma.cashBankVoucher.count();
    const prefix = voucherType === 'PAYMENT' ? 'PMT' : voucherType === 'RECEIPT' ? 'RCP' : 'CON';
    const srNumber = `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(srCount + 1).padStart(4, '0')}`;

    const voucher = await prisma.cashBankVoucher.create({
      data: {
        srNumber,
        date: new Date(date),
        voucherType,
        transactionMode,
        partyAccountName,
        amount: parseFloat(amount),
        description,
        month,
        transactionId: transactionId ? parseInt(transactionId) : null,
      }
    });

    if (transactionId) {
      const tx = await prisma.transaction.findUnique({ where: { id: parseInt(transactionId) } });
      if (tx) {
        const newPaid = tx.paidAmount + parseFloat(amount);
        const totalAmount = (parseFloat(tx.unit || '0') * (tx.rate || 0)) || tx.rate || 0;
        const newStatus = newPaid >= totalAmount ? 'COMPLETED' : 'PENDING';
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { paidAmount: newPaid, status: newStatus }
        });
      }
    }

    res.status(201).json(voucher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating voucher' });
  }
};

export const getVouchers = async (req: Request, res: Response) => {
  try {
    const vouchers = await prisma.cashBankVoucher.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(vouchers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching vouchers' });
  }
};

export const getVoucherById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const voucher = await prisma.cashBankVoucher.findUnique({
      where: { id: parseInt(id as string) }
    });
    
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    
    res.json(voucher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching voucher' });
  }
};

export const updateVoucher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, voucherType, transactionMode, partyAccountName, amount, description, month } = req.body;

    const oldVoucher = await prisma.cashBankVoucher.findUnique({
      where: { id: parseInt(id as string) }
    });

    const voucher = await prisma.cashBankVoucher.update({
      where: { id: parseInt(id as string) },
      data: {
        date: date ? new Date(date) : undefined,
        voucherType,
        transactionMode,
        partyAccountName,
        amount: amount ? parseFloat(amount) : undefined,
        description,
        month,
      }
    });

    if (oldVoucher && oldVoucher.transactionId && amount && parseFloat(amount) !== oldVoucher.amount) {
      const tx = await prisma.transaction.findUnique({ where: { id: oldVoucher.transactionId } });
      if (tx) {
        const difference = parseFloat(amount) - oldVoucher.amount;
        const newPaid = tx.paidAmount + difference;
        const totalAmount = (parseFloat(tx.unit || '0') * (tx.rate || 0)) || tx.rate || 0;
        const newStatus = newPaid >= totalAmount ? 'COMPLETED' : 'PENDING';
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { paidAmount: Math.max(0, newPaid), status: newStatus }
        });
      }
    }

    res.json(voucher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating voucher' });
  }
};

export const deleteVoucher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const masterPassword = process.env.DELETE_PASSWORD || 'admin123';
    
    if (password !== masterPassword) {
      return res.status(401).json({ message: 'Invalid password for deletion' });
    }

    const voucher = await prisma.cashBankVoucher.findUnique({
      where: { id: parseInt(id as string) }
    });

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    await prisma.cashBankVoucher.delete({
      where: { id: parseInt(id as string) }
    });

    if (voucher.transactionId) {
      const tx = await prisma.transaction.findUnique({ where: { id: voucher.transactionId } });
      if (tx) {
        const newPaid = tx.paidAmount - voucher.amount;
        const totalAmount = (parseFloat(tx.unit || '0') * (tx.rate || 0)) || tx.rate || 0;
        const newStatus = newPaid >= totalAmount ? 'COMPLETED' : 'PENDING';
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { paidAmount: Math.max(0, newPaid), status: newStatus }
        });
      }
    }

    res.json({ message: 'Voucher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting voucher' });
  }
};
