import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalPurchases = await prisma.transaction.count({
      where: { type: 'PURCHASE' }
    });
    const totalSales = await prisma.transaction.count({
      where: { type: 'SALE' }
    });
    
    // Using a simplistic calculation, realistically you'd sum up 'rate' or another field
    const pendingPayments = await prisma.transaction.count({
      where: { status: 'PENDING' }
    });

    res.json({
      totalPurchases,
      totalSales,
      pendingPayments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

export default router;
