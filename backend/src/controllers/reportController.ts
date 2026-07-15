import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getPartyLedger = async (req: AuthRequest, res: Response) => {
  try {
    const { partyName, startDate, endDate } = req.query;

    if (!partyName) {
      return res.status(400).json({ message: 'Party name is required' });
    }

    const start = startDate ? new Date(startDate as string) : new Date(0);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    // To ensure the end date covers the whole day
    end.setHours(23, 59, 59, 999);

    let openingBalance = 0; // Negative = Credit (we owe them / they paid advance), Positive = Debit (they owe us)

    // Helper to calculate impact of older transactions for opening balance
    const calculateOpeningBalance = async () => {
      // 1. Transactions (Purchases, Sales, Services) before start date
      const transactions = await prisma.transaction.findMany({
        where: {
          partAccountName: partyName as string,
          date: { lt: start }
        }
      });
      
      transactions.forEach(t => {
        const amount = (parseFloat(t.unit || '0') * (t.rate || 0)) || t.rate || 0;
        if (t.type === 'PURCHASE') {
          openingBalance -= amount; // We owe them -> Credit
        } else if (t.type === 'SALE' || t.type === 'SERVICE') {
          openingBalance += amount; // They owe us -> Debit
        }
      });

      // 2. Vouchers before start date
      const vouchers = await prisma.cashBankVoucher.findMany({
        where: {
          partyAccountName: partyName as string,
          date: { lt: start }
        }
      });

      vouchers.forEach(v => {
        if (v.voucherType === 'PAYMENT') {
          openingBalance += v.amount; // We paid them -> Debit
        } else if (v.voucherType === 'RECEIPT') {
          openingBalance -= v.amount; // They paid us -> Credit
        }
      });

      // 3. Journals before start date
      const journals = await prisma.journalDetail.findMany({
        where: {
          accountName: partyName as string,
          journal: { date: { lt: start } }
        },
        include: { journal: true }
      });

      journals.forEach(j => {
        if (j.debit) openingBalance += j.debit;
        if (j.credit) openingBalance -= j.credit;
      });
    };

    await calculateOpeningBalance();

    const ledgerEntries: any[] = [];

    // 1. Fetch Transactions in range
    const transactions = await prisma.transaction.findMany({
      where: {
        partAccountName: partyName as string,
        date: { gte: start, lte: end }
      }
    });

    transactions.forEach(t => {
      const amount = (parseFloat(t.unit || '0') * (t.rate || 0)) || t.rate || 0;
      let debit = 0;
      let credit = 0;
      
      if (t.type === 'PURCHASE') {
        credit = amount;
      } else if (t.type === 'SALE' || t.type === 'SERVICE') {
        debit = amount;
      }

      ledgerEntries.push({
        date: t.date,
        particulars: `${t.type} - ${t.srNumber}`,
        description: t.description || t.item || '',
        debit,
        credit,
        type: t.type
      });
    });

    // 2. Fetch Vouchers in range
    const vouchers = await prisma.cashBankVoucher.findMany({
      where: {
        partyAccountName: partyName as string,
        date: { gte: start, lte: end }
      }
    });

    vouchers.forEach(v => {
      let debit = 0;
      let credit = 0;
      if (v.voucherType === 'PAYMENT') debit = v.amount;
      if (v.voucherType === 'RECEIPT') credit = v.amount;

      ledgerEntries.push({
        date: v.date,
        particulars: `${v.voucherType} - ${v.srNumber}`,
        description: v.description || '',
        debit,
        credit,
        type: v.voucherType
      });
    });

    // 3. Fetch Journals in range
    const journals = await prisma.journalDetail.findMany({
      where: {
        accountName: partyName as string,
        journal: { date: { gte: start, lte: end } }
      },
      include: { journal: true }
    });

    journals.forEach(j => {
      ledgerEntries.push({
        date: j.journal.date,
        particulars: `JOURNAL - ${j.journal.srNumber}`,
        description: j.journal.description || '',
        debit: j.debit || 0,
        credit: j.credit || 0,
        type: 'JOURNAL'
      });
    });

    // Sort by date ASC
    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = openingBalance;
    ledgerEntries.forEach(entry => {
      runningBalance += entry.debit;
      runningBalance -= entry.credit;
      entry.balance = runningBalance;
    });

    res.json({
      partyName,
      startDate: start,
      endDate: end,
      openingBalance,
      closingBalance: runningBalance,
      entries: ledgerEntries
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating party ledger' });
  }
};
