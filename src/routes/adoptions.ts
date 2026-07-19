import { Router } from 'express';
import { createAdoption, getReceivedRequests, getSentRequests, approveRequest, rejectRequest } from '../controllers/adoptionsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, createAdoption);
router.get('/received', authMiddleware, getReceivedRequests);
router.get('/sent', authMiddleware, getSentRequests);
router.put('/:id/approve', authMiddleware, approveRequest);
router.put('/:id/reject', authMiddleware, rejectRequest);

export default router;
