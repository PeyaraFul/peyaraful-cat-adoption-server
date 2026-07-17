import { Router } from 'express';
import { getAllCats, getCatById, createCat, updateCat, deleteCat } from '../controllers/catsController';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.get('/', getAllCats);
router.get('/:id', getCatById);
router.post('/', dummyAuth, createCat);
router.put('/:id', dummyAuth, updateCat);
router.delete('/:id', dummyAuth, deleteCat);

export default router;
