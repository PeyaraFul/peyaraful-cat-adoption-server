import { Router } from 'express';
import { getAllStories, getTopStories } from '../controllers/storiesController';

const router = Router();

router.get('/', getAllStories);
router.get('/top', getTopStories);

export default router;
