import { Router } from 'express';
import { getAllStories, getTopStories, createStory, deleteStory } from '../controllers/storiesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllStories);
router.get('/top', getTopStories);
router.post('/', authMiddleware, createStory);
router.delete('/:id', authMiddleware, deleteStory);

export default router;
