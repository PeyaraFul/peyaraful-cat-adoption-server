import { Router } from 'express';
import { createAdoption } from '../controllers/adoptionsController';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.post('/', dummyAuth, createAdoption);

export default router;
