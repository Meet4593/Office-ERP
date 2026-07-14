import { Router } from 'express';
import { getMasterData, addRecord, updateRecord, deleteRecord } from '../controllers/masterDataController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getMasterData);
router.post('/:type', authenticateToken, addRecord);
router.put('/:type/:id', authenticateToken, updateRecord);
router.delete('/:type/:id', authenticateToken, deleteRecord);

export default router;
