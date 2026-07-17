import { Router } from 'express';
import { getAllCats } from '../controllers/catsController';

const router = Router();

router.get('/', getAllCats);

export default router;
