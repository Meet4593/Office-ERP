import { Router } from 'express';
import { createTransaction, getTransactions, updateTransaction, deleteTransaction, getTransactionById } from '../controllers/transactionController';
import { upload } from '../middlewares/uploadMiddleware';
import { authenticateToken, requirePermission } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, requirePermission('VIEW'), getTransactions);
router.get('/:id', authenticateToken, requirePermission('VIEW'), getTransactionById);
router.post('/', authenticateToken, requirePermission('ADD'), upload.single('attachment'), createTransaction);
router.put('/:id', authenticateToken, requirePermission('EDIT'), upload.single('attachment'), updateTransaction);
router.delete('/:id', authenticateToken, requirePermission('DELETE'), deleteTransaction);

export default router;
