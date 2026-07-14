import { Router } from 'express';
import { login, register, changePassword, updateSecurityQuestion, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/change-password', authenticateToken, changePassword);
router.post('/update-security-question', authenticateToken, updateSecurityQuestion);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
