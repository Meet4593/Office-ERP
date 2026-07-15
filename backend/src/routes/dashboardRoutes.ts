import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany();
    
    let totalPurchases = 0;
    let totalSales = 0;
    let pendingPayments = 0;

    transactions.forEach(t => {
      const unit = parseFloat(t.unit || '0');
      const rate = t.rate || 0;
      const amount = (unit * rate) || rate || 0;

      if (t.type === 'PURCHASE') totalPurchases += amount;
      if (t.type === 'SALE') totalSales += amount;
      
      if (t.status === 'PENDING') {
        const balance = amount - (t.paidAmount || 0);
        if (balance > 0) pendingPayments += balance;
      }
    });

    res.json({
      totalPurchases: `₹ ${totalPurchases.toLocaleString()}`,
      totalSales: `₹ ${totalSales.toLocaleString()}`,
      pendingPayments: `₹ ${pendingPayments.toLocaleString()}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

export default router;
