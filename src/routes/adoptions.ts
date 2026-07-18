import { Router } from 'express';
import { createAdoption, getReceivedRequests, getSentRequests, approveRequest } from '../controllers/adoptionsController';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.post('/', dummyAuth, createAdoption);
router.get('/received', dummyAuth, getReceivedRequests);
router.get('/sent', dummyAuth, getSentRequests);
router.put('/:id/approve', dummyAuth, approveRequest);

export default router;
