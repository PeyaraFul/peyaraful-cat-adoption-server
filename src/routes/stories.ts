import { Router } from 'express';
import { getAllStories, getTopStories, createStory, deleteStory, likeStory } from '../controllers/storiesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllStories);
router.get('/top', getTopStories);
router.post('/', authMiddleware, createStory);
router.post('/:id/like', authMiddleware, likeStory);
router.delete('/:id', authMiddleware, deleteStory);

export default router;
