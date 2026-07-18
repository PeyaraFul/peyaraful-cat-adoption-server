import { Router } from 'express';
import { getAllStories } from '../controllers/storiesController';

const router = Router();

router.get('/', getAllStories);

export default router;
