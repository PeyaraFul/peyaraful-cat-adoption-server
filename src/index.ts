import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import catsRouter from './routes/cats.js';
import storiesRouter from './routes/stories.js';
import adoptionsRouter from './routes/adoptions.js';
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cats', catsRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/adoptions', adoptionsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);

// Public stats for home page
app.get('/api/stats', async (_, res) => {
  try {
    const db = (await import('./config/db.js')).getDB();
    const totalCats = await db.collection('cats').countDocuments({ status: 'available' });
    const totalUsers = await db.collection('users').countDocuments();
    const totalAdoptions = await db.collection('adoption_requests').countDocuments({ status: 'approved' });
    res.json({ totalCats, totalUsers, totalAdoptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

export { app };

// Start server (only when running directly, not on Vercel)
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  async function start() {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
  start();
}
