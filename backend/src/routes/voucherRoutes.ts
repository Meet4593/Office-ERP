import { Router } from 'express';
import { createVoucher, getVouchers, getVoucherById, updateVoucher, deleteVoucher } from '../controllers/voucherController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getVouchers);
router.get('/:id', authenticateToken, getVoucherById);
router.post('/', authenticateToken, createVoucher);
router.put('/:id', authenticateToken, updateVoucher);
router.delete('/:id', authenticateToken, deleteVoucher);

export default router;
