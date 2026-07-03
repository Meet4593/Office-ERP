import { Router } from 'express';
import { createJournal, getJournals, getJournalById, updateJournal, deleteJournal } from '../controllers/journalController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getJournals);
router.get('/:id', authenticateToken, getJournalById);
router.post('/', authenticateToken, createJournal);
router.put('/:id', authenticateToken, updateJournal);
router.delete('/:id', authenticateToken, deleteJournal);

export default router;
