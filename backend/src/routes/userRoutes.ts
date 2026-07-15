import { Router } from 'express';
import { getUsers, updateUser, createUser, resetUserPassword } from '../controllers/userController';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, requireAdmin, getUsers);
router.post('/', authenticateToken, requireAdmin, createUser);
router.put('/:id', authenticateToken, requireAdmin, updateUser);
router.post('/:id/reset-password', authenticateToken, requireAdmin, resetUserPassword);

export default router;
