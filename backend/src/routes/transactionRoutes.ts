import { Router } from 'express';
import { createTransaction, getTransactions, updateTransaction, deleteTransaction, getTransactionById } from '../controllers/transactionController';
import { upload } from '../middlewares/uploadMiddleware';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getTransactions);
router.get('/:id', authenticateToken, getTransactionById);
router.post('/', authenticateToken, upload.single('attachment'), createTransaction);
router.put('/:id', authenticateToken, upload.single('attachment'), updateTransaction);
router.delete('/:id', authenticateToken, deleteTransaction);

export default router;
