import { Router } from 'express';
import { getAllCats, getCatById } from '../controllers/catsController';

const router = Router();

router.get('/', getAllCats);
router.get('/:id', getCatById);

export default router;
