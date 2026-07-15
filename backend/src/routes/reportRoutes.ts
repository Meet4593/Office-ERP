import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { getPartyLedger } from '../controllers/reportController';

const router = Router();

router.get('/ledger', authenticateToken, getPartyLedger);

export default router;
