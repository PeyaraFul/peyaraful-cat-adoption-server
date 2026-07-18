import { Router } from 'express';
import { createAdoption, getReceivedRequests } from '../controllers/adoptionsController';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.post('/', dummyAuth, createAdoption);
router.get('/received', dummyAuth, getReceivedRequests);

export default router;
