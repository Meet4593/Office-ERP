import { Router } from 'express';
import { getMasterData } from '../controllers/masterDataController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getMasterData);

export default router;
