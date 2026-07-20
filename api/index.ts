import { app } from '../src/index.js';
import { connectDB } from '../src/config/db.js';

let isConnected = false;

async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

export default async function handler(req: any, res: any) {
  await ensureDB();
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
