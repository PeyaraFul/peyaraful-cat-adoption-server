import { Router } from 'express';
import { getAllCats, getCatById, createCat } from '../controllers/catsController';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.get('/', getAllCats);
router.get('/:id', getCatById);
router.post('/', dummyAuth, createCat);

export default router;
