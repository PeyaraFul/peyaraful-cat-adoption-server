import { Router } from 'express';
import { getStats, getAllUsers, deleteUser, getAllCats, deleteCat, getAllAdoptions } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAdmin, getStats);
router.get('/users', requireAdmin, getAllUsers);
router.delete('/users/:id', requireAdmin, deleteUser);
router.get('/cats', requireAdmin, getAllCats);
router.delete('/cats/:id', requireAdmin, deleteCat);
router.get('/adoptions', requireAdmin, getAllAdoptions);

export default router;
