import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { connectDB } from '../src/config/db.js';
import catsRouter from '../src/routes/cats.js';
import storiesRouter from '../src/routes/stories.js';
import adoptionsRouter from '../src/routes/adoptions.js';
import adminRouter from '../src/routes/admin.js';
import authRouter from '../src/routes/auth.js';
import chatRouter from '../src/routes/chat.js';
import { getDB } from '../src/config/db.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/cats', catsRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/adoptions', adoptionsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);

app.get('/api/stats', async (_req: any, res: any) => {
  try {
    const db = getDB();
    const totalCats = await db.collection('cats').countDocuments({ status: 'available' });
    const totalUsers = await db.collection('users').countDocuments();
    const totalAdoptions = await db.collection('adoption_requests').countDocuments({ status: 'approved' });
    res.json({ totalCats, totalUsers, totalAdoptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/health', (_req: any, res: any) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

let isConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
}
