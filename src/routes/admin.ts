import { Router } from 'express';
import { getStats, getAllUsers, deleteUser, getAllCats } from '../controllers/adminController';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.get('/stats', dummyAuth, getStats);
router.get('/users', dummyAuth, getAllUsers);
router.delete('/users/:id', dummyAuth, deleteUser);
router.get('/cats', dummyAuth, getAllCats);

export default router;
