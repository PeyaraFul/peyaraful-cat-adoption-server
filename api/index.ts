import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, getDB } from '../src/config/db.js';

let isConnected = false;

async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureDB();
  } catch (e: any) {
    return res.status(500).json({ message: 'Database connection failed', detail: e?.message });
  }

  const [{ default: express }, { default: cors }] = await Promise.all([
    import('express'),
    import('cors'),
  ]);

  const app = express();
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());

  const [
    { default: catsRouter },
    { default: storiesRouter },
    { default: adoptionsRouter },
    { default: adminRouter },
    { default: authRouter },
    { default: chatRouter },
  ] = await Promise.all([
    import('../src/routes/cats.js'),
    import('../src/routes/stories.js'),
    import('../src/routes/adoptions.js'),
    import('../src/routes/admin.js'),
    import('../src/routes/auth.js'),
    import('../src/routes/chat.js'),
  ]);

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

  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
