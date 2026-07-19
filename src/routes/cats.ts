import { Router } from 'express';
import { getAllCats, getCatById, createCat, updateCat, deleteCat } from '../controllers/catsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllCats);
router.get('/:id', getCatById);
router.post('/', authMiddleware, createCat);
router.put('/:id', authMiddleware, updateCat);
router.delete('/:id', authMiddleware, deleteCat);

export default router;
