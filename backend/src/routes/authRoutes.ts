import { Router } from 'express';
import { login, register, getProfile, changePassword, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
