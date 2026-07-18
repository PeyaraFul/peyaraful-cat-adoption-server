import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import catsRouter from './routes/cats';
import storiesRouter from './routes/stories';
import adoptionsRouter from './routes/adoptions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/cats', catsRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/adoptions', adoptionsRouter);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
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
