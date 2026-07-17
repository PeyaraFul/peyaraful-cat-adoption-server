import { Router } from 'express';
import { getAllCats, getCatById, createCat, updateCat } from '../controllers/catsController';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.get('/', getAllCats);
router.get('/:id', getCatById);
router.post('/', dummyAuth, createCat);
router.put('/:id', dummyAuth, updateCat);

export default router;
