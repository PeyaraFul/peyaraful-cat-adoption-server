import { Router } from 'express';
import { getAllStories, getTopStories, createStory } from '../controllers/storiesController';
import { dummyAuth } from '../middleware/auth';

const router = Router();

router.get('/', getAllStories);
router.get('/top', getTopStories);
router.post('/', dummyAuth, createStory);

export default router;
